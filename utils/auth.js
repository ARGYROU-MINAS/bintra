"use strict";

var LoginModel = require('../models/login.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

var UsersService = require('../service/UsersService');

var jwt = require("jsonwebtoken");
require('custom-env').env(true);
var sharedSecret = process.env.JWT_SECRET;
var issuer = process.env.JWT_ISSUER;


exports.verifyToken = async function(req, scopes, schema) {
    var current_req_scopes = req.openapi.schema["x-security-scopes"]
    console.log(current_req_scopes);
    console.log(schema);
    var token = req.headers.authorization;

    console.log("in verify, token: " + token)

    //validate the 'Authorization' header. it should have the following format:
    //'Bearer tokenString'
    if (token && token.indexOf("Bearer ") == 0) {
        var tokenString = token.split(" ")[1];

        var decodedToken = jwt.verify(tokenString, sharedSecret);
        console.log("Decoded token:");
        console.log(decodedToken);
        if (!decodedToken) {
            console.error("Decode failed");
            return false;
        }

        //check if the JWT was verified correctly
        if (decodedToken.role) {
            console.log("User has role " + decodedToken.role + " in JWT");

            // check if the issuer matches
            var issuerMatch = decodedToken.iss == issuer;
            if (!issuerMatch) {
                console.error("issuer doesn't match");
                return false;
            }

            // Check if users role matches api precondition, will return if OK, otherwise jump out
            console.log("Check users role matching API requirements");
            await UsersService.hasRole(decodedToken.sub, current_req_scopes);

            // you can add more verification checks for the
            // token here if necessary, such as checking if
            // the username belongs to an active user, will throw out if not
            console.log("Check if user is active: " + decodedToken.sub + "?");
            await UsersService.isActiveUser(decodedToken.sub);
            //add the token to the request so that we
            //can access it in the endpoint code if necessary
            req.auth = decodedToken;
            console.log("Added AUTH to request object");

            return true;
        }
    } else {
        return false;
    }
};

exports.issueToken = function(username, role) {
    console.log("user " + username + ", role" + role);
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