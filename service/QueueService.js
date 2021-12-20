'use strict';

var Worker = require('node-resque').Worker;
var Plugins = require('node-resque').Plugins;
var Scheduler = require('node-resque').Scheduler;
var Queue = require('node-resque').Queue;

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

const connectionDetails = {
	pkg: "ioredis",
	host: "127.0.0.1",
	password: null,
	port: 6379,
	database: 0,
};


/**
 * @method
 * List queues
 * @public
 *
 * @returns array of entries
 **/
exports.listQueues = function() {
	return new Promise(function(resolve, reject) {
		logger.info("In list service");
		var q = new Queue({ connection: connectionDetails });
		q.on("error", function(error) {
			logger.error(error);
		});
		q.connect().then(c => {
			q.queues()
				.then(async (item) => {
					var r = [];
					for (const value of item) {
						const l = await q.length(value);
						r.push({ id: value, count: l });
					}
					resolve(r);
				})
				.catch(err => {
					logger.error("Not OK: ", err);
					reject("bahh");
				});
		});
	});
}

