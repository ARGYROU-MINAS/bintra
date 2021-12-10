'use strict';

/**
 * @module controller
 * API controller for admin methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

//import { Worker, Plugins, Scheduler, Queue } from "node-resque";

var Worker = require('node-resque').Worker;
var Plugins = require('node-resque').Plugins;
var Scheduler = require('node-resque').Scheduler;
var Queue = require('node-resque').Queue;

async function boot() {
	const connectionDetails = {
		pkg: "ioredis",
		host: "127.0.0.1",
		password: null,
		port: 6379,
		database: 0,
	};

	const jobs = {
		add: {
		}
	};

	// Start worker
	const worker = new Worker(
		{ connection: connectionDetails, queues: ["toot", "otherQueue"] },
		jobs
	);
	await worker.connect();
	worker.start();

	// Start scheduler
	const scheduler = new Scheduler({ connection: connectionDetails });
	await scheduler.connect();
	scheduler.start();

	// Register for events
	worker.on("start", () => {
		console.log("worker started");
	});
	worker.on("end", () => {
		console.log("worker ended");
	});
	worker.on("cleaning_worker", (worker, pid) => {
		console.log(`cleaning old worker ${worker}`);
	});
	worker.on("poll", (queue) => {
		console.debug(`worker polling ${queue}`);
	});
	worker.on("ping", (time) => {
		console.debug(`worker check in @ ${time}`);
	});
	worker.on("job", (queue, job) => {
		console.log(`working job ${queue} ${JSON.stringify(job)}`);
	});
	worker.on("reEnqueue", (queue, job, plugin) => {
		console.log(`reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`);
	});
	worker.on("success", (queue, job, result, duration) => {
		console.log(`job success ${queue} ${JSON.stringify(job)} >> ${result} (${duration}ms)`);
	});
	worker.on("failure", (queue, job, failure, duration) => {
		console.log( `job failure ${queue} ${JSON.stringify( job)} >> ${failure} (${duration}ms)`);
	});
	worker.on("error", (error, queue, job) => {
		console.log(`error ${queue} ${JSON.stringify(job)}  >> ${error}`);
	});
	worker.on("pause", () => {
		console.debug("worker paused");
	});

	scheduler.on("start", () => {
		console.log("scheduler started");
	});
	scheduler.on("end", () => {
		console.log("scheduler ended");
	});
	scheduler.on("poll", () => {
		console.debug("scheduler polling");
	});
	scheduler.on("leader", () => {
		console.debug("scheduler became leader");
	});
	scheduler.on("error", (error) => {
		console.log(`scheduler error >> ${error}`);
	});
	scheduler.on("cleanStuckWorker", (workerName, errorPayload, delta) => {
		console.log( `failing ${workerName} (stuck for ${delta}s) and failing job ${errorPayload}`);
	});
	scheduler.on("workingTimestamp", (timestamp) => {
		console.log(`scheduler working timestamp ${timestamp}`);
	});
	scheduler.on("transferredJob", (timestamp, job) => {
		console.log(`scheduler enquing job ${timestamp} >> ${JSON.stringify(job)}`);
	});

	// connect to a queue
	const queue = new Queue({ connection: connectionDetails }, jobs);
	queue.on("error", function (error) {
		console.log(error);
	});
	await queue.connect();
}

boot();

exports.boot = boot;
exports.Worker = Worker;
exports.Scheduler = Scheduler;
exports.Queue = Queue;
