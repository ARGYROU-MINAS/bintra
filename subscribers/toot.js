// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;

var myworker = require('../worker/worker');

eventEmitter.on('putdata', function getPutDataHit(packageName, packageVersion, packageArch, packageFamily, packageHash, isnew) {
  if(process.env.TOOTAUTH == "XXX") return;
  console.debug("In toot subscriber");

  var t;
  if(isnew) {
    t = 'Add new hash ' + packageHash + ' for ' + packageName + ' (' + packageVersion + ') for ' + packageArch + ' #' + packageFamily;
  } else {
    console.log('Skip checks for now');
    return;
  }

  t = t + ' #binarytransparency';

  myworker.doqueue("toot", "addtoot", t);

});

module.exports = {}
