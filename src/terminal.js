// String swap
String.prototype.replaceAt = function (index, replacement) {

  if (replacement.length < -index || index >= this.length) {
    return this
  } else if (index < 0) {
    return replacement.substring(-index, this.length + 1) + this.substring(replacement.length + index)
  } else {
    return this.substring(0, index) + replacement.substring(0, this.length - index) + this.substring(index + replacement.length)
  }

};

String.prototype.repeat = function (times) {
  var repeatedString = "";
  
  for (let charIndex = 0; charIndex < times; charIndex++) {
    repeatedString += this;
  }

  return repeatedString;
}

// Listeners
var resizeQueue = [];

function addResizeEvent(functionReference) {
  resizeQueue.push(functionReference);
};

window.onresize = function (event) {
  for (let functionIndex = 0; functionIndex < resizeQueue.length; functionIndex++) {
    resizeQueue[functionIndex](event);
  }
};

// KeyLogger
function Catcher() {
  this.logger = document.createElement("input");
  this.logger.style.bottom = "100%";
  this.logger.style.right = "100%"
  this.logger.style.position = "absolute";
  this.logger.style.width = "1px";
  this.logger.style.height = "1em";
  this.logger.style.padding = "0";
  this.logger.style.border = "none";
  this.logger.style.zIndex = "1";
  this.logger.style.opacity = "0";
  this.logger.style.whiteSpace = "pre";
  document.body.appendChild(this.logger);

  this.hear();

};

Catcher.prototype.hear = function () {
  this.logger.focus();
}

Catcher.prototype.stream = function (port) {
  var self = this;

  document.onkeydown = function (event) {
    self.hear();
    
    port(event.key);
  }
}

// Measure
function Ruler(fontID, sampleText) {
  this.sampleSpan = document.createElement("span");
  this.sampleSpan.style.position = "absolute";
  this.sampleSpan.style.whiteSpace = "nowrap";
  this.sampleSpan.style.visibility = "hidden";

  document.body.appendChild(this.sampleSpan);
  this.updateFont(fontID);

  if (typeof sampleText == "string") {
    this.updateSample(sampleText);
  } else {
    var printableAscii = "";
    
    for (var charCode = 32; charCode < 127; charCode++) {
      printableAscii += String.fromCharCode(charCode);
    }

    this.updateSample(printableAscii);
  }

  this.measure();

  var self = this;

  addResizeEvent(function () { 
    self.measure();
  });
};

Ruler.prototype.measure = function () {
  var sampleRect = this.sampleSpan.getBoundingClientRect();
  var sampleSizeY = sampleRect.height;
  var textWidth = this.sampleSpan.textContent.length;
  var sampleSizeX = sampleRect.width / textWidth;

  this.screenSpace = {
    y: Math.floor(window.innerHeight / sampleSizeY),
    x: Math.floor(window.innerWidth / sampleSizeX)
  };
};

Ruler.prototype.updateFont = function (fontID) {
  this.sampleSpan.style.fontFamily = fontID;
};

Ruler.prototype.updateSample = function (sampleText) {
  this.sampleSpan.textContent = sampleText;
};

Ruler.prototype.getMeasure = function () {
  return this.screenSpace;
};

// Terminal
function Terminal(displayID, measure, catcher) {
  this.display = document.getElementById(displayID);

  this.cursor = { x: 0, y: 0 };
  
  this.renderIndex = 0;

  this.dataRows = new Array();
  this.outputRows = new Array();

  this.adjust(measure);
  this.listen(catcher);
  
  this.blank();
  
  this.render();
  this.wipe();
  
  var self = this;

  addResizeEvent(function () {
    self.blank();
    self.render();
  });


};

Terminal.prototype.adjust = function (measure) {
  this.measure = measure;
  this.terminalSize = measure.getMeasure();
  this.render();
};

Terminal.prototype.listen = function (catcher) {
  this.catcher = catcher;
}

Terminal.prototype.blank = function () {
  while (this.dataRows.length < this.terminalSize.y) {
    var currentRow = this.dataRows.length;
    this.dataRows[currentRow] = "\u00A0".repeat(this.terminalSize.x);
  }
};

Terminal.prototype.wipe = function () {
  this.renderIndex = 0;
  this.display.innerHTML = "";
};

Terminal.prototype.render = function () {
  for (this.renderIndex; this.renderIndex < this.dataRows.length; this.renderIndex++) {

    var text = this.dataRows[this.renderIndex];
    var line = document.createElement("div");

    if (this.cursor.y == this.renderIndex) {
      
      var preCursorText = text.substring(0, this.cursor.x);
      var preCursorTextNode = document.createTextNode(preCursorText);

      line.appendChild(preCursorTextNode);

      var cursorSpan = document.createElement("span");
      cursorSpan.className = "cursor";
      
      var cursorText = text.charAt(this.cursor.x);
      var cursorTextNode = document.createTextNode(cursorText);

      cursorSpan.appendChild(cursorTextNode);

      line.appendChild(cursorSpan);

      var postCursorText = text.substring(this.cursor.x + 1, text.length);
      var postCursorTextNode = document.createTextNode(postCursorText);

      line.appendChild(postCursorTextNode);

    } else {
      var textNode = document.createTextNode(text);
      line.appendChild(textNode);
    }

    this.outputRows[this.renderIndex] = line;

    this.display.appendChild(line);
  }

};

