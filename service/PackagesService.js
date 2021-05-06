'use strict';

/**
 * @module Services
 * Plain functionality in service methods.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var fs = require('fs');
const cdigit = require("cdigit");
var dateFormat = require("dateformat");
require("datejs");
var jsonpatch = require('json-patch');
var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');
const bcrypt = require ('bcrypt');

var eventEmitter = require('../utils/eventer').em;


/**
 * Helper functions
 */
function getUserObject(username) {
  return new Promise(function(resolve, reject) {
    LoginModel.find({name: username})
      .then(itemFound => {
        if(1 == itemFound.length) {
          console.log("Found user");
          resolve(itemFound[0]);
        } else {
          reject("Not found");
        }
      })
      .catch(err => {
        console.error("getUser failed: " + err);
        reject("getUser failed");
      });
  });
}

function renameAttributes(item) {
    var r = {
        id: item._id,
        packageName: item.name,
        packageVersion: item.version,
        packageArch: item.arch,
        packageFamily: item.family,
        packageHash: item.hash,
        count: item.count,
        creationDate: item.tscreated
    };
    return r;
}

function findPackage(resolve, reject, packageName, packageVersion, packageArch, packageFamily)
{
	PackageModel.find({name: packageName, version: packageVersion, arch: packageArch, family: packageFamily},
                              {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
                          .then(itemOthers => {
                              console.info("Found others");
                              resolve(itemOthers);
                          })
                          .catch(err => {
                              console.error("Not found others: ", err);
                              reject("bahh");
                          });
}


/**
 * @method
 * Validate the package.
 * @public
 *
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @param {string} packageArch - Architecture of the package
 * @param {string} packageFamily - Architecture of the package
 * @param {string} packageHash - SHA hash of the package
 * @param {string} username - The user asking for this, used for creator
 * @returns String
 **/
exports.validatePackage = function(packageName, packageVersion, packageArch, packageFamily, packageHash, username) {
  return new Promise(function(resolve, reject) {
    console.log("In validate service for " + username);
    var tsnow = new Date();

    // Does it exist already?
    PackageModel.find({name: packageName, version: packageVersion, arch: packageArch, family: packageFamily, hash: packageHash})
        .then(itemFound => {
            if(0 == itemFound.length) {
              console.log("Not exist yet");

              getUserObject(username)
                .then(userObject => {
                console.log(userObject);

                var packageNew = new PackageModel({name: packageName, version: packageVersion,
                                                   creator: userObject,
                                                   arch: packageArch, family: packageFamily,
		                                   hash: packageHash, tscreated: tsnow, tsupdated: tsnow});
                packageNew.save()
                  .then(itemSaved => {
                      console.log("Added fresh entry");
                      eventEmitter.emit('putdata', packageName, packageVersion, packageArch, packageFamily, packageHash, true);

		      findPackage(resolve, reject, packageName, packageVersion, packageArch, packageFamily);
                  })
                  .catch(err => {
                      console.error("Not saved fresh: ", err);
                      reject("bahh");
                  })
                })
                .catch(err => {
                });
            } else {
              console.log("Did exist already");

              PackageModel.updateMany(
	            {name: packageName, version: packageVersion, arch: packageArch, family: packageFamily, hash: packageHash},
	            { $inc: {count: 1}, $set: {tsupdated: tsnow} },
	            { upsert: true })
                .then(itemUpdated => {
                    console.log("Did update counter");
                    eventEmitter.emit('putdata', packageName, packageVersion, packageArch, packageFamily, packageHash, false);
		    findPackage(resolve, reject, packageName, packageVersion, packageArch, packageFamily);
                })
                .catch(err => {
                    console.error("Not updated: ", err);
                    reject("bahh");
                });
            } // if
        })
        .catch(err => { // Not really an error, just a fresh entry
            console.error("Query failed: ", err);
            reject("bahh");
        });
    });
}

/**
 * @method
 * List package data for given combination.
 * @public
 *
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @param {string} packageArch - Architecture of the package
 * @param {string} packageFamily - Family of the package
 * @returns array of entries
 **/
exports.listPackage = function(packageName, packageVersion, packageArch, packageFamily) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({name: packageName, version: packageVersion, arch: packageArch, family: packageFamily}, {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
          .then(item => {
                  console.info("Was OK");
		  var r = [];
		  item.forEach(function(value) {
			  r.push(renameAttributes(value));
		  });
                  resolve(r);
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject("bahh");
          });
  });
}

/**
 * @method
 * List data for a single package.
 * @public
 *
 * @param {string} packageId - ID of the package
 * @returns object with entry data
 **/
exports.listPackageSingle = function(packageId) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({_id: packageId}, {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
          .then(item => {
                  console.info("Was OK");
		  if(item.length > 0) {
                        var r = renameAttributes(item[0]);
                        resolve(r);
                  } else {
                        reject({code:404, msg:"not found"});
                  }
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject({code:400, msg:"bahh"});
          });
  });
}

/**
 * @method
 * List all packages with maximum amount and entries to skip.
 * @public
 *
 * @param {number} skip - Skip first replies
 * @param {number} count - Limit replies
 * @param {string} sort - Sort by property
 * @param {string} direction - Sort up or down
 * @returns array of entries
 **/
exports.listPackages = function(skip, count, sort, direction) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");

    var sdir = -1;
    if('up' == direction) sdir = 1;

    PackageModel.find({}, {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
          .sort({[sort]: sdir})
          .limit(count)
	  .skip(skip)
          .then(item => {
                  console.info("Was OK");
                  resolve(item);
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject("bahh");
          });
  });
}

