// KeyLogger
function Catcher() {
  this.logger = document.createElement("input");
  var loggerStylesheet = this.logger.style;
  loggerStylesheet.bottom = "100%";
  loggerStylesheet.right = "100%"
  loggerStylesheet.position = "absolute";
  loggerStylesheet.width = "1px";
  loggerStylesheet.height = "1em";
  loggerStylesheet.padding = "0";
  loggerStylesheet.border = "none";
  loggerStylesheet.zIndex = "1";
  loggerStylesheet.opacity = "0";
  loggerStylesheet.whiteSpace = "pre";
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
