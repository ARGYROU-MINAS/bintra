// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;

eventEmitter.on('apihit', function getPrometheusApiHit(req) {
  console.debug("In prometheus subscriber");

  if(null == req.appCounter) return;
  req.appCounter.inc();
  console.log(req.appCounter);
});

module.exports = {}
