// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "debug";

eventEmitter.on('apihit', function getPrometheusApiHit(req) {
  logger.debug("In prometheus subscriber");

  if(null == req.appCounter) return;
  req.appCounter.inc();
  logger.info(req.appCounter);
});

module.exports = {}
