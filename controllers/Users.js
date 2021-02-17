'use strict';

/**
 * @module controller
 * API controller for methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var utils = require('../utils/writer.js');
var eventEmitter = require('../utils/eventer').em;
var Service = require('../service/PackagesService');


/**
 * @method
 * Validate package, store information and return alternatives.
 * @public
 */
module.exports.validatePackage = function validatePackage (req, res, next) {
  var packageName = req.swagger.params['packageName'].value;
  var packageVersion = req.swagger.params['packageVersion'].value;
  var packageArch = req.swagger.params['packageArch'].value;
  var packageHash = req.swagger.params['packageHash'].value;
  var username = req.auth.sub;

  eventEmitter.emit('apihit', req);

  Service.validatePackage(packageName, packageVersion, packageArch, packageHash, username)
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
module.exports.listPackage = function listPackage (req, res, next) {
  var packageName = req.swagger.params['packageName'].value;
  var packageVersion = req.swagger.params['packageVersion'].value;
  var packageArch = req.swagger.params['packageArch'].value;

  eventEmitter.emit('apihit', req);

  Service.listPackage(packageName, packageVersion, packageArch)
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
module.exports.listPackageSingle = function listPackage (req, res, next) {
  var packageId = req.swagger.params['id'].value;

  eventEmitter.emit('apihit', req);

  Service.listPackageSingle(packageId)
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
module.exports.listPackages = function listPackage (req, res, next) {
  var count = req.swagger.params['count'].value;
  if(!count) {
    count = 100;
  }

  eventEmitter.emit('apihit', req);

  Service.listPackages(count)
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
module.exports.listPackagesFull = function listPackage (req, res, next) {
  var count = req.swagger.params['count'].value;
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

  var a = req.headers['Authorize'];
  console.log("Auth: " + a); 

  Service.countPackage()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};