/**
 * @method
 * List all packages, optimized for UI pagination.
 * @public
 *
 * @param {number} page - Skip first replies
 * @param {number} size - Limit replies
 * @param {string} sorters - Sort by property
 * @param {string} filter - optional filter
 * @returns array of entries and number of possible pages with given size value
 **/
exports.listPagePackages = function(page, size, sorters, filter) {
  return new Promise(function(resolve, reject) {
    console.log("In listpage service");

    var sdir = -1;
    var iSkip = (page - 1) * size;
    console.log("skip=" + iSkip + ", amount=" + size);

    PackageModel.countDocuments({}, function(err, count) {
      console.info("All entries: " + count);

      PackageModel.find({}, {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
          .sort({[sorters]: sdir})
          .limit(size)
          .skip(iSkip)
          .then(item => {
                  console.info("Was OK");
                  var iPages = Math.ceil(count / size);
                  var resp = {last_page: iPages, data: item };
                  resolve(resp);
          })
          .catch(err2 => {
                  console.error("Not OK: ", err2);
                  reject("bahh");
          });
    });
  });
}

/**
 * @method
 * List all packages including personal data for admin usage.
 * @public
 *
 * @param {string} count - Limit replies
 * @returns array of entries
 **/
exports.listPackagesFull = function(count) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({})
          .populate('creator')
          .sort({tsupdated: -1})
          .limit(count)
          .then(item => {
                  console.info("Was OK");
                  resolve(item);
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject("bahh");
          });
  });
}

/**
 * @method
 * Search for packages by given query
 * @public
 * @param {string} jsearch - json query
 *
 * @returns array of entries
 **/
exports.searchPackages = function(jsearch) {
  return new Promise(function(resolve, reject) {
    console.log("In search packages service");

    const count=100;
    const queryObj = {};

    if(jsearch.hasOwnProperty('packageName')) {
      if(jsearch.packageName.endsWith("*")) {
        queryObj['name'] = new RegExp('^' + jsearch.packageName.replace("*", ""), 'i');
      } else {
        queryObj['name'] = jsearch.packageName;
      }
    }

    if(jsearch.hasOwnProperty('packageVersion')) {
      if(jsearch.packageVersion.endsWith("*")) {
        queryObj['version'] = new RegExp('^' + jsearch.packageVersion.replace("*", ""), 'i');
      } else {
        queryObj['version'] = jsearch.packageVersion;
      }
    }

    if(jsearch.hasOwnProperty('packageArch')) {
      queryObj['arch'] = jsearch.packageArch;
    }
    if(jsearch.hasOwnProperty('packageFamily')) {
      queryObj['family'] = jsearch.packageFamily;
    }
    if(jsearch.hasOwnProperty('packageHash')) {
      queryObj['hash'] = jsearch.packageHash;
    }
    if(jsearch.hasOwnProperty('count')) {
      queryObj['count'] = jsearch.count;
    }
    if(jsearch.hasOwnProperty('tscreated')) {
      queryObj['tscreated'] = jsearch.tscreated;
    }
    if(jsearch.hasOwnProperty('tsupdated')) {
      queryObj['tsupdated'] = jsearch.tsupdated;
    }
    PackageModel.find(queryObj, {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
          .sort({name: 1})
          .limit(count)
          .then(item => {
                  console.info("Was OK");
		  if(item.length == 0) {
                          reject({code:404, msg:"not found"});
		  } else {
                          resolve(item);
		  }
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject({code:400, msg:"bahh"});
          });
  });
}


/**
 * @method
 * Delete a single package from database.
 * @public
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @param {string} packageArch - Architecture of the package
 * @param {string} packageFamily - Family of the package
 * @param {string} packageHash - SHA hash of the package
 *
 **/
exports.deletePackage = function(packageName, packageVersion, packageArch, packageFamily, packageHash) {
  return new Promise(function(resolve, reject) {
    console.log("In deletePackage service");

    var query = {name: packageName, version: packageVersion, arch: packageArch, family: packageFamily, hash: packageHash};
    PackageModel.deleteOne(query)
          .then(item => {
		  if(item.deletedCount != 1) {
			console.error("not found, not deleted");
			reject({code:404, msg:"not found"});
		  } else {
                        resolve("OK");
		  }
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject({code:400, msg:"bahh"});
          });
  });
}

/**
 * @method
 * Delete a single package from database.
 * @public
 * @param {string} packageId - ID of the package
 *
 **/
exports.deletePackageById = function(packageId) {
  return new Promise(function(resolve, reject) {
    console.log("In cleanup service");

    PackageModel.deleteOne({_id: packageId})
          .then(item => {
		  if(item.deletedCount != 1) {
			  console.error("not found, not deleted");
			  reject({code:404, msg:"not found"});
		  } else {
                          resolve("OK");
		  }
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject({code:400, msg:"bahh"});
          });
  });
}

/**
 * @method
 * Count number of entries in database.
 * @public
 *
 * @returns object with count attribute
 **/
exports.countPackage = function() {
  return new Promise(function(resolve, reject) {
    console.log("In count service");

    PackageModel.countDocuments({}, function(err, count) {
      console.info("Was OK: " + count);
      var examples = {};
      examples['application/json'] = { count: count };
      resolve(examples[Object.keys(examples)[0]]);
    });
  });
}
