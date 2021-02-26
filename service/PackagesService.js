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


/**
 * Helper function
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
 * Validate the package.
 * @public
 *
 * @param {string} packageName - Name of the package
 * @param {string} packageVersion - Version of the package
 * @param {string} packageArch - Architecture of the package
 * @param {string} packageFamily - Family of the package
 * @returns String
 **/
exports.listPackage = function(packageName, packageVersion, packageArch, packageFamily) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({name: packageName, version: packageVersion, arch: packageArch, family: packageFamily}).populate('creator')
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
 * @param {string} packageId - ID of the package
 * @returns String
 **/
exports.listPackageSingle = function(packageId) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({_id: packageId}, {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
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
 * List all packages.
 * @public
 *
 * @param {string} count - Limit replies
 * @returns String
 **/
exports.listPackages = function(count) {
  return new Promise(function(resolve, reject) {
    console.log("In list service");
    PackageModel.find({}, {name: 1, version: 1, arch: 1, family: 1, hash: 1, count: 1, tscreated: 1, tsupdated: 1})
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
 * List all packages.
 * @public
 *
 * @param {string} count - Limit replies
 * @returns String
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
 * Validate the package.
 * @public
 *
 * @returns String
 **/
exports.listUsers = function() {
  return new Promise(function(resolve, reject) {
    console.log("In list users service");

    LoginModel.find({}, {role: 1, status: 1, name: 1, email: 1, tscreated: 1})
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
exports.putUserStatus = function(id, newStatus) {
  return new Promise(function(resolve, reject) {
    console.log("In put user status service " + id + newStatus);

    LoginModel.findOneAndUpdate({_id: id}, {status: newStatus})
          .then(item => {
                  console.info("Was OK");
		  console.log(item);
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
exports.listUser = function(idUser) {
  return new Promise(function(resolve, reject) {
    console.log("In list user service");

    LoginModel.find({_id: idUser}, {role: 1, status: 1, name: 1, email: 1, tscreated: 1})
          .then(item => {
                  console.info("Was OK");
		  if(item.length > 0) {
                  	resolve(item[0]);
		} else {
			reject("not found");
		}
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
exports.patchUser = function(idUser, jpatch) {
  return new Promise(function(resolve, reject) {
    console.log("In patch user service");

    LoginModel.find({_id: idUser}, {role: 1, status: 1, name: 1, email: 1, tscreated: 1})
          .then(item => {
                  console.info("Was OK");
                  if(item.length > 0) {
			  var userDoc = item[0];
			  var patchedUser = jsonpatch.apply(userDoc, jpatch);
			  patchedUser.save();
                        resolve(patchedUser);
                } else {
                        reject("not found");
                }
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
exports.deleteUser = function(idUser) {
  return new Promise(function(resolve, reject) {
    console.log("In delete user service");

    LoginModel.find({_id: idUser}, {role: 1, status: 1, name: 1, email: 1, tscreated: 1})
          .then(item => {
                  console.info("Query OK");
                  if(item.length > 0) {
			  console.log("Items found");
                          var userDoc = item[0];
			  console.log(userDoc);
			  userDoc.status = "deleted";
			  console.log(userDoc);
                          userDoc.save().then(item => {
		            console.log("Updated item saved");
                            resolve(userDoc);
			  })
			  .catch(err => {
		 	    console.error("Not OK" + err);
		            reject("error");
			  });
                } else {
                        reject("not found");
                }
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
exports.createUser = function(user) {
  return new Promise(function(resolve, reject) {
    console.log("In create user service");
    const saltRounds = 10;
    var tsnow = new Date();
    bcrypt.hash(user.password, saltRounds, function(err, hash) {
      var u = new LoginModel({
        name: user.username,
        passwd: hash,
        email: user.email,
	role: "user",
	status: "register",
	tscreated: tsnow
      });

      u.save()
          .then(item => {
                  console.info("Was OK");
                  resolve(u);
          })
          .catch(err => {
                  console.error("Not OK: ", err);
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
 * @returns boolean
 **/
exports.checkUser = function(name, passwd) {
  return new Promise(function(resolve, reject) {
    console.log("In check users service");

    LoginModel.find({name: name, status: "active"})
          .then(item => {
		  if(item.length > 0) {
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
                  } else {
                    console.error("No entry found");
                    reject("bahh");
                  }
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
exports.isActiveUser = function(uname) {
  return new Promise(function(resolve, reject) {
    console.log("In isActiveUser service");

    LoginModel.find({name: uname, status: "active"})
          .then(item => {
		  if(item.length > 0) {
                    console.info("Was found OK");
                    resolve(true);
		  } else {
                    console.error("No match found");
                    reject(false);
		  }
          })
          .catch(err => {
                  console.error("Not OK: ", err);
                  reject(false);
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
 * @param {string} packageFamily - Family of the package
 * @param {string} packageHash - SHA hash of the package
 *
 * @returns String
 **/
exports.deletePackage = function(packageName, packageVersion, packageArch, packageFamily, packageHash) {
  return new Promise(function(resolve, reject) {
    console.log("In cleanup service");

    PackageModel.remove({name: packageName, version: packageVersion, arch: packageArch, family: packageFamily, hash: packageHash})
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
