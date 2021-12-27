'use strict';

/**
 * @module AppServer
 * Main entry point..
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var fs = require('fs'),
	path = require('path'),
	http = require('http');

require('custom-env').env(true);

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

var favicon = require('serve-favicon');
var serveStatic = require('serve-static');
var oas3Tools = require('./myoas/'); // here was required the oas3-tools before
var jsyaml = require('js-yaml');
var mongoose = require('mongoose');
var auth = require("./utils/auth");
const express = require("express");
var app = express();

app.set('trust proxy', true);

// get git revision
var gitrevFilename = path.join(__dirname, '.gitrevision');
var gitrevision = "";
try {
	fs.accessSync(gitrevFilename, fs.constants.R_OK);
	gitrevision = fs.readFileSync(gitrevFilename, 'utf8');
} catch (err) {
	logger.error("gitrevision file not found at: " + gitrevFilename);
}


// Sentry
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const sentryDSN = process.env.SENTRY;
Sentry.init({
	dsn: sentryDSN,
	environment: process.env.NODE_ENV || "production",
	sendDefaultPii: true,
	release: "bintra@" + gitrevision,
	integrations: [
		new Sentry.Integrations.Http({ tracing: true }),
		new Tracing.Integrations.Express({
			app,
		}),
	],
	tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(Sentry.Handlers.errorHandler());

// Prometheus section
const client = require('prom-client');
const defaultLabels = { NODE_APP_INSTANCE: process.env.NODE_APP_INSTANCE };
const Registry = client.Registry;
const register = new Registry();
register.setDefaultLabels(defaultLabels);
const collectDefaultMetrics = client.collectDefaultMetrics;
const appCounter = new client.Counter({
	name: 'bintra_app_requests_counter',
	help: 'all api requests',
	registers: [register],
});

const pj = require('./package.json');
const myversion = pj.version;
const versionCounter = new client.Gauge({
	name: 'bintra_app_version',
	help: 'source code version',
	registers: [register],
	labelNames: ['version']
});
versionCounter.set({ version: myversion }, 1);

collectDefaultMetrics({ prefix: 'bintra_', register });

// next section
//const toobusy = require('toobusy-js');
const hpp = require('hpp');
const cors = require("cors");

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

var pfilter = require('./controllers/pfilter');

var emitter = require('events').EventEmitter;
var eventEmitter = require('./utils/eventer').em;
require('./subscribers/matomo');
require('./subscribers/toot');
require('./subscribers/mqttclient.js');
require('./subscribers/prometheus.js');

var myworker = require('./worker/worker');

const {
	mongoHost,
	mongoPort,
	mongoDb,
	mongoUrl
} = require('./conf');
mongoose.set('useCreateIndex', true);
mongoose.connect(mongoUrl, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	connectWithNoPrimary: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// default CORS domain
const corsWhitelist = ['https://api.bintra.directory', 'https://api.binarytransparency.net', 'https://bintra.directory', 'http://192.168.0.249:8080'];
var corsOptions = {
	origin: function(origin, callback) {
		if (!(origin)) {
			callback(null, true);
		} else {
			logger.info("cors check on " + origin);
			if (corsWhitelist.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		}
	}
};

app.use(hpp());
app.use(cors(corsOptions));

// Add Sentry to app object
app.use(function(req, res, next) {
	Sentry.setUser({
		ip_address: req.ip
	});
	Sentry.setContext("GeoIP", {
		country: req.headers['geoip-country-code'],
		city: req.headers['geoip-city-name'],
		zip: req.headers['geoip-zip'],
		statecode: req.headers['geoip-state-code']
	});
	req.sentry = Sentry;
	next();
});

// Redirect root to docs UI
app.use('/', function doRedir(req, res, next) {
	if (req.url != '/') {
		next();
	} else {
		res.writeHead(301, {
			Location: '/docs/'
		});
		res.end();
	}
});

/*
app.use(function(req, res, next) {
	if (toobusy()) {
		var error = new Error("Too busy");
		req.sentry.captureException(error);
		res.status(503).send("I'm busy right now, sorry.");
	} else {
		next();
	}
});
toobusy.onLag(function(currentLag) {
	logger.warn("Event loop lag detected! Latency: " + currentLag + "ms");
});
*/

app.get('/feed.(rss|atom|json)', (req, res) => res.redirect('/v1/feed.' + req.params[0]));

app.get('/metrics', async (req, res) => {
	res.set('Content-Type', register.contentType);
	res.end(await register.metrics());
});

app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'static')));

// Add some mongoose data to request for later use
app.use(function(req, res, next) {
	req.mcdadmin = mongoose.connection;
	req.appCounter = appCounter;
	next();
});

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname, 'api/swagger.yaml'), 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);
var swaggerDocJson = YAML.load(path.join(__dirname, 'api/swagger.yaml'));

var uioptions = {
	customCss: '.swagger-ui .topbar { display: none }',
	customJs: '/matomo.js',
	customSiteTitle: "Bintra directory API - binarytransparency",
	customfavIcon: "/favicon.ico"
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocJson, uioptions));

// swaggerRouter configuration
var options = {
	routing: {
		controllers: path.join(__dirname, './controllers')
	},
	logging: {
		format: 'combined',
		errorLimit: 400
	},
	theapp: app,
	openApiValidator: {
		validateSecurity: {
			handlers: {
				bearerauth: auth.verifyToken
			}
		},
		validateRequests: true,
		validateResponses: false
	}
};

// No "/v1" pattern, so it is wrong from here on
app.use(/^(?!\/v1).+/, function(req, res) {
	res.status(404);
	res.send('No API call');
	req.sentry.captureMessage("No API call");
});


// Filter all parameters known
app.use(pfilter);

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/swagger.yaml'), options);


/**
 * Start the server
 */
var serverPort = process.env.BIND_PORT;
var serverHost = process.env.BIND_HOST;
logger.info("Bind to %s : %d", serverHost, serverPort);
var server = http.createServer(app).listen(serverPort, serverHost, function() {
	logger.info('Your server is listening on port %d (http://%s:%d)', serverPort, serverHost, serverPort);
	logger.info('Swagger-ui is available on http://%s:%d/docs', serverHost, serverPort);
});

async function workerStop() {
	await myworker.queue.end();
	await myworker.Scheduler.end();
	await myworker.Worker.end();
}

process.on('SIGINT', function() {
	logger.error("SIGINT received, quit");
	server.close();
	(async () => workerStop())();
	// calling .shutdown allows your process to exit normally
	//toobusy.shutdown();
	process.exit();
});

module.exports = {
	app: app
}

