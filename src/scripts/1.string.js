String.prototype.replaceAt = function (index, replacement) {

  if (replacement.length < -index || index >= this.length) {
    return this
  } else if (index < 0) {
    return replacement.substring(-index, this.length + 1) + this.substring(replacement.length + index)
  } else {
    return this.substring(0, index) + replacement.substring(0, this.length - index) + this.substring(index + replacement.length)
  }

};

String.prototype.sandwichAt = function (index, sandwich) {
  return this.substring(0, index) + sandwich + this.substring(index + sandwich.length - 1);
}

String.prototype.repeat = function (times) {
  var repeatedString = "";
  
  for (let charIndex = 0; charIndex < times; charIndex++) {
    repeatedString += this;
  }

  return repeatedString;
}