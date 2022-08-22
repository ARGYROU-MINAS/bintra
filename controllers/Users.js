'use strict';

/**
 * @module controller
 * API controller for methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

const utils = require('../utils/writer.js');
const eventEmitter = require('../utils/eventer').em;
const PackagesService = require('../service/PackagesService');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';
const EVENTNAME = 'apihit';

/**
 * @method
 * Validate package, store information and return alternatives.
 * @public
 */
module.exports.checkToken = function checkToken (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);

  logger.debug(req.auth);
  logger.debug('from=' + req.auth.iat);
  logger.debug('to=' + req.auth.exp);

  const tsfrom = new Date(req.auth.iat * 1000);
  const tsto = new Date(req.auth.exp * 1000);
  const sfrom = tsfrom.toISOString();
  const sto = tsto.toISOString();
  logger.debug('sfrom=' + sfrom);
  logger.debug('sto=' + sto);

  const payload = {
    name: req.auth.sub,
    tsfrom: sfrom,
    tsto: sto
  };
  logger.debug(payload);
  utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Validate package, store information and return alternatives.
 * @public
 */
module.exports.validatePackage = function validatePackage (req, res, next, packageName, packageVersion, packageArch, packageFamily, packageSubFamily, packageHash) {
  const username = req.auth.sub;

  eventEmitter.emit(EVENTNAME, req);

  logger.debug('subfamily=' + packageSubFamily);

  PackagesService.validatePackage(packageName, packageVersion, packageArch, packageFamily, packageSubFamily, packageHash, username)
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
  eventEmitter.emit(EVENTNAME, req);

  PackagesService.listPackage(packageName, packageVersion, packageArch, packageFamily)
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
  eventEmitter.emit(EVENTNAME, req);

  PackagesService.listPackageSingle(id)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeText(res, payload.msg, payload.code);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listPackages = function listPackage (req, res, next, skip, count, sort, direction, age) {
  logger.debug('listPackages called with ' + skip + ', ' + count + ', ' + sort + ', ' + direction + ', ' + age);

  eventEmitter.emit(EVENTNAME, req);

  if (age == null) {
    age = 9999; // might be enough for any
  }

  PackagesService.listPackages(skip, count, sort, direction, age)
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
module.exports.listPagePackages = function listPagePackage (req, res, next, page, size, sorters, filter) {
  logger.debug('listPagePackages called with ' + page + ', ' + size + ', ' + sorters + ', ' + filter);

  eventEmitter.emit(EVENTNAME, req);

  PackagesService.listPagePackages(page, size, sorters, filter)
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
  if (!count) {
    count = 100;
  }

  eventEmitter.emit(EVENTNAME, req);

  PackagesService.listPackagesFull(count)
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
  eventEmitter.emit(EVENTNAME, req);

  PackagesService.countPackage()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * Test function for normal rights
 * @public
 */
module.exports.testDefault = function testDefault (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);
  logger.info(req.openapi.schema.security);

  const payload = {
    message: 'you called default'
  };
  utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Test function for admin right
 * @public
 */
module.exports.testAdmin = function testAdmin (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);
  logger.info(req.openapi.schema.security);

  const payload = {
    message: 'you called admin'
  };
  utils.writeJson(res, payload, 200);
};

/**
 * @method
 * Return total number of package variations.
 * @public
 */
module.exports.summaryByWhat = function summaryByWhat (req, res, next, bywhat) {
  eventEmitter.emit(EVENTNAME, req);

  switch (bywhat) {
    case 'arch':
      PackagesService.summaryArch()
        .then(function (payload) {
          utils.writeJson(res, payload, 200);
        })
        .catch(function (payload) {
          utils.writeJson(res, payload, 400);
        });
      break;
    case 'family':
      PackagesService.summaryFamily()
        .then(function (payload) {
          utils.writeJson(res, payload, 200);
        })
        .catch(function (payload) {
          utils.writeJson(res, payload, 400);
        });
      break;
  } // switch
};
