'use strict';

/**
 * @module Services
 * Plain functionality in service methods.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

require('datejs');
const PackageModel = require('../models/package.js');
const LoginModel = require('../models/login.js');

const eventEmitter = require('../utils/eventer').em;

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

/**
 * Helper functions
 */
function getUserObject (username) {
  return new Promise(function (resolve, reject) {
    LoginModel.find({
      name: username
    })
      .then(itemFound => {
        if (itemFound.length === 1) {
          logger.info('Found user');
          resolve(itemFound[0]);
        } else {
          reject(Error('Not found'));
        }
      })
      .catch(err => {
        logger.error('getUser failed: ' + err);
        reject(err);
      });
  });
}

function renameAttributes (item) {
  return {
    id: item._id,
    packageName: item.name,
    packageVersion: item.version,
    packageArch: item.arch,
    packageFamily: item.family,
    packageHash: item.hash,
    count: item.count,
    creationDate: item.tscreated
  };
}

function findPackage (resolve, reject, packageName, packageVersion, packageArch, packageFamily) {
  PackageModel.find({
    name: packageName,
    version: packageVersion,
    arch: packageArch,
    family: packageFamily
  }, {
    name: 1,
    version: 1,
    arch: 1,
    family: 1,
    hash: 1,
    count: 1,
    tscreated: 1,
    tsupdated: 1
  })
    .then(itemOthers => {
      logger.info('Found others');
      resolve(itemOthers);
    })
    .catch(err => {
      logger.error('Not found others: ', err);
      reject(err);
    });
}

/**
 * @method
 * Local helper function
 * @private
 **/
function replyWithError (reject, err) {
  logger.error('Not OK: ', err);
  err.code = 400;
  reject(err);
}

/**
 * @method
 * Reply with structure
 * @private
 **/
