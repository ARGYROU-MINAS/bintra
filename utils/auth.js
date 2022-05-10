'use strict';

const LoginModel = require('../models/login.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const UsersService = require('../service/UsersService');

const jwt = require('jsonwebtoken');
require('custom-env').env(true);
const sharedSecret = process.env.JWT_SECRET;
const issuer = process.env.JWT_ISSUER;

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

exports.verifyToken = async function (req, scopes, schema) {
  logger.info('In verifyToken');

  const current_req_scopes = req.openapi.schema['x-security-scopes']
  logger.info(current_req_scopes);
  logger.info(schema);
  const token = req.headers.authorization;

  logger.debug('token: ' + token)

  // validate the 'Authorization' header. it should have the following format:
  // 'Bearer tokenString'
  if (token && token.indexOf('Bearer ') == 0) {
    const tokenString = token.split(' ')[1];
    let decodedToken = '';

    try {
      decodedToken = jwt.verify(tokenString, sharedSecret);
    } catch (err) {
      logger.error('JWT verify failed: ' + err);
      logger.error(err.message);
      req.sentry.setUser({ ip_address: req.ip });
      req.sentry.setContext('JWT', {
        msg: err.message
	    });
      req.sentry.captureException(err);
      throw (err);
    }

    logger.debug('Decoded token:');
    logger.debug(decodedToken);
    if (!decodedToken) {
      logger.error('Decode failed');
      return false;
    }

    // check if the JWT was verified correctly
    if (decodedToken.role) {
      logger.info('User has role ' + decodedToken.role + ' in JWT');

      // check if the issuer matches
      const issuerMatch = decodedToken.iss == issuer;
      if (!issuerMatch) {
        logger.error("issuer doesn't match");
        return false;
      }

      // Check if users role matches api precondition, will return if OK, otherwise jump out
      logger.debug('Check active users role matching API requirements');
      await UsersService.isActiveHasRole(decodedToken.sub, current_req_scopes);

      req.auth = decodedToken;
      logger.debug('Added AUTH to request object');

      // Add user data to sentry
      req.sentry.setUser({ username: decodedToken.sub, ip_address: req.ip });

      return true;
    }
  } else {
    return false;
  }
};

function doIssue (username, role, exprange) {
  logger.info('user ' + username + ', role' + role);
  return jwt.sign({
    sub: username,
    iss: issuer,
    role
  },
  sharedSecret, {
    expiresIn: exprange
  }
  );
}

exports.issueToken = function (username, role) {
  return doIssue(username, role, '365d');
};

exports.issueShortToken = function (username, role) {
  return doIssue(username, role, '1s');
};
