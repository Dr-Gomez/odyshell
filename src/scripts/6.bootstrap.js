void function () {
  var measure = new Ruler('"Courier New", Courier, monospace', "My");
  var catcher = new Catcher();

  var terminal = new Terminal("lines", measure, catcher);
  var shell = new Shell("lagann", "Don", terminal);
}();