function replyWithSummary (resolve, answer) {
  const examples = {};

  examples['application/json'] = {
    summary: answer
  };
  resolve(examples[Object.keys(examples)[0]]);
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
 * @param {string} packageSubFamily - Optional subfamily string
 * @param {string} packageHash - SHA hash of the package
 * @param {string} username - The user asking for this, used for creator
 * @returns String
 **/
exports.validatePackage = function (packageName, packageVersion, packageArch, packageFamily, packageSubFamily, packageHash, username) {
  return new Promise(function (resolve, reject) {
    logger.info('In validate service for ' + username);
    const tsnow = new Date();

    // Does it exist already?
    PackageModel.find({
      name: packageName,
      version: packageVersion,
      arch: packageArch,
      family: packageFamily,
      hash: packageHash
    })
      .then(itemFound => {
        if (itemFound.length === 0) {
          logger.info('Not exist yet');

          getUserObject(username)
            .then(userObject => {
              logger.info(userObject);

              const packageNew = new PackageModel({
                name: packageName,
                version: packageVersion,
                creator: userObject,
                arch: packageArch,
                family: packageFamily,
                hash: packageHash,
                tscreated: tsnow,
                tsupdated: tsnow
              });
              packageNew.save()
                .then(itemSaved => {
                  logger.info('Added fresh entry');
                  eventEmitter.emit('putdata', packageName, packageVersion, packageArch, packageFamily, packageHash, true);

                  findPackage(resolve, reject, packageName, packageVersion, packageArch, packageFamily);
                })
                .catch(err => {
                  logger.error('Not saved fresh: ', err);
                  reject(err);
                })
            })
            .catch(err => {
              logger.error('Some error occured?', err);
            });
        } else {
          logger.info('Did exist already');

          PackageModel.updateMany({
            name: packageName,
            version: packageVersion,
            arch: packageArch,
            family: packageFamily,
            hash: packageHash
          }, {
            $inc: {
              count: 1
            },
            $set: {
              tsupdated: tsnow
            }
          }, {
            upsert: true
          })
            .then(itemUpdated => {
              logger.info('Did update counter');
              eventEmitter.emit('putdata', packageName, packageVersion, packageArch, packageFamily, packageHash, false);
              findPackage(resolve, reject, packageName, packageVersion, packageArch, packageFamily);
            })
            .catch(err => {
              logger.error('Not updated: ', err);
              reject(err);
            });
        } // if
      })
      .catch(err => { // Not really an error, just a fresh entry
        logger.error('Query failed: ', err);
        reject(err);
      });
  });
};

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
exports.listPackage = function (packageName, packageVersion, packageArch, packageFamily) {
  return new Promise(function (resolve, reject) {
    logger.info('In list service');
    PackageModel.find({
      name: packageName,
      version: packageVersion,
      arch: packageArch,
      family: packageFamily
    }, {
      name: 1,
      version: 1,
      arch: 1,
      family: 1,
      hash: 1,
      count: 1,
      tscreated: 1,
      tsupdated: 1
    })
      .then(item => {
        const r = [];
        item.forEach(function (value) {
          r.push(renameAttributes(value));
        });
        resolve(r);
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject(err);
      });
  });
};

/**
 * @method
 * List data for a single package.
 * @public
 *
 * @param {string} packageId - ID of the package
 * @returns object with entry data
 **/
exports.listPackageSingle = function (packageId) {
  return new Promise(function (resolve, reject) {
    logger.info('In list service');
    PackageModel.find({
      _id: packageId
    }, {
      name: 1,
      version: 1,
      arch: 1,
      family: 1,
      hash: 1,
      count: 1,
      tscreated: 1,
      tsupdated: 1
    })
      .then(item => {
        if (item.length > 0) {
          const r = renameAttributes(item[0]);
          resolve(r);
        } else {
          reject(Error({
            code: 404,
            msg: 'not found'
          }));
        }
      })
      .catch(err => {
        replyWithError(reject, err);
      });
  });
};

/**
 * @method
 * List all packages with maximum amount and entries to skip.
 * @public
 *
 * @param {number} skip - Skip first replies
 * @param {number} count - Limit replies
 * @param {string} sort - Sort by property
 * @param {string} direction - Sort up or down
 * @param {number} age - maximum age of tsupdated in days to be included
 * @returns array of entries
 **/
exports.listPackages = function (skip, count, sort, direction, age) {
  return new Promise(function (resolve, reject) {
    logger.info('In list service');

    let sdir = -1;
    if (direction === 'up') sdir = 1;

    const date = new Date();
    const marginDate = new Date(date.setDate(date.getDate() - age));
    logger.info('Show from ' + marginDate);
    PackageModel.find({ tsupdated: { $gt: marginDate } }, {
      name: 1,
      version: 1,
      arch: 1,
      family: 1,
      hash: 1,
      count: 1,
      tscreated: 1,
      tsupdated: 1
    })
      .sort({
        [sort]: sdir
      })
      .limit(count)
      .skip(skip)
      .then(item => {
        resolve(item);
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject(err);
      });
  });
};

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
exports.listPagePackages = function (page, size, sorters, filter) {
  return new Promise(function (resolve, reject) {
    logger.info('In listpage service');

    const sdir = -1;
    const iSkip = (page - 1) * size;
    logger.info('skip=' + iSkip + ', amount=' + size);

    PackageModel.countDocuments({}, function (err, count) {
      if (err) {
        reject(err);
      }
      logger.info('All entries: ' + count);

      PackageModel.find({}, {
        name: 1,
        version: 1,
        arch: 1,
        family: 1,
        hash: 1,
        count: 1,
        tscreated: 1,
        tsupdated: 1
      })
        .sort({
          [sorters]: sdir
        })
        .limit(size)
        .skip(iSkip)
        .then(item => {
          const iPages = Math.ceil(count / size);
          const resp = {
            last_page: iPages,
            data: item
          };
          resolve(resp);
        })
        .catch(err2 => {
          logger.error('Not OK: ', err2);
          reject(err2);
        });
    });
  });
};

/**
 * @method
 * List all packages including personal data for admin usage.
 * @public
 *
 * @param {string} count - Limit replies
 * @returns array of entries
 **/
exports.listPackagesFull = function (count) {
  return new Promise(function (resolve, reject) {
    logger.info('In list service');
    PackageModel.find({})
      .populate('creator')
      .sort({
        tsupdated: -1
      })
      .limit(count)
      .then(item => {
        resolve(item);
      })
      .catch(err => {
        logger.error('Not OK: ', err);
        reject(err);
      });
  });
};

function optionalWildcard (searchvalue) {
  if (searchvalue.endsWith('*')) {
    return new RegExp('^' + searchvalue.replace('*', ''), 'i');
  } else {
    return searchvalue;
  }
}

/**
 * Internal check in json data.
 * @param {json} j
 * @param {string} p
 * @private
 * @returns boolean
 */
function checkProp (j, p) {
  // eslint-disable-next-line no-prototype-builtins
  return j.hasOwnProperty(p);
}

/**
 * @method
 * Search for packages by given query
 * @public
 * @param {string} jsearch - json query
 *
 * @returns array of entries
 **/
exports.searchPackages = function (jsearch) {
  return new Promise(function (resolve, reject) {
    logger.info('In search packages service');

    const count = 100;
    const queryObj = {};

    if (checkProp(jsearch, 'packageName')) {
      queryObj.name = optionalWildcard(jsearch.packageName);
    }

    if (checkProp(jsearch, 'packageVersion')) {
      queryObj.version = optionalWildcard(jsearch.packageVersion);
    }

    if (checkProp(jsearch, 'packageArch')) {
      queryObj.arch = jsearch.packageArch;
    }
    if (checkProp(jsearch, 'packageFamily')) {
      queryObj.family = jsearch.packageFamily;
    }
    if (checkProp(jsearch, 'packageHash')) {
      queryObj.hash = jsearch.packageHash;
    }
    if (checkProp(jsearch, 'count')) {
      queryObj.count = jsearch.count;
    }
    if (checkProp(jsearch, 'tscreated')) {
      queryObj.tscreated = jsearch.tscreated;
    }
    if (checkProp(jsearch, 'tsupdated')) {
      queryObj.tsupdated = jsearch.tsupdated;
    }
    PackageModel.find(queryObj, {
      name: 1,
      version: 1,
      arch: 1,
      family: 1,
      hash: 1,
      count: 1,
      tscreated: 1,
      tsupdated: 1
    })
      .sort({
        name: 1
      })
      .limit(count)
      .then(item => {
        if (item.length === 0) {
          logger.error('XXX No item found');
          const e = new Error('not found');
          e.msg = 'Not found';
          e.code = 404;
          reject(e);
        } else {
          logger.error('XXX Some item found');
          resolve(item);
        }
      })
      .catch(err => {
        logger.error('XXX Error found');
        replyWithError(reject, err);
      });
  });
};

function checkDeleteStatus (resolve, reject, query) {
  PackageModel.deleteOne(query)
    .then(item => {
      if (item.deletedCount !== 1) {
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
      replyWithError(reject, err);
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
exports.deletePackage = function (packageName, packageVersion, packageArch, packageFamily, packageHash) {
  return new Promise(function (resolve, reject) {
    logger.info('In deletePackage service');

    const query = {
      name: packageName,
      version: packageVersion,
      arch: packageArch,
      family: packageFamily,
      hash: packageHash
    };
    checkDeleteStatus(resolve, reject, query);
  });
};

/**
 * @method
 * Delete a single package from database.
 * @public
 * @param {string} packageId - ID of the package
 *
 **/
exports.deletePackageById = function (packageId) {
  return new Promise(function (resolve, reject) {
    logger.info('In cleanup service');

    checkDeleteStatus(resolve, reject, {
      _id: packageId
    });
  });
};

/**
 * @method
 * Count number of entries in database.
 * @public
 *
 * @returns object with count attribute
 **/
exports.countPackage = function () {
  return new Promise(function (resolve, reject) {
    logger.info('In count service');

    PackageModel.countDocuments({}, function (err, count) {
      if (err) {
        reject(err);
      }
      const examples = {};
      examples['application/json'] = {
        count
      };
      resolve(examples[Object.keys(examples)[0]]);
    });
  });
};

/**
 * @method
 * Count number of entries in database.
 * @public
 *
 * @returns object with count attribute
 **/
exports.summaryArch = function () {
  return new Promise(function (resolve, reject) {
    logger.info('In summaryArch service');

    PackageModel.aggregate([
      {
        $group: {
          _id: '$arch',
          count: { $sum: 1 }
        }
      }
    ], function (err, answer) {
      if (err) {
        reject(err);
      }
      replyWithSummary(resolve, answer);
    });
  });
};

/**
 * @method
 * Count number of entries in database.
 * @public
 *
 * @returns object with count attribute
 **/
exports.summaryFamily = function () {
  return new Promise(function (resolve, reject) {
    logger.info('In summaryFamily service');

    PackageModel.aggregate([
      {
        $group: {
          _id: '$family',
          count: { $sum: 1 }
        }
      }
    ], function (err, answer) {
      if (err) {
        reject(err);
      }
      replyWithSummary(resolve, answer);
    });
  });
};

/**
 * @method
 * Count objects per creator
 * @public
 *
 * @returns array of _id count tuples
 **/
exports.countPerCreator = function () {
  return new Promise(function (resolve, reject) {
    logger.info('In countPerCreator service');

    PackageModel.aggregate([
      { $group: { _id: '$creator', count: { $sum: 1 } } }
    ], function (err, answer) {
      if (err) {
        reject(err);
      }
      replyWithSummary(resolve, answer);
    });
  });
};
