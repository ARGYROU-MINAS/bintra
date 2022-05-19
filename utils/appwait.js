'use strict';

const server = require('../app').app;
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

exports.appWait = function (done) {
  logger.warn('Wait for app server start');
  if (server.didStart) {
    logger.info('app server already started');
    done();
  } else {
    server.on('appStarted', function () {
      logger.info('app server started now');
      done();
    });
  } // if
}
