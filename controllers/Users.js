'use strict';

/**
 * @module controller
 * API controller for methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var dateFormat = require("dateformat");
var utils = require('../utils/writer.js');
var eventEmitter = require('../utils/eventer').em;
var Service = require('../service/PackagesService');


/**
 * @method
 * Validate package, store information and return alternatives.
 * @public
 */
module.exports.checkToken = function checkToken (req, res, next) {
  console.log("In check");
  eventEmitter.emit('apihit', req);
  console.log(req.auth);

  var tsfrom = dateFormat(req.auth.iat * 1000, "isoUtcDateTime");
  var tsto = dateFormat(req.auth.exp * 1000, "isoUtcDateTime");

  var payload = {name: req.auth.sub, tsfrom: tsfrom, tsto: tsto};
  console.log(payload);
  utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Validate package, store information and return alternatives.
 * @public
 */
module.exports.validatePackage = function validatePackage (req, res, next, packageName, packageVersion, packageArch, packageFamily, packageHash) {
  var username = req.auth.sub;

  eventEmitter.emit('apihit', req);

  Service.validatePackage(packageName, packageVersion, packageArch, packageFamily, packageHash, username)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List package data for arguments matching.
 * @public
 */
module.exports.listPackage = function listPackage (req, res, next, packageName, packageVersion, packageArch, packageFamily) {

  eventEmitter.emit('apihit', req);

  Service.listPackage(packageName, packageVersion, packageArch, packageFamily)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List package data for arguments matching.
 * @public
 */
module.exports.listPackageSingle = function listPackage (req, res, next, id) {

  eventEmitter.emit('apihit', req);

  Service.listPackageSingle(id)
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
module.exports.listPackages = function listPackage (req, res, next, count, sort, direction) {
  console.log("listPackages called with" + count + ", " + sort + ", " + direction);

  eventEmitter.emit('apihit', req);

  Service.listPackages(count, sort, direction)
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
module.exports.listPackagesFull = function listPackage (req, res, next, count) {
  if(!count) {
    count = 100;
  }

  eventEmitter.emit('apihit', req);

  Service.listPackagesFull(count)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * Return total number of package variations.
 * @public
 */
module.exports.countPackage = function countPackage (req, res, next) {

  eventEmitter.emit('apihit', req);

  Service.countPackage()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};


/**
 * @method
 * Test function
 * @public
 */
module.exports.testDefault = function testDefault (req, res, next) {

  eventEmitter.emit('apihit', req);
console.log(req.openapi.schema.security);

  var payload = {message: "you called default"};
  utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Test function
 * @public
 */
module.exports.testAdmin = function testAdmin (req, res, next) {

  eventEmitter.emit('apihit', req);
console.log(req.openapi.schema.security);

  var payload = {message: "you called admin"};
  utils.writeJson(res, payload, 200);
};
