function Shell(host, user, terminal) {
  this.login(host, user);
  
  this.command = "";
  this.connect(terminal);
  
  var self = this;

  this.terminal.catcher.stream(
    function (key) {
      self.userWrite(key);
    }
  )
};

Shell.prototype.connect = function (terminal) {
  this.terminal = terminal;
  this.prompt();
};

Shell.prototype.login = function (host, user) {
  this.host = host,
  this.user = user;
};

Shell.prototype.prompt = function () {
  this.promptText = this.user + "@" + this.host + ":~$ ";
  this.command += this.promptText;
  this.promptLength = this.promptText.length;
  this.promptLine = this.terminal.cursor.y
  this.terminal.write(this.promptText);
};

Shell.prototype.canClaim = function () {
  if (this.terminal.cursor.y != this.promptLine || this.terminal.cursor.x > this.promptLength) {
    return true;
  }

  return false;
}

Shell.prototype.userWrite = function (key) {

  if (key == "Backspace") {
    if (this.canClaim()) {
      var startCursorX = this.terminal.cursor.x;
      var stringPosition = this.terminal.cursor.x + this.terminal.terminalSize.x * (this.terminal.cursor.y - this.promptLine);
      this.command = this.command.substring(0, stringPosition - 1) + this.command.substring(stringPosition);
      this.terminal.pullCursor();
      this.terminal.write(this.command + "\u00A0".repeat(this.terminal.terminalSize.x - this.command.length));
      this.terminal.cursor.x = startCursorX - 1;
      this.terminal.reRender(this.terminal.cursor.y, this.terminal.cursor.y);
    }
  } else if (key == "ArrowLeft") {
    if (this.canClaim()) {
      this.terminal.shift("Left");
    }
  } else if (key == "ArrowRight") {
    this.terminal.shift("Right");
  } else if (key.length == 1) {
    var startCursorX = this.terminal.cursor.x;
    var stringPosition = this.terminal.cursor.x + this.terminal.terminalSize.x * (this.terminal.cursor.y - this.promptLine);
    this.command = this.command.sandwichAt(stringPosition, key);
    this.terminal.pullCursor();
    this.terminal.write(this.command);
    this.terminal.cursor.x = startCursorX + 1;
    this.terminal.reRender(this.terminal.cursor.y, this.terminal.cursor.y);
  }
}