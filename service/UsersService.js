'use strict';

/**
 * @module User Services
 * Plain user functionality in service methods.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

const fs = require('fs');
require('datejs');
const jsonpatch = require('json-patch');
const LoginModel = require('../models/login.js');
const DomainModel = require('../models/domain.js');
const bcrypt = require('bcrypt');

const {
  mongoHost,
  mongoPort,
  mongoDb,
  mongoUrl,
  saltRounds
} = require('../conf');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

/**
 * @method
 * List all registered blacklisted domain.
 * @public
 *
 * @returns array of domain entries
 **/
exports.listDomains = function () {
  return new Promise(function (resolve, reject) {
    logger.info('In list domains service');

    DomainModel.find({})
      .then(item => {
        resolve(item);
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * List all registered blacklisted domain.
 * @public
 * @param {string} domainname - Domain name
 *
 * @returns array of domain entries
 **/
exports.addDomain = function (domainname) {
  return new Promise(function (resolve, reject) {
    logger.info('In add domain service');

    const tsnow = new Date();
    const d = new DomainModel({
      name: domainname,
      tscreated: tsnow
    });

    d.save()
      .then(item => {
        resolve(item);
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * Delete one registered blacklisted domain.
 * @public
 * @param {string} domainname - Domain name
 *
 * @returns domain object before deleting
 **/
exports.deleteDomain = function (domainname) {
  return new Promise(function (resolve, reject) {
    logger.info('In delete domain service');

    DomainModel.deleteOne({
      name: domainname
    })
      .then(item => {
        if (item.deletedCount != 1) {
          logger.error('not found, not deleted');
          reject({
            code: 404,
            msg: 'not found'
          });
        } else {
          resolve('OK');
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject({
          code: 400,
          msg: 'bahh'
        });
      });
  });
};

/**
 * @method
 * Check for registered blacklisted domain.
 * @public
 * @param {string} domainname - Domain name
 *
 * @returns domain object before deleting
 **/
exports.checkDomain = function (domainname) {
  return new Promise(function (resolve, reject) {
    logger.info('In check domain service');

    DomainModel.find({
      name: domainname
    })
      .then(item => {
        if (item.length == 1) {
          resolve(item[0]);
        } else {
          resolve(null);
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * List all registered users.
 * @public
 *
 * @returns array of user entries
 **/
exports.listUsers = function () {
  return new Promise(function (resolve, reject) {
    logger.info('In list users service');

    LoginModel.find({}, {
      role: 1,
      status: 1,
      name: 1,
      email: 1,
      tscreated: 1
    })
      .then(item => {
        resolve(item);
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * Update user entry with new status
 * @public
 * @param {string} id - user id in database
 * @param {string} newStatus - user status to change to
 *
 * @returns updates user object
 **/
exports.putUserStatus = function (id, newStatus) {
  return new Promise(function (resolve, reject) {
    logger.info('In put user status service ' + id + newStatus);

    LoginModel.findOneAndUpdate({
      _id: id
    }, {
      status: newStatus
    })
      .then(item => {
        logger.info(item);
        resolve(item);
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

function checkGetUserStatus (resolve, reject, query) {
  LoginModel.find(query, {
    role: 1,
    status: 1,
    name: 1,
    email: 1,
    tscreated: 1
  })
    .then(item => {
      if (item.length > 0) {
        resolve(item[0]);
      } else {
        reject('not found');
      }
    })
    .catch(err => {
      logger.error('Not OK: ', err);
      reject('bahh');
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
exports.listUser = function (idUser) {
  return new Promise(function (resolve, reject) {
    logger.info('In list user service');

    checkGetUserStatus(resolve, reject, {
      _id: idUser
    });
  });
};

/**
 * @method
 * Show userdata of given name.
 * @public
 * @param {string} name - user name in database
 *
 * @returns object with user data
 **/
exports.getUser = function (name) {
  return new Promise(function (resolve, reject) {
    logger.info('In get user service');

    checkGetUserStatus(resolve, reject, {
      name
    });
  });
};

/**
 * @method
 * Change user data by json patch request
 * @public
 * @param {string} idUser - id of user in database
 * @param {string} jpatch - json patch data
 *
 * @returns object of updated user data
 **/
exports.patchUser = function (idUser, jpatch) {
  return new Promise(function (resolve, reject) {
    logger.info('In patch user service');

    LoginModel.find({
      _id: idUser
    }, {
      role: 1,
      status: 1,
      name: 1,
      email: 1,
      tscreated: 1
    })
      .then(item => {
        if (item.length > 0) {
          const userDoc = item[0];
          const patchedUser = jsonpatch.apply(userDoc, jpatch);
          patchedUser.save();
          resolve(patchedUser);
        } else {
          reject('not found');
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * Delete one user from database.
 * @public
 * @param {string} idUser - the id of the user object
 *
 * @returns object of user entry for the very last time
 **/
exports.deleteUser = function (idUser) {
  return new Promise(function (resolve, reject) {
    logger.info('In delete user service');

    LoginModel.find({
      _id: idUser
    }, {
      role: 1,
      status: 1,
      name: 1,
      email: 1,
      tscreated: 1
    })
      .then(item => {
        logger.info('Query OK');
        if (item.length > 0) {
          logger.info('Items found');
          const userDoc = item[0];
          logger.info(userDoc);
          userDoc.status = 'deleted';
          logger.info(userDoc);
          userDoc.save().then(itemSave => {
            logger.info('Updated item saved');
            resolve(userDoc);
          })
            .catch(err => {
              logger.error('Not OK' + err);
              reject('error');
            });
        } else {
          reject('not found');
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * Creates an user entry in database.
 * @public
 * @param {string} user - json user object
 *
 * @returns object of created user
 **/
exports.createUser = function (user) {
  return new Promise(function (resolve, reject) {
    logger.info('In create user service');

    const domain = user.email.split('@')[1];
    logger.info('Check domain ' + domain);
    DomainModel.find({
      name: domain
    })
      .then(item => {
        if (item.length == 1) {
          logger.error('Domain black listed: ' + domain);
          reject('bahh');
        } else {
          const tsnow = new Date();
          bcrypt.hash(user.password, saltRounds, function (err, hash) {
            const u = new LoginModel({
              name: user.username,
              passwd: hash,
              email: user.email,
              role: 'user',
              status: 'register',
              tscreated: tsnow
            });

            u.save()
              .then(item2 => {
                resolve(u);
              })
              .catch(errSave => {
                logger.error('Not OK: ', errSave);
                reject('bahh');
              });
          });
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * Check login data for user.
 * @public
 * @param {string} name - user name
 * @param {string} passwd - clear text password from web form
 *
 * @returns object of athenticated user
 **/
exports.checkUser = function (name, passwd) {
  return new Promise(function (resolve, reject) {
    logger.info('In check users service');

    LoginModel.find({
      name,
      status: 'active'
    })
      .then(item => {
        if (item.length > 0) {
          const pwhash = item[0].passwd;
          logger.info('pwd=' + passwd + '; hashfromdb=' + pwhash);
          bcrypt.compare(passwd, pwhash, function (err, result) {
            if (err) {
              logger.error('Some error during compare: ' + err);
              reject('bahh');
            }
            if (result) {
              logger.info('matched');
              resolve(item[0]);
            } else {
              logger.error('Pwd mismatch');
              reject('bahh');
            }
          });
        } else {
          logger.error('No entry found or perhaps not yet activated');
          reject('bahh');
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject('bahh');
      });
  });
};

/**
 * @method
 * Check if user is activated.
 * @public
 * @param {string} uname - user login name
 *
 * @returns boolean
 **/
exports.isActiveUser = function (uname) {
  return new Promise(function (resolve, reject) {
    logger.info('In isActiveUser service');

    LoginModel.find({
      name: uname,
      status: 'active'
    })
      .then(item => {
        if (item.length > 0) {
          logger.debug('Was found OK');
          resolve(true);
        } else {
          logger.error('No match found');
          reject(false);
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject(false);
      });
  });
};

/**
 * @method
 * Check if user has one of the wanted roles.
 * @public
 * @param {string} uname - user login name
 * @param {string} aRoles - Array of strings
 *
 * @returns boolean
 **/
exports.hasRole = function (uname, aRoles) {
  return new Promise(function (resolve, reject) {
    logger.info('In hasRole service');

    LoginModel.find({
      name: uname
    })
      .then(item => {
        if (item.length > 0) {
          logger.debug('Was found OK');
          const uRole = item[0].role;
          logger.info('USer ' + uname + ' has role ' + uRole);
          if (aRoles.indexOf(uRole) == -1) {
            logger.error('User does not have one of the wanted roles');
            reject(false);
          }
          resolve(true);
        } else {
          logger.error('No match found');
          reject(false);
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject(false);
      });
  });
};

/**
 * @method
 * Check if active user has one of the wanted roles.
 * @public
 * @param {string} uname - user login name
 * @param {string} aRoles - Array of strings
 *
 * @returns boolean
 **/
exports.isActiveHasRole = function (uname, aRoles) {
  return new Promise(function (resolve, reject) {
    logger.info('In isActiveHasRole service');

    LoginModel.find({
      name: uname,
      status: 'active'
    })
      .then(item => {
        if (item.length > 0) {
          logger.info('Active user was found OK');
          const uRole = item[0].role;
          logger.info('User ' + uname + ' has role ' + uRole);
          if (aRoles.indexOf(uRole) == -1) {
            logger.error('User does not have one of the wanted roles');
            reject(false);
          }
          resolve(true);
        } else {
          logger.error('No match found');
          reject(false);
        }
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject(false);
      });
  });
};
