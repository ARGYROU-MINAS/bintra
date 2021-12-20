'use strict';

/**
 * @module controller
 * API controller for queue handling stuff.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var utils = require('../utils/writer.js');
var eventEmitter = require('../utils/eventer').em;
var QueueService = require('../service/QueueService');
var auth = require("../utils/auth");
var fs = require('fs');
var path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

/**
 * @method
 * List all queues.
 * @public
 */
module.exports.listQueues = function listQueues(req, res, next) {

    eventEmitter.emit('apihit', req);

    QueueService.listQueues()
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
};

