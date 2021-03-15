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
  var username = args.body.username;
  var password = args.body.password;
  var response;

  //eventEmitter.emit('apihit', req);

  Service.checkUser(username, password)
    .then(function (useritem) {
	  console.log("User found: " + useritem);
      var myRole = useritem.role;
      console.log("User hat role " + myRole);
      var tokenString = auth.issueToken(username, myRole);
      response = { token: tokenString };
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(response));
    })
    .catch(function () {
      response = { message: "Error: Credentials incorrect" };
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(response));
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listUsers = function listUsers (req, res, next) {

  eventEmitter.emit('apihit', req);

  Service.listUsers()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.deleteUser = function deleteUser (req, res, next, id) {
  eventEmitter.emit('apihit', req);

  Service.deleteUser(id)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.putUserStatus = function putUserStatus (req, res, next, status, id) {
  eventEmitter.emit('apihit', req);
  console.log("putUserStatus " + id + "/" + status + "!");

  Service.putUserStatus(id, status)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listUser = function listUser (req, res, next, id) {
  eventEmitter.emit('apihit', req);

  Service.listUser(id)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.createUser = function createUser (req, res, next, user) {
  eventEmitter.emit('apihit', req);

  Service.createUser(user)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.searchPackages = function searchPackages (req, res, next, jsearch) {
  eventEmitter.emit('apihit', req);

  Service.searchPackages(jsearch)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.patchUser = function patchUser (req, res, next, id, jpatch) {
  eventEmitter.emit('apihit', req);

  Service.patchUser(id, jpatch)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * Delete package with given package data. Permission required.
 * @public
 */
module.exports.deletePackage = function deletePackage (req, res, next, packageName, packageVersion, packageArch, packageFamily, packageHash) {

  eventEmitter.emit('apihit', req);

  Service.deletePackage(packageName, packageVersion, packageArch, packageFamily, packageHash)
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeText(res, payload, 400);
    });
};

/**
 * @method
 * Delete package with given package id. Permission required.
 * @public
 */
module.exports.deletePackageById = function deletePackageById (req, res, next, id) {

  eventEmitter.emit('apihit', req);

  Service.deletePackageById(id)
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

