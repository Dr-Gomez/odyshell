var resizeQueue = new Array();

function addResizeEvent(functionReference) {
  resizeQueue.push(functionReference);
};

window.onresize = function (event) {
  for (let functionIndex = 0; functionIndex < resizeQueue.length; functionIndex++) {
    resizeQueue[functionIndex](event);
  }
};