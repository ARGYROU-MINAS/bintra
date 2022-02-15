'use strict';

/**
 * @module controller
 * API controller for methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var utils = require('../utils/writer.js');
var eventEmitter = require('../utils/eventer').em;
var PackagesService = require('../service/PackagesService');
var UsersService = require('../service/UsersService');

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";


/**
 * @method
 * Validate package, store information and return alternatives.
 * @public
 */
module.exports.checkToken = function checkToken(req, res, next) {
    logger.info("In check");
    eventEmitter.emit('apihit', req);
    logger.info(req.auth);
    logger.info("from=" + req.auth.iat);
    logger.info("to=" + req.auth.exp);

    var tsfrom = new Date(req.auth.iat * 1000);
    var tsto = new Date(req.auth.exp * 1000);
    var sfrom = tsfrom.toISOString();
    var sto = tsto.toISOString();
    logger.info("sfrom=" + sfrom);
    logger.info("sto=" + sto);

    var payload = {
        name: req.auth.sub,
        tsfrom: sfrom,
        tsto: sto
    };
    logger.info(payload);
    utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Validate package, store information and return alternatives.
 * @public
 */
module.exports.validatePackage = function validatePackage(req, res, next, packageName, packageVersion, packageArch, packageFamily, packageHash) {
    var username = req.auth.sub;

    eventEmitter.emit('apihit', req);

    PackagesService.validatePackage(packageName, packageVersion, packageArch, packageFamily, packageHash, username)
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
};

/**
 * @method
 * List package data for arguments matching.
 * @public
 */
module.exports.listPackage = function listPackage(req, res, next, packageName, packageVersion, packageArch, packageFamily) {

    eventEmitter.emit('apihit', req);

    PackagesService.listPackage(packageName, packageVersion, packageArch, packageFamily)
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
};

/**
 * @method
 * List package data for arguments matching.
 * @public
 */
module.exports.listPackageSingle = function listPackage(req, res, next, id) {

    eventEmitter.emit('apihit', req);

    PackagesService.listPackageSingle(id)
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeText(res, payload.msg, payload.code);
        });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listPackages = function listPackage(req, res, next, skip, count, sort, direction, age) {
    logger.info("listPackages called with " + skip + ", " + count + ", " + sort + ", " + direction + ", " + age);

    eventEmitter.emit('apihit', req);

    if(age == null) {
        age = 9999; // might be enough for any
    }

    PackagesService.listPackages(skip, count, sort, direction, age)
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listPagePackages = function listPagePackage(req, res, next, page, size, sorters, filter) {
    logger.info("listPagePackages called with " + page + ", " + size + ", " + sorters + ", " + filter);

    eventEmitter.emit('apihit', req);

    PackagesService.listPagePackages(page, size, sorters, filter)
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listPackagesFull = function listPackage(req, res, next, count) {
    if (!count) {
        count = 100;
    }

    eventEmitter.emit('apihit', req);

    PackagesService.listPackagesFull(count)
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
};

/**
 * @method
 * Return total number of package variations.
 * @public
 */
module.exports.countPackage = function countPackage(req, res, next) {

    eventEmitter.emit('apihit', req);

    PackagesService.countPackage()
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
};


/**
 * @method
 * Test function
 * @public
 */
module.exports.testDefault = function testDefault(req, res, next) {

    eventEmitter.emit('apihit', req);
    logger.info(req.openapi.schema.security);

    var payload = {
        message: "you called default"
    };
    utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Test function
 * @public
 */
module.exports.testAdmin = function testAdmin(req, res, next) {

    eventEmitter.emit('apihit', req);
    logger.info(req.openapi.schema.security);

    var payload = {
        message: "you called admin"
    };
    utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Return total number of package variations.
 * @public
 */
module.exports.summaryByWhat = function summaryByWhat(req, res, next, bywhat) {

    eventEmitter.emit('apihit', req);

    switch(bywhat) {
      case 'arch':
        PackagesService.summaryArch()
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
        break;
      case 'family':
        PackagesService.summaryFamily()
        .then(function(payload) {
            utils.writeJson(res, payload, 200);
        })
        .catch(function(payload) {
            utils.writeJson(res, payload, 400);
        });
        break;
    } // switch
};
