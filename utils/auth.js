"use strict";

var LoginModel = require('../models/login.js');
const bcrypt = require ('bcrypt');
const saltRounds = 10;

var Service = require('../service/PackagesService');

var jwt = require("jsonwebtoken");
require('custom-env').env(true);
var sharedSecret = process.env.JWT_SECRET;
var issuer = process.env.JWT_ISSUER;

//Here we setup the security checks for the endpoints
//that need it (in our case, only /protected). This
//function will be called every time a request to a protected
//endpoint is received
exports.verifyToken = function(req, authOrSecDef, token, callback) {
  //these are the scopes/roles defined for the current endpoint
  var currentScopes = req.swagger.operation["x-security-scopes"];
  console.log("Check for scopes:");
  console.log(currentScopes);

  console.log("in verify " + currentScopes + token)
  function sendError() {
	var response = { statusCode: 401, message: 'Error: Access Denied' };
    return response;
  }

  //validate the 'Authorization' header. it should have the following format:
  //'Bearer tokenString'
  if (token && token.indexOf("Bearer ") == 0) {
    var tokenString = token.split(" ")[1];

    jwt.verify(tokenString, sharedSecret, function(
      verificationError,
      decodedToken
    ) {
	  console.log(decodedToken);
      //check if the JWT was verified correctly
      if (
        verificationError == null &&
        Array.isArray(currentScopes) &&
        decodedToken &&
        decodedToken.role
      ) {
	    console.log("User has role " + decodedToken.role + " in JWT");
        // check if the role is valid for this endpoint
        var roleMatch = currentScopes.indexOf(decodedToken.role) !== -1;
        // check if the issuer matches
        var issuerMatch = decodedToken.iss == issuer;

        // you can add more verification checks for the
        // token here if necessary, such as checking if
        // the username belongs to an active user
	console.log("Check if iser is active:" + decodedToken.sub + "!");
	Service.isActiveUser(decodedToken.sub).then(function (bRC) {

          if (roleMatch && issuerMatch) {
            //add the token to the request so that we
            //can access it in the endpoint code if necessary
            req.auth = decodedToken;
            //if there is no error, just return null in the callback
            return callback(null);
          } else {
            //return the error in the callback if there is one
            return callback(sendError());
          }
	})
	.catch(function () {
	  console.error("User not active");
	  return callback(sendError());
	});
      } else {
        //return the error in the callback if the JWT was not verified
        return callback(sendError());
      }
    });
  } else {
    //return the error in the callback if the Authorization header doesn't have the correct format
    return callback(sendError());
  }
};

exports.issueToken = function(username, role) {
  console.log("user " + username + ", role" + role);
  var token = jwt.sign(
    {
      sub: username,
      iss: issuer,
      role: role
    },
    sharedSecret,
    {
      expiresIn: "365d"
    }
  );
  return token;
};
