'use strict';

const Worker = require('node-resque').Worker;
const Plugins = require('node-resque').Plugins;
const Scheduler = require('node-resque').Scheduler;
const Queue = require('node-resque').Queue;

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

const connectionDetails = {
  pkg: 'ioredis',
  host: process.env.REDIS_HOSTNAME || '127.0.0.1',
  password: null,
  port: process.env.REDIS_PORT || 6379,
  database: 0
};

/**
 * @method
 * List queues
 * @public
 *
 * @returns array of entries
 **/
exports.listQueues = function () {
  return new Promise(function (resolve, reject) {
    logger.info('In list service');
    const q = new Queue({ connection: connectionDetails });
    q.on('error', function (error) {
      logger.error(error);
    });
    q.connect().then(c => {
      q.queues()
        .then(async (item) => {
          const r = [];
          for (const value of item) {
            const l = await q.length(value);
            r.push({ id: value, count: l });
          }
          resolve(r);
        })
        .catch(err => {
          logger.error('Not OK: ', err);
          reject('bahh');
        });
    });
  });
};
