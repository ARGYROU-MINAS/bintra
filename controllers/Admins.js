'use strict';

/**
 * @module controller
 * API controller for admin methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var utils = require('../utils/writer.js');
var eventEmitter = require('../utils/eventer').em;
var Service = require('../service/PackagesService');
var auth = require("../utils/auth");



/**
 * @function
 * Receive login data and return JWT token.
 * @private
 */
module.exports.loginPost = function loginPost(args, res, next) {
  var role = args.swagger.params.role.value;
  var username = args.body.username;
  var password = args.body.password;
  var response;

  eventEmitter.emit('apihit', req);

  if (role != "user" && role != "admin") {
    response = { message: 'Error: Role must be either "admin" or "user"' };
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(response));
  }

  if (username == "username" && password == "password" && role) {
    var tokenString = auth.issueToken(username, role);
    response = { token: tokenString };
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(response));
  } else {
    response = { message: "Error: Credentials incorrect" };
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(response));
  }
};


/**
 * @method
 * Delete package with given package data. Permission required.
 * @public
 */
module.exports.deletePackage = function deletePackage (req, res, next) {
  var packageName = req.swagger.params['packageName'].value;
  var packageVersion = req.swagger.params['packageVersion'].value;
  var packageArch = req.swagger.params['packageArch'].value;
  var packageHash = req.swagger.params['packageHash'].value;

  eventEmitter.emit('apihit', req);

  Service.deletePackage(packageName, packageVersion, packageArch, packageHash)
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeText(res, payload, 400);
    });
};

/**
 * @method
 * Delete all packages, for testing purpose. Permission required.
 * @public
 */
module.exports.cleanupPackages = function cleanupPackages (req, res, next) {

  eventEmitter.emit('apihit', req);

  Service.cleanupPackages()
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeText(res, payload, 400);
    });
};
