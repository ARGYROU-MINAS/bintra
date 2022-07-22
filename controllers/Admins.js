'use strict';

/**
 * @module controller
 * API controller for admin methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

const utils = require('../utils/writer.js');
const eventEmitter = require('../utils/eventer').em;
const PackagesService = require('../service/PackagesService');
const UsersService = require('../service/UsersService');
const mongoose = require('mongoose');
const auth = require('../utils/auth');
const fs = require('fs');
const path = require('path');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';
const EVENTNAME = 'apihit';

/**
 * @function
 * Receive login data and return JWT token.
 * @private
 */
module.exports.loginPost = function loginPost (args, res, next) {
  const username = args.body.username;
  const password = args.body.password;
  let response;

  eventEmitter.emit('posthit', 'login');

  UsersService.checkUser(username, password)
    .then(function (useritem) {
      logger.info('User found: ' + useritem);
      const myRole = useritem.role;
      logger.info('User hat role ' + myRole);
      const tokenString = auth.issueToken(username, myRole);
      response = {
        token: tokenString
      };
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify(response));
    })
    .catch(function () {
      response = {
        message: 'Error: Credentials incorrect'
      };
      res.writeHead(403, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify(response));
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listUsers = function listUsers (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.listUsers()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 500);
    });
};

/**
 * @method
 * Get user data of named user.
 * @public
 */
module.exports.getUser = function getUser (req, res, next, name) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.getUser(name)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.deleteUser = function deleteUser (req, res, next, id) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.deleteUser(id)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.putUserStatus = function putUserStatus (req, res, next, status, id) {
  eventEmitter.emit(EVENTNAME, req);

  logger.info('putUserStatus ' + id + '/' + status + '!');

  UsersService.putUserStatus(id, status)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.listUser = function listUser (req, res, next, id) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.listUser(id)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * List all black listed domains.
 * @public
 */
module.exports.listDomains = function listDomains (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.listDomains()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * Add a black listed domains.
 * @public
 */
module.exports.addDomain = function listDomains (req, res, next, name) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.addDomain(name)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * Delete a black listed domains.
 * @public
 */
module.exports.deleteDomain = function listDomains (req, res, next, name) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.deleteDomain(name)
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeText(res, err.message, err.code);
    });
};

/**
 * @method
 * List all black listed domains.
 * @public
 */
module.exports.checkDomain = function listDomains (req, res, next, name) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.checkDomain(name)
    .then(function (payload) {
      if (payload == null) {
        utils.writeJson(res, {
          message: 'Not found'
        }, 404);
      } else {
        utils.writeJson(res, payload, 200);
      }
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.createUser = function createUser (req, res, next, user) {
  eventEmitter.emit(EVENTNAME, req);

  UsersService.createUser(user)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.searchPackages = function searchPackages (req, res, next, jsearch) {
  eventEmitter.emit(EVENTNAME, req);

  PackagesService.searchPackages(jsearch)
    .then(function (payload) {
      logger.error('Found search result');
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeText(res, err.message, err.code);
    });
};

/**
 * @method
 * List all packages and variations.
 * @public
 */
module.exports.patchUser = function patchUser (req, res, next, jpatch, id) {
  logger.info('In PATCH controller');
  eventEmitter.emit(EVENTNAME, req);
  logger.info(req.headers['content-type']);

  UsersService.patchUser(id, jpatch)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};

/**
 * @method
 * Delete package with given package data. Permission required.
 * @public
 */
module.exports.deletePackage = function deletePackage (req, res, next, packageName, packageVersion, packageArch, packageFamily, packageHash) {
  eventEmitter.emit(EVENTNAME, req);

  PackagesService.deletePackage(packageName, packageVersion, packageArch, packageFamily, packageHash)
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeText(res, err.message, err.code);
    });
};

/**
 * @method
 * Delete package with given package id. Permission required.
 * @public
 */
module.exports.deletePackageById = function deletePackageById (req, res, next, id) {
  eventEmitter.emit(EVENTNAME, req);

  PackagesService.deletePackageById(id)
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeText(res, err.message, err.code);
    });
};

/**
 * @method
 * Get all version names.
 * @public
 */
module.exports.getVersions = function getVersions (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);

  const jdata = process.versions;
  const json = require('../package.json');
  const gitrevFilename = path.join(__dirname, '../.gitrevision');
  let gitrevision = '';

  try {
    fs.accessSync(gitrevFilename, fs.constants.R_OK);
    gitrevision = fs.readFileSync(gitrevFilename, 'utf8');
  } catch (err) {
    logger.error('gitrevision file not found at: ' + gitrevFilename);
  }

  jdata.bintra = json.version;
  logger.debug('bintra version found: ' + jdata.bintra);

  jdata.gitrevision = gitrevision.trim();
  logger.debug('git revision found: ' + jdata.gitrevision);

  // get DB version
  const admin = new mongoose.mongo.Admin(mongoose.connection.db);
  admin.buildInfo(function (err, info) {
    if (err) {
      logger.error(err);
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      return res.end();
    }

    logger.debug('mongo version found: ' + info.version);
    jdata.mongodb = info.version;

    const payload = JSON.stringify(jdata);
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    logger.info('return');
    return res.end(payload);
  });
};

/**
 * @method
 * Get count per creator.
 * @public
 **/
module.exports.getCountPerCreator = function getVersions (req, res, next) {
  eventEmitter.emit(EVENTNAME, req);

  PackagesService.countPerCreator()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (err) {
      utils.writeJson(res, err.message, 400);
    });
};
