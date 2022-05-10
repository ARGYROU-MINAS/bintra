'use strict';

/**
 * @module controller
 * API controller for queue handling stuff.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

const utils = require('../utils/writer.js');
const eventEmitter = require('../utils/eventer').em;
const QueueService = require('../service/QueueService');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';
const EVENTNAME = 'apihit';

/**
 * @method
 * List all queues and entry counts.
 * @public
 */
module.exports.listQueues = function listQueues (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);

  QueueService.listQueues()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};
