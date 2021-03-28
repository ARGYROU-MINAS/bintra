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
const express = require("express");
const cors = require("cors");

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
const corsWhitelist = ['api.bintra.directory', 'bintra.directory'];
var corsOptions = {
  origin: function(origin, callback) {
      console.log("cors check on " + origin);
      if(corsWhitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
};

var app = express();

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

app.get('/feed.rss', (req, res) => res.redirect('/v1/feed.rss'));
app.get('/feed.atom', (req, res) => res.redirect('/v1/feed.atom'));
app.get('/feed.json', (req, res) => res.redirect('/v1/feed.json'));

app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'static')));

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname,'api/swagger.yaml'), 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

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

// Filter all parameters known
app.use(pfilter);

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/swagger.yaml'), options);
//var app = expressAppConfig.getApp();

  // Error handlers
  app.use((err, req, res, next) => {
    if (err.statusCode === 401) {
       // do something you like

       res.code = 401;
       res.end(err.message);
       return;
     }
     res.code = 500;
     res.end(err.message);
  });

/**
 * Start the server
 */
var serverPort = process.env.BIND_PORT;
var serverHost = process.env.BIND_HOST;
console.log("Bind to %s : %d", serverHost, serverPort);
http.createServer(app).listen(serverPort, serverHost, function () {
  console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
  console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});

module.exports = app; // for testing
