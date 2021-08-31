// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;
var appCounter = require('../app.js').appCounter;

eventEmitter.on('apihit', function getPrometheusApiHit(req) {
  console.debug("In prometheus subscriber");

  if(null == appCounter) return;
  appCounter.inc();
});

module.exports = {}
