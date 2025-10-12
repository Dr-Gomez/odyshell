#!/usr/bin/perl
use strict;
use warnings;
use Socket;
use File::Basename;
use File::Spec;
use POSIX qw(strftime);

# Configuration
my $PORT = 8080;
my $HOST = '0.0.0.0';
my $WEB_ROOT = File::Spec->catdir(dirname(__FILE__), 'src');
my $INDEX_FILE = 'index.html';
my $BUFFER_SIZE = 8192;

# MIME types mapping
my %MIME_TYPES = (
    'html' => 'text/html',
    'htm'  => 'text/html',
    'txt'  => 'text/plain',
    'css'  => 'text/css',
    'js'   => 'application/javascript',
    'json' => 'application/json',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'svg'  => 'image/svg+xml',
    'ico'  => 'image/x-icon',
    'pdf'  => 'application/pdf',
    'zip'  => 'application/zip',
    'gz'   => 'application/gzip',
    'mp3'  => 'audio/mpeg',
    'mp4'  => 'video/mp4',
    'webm' => 'video/webm',
    'woff' => 'font/woff',
    'woff2'=> 'font/woff2',
    'ttf'  => 'font/ttf',
    'otf'  => 'font/otf',
);

# Create socket
socket(my $server, PF_INET, SOCK_STREAM, getprotobyname('tcp')) or die "socket: $!";
setsockopt($server, SOL_SOCKET, SO_REUSEADDR, 1) or die "setsockopt: $!";
bind($server, sockaddr_in($PORT, inet_aton($HOST))) or die "bind: $!";
listen($server, SOMAXCONN) or die "listen: $!";

print "Server running at http://$HOST:$PORT/\n";
print "Web root: $WEB_ROOT\n";

# Main server loop
while (1) {
    my $client;
    my $client_addr = accept($client, $server);

    if (!$client_addr) {
        warn "Accept failed: $!";
        next;
    }

    # Get client IP (but don't fail if we can't)
    my $client_ip = 'unknown';
    eval {
        $client_ip = inet_ntoa((sockaddr_in($client_addr))[1]);
    };

    # Handle request
    my $request = '';
    my $bytes_read = sysread($client, $request, $BUFFER_SIZE);

    if ($bytes_read > 0) {
        my ($method, $path) = parse_request($request);
        my $file_path = sanitize_path($path);

        if ($method ne 'GET') {
            send_response($client, 405, "Method Not Allowed", "text/plain", "Method not allowed", $client_ip);
        }
        elsif (not $file_path) {
            send_response($client, 400, "Bad Request", "text/plain", "Invalid request", $client_ip);
        }
        else {
            serve_file($client, $file_path, $client_ip);
        }
    }

    close $client;
}

sub parse_request {
    my ($request) = @_;
    if ($request =~ /^([A-Z]+)\s+([^\s?]+)/) {
        return ($1, $2);
    }
    return (undef, undef);
}

sub sanitize_path {
    my ($path) = @_;
    $path =~ s/[?#].*$//;
    $path =~ s/\/\.\.?\//\//g;
    $path =~ s/^\/+//;

    # Prevent directory traversal
    return undef if $path =~ /\.\./;

    # Default to index file if path ends with /
    $path .= $INDEX_FILE if $path =~ /\/$/ or $path eq '';

    return File::Spec->catfile($WEB_ROOT, $path);
}

sub serve_file {
    my ($client, $file_path, $client_ip) = @_;

    if (-d $file_path) {
        $file_path = File::Spec->catfile($file_path, $INDEX_FILE);
    }

    if (-f $file_path and -r $file_path) {
        my $ext = ($file_path =~ /\.([^.]+)$/)[0] // '';
        my $mime_type = $MIME_TYPES{lc $ext} || 'application/octet-stream';

        open(my $fh, '<', $file_path) or do {
            send_response($client, 500, "Internal Server Error", "text/plain", "Could not open file", $client_ip);
            return;
        };

        binmode($fh);
        my $file_size = -s $file_path;

        # Prepare headers
        my $headers = "HTTP/1.1 200 OK\n";
        $headers .= "Content-Type: $mime_type\n";
        $headers .= "Content-Length: $file_size\n";
        $headers .= "Cache-Control: public, max-age=3600\n";
        $headers .= "Connection: close\n\n";

        # Log headers packet
        log_packet(
            type       => 'HEADERS',
            client_ip  => $client_ip,
            file_path  => $file_path,
            size       => length($headers),
            content    => $headers,
            mime_type  => $mime_type,
            file_size  => $file_size
        );

        # Send headers
        print $client $headers;

        # Send file content in chunks and log each packet
        my $bytes_sent = 0;
        my $packet_num = 1;
        while (my $bytes_read = sysread($fh, my $buffer, $BUFFER_SIZE)) {
            print $client $buffer;
            $bytes_sent += $bytes_read;

            log_packet(
                type       => 'DATA',
                client_ip  => $client_ip,
                file_path  => $file_path,
                size       => $bytes_read,
                packet_num => $packet_num++,
                total_size => $file_size,
                progress   => int(($bytes_sent/$file_size)*100),
                mime_type  => $mime_type
            );
        }

        close($fh);
    }
    else {
        send_response($client, 404, "Not Found", "text/plain", "File not found", $client_ip);
    }
}

sub send_response {
    my ($client, $code, $status, $content_type, $message, $client_ip) = @_;
    my $response = "HTTP/1.1 $code $status\r\n";
    $response .= "Content-Type: $content_type\r\n";
    $response .= "Content-Length: " . length($message) . "\r\n";
    $response .= "Connection: close\r\n\r\n";
    $response .= $message;

    log_packet(
        type       => 'FULL_RESPONSE',
        client_ip  => $client_ip,
        size       => length($response),
        code       => $code,
        status     => $status,
        content    => $response
    );

    print $client $response;
}

sub log_packet {
    my %params = @_;
    my $timestamp = strftime("%Y-%m-%d %H:%M:%S", localtime);

    my $separator = '=' x 80;
    my $subseparator = '-' x 80;

    print "\n\033[1;36m$separator\033[0m\n";
    print "\033[1;33m| PACKET DETAILS (\033[1;37m$params{type}\033[1;33m) at \033[1;35m$timestamp\033[0m\n";
    print "\033[1;36m$subseparator\033[0m\n";

    # Basic info section
    print "\033[1;32m| Client:\033[0m     \033[1;37m$params{client_ip}\033[0m\n";

    if (exists $params{file_path}) {
        print "\033[1;32m| File:\033[0m       \033[1;37m$params{file_path}\033[0m\n";
    }

    if (exists $params{code}) {
        print "\033[1;32m| Status:\033[0m     \033[1;37m$params{code} $params{status}\033[0m\n";
    }

    if (exists $params{mime_type}) {
        print "\033[1;32m| MIME Type:\033[0m  \033[1;37m$params{mime_type}\033[0m\n";
    }

    print "\033[1;32m| Size:\033[0m       \033[1;37m$params{size} bytes\033[0m\n";

    if (exists $params{file_size}) {
        print "\033[1;32m| File Size:\033[0m  \033[1;37m$params{file_size} bytes\033[0m\n";
    }

    if (exists $params{packet_num}) {
        print "\033[1;32m| Packet #:\033[0m   \033[1;37m$params{packet_num}\033[0m\n";
    }

    if (exists $params{progress}) {
        print "\033[1;32m| Progress:\033[0m   \033[1;37m$params{progress}%\033[0m\n";
    }

    print "\033[1;36m$separator\033[0m\n\n";
}

END {
    close($server) if $server;
}