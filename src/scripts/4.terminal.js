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

// Terminal Resize

Terminal.prototype.adjust = function (measure) {
  this.measure = measure;
  this.terminalSize = measure.getMeasure();
  this.render();
};

// Terminal Input Select

Terminal.prototype.listen = function (catcher) {
  this.catcher = catcher;
}

// Terminal Data Reset

Terminal.prototype.blank = function () {
  while (this.dataRows.length < this.terminalSize.y) {
    var currentRow = this.dataRows.length;
    this.dataRows[currentRow] = "\u00A0".repeat(this.terminalSize.x);
  }
};

// Terminal Line Cursor Reset

Terminal.prototype.pullCursor = function () {
  this.cursor.x = 0;
}

Terminal.prototype.pushCursor = function () {
  this.cursor.x = this.terminalSize.x - 1;
}

// Terminal Display Reset

Terminal.prototype.wipe = function () {
  this.renderIndex = 0;
  this.display.innerHTML = "";
};

// Terminal clean-line render

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

// Terminal dirty-line render

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

// Terminal write at cursor

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

// Terminal erase at cursor

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

// Terminal 

// Terminal user movement

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