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
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var mongoose = require('mongoose');
var auth = require("./utils/auth");

var emitter = require('events').EventEmitter;
var eventEmitter = require('./utils/eventer').em;
require('./subscribers/matomo');

const { mongoHost, mongoPort, mongoDb, mongoUrl } = require('./conf');
console.log(mongoHost + mongoUrl);
mongoose.connect(mongoUrl, { useNewUrlParser: true, useInifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname,'api/swagger.yaml'), 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// swaggerRouter configuration
var options = {
  swaggerUi: path.join(__dirname, '/swagger.json'),
  controllers: path.join(__dirname, './controllers'),
  useStubs: process.env.NODE_ENV === 'development' // Conditionally turn on stubs (mock mode)
};


// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));

  app.use(serveStatic(path.join(__dirname, 'static')));

  app.use(
    middleware.swaggerSecurity({
      //manage token function in the 'auth' module
      Bearer: auth.verifyToken
    })
  );

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi({
          url: "/api/swagger.yaml"
  }));

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
   * @see DDATA-server-backend-002
   */
  var serverPort = process.env.BIND_PORT;
  var serverHost = process.env.BIND_HOST;
  console.log("Bind to %s : %d", serverHost, serverPort);
  http.createServer(app).listen(serverPort, serverHost, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });

  // Redirect root to docs UI
  app.use('/', function doRedir(req, res, next) {
    if(req.url != '/') {
      next();
    } else {
      res.writeHead(301, {Location: '/docs/'});
      res.end();
    }
  });

});

module.exports = app; // for testing
