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

/**
 * @method
 * Validate the package.
 * @public
 *
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @param {string} packageHash - SHA hash of the package
 * @returns String
 **/
exports.validatePackage = function(packageName, packageVersion, packageHash) {
  return new Promise(function(resolve, reject) {
    console.log("In validate service");
    PackageModel.updateMany(
	    {name: packageName, version: packageVersion, hash: packageHash},
	    { $inc: {count: 1} },
	    { upsert: true })
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
 *
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @returns String
 **/
exports.listPackage = function(packageName, packageVersion) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({name: packageName, version: packageVersion})
          .then(item => {
                  console.info("Was OK: " + item);
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
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @returns String
 **/
exports.listPackages = function(packageName, packageVersion) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({})
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
 * @param {string} packageHash - SHA hash of the package
 *
 * @returns String
 **/
exports.deletePackage = function(packageName, packageVersion, packageHash) {
  return new Promise(function(resolve, reject) {
    console.log("In cleanup service");

    PackageModel.remove({name: packageName, version: packageVersion, hash: packageHash})
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
