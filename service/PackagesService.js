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
    var myData = new PackageModel({
	    packageName: packageName, packageVersion: packageVersion, packageHash: packageHash, id: 0
    });
    myData.save()
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

