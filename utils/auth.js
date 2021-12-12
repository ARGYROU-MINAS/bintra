"use strict";

var LoginModel = require('../models/login.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

var UsersService = require('../service/UsersService');

var jwt = require("jsonwebtoken");
require('custom-env').env(true);
var sharedSecret = process.env.JWT_SECRET;
var issuer = process.env.JWT_ISSUER;

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "debug";


exports.verifyToken = async function(req, scopes, schema) {
    var current_req_scopes = req.openapi.schema["x-security-scopes"]
    logger.info(current_req_scopes);
    logger.info(schema);
    var token = req.headers.authorization;

    logger.info("in verify, token: " + token)

    //validate the 'Authorization' header. it should have the following format:
    //'Bearer tokenString'
    if (token && token.indexOf("Bearer ") == 0) {
        var tokenString = token.split(" ")[1];

        var decodedToken = jwt.verify(tokenString, sharedSecret);
        logger.info("Decoded token:");
        logger.info(decodedToken);
        if (!decodedToken) {
            logger.error("Decode failed");
            return false;
        }

        //check if the JWT was verified correctly
        if (decodedToken.role) {
            logger.info("User has role " + decodedToken.role + " in JWT");

            // check if the issuer matches
            var issuerMatch = decodedToken.iss == issuer;
            if (!issuerMatch) {
                logger.error("issuer doesn't match");
                return false;
            }

            // Check if users role matches api precondition, will return if OK, otherwise jump out
            logger.info("Check users role matching API requirements");
            await UsersService.hasRole(decodedToken.sub, current_req_scopes);

            // you can add more verification checks for the
            // token here if necessary, such as checking if
            // the username belongs to an active user, will throw out if not
            logger.info("Check if user is active: " + decodedToken.sub + "?");
            await UsersService.isActiveUser(decodedToken.sub);
            //add the token to the request so that we
            //can access it in the endpoint code if necessary
            req.auth = decodedToken;
            logger.info("Added AUTH to request object");

            // Add user data to sentry
            req.sentry.setUser({username: decodedToken.sub, ip_address: req.ip});

            return true;
        }
    } else {
        return false;
    }
};

exports.issueToken = function(username, role) {
    logger.info("user " + username + ", role" + role);
    return jwt.sign({
            sub: username,
            iss: issuer,
            role: role
        },
        sharedSecret, {
            expiresIn: "365d"
        }
    );
};
