// subscribers

const eventEmitter = require('../utils/eventer').em;

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

eventEmitter.on('apihit', function getPrometheusApiHit (req) {
  logger.debug('In prometheus subscriber');

  if (req.appCounter == null) return;
  req.appCounter.inc();
  logger.debug(req.appCounter);
});

module.exports = {}
