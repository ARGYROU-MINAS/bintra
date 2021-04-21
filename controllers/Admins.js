'use strict';

/**
 * @module controller
 * API controller for admin methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var utils = require('../utils/writer.js');
var eventEmitter = require('../utils/eventer').em;
var PackagesService = require('../service/PackagesService');
var UsersService = require('../service/UsersService');
var auth = require("../utils/auth");
var fs = require('fs');
var path = require('path');


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

  UsersService.checkUser(username, password)
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

  UsersService.listUsers()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * Get user data of named user.
 * @public
 */
module.exports.getUser = function getUser (req, res, next, name) {

  eventEmitter.emit('apihit', req);

  UsersService.getUser(name)
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

  UsersService.deleteUser(id)
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

  UsersService.putUserStatus(id, status)
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

  UsersService.listUser(id)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all black listed domains.
 * @public
 */
module.exports.listDomains = function listDomains (req, res, next) {
  eventEmitter.emit('apihit', req);

  UsersService.listDomains()
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * Add a black listed domains.
 * @public
 */
module.exports.addDomain = function listDomains (req, res, next, name) {
  eventEmitter.emit('apihit', req);

  UsersService.addDomain(name)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * Delete a black listed domains.
 * @public
 */
module.exports.deleteDomain = function listDomains (req, res, next, name) {
  eventEmitter.emit('apihit', req);

  UsersService.deleteDomain(name)
    .then(function (payload) {
      utils.writeJson(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeJson(res, payload, 400);
    });
};

/**
 * @method
 * List all black listed domains.
 * @public
 */
module.exports.checkDomain = function listDomains (req, res, next, name) {
  eventEmitter.emit('apihit', req);

  UsersService.checkDomain(name)
    .then(function (payload) {
      if(null == payload) {
        utils.writeJson(res, {message: 'Not found'}, 404);
      } else {
        utils.writeJson(res, payload, 200);
      }
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

  UsersService.createUser(user)
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

  PackagesService.searchPackages(jsearch)
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
module.exports.patchUser = function patchUser (req, res, next, jpatch, id) {
  eventEmitter.emit('apihit', req);

  UsersService.patchUser(id, jpatch)
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

  PackagesService.deletePackage(packageName, packageVersion, packageArch, packageFamily, packageHash)
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

  PackagesService.deletePackageById(id)
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeText(res, payload, 400);
    });
};


/**
 * @method
 * Get all version names.
 * @public
 */
module.exports.getVersions = function getVersions (req, res, next) {

  eventEmitter.emit('apihit', req);

  var jdata = process.versions;
  var json = require('../package.json');
  var gitrevFilename = path.join(__dirname,'../.gitrevision');
  var gitrevision = "";

  try {
    fs.accessSync(gitrevFilename, fs.constants.R_OK);
    gitrevision = fs.readFileSync(gitrevFilename, 'utf8');
  } catch(err) {
    console.error("gitrevision file not found at: " + gitrevFilename);
  }
  jdata.bintra = json.version;
  jdata.gitrevision = gitrevision.trim();
  var admin = req.mcdadmin.db.admin();
  admin.serverStatus(function(err, info) {
    if(err) {
      console.error("Get mongoDB version failed");
      return res.status(500);
    }

    jdata.mongodb = info.version;
    var payload = JSON.stringify(jdata);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(payload);
  });
};
