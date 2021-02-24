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

var app = require('connect')();
var favicon = require('serve-favicon');
var serveStatic = require('serve-static');
var oas3Tools = require('oas3-tools');
var jsyaml = require('js-yaml');
var mongoose = require('mongoose');
var auth = require("./utils/auth");

var pfilter = require('./controllers/pfilter');

var bintrafeed = require('./controllers/bintrafeed');

var emitter = require('events').EventEmitter;
var eventEmitter = require('./utils/eventer').em;
require('./subscribers/matomo');

const { mongoHost, mongoPort, mongoDb, mongoUrl } = require('./conf');
console.log(mongoHost + mongoUrl);
mongoose.connect(mongoUrl, { useNewUrlParser: true, useInifiedTopology: true, useFindAndModify: false });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

function validate(request, scopes, schema) {
    console.log("IN VALIDATE!!!");
    // security stuff here
    return true;
}

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname,'api/swagger.yaml'), 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
    loggin: {
        format: 'combined',
        errorLimit: 400
    },
    openApiValidator: {
	validateSecurity: {
            handlers: {
                bearerAuth: auth.verifyToken
            }
        }
    }
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/swagger.yaml'), options);
var app = expressAppConfig.getApp();

app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));

app.use(serveStatic(path.join(__dirname, 'static')));

app.use("/feed.rss", bintrafeed.rss);
app.use("/feed.atom", bintrafeed.atom);

  // Filter all parameters known
//  app.use(pfilter);

  // Redirect root to docs UI
  app.use('/', function doRedir(req, res, next) {
    if(req.url != '/') {
      next();
    } else {
      res.writeHead(301, {Location: '/docs/'});
      res.end();
    }
  });

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