Terminal.prototype.reRender = function (startIndex, endIndex) {
  for (let reRenderIndex = startIndex; reRenderIndex <= endIndex; reRenderIndex++) {

    var text = this.dataRows[reRenderIndex];
    var line = this.outputRows[reRenderIndex];

    line.innerHTML = "";

    if (this.cursor.y == reRenderIndex) {

      var preCursorText = text.substring(0, this.cursor.x);
      var preCursorTextNode = document.createTextNode(preCursorText);

      line.appendChild(preCursorTextNode);

      var cursorSpan = document.createElement("span");
      cursorSpan.className += "cursor";
      
      var cursorText = text.charAt(this.cursor.x);
      var cursorTextNode = document.createTextNode(cursorText);

      cursorSpan.appendChild(cursorTextNode);

      line.appendChild(cursorSpan);

      var postCursorText = text.substring(this.cursor.x + 1, text.length);
      var postCursorTextNode = document.createTextNode(postCursorText);

      line.appendChild(postCursorTextNode);

    } else {
      var textNode = document.createTextNode(text);
      line.appendChild(textNode);
    }

  }
}

Terminal.prototype.write = function (message) {
  
  var overwrite = false;
  var startIndex = 0;

  if (this.cursor.y < this.dataRows.length) {

    if (this.cursor.y <= this.outputRows.length) {

      if (overwrite == false) {
        overwrite = true;
        startIndex = this.cursor.y;
        endIndex = this.cursor.y
      } else {
        endIndex = this.cursor.y
      }
    }

    while (message.length > 0) {
      this.dataRows[this.cursor.y] = this.dataRows[this.cursor.y].replaceAt(this.cursor.x, message);
      
      var printedLength = message.length;
      
      message = message.substring(this.terminalSize.x - this.cursor.x);

      if (message.length == 0) {
        this.cursor.x += printedLength;
      } else {
        this.cursor.y++;
        this.cursor.x = 0;
      }
    }
  } else {
    this.dataRows[this.dataRows.length] = message + "\u00A0".repeat(this.terminal.x - message.length);
  }

  if (overwrite == true) {
    this.reRender(startIndex, endIndex);
  }

  this.render();
};

Terminal.prototype.erase = function () {
  
  var line = "";
  var startY = this.cursor.y;

  if (this.cursor.x == 0) {
    if (this.cursor.y == 0) {
      return;
    }
    
    this.cursor.y--;
    
    var line = this.dataRows[this.cursor.y];
    this.cursor.x = line.length - 1;
    
    line = line.replaceAt(this.cursor.x, " ");
  } else {
    this.cursor.x -= 1;
    var line = this.dataRows[this.cursor.y];
    line = line.replaceAt(this.cursor.x, " ");
  }
  
  this.dataRows[this.cursor.y] = line;
  this.reRender(this.cursor.y, startY);
  this.render();
}

Terminal.prototype.shift = function (direction) {

  if (direction == "Left") {
    if (this.cursor.x == 0) {

      if (this.cursor.y == 0) {
        return;
      } 
      
      else {
        this.cursor.y--;
        this.cursor.x = this.terminalSize.x - 1;
        return;
      }

    } else {
      this.cursor.x--;
      this.reRender(this.cursor.y, this.cursor.y)
    }

  } else if (direction == "Right") {
    if (this.cursor.x == this.terminalSize.x - 1) {

      if (this.cursor.y == this.dataRows.length - 1) {
        return;
      } else {
        this.cursor.y++;
        this.cursor.x = 0;
      }
      
    } else {
      this.cursor.x++;
      this.reRender(this.cursor.y, this.cursor.y);
    }
  }

  this.reRender(this.cursor.y, this.cursor.y);
}

// Shell
function Shell(host, user, terminal) {
  this.login(host, user);
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
  this.promptLength = this.promptText.length;
  this.promptLine = this.terminal.cursor.y
  this.terminal.write(this.promptText);
};

Shell.prototype.userWrite = function (key) {

  if (key == "Backspace") {

    if (this.terminal.cursor.y != this.promptLine || this.terminal.cursor.x > this.promptLength) {
      this.terminal.erase();
    }

  } else if (key == "ArrowLeft") {
    this.terminal.shift(-1);
  } else if (key == "ArrowRight") {
    this.terminal.shift(1);
  } else if (key.length == 1) {
    this.terminal.write(key);
  }
}


void function () {
  var measure = new Ruler('"Courier New", Courier, monospace', "My");
  var catcher = new Catcher();

  var terminal = new Terminal("lines", measure, catcher);
  var shell = new Shell("lagann", "Don", terminal);
}();