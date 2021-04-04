'use strict';

/**
 * @module User Services
 * Plain user functionality in service methods.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var fs = require('fs');
const cdigit = require("cdigit");
var dateFormat = require("dateformat");
require("datejs");
var jsonpatch = require('json-patch');
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


/**
 * @method
 * List all registered users.
 * @public
 *
 * @returns array of user entries
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
 * Update user entry with new status
 * @public
 * @param {string} id - user id in database
 * @param {string} newStatus - user status to change to
 *
 * @returns updates user object
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
 * Show userdata of given id.
 * @public
 * @param {string} id - user id in database
 *
 * @returns object with user data
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
 * Change user data by json patch request
 * @public
 * @param {string} idUser - id of user in database
 * @param {string} jpatch - json patch data
 *
 * @returns object of updated user data
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
 * Delete one user from database.
 * @public
 * @param {string} idUser - the id of the user object
 *
 * @returns object of user entry for the very last time
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
                          userDoc.save().then(itemSave => {
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
 * Creates an user entry in database.
 * @public
 * @param {string} user - json user object
 *
 * @returns object of created user
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
          .catch(errSave => {
                  console.error("Not OK: ", errSave);
                  reject("bahh");
          });
    });
  });
}

/**
 * @method
 * Check login data for user.
 * @public
 * @param {string} name - user name
 * @param {string} passwd - clear text password from web form
 *
 * @returns object of athenticated user
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
 * Check if user is activated.
 * @public
 * @param {string} uname - user login name
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
