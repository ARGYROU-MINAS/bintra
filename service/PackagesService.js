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
var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');
const bcrypt = require ('bcrypt');

/**
 * @method
 * Validate the package.
 * @public
 *
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @param {string} packageArch - Architecture of the package
 * @param {string} packageHash - SHA hash of the package
 * @returns String
 **/
exports.validatePackage = function(packageName, packageVersion, packageArch, packageHash) {
  return new Promise(function(resolve, reject) {
    console.log("In validate service");
    var tsnow = new Date();

    // Does it exist already?
    PackageModel.find({name: packageName, version: packageVersion, arch: packageArch, hash: packageHash})
        .then(itemFound => {
	        console.log("Did exist already");
            PackageModel.updateMany(
	            {name: packageName, version: packageVersion, arch: packageArch, hash: packageHash},
	            { $inc: {count: 1}, $set: {tsupdated: tsnow} },
	            { upsert: true })
                .then(itemUpdated => {
                    console.log("Did update counter");
                    PackageModel.find({name: packageName, version: packageVersion, arch: packageArch})
                        .then(itemOthers => {
                            console.info("Found others");
                            resolve(itemOthers);
                        })
                        .catch(err => {
                            console.error("Not found others: ", err);
                            reject("bahh");
                        });
                })
                .catch(err => {
                    console.error("Not updated: ", err);
                    reject("bahh");
                });
        })
        .catch(err => { // Not really an error, just a fresh entry
            var packageNew = new PackageModel({name: packageName, version: packageVersion, arch: packageArch, hash: packageHash, tscreated: tsnow});
            packageNew.save()
                .then(itemSaved => {
                    console.log("Added fresh entry");
                    PackageModel.find({name: packageName, version: packageVersion, arch: packageArch})
                        .then(itemOthers => {
                            console.info("Found others");
                            resolve(itemOthers);
                        })
                        .catch(err => {
                            console.error("Not found others: ", err);
                            reject("bahh");
                        });
                })
                .catch(err => {
                    console.error("Not saved fresh: ", err);
                    reject("bahh");
                });
        });
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
 * @returns String
 **/
exports.listPackage = function(packageName, packageVersion, packageArch) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({name: packageName, version: packageVersion, arch: packageArch})
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
 * Validate the package.
 * @public
 *
 * @param {string} count - Limit replies
 * @returns String
 **/
exports.listPackages = function(count) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({})
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
 * Validate the package.
 * @public
 *
 * @returns String
 **/
exports.listUsers = function() {
  return new Promise(function(resolve, reject) {
    console.log("In list users service");

    LoginModel.find({})
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
 * Validate the package.
 * @public
 *
 * @returns boolean
 **/
exports.checkUser = function(name, passwd) {
  return new Promise(function(resolve, reject) {
    console.log("In check users service");

    LoginModel.find({name: name})
          .then(item => {
                  console.info("Was OK: " + item);
                  var pwhash = item[0].passwd;
                  console.log("pwd=" + passwd + "; hashfromdb=" + pwhash);
                  bcrypt.compare(passwd, pwhash, function(err, result) {
	                  if(err) {
		                  console.error("Pwd mismatch");
                          reject("bahh");
                      }
	                  console.log("pwd matched");
                      resolve(item[0]);
                  });
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject("bahh");
          });
  });
}

/**
 * @method
 * Validate the package.
 * @public
 *
 * @returns String
 **/
exports.cleanupPackages = function() {
  return new Promise(function(resolve, reject) {
    console.log("In cleanup service");

    PackageModel.remove({})
          .then(item => {
                  console.info("Was OK: " + item);
                  resolve("OK");
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject("bahh");
          });
  });
}

/**
 * @method
 * Validate the package.
 * @public
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @param {string} packageArch - Architecture of the package
 * @param {string} packageHash - SHA hash of the package
 *
 * @returns String
 **/
exports.deletePackage = function(packageName, packageVersion, packageArch, packageHash) {
  return new Promise(function(resolve, reject) {
    console.log("In cleanup service");

    PackageModel.remove({name: packageName, version: packageVersion, arch: packageArch, hash: packageHash})
          .then(item => {
                  console.info("Was OK");
                  resolve("OK");
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject("bahh");
          });
  });
}

/**
 * @method
 * Validate the package.
 * @public
 * @param {string} packageId - ID of the package
 *
 * @returns String
 **/
exports.deletePackageById = function(packageId) {
  return new Promise(function(resolve, reject) {
    console.log("In cleanup service");

    PackageModel.remove({_id: packageId})
          .then(item => {
                  console.info("Was OK");
                  resolve("OK");
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject("bahh");
          });
  });
}

/**
 * @method
 * Validate the package.
 * @public
 *
 * @returns String
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
