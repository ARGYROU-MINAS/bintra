'use strict';

/**
 * @module AppServer
 * Main entry point.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var fs = require('fs'),
    path = require('path'),
    http = require('http');

require('custom-env').env(true);

var favicon = require('serve-favicon');
var serveStatic = require('serve-static');
var oas3Tools = require('./myoas/'); //require('oas3-tools');
var jsyaml = require('js-yaml');
var mongoose = require('mongoose');
var auth = require("./utils/auth");

const toobusy = require('toobusy-js');
const hpp = require('hpp');
const express = require("express");
const cors = require("cors");

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

var pfilter = require('./controllers/pfilter');

var emitter = require('events').EventEmitter;
var eventEmitter = require('./utils/eventer').em;
require('./subscribers/matomo');
require('./subscribers/toot');

const { mongoHost, mongoPort, mongoDb, mongoUrl } = require('./conf');
console.log(mongoHost + mongoUrl);
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.set('useCreateIndex', true);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// default CORS domain
const corsWhitelist = ['https://api.bintra.directory', 'https://api.binarytransparency.net', 'https://bintra.directory', 'http://192.168.0.249:8080'];
var corsOptions = {
  origin: function(origin, callback) {
      if(!(origin)) {
        callback(null, true);
      } else {
        console.log("cors check on " + origin);
        if(corsWhitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    }
};

var app = express();

app.use(hpp());

app.use(cors(corsOptions));

// Redirect root to docs UI
app.use('/', function doRedir(req, res, next) {
  if(req.url != '/') {
    next();
  } else {
    res.writeHead(301, {Location: '/docs/'});
    res.end();
  }
});

app.use(function(req, res, next) {
  if (toobusy()) {
    res.send(503, "I'm busy right now, sorry.");
  } else {
    next();
  }
});
toobusy.onLag(function(currentLag) {
  console.error("Event loop lag detected! Latency: " + currentLag + "ms");
});

app.get('/feed.(rss|atom|json)', (req, res) => res.redirect('/v1/feed.' + req.params[0]));

app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'static')));

// Add some mongoose data to request for later use
app.use(function(req, res, next) {
  req.mcdadmin = mongoose.connection;
  next();
});

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname,'api/swagger.yaml'), 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);
var swaggerDocJson = YAML.load(path.join(__dirname,'api/swagger.yaml'));

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
	validateSecurity:
	    {
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
  console.error('No API call');
  res.status(404);
  res.send('No API call');
});

// Filter all parameters known
app.use(pfilter);

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/swagger.yaml'), options);


/**
 * Start the server
 */
var serverPort = process.env.BIND_PORT;
var serverHost = process.env.BIND_HOST;
console.log("Bind to %s : %d", serverHost, serverPort);
var server = http.createServer(app).listen(serverPort, serverHost, function () {
  console.log('Your server is listening on port %d (http://%s:%d)', serverPort, serverHost, serverPort);
  console.log('Swagger-ui is available on http://%s:%d/docs', serverHost, serverPort);
});

process.on('SIGINT', function() {
  console.error("SIGINT received, quit");
  server.close();
  // calling .shutdown allows your process to exit normally
  toobusy.shutdown();
  process.exit();
});

module.exports = app; // for testing
