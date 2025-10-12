
String.prototype.replaceAt = function (index, replacement) {

  if (replacement.length < -index || index >= this.length) {
    return this
  } else if (index < 0) {
    return replacement.substring(-index, this.length + 1) + this.substring(replacement.length + index)
  } else {
    return this.substring(0, index) + replacement.substring(0, this.length - index) + this.substring(index + replacement.length)
  }

}

var resizeQueue = [];

function addResizeEvent(functionReference) {
  resizeQueue.push(functionReference);
}

window.onresize = function (event) {
  for (let functionIndex = 0; functionIndex < resizeQueue.length; functionIndex++) {
    resizeQueue[functionIndex](event);
  }
}

function Measure(fontID, sampleText) {
  this.sampleSpan = document.createElement("span");
  this.sampleSpan.style.position = "absolute";
  this.sampleSpan.style.whiteSpace = "nowrap";
  this.sampleSpan.style.visibility = "hidden";

  document.body.appendChild(this.sampleSpan);
  this.sampleSpan.style.fontFamily = fontID;

  if (typeof sampleText == "string") {
    this.sampleSpan.textContent = sampleText;
  } else {
    var printableAscii = "";
    for (var charCode = 32; charCode < 127; charCode++) {
      printableAscii += String.fromCharCode(charCode);
    }
    this.sampleSpan.textContent = printableAscii;
  }

  this.update = function () {
    var sampleRect = this.sampleSpan.getBoundingClientRect();
    var sampleSizeY = sampleRect.height;
    var textWidth = this.sampleSpan.textContent.length;
    var sampleSizeX = sampleRect.width / textWidth;

    this.screenSpace = {
      y: Math.floor(window.innerHeight / sampleSizeY),
      x: Math.floor(window.innerWidth / sampleSizeX)
    };
  };

  var self = this;
  self.update();

  this.getMeasure = function () {
    return this.screenSpace;
  };

  addResizeEvent(function () {
    self.update();
  });
}

function Terminal(displayID, measure) {
  this.display = document.getElementById(displayID);

  this.cursor = { x: 0, y: 0 };

  this.sampleText = document.getElementById("measure");
  this.sampleMeasure = this.sampleText.getBoundingClientRect();

  measure.update();
  this.terminalSize = measure.getMeasure();

  this.renderIndex = 0;

  this.rows = new Array(this.terminalSize.y);
  for (let row = 0; row < this.rows.length; row++) {
    this.rows[row] = "";
    for (let col = 0; col < this.terminalSize.x; col++) {
      this.rows[row] += "\u00A0";
    }
  }

  var self = this;

  addResizeEvent(function () {
    self.terminalSize = measure.getMeasure();
    while (self.rows.length < self.terminalSize.y) {
      self.rows.push("");
    }
    self.render();
  });
}

Terminal.canMessage = function (message) {
  if (typeof message == "undefined" || (typeof message == "object" && message == null)) {
    return false;
  }
  return true;
};

Terminal.prototype.wipe = function () {
  this.renderIndex = 0;
  this.display.innerHTML = "";
};

Terminal.prototype.render = function () {
  this.wipe();
  for (let i = 0; i < this.rows.length; i++) {
    this.display.innerHTML += "<div>" + this.rows[i] + "</div>";
  }
};

Terminal.prototype.moveCursor = function (x, y) {
  this.cursor.x = x;
  this.cursor.y = y;
};

Terminal.prototype.write = function (message) {
  if (Terminal.canMessage(message)) {
    if (this.cursor.y < this.rows.length) {

      while (message.length > 0) {
        this.rows[this.cursor.y] = this.rows[this.cursor.y].replaceAt(this.cursor.x, message);
        message = message.substring(this.terminalSize.x - this.cursor.x);
        this.cursor.y++;
        this.cursor.x = 0;
      }
    } else {
      this.rows.shift();
      this.rows.push(message);
    }
    this.render();
  } else {
    console.log("MESSAGE ERR: Message is of an unsupported type.");
  }
};


function Shell(host, user) {
  this.host = host;
  this.user = user;
  this.terminal = null;

  this.connect = function (terminal) {
    this.terminal = terminal;
    this.prompt();
  };

  this.prompt = function () {
    if (this.terminal) {
      this.terminal.write(this.user + "@" + this.host + ":~$ ");
    }
  };
}

(function () {
  var measure = new Measure('"Courier New", Courier, monospace', "My");

  var terminal = new Terminal("lines", measure);
  var shell = new Shell("lagann3001", "Marco");
  shell.connect(terminal);
  terminal.render();
})();
