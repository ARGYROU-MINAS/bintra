'use strict';

/**
 * @module controller
 * API controller for admin methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

const Worker = require('node-resque').Worker;
const Scheduler = require('node-resque').Scheduler;
const Queue = require('node-resque').Queue;
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

let queue;

const dotoot = require('./w_toot');

async function boot () {
  const connectionDetails = {
    pkg: 'ioredis',
    host: process.env.REDIS_HOSTNAME || '127.0.0.1',
    password: null,
    port: process.env.REDIS_PORT || 6379,
    database: 0
  };

  const jobs = {
    addtoot: {
      perform: (t) => {
        queue.length('toot').then(function (l) {
          if (l > 1) {
            t = t + ' and ' + l + ' more';
          }
          dotoot(t);
          queue.delByFunction('toot', 'addtoot');
        });
      }
    }
  };

  // Start worker
  const worker = new Worker(
    { connection: connectionDetails, queues: ['toot', 'otherQueue'] },
    jobs
  );
  await worker.connect();
  worker.start();

  // Start scheduler
  const scheduler = new Scheduler({ connection: connectionDetails });
  await scheduler.connect();
  scheduler.start();

  // Register for events
  worker.on('start', () => {
    logger.info('worker started');
  });
  worker.on('end', () => {
    logger.info('worker ended');
  });
  worker.on('cleaning_worker', (w, pid) => {
    logger.debug(`cleaning old worker ${w}`);
  });
  worker.on('poll', (q) => {
    logger.debug(`worker polling ${q}`);
    queue.length(q).then(function (l) {
      logger.debug('Q length=' + l);
    });
  });
  worker.on('ping', (time) => {
    logger.debug(`worker check in @ ${time}`);
  });
  worker.on('job', (q, job) => {
    logger.debug(`working job ${q} ${JSON.stringify(job)}`);
  });
  worker.on('reEnqueue', (q, job, plugin) => {
    logger.debug(`reEnqueue job (${plugin}) ${q} ${JSON.stringify(job)}`);
  });
  worker.on('success', (q, job, result, duration) => {
    logger.debug(`job success ${q} ${JSON.stringify(job)} >> ${result} (${duration}ms)`);
  });
  worker.on('failure', (q, job, failure, duration) => {
    logger.debug(`job failure ${q} ${JSON.stringify(job)} >> ${failure} (${duration}ms)`);
  });
  worker.on('error', (error, q, job) => {
    logger.debug(`error ${q} ${JSON.stringify(job)}  >> ${error}`);
  });
  worker.on('pause', () => {
    logger.debug('worker paused');
  });

  scheduler.on('start', () => {
    logger.debug('scheduler started');
  });
  scheduler.on('end', () => {
    logger.debug('scheduler ended');
  });
  scheduler.on('poll', () => {
    logger.debug('scheduler polling');
  });
  scheduler.on('leader', () => {
    logger.debug('scheduler became leader');
  });
  scheduler.on('error', (error) => {
    logger.debug(`scheduler error >> ${error}`);
  });
  scheduler.on('cleanStuckWorker', (workerName, errorPayload, delta) => {
    logger.debug(`failing ${workerName} (stuck for ${delta}s) and failing job ${errorPayload}`);
  });
  scheduler.on('workingTimestamp', (timestamp) => {
    logger.debug(`scheduler working timestamp ${timestamp}`);
  });
  scheduler.on('transferredJob', (timestamp, job) => {
    logger.debug(`scheduler enquing job ${timestamp} >> ${JSON.stringify(job)}`);
  });

  // connect to a queue
  queue = new Queue({ connection: connectionDetails }, jobs);
  queue.on('error', function (error) {
    logger.error(error);
  });
  await queue.connect();
}

async function doqueue (t) {
  queue.enqueue('toot', 'addtoot', t);
}

async function queueDelayed (s) {
  logger.debug('XX');
  const qName = 'toot';
  const fName = 'addtoot';
  const iDelay = 5000;

  queue.length(qName).then(function (result) {
    logger.debug('Queue length=' + result);
    queue.enqueueIn(result * iDelay, qName, fName, s);
    logger.debug('Did enqueue');
  });
}

boot();

exports.boot = boot;
exports.Worker = Worker;
exports.Scheduler = Scheduler;
exports.queue = queue;
exports.doqueue = doqueue;
exports.queueDelayed = queueDelayed;
