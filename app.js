'use strict';

/**
 * @module AppServer
 * Main entry point..
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

require('custom-env').env(true);

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

const favicon = require('serve-favicon');
const serveStatic = require('serve-static');
const oas3Tools = require('./myoas/'); // here was required the oas3-tools before
const mongoose = require('mongoose');
const auth = require('./utils/auth');
const webFilterOK = require('./utils/webfilter').webFilterOK;
const express = require('express');
const app = express();

/* add BEHINDPROXY=uniquelocal to .env for private IP detection of proxy */
const behindProxy = process.env.BEHINDPROXY || '';
if (behindProxy === '') {
  logger.warn('Direct serving, no proxy');
} else {
  logger.warn('Behind proxy ' + behindProxy);
  app.set('trust proxy', behindProxy);
}

// get git revision
const gitrevFilename = path.join(__dirname, '.gitrevision');
let gitrevision = '';
try {
  fs.accessSync(gitrevFilename, fs.constants.R_OK);
  gitrevision = fs.readFileSync(gitrevFilename, 'utf8');
} catch (err) {
  logger.error('gitrevision file not found at: ' + gitrevFilename);
}

// Sentry
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const sentryDSN = process.env.SENTRY;
Sentry.init({
  dsn: sentryDSN,
  environment: process.env.NODE_ENV || 'production',
  sendDefaultPii: true,
  release: 'bintra@' + gitrevision,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({
      app
    })
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
  registers: [register]
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
const toobusy = require('toobusy-js');
const hpp = require('hpp');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const pfilter = require('./controllers/pfilter');

const eventEmitter = require('./utils/eventer').em;
eventEmitter.setMaxListeners(0); // temp solution somehow
require('./subscribers/matomo');
require('./subscribers/toot');
require('./subscribers/mqttclient.js');
require('./subscribers/prometheus.js');

const myworker = require('./worker/worker');

// Connect to mongo DB
const mongoUrl = require('./conf').mongoUrl;
logger.debug('DB used: ' + mongoUrl);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('connecting', err => { if (err) { logger.error(err); } logger.info('connecting'); });
db.on('connected', err => { if (err) { logger.error(err); } logger.info('DB connected'); });
db.on('open', err => { if (err) { logger.error(err); } logger.info('DB open'); });
mongoose.connect(mongoUrl, { });

// default CORS domain
const corsWhitelist = ['https://api.bintra.directory', 'https://api.binarytransparency.net', 'https://bintra.directory', 'http://192.168.0.249:8080', 'http://127.0.0.1:8087'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!(origin)) {
      callback(null, true);
    } else {
      logger.info('cors check on ' + origin);
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
app.use(function (req, res, next) {
  Sentry.setUser({
    ip_address: req.ip
  });
  if (typeof req.headers['geoip-country-code'] !== 'undefined') {
    Sentry.setContext('GeoIP', {
      country: req.headers['geoip-country-code'],
      city: req.headers['geoip-city-name'],
      zip: req.headers['geoip-zip'],
      statecode: req.headers['geoip-state-code']
    });
  } // if
  req.sentry = Sentry;
  next();
});

// Redirect root to docs UI
app.get('/', function doRedir (req, res, next) {
  if (req.url !== '/') {
    next();
  } else {
    res.writeHead(301, {
      Location: '/docs/'
    });
    res.end();
  }
});

toobusy.maxLag(parseInt(process.env.BUSY_LAG) || 70);
toobusy.interval(parseInt(process.env.BUSY_INTERVAL) || 500);
const currentMaxLag = toobusy.maxLag(); const interval = toobusy.interval();
logger.info('configure toobusy with maxLag=' + currentMaxLag + ', interval=' + interval);
app.use(function (req, res, next) {
  if (toobusy()) {
    const error = new Error('Too busy');
    req.sentry.captureException(error);
    res.status(503).send("I'm busy right now, sorry.");
  } else {
    next();
  }
});
toobusy.onLag(function (currentLag) {
  const sTmp = 'Event loop lag detected! Latency: ' + currentLag + 'ms';
  Sentry.captureMessage(sTmp, 'warning');
  logger.warn(sTmp);
});

// filter bad requests early
app.use(function (req, res, next) {
  logger.debug('use webFilter');
  if (!webFilterOK(req)) {
    logger.warn('Skip bad request');
    const error = new Error('Bad request gets filtered out');
    req.sentry.captureException(error);
    res.status(400).send('Bad request');
  } else {
    next();
  }
});

app.get('/feed.(rss|atom|json)', (req, res) => res.redirect('/v1/feed.' + req.params[0]));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'static')));

// Add some mongoose data to request for later use
app.use(function (req, res, next) {
  req.mcdadmin = mongoose.connection;
  req.appCounter = appCounter;
  next();
});

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
const swaggerDocJson = YAML.load(path.join(__dirname, 'api/swagger.yaml'));

const uioptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customJs: '/matomo.js',
  customSiteTitle: 'Bintra directory API - binarytransparency',
  customfavIcon: '/favicon.ico'
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocJson, uioptions));

// swaggerRouter configuration
const options = {
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
app.use(/^(?!\/v1).+/, function (req, res) {
  res.status(404);
  res.send('No API call');
  req.sentry.captureMessage('No API call');
});

// Filter all parameters known
app.use(pfilter);

oas3Tools.expressAppConfig(path.join(__dirname, 'api/swagger.yaml'), options);

/**
 * Start the server
 */
logger.info('MaxSockets: ' + http.globalAgent.maxSockets);
const serverPort = process.env.BIND_PORT;
const serverHost = process.env.BIND_HOST;
logger.info('Bind to %s:%d', serverHost, serverPort);
const server = http.createServer(app).listen(serverPort, serverHost, function () {
  logger.info('Your server is listening on port %d (http://%s:%d)', serverPort, serverHost, serverPort);
  logger.info('Swagger-ui is available on http://%s:%d/docs', serverHost, serverPort);
});

async function workerStop () {
  await myworker.queue.end();
  await myworker.Scheduler.end();
  await myworker.Worker.end();
}

process.on('SIGINT', function () {
  logger.error('SIGINT received, quit');
  server.close();
  (async () => workerStop())();
  // calling .shutdown allows your process to exit normally
  toobusy.shutdown();
  process.exit();
});

module.exports = {
  app,
  mongoose
};
