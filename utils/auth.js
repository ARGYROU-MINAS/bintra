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
//exports.verifyToken = function(req, authOrSecDef, token, callback) {

exports.checkAuthentication = function(req, res, next) {
  console.log("in auth.checkAutrhentication filter");
  next();
}

exports.verifyToken = function(req, scopes, schema) {
  //these are the scopes/roles defined for the current endpoint
//  var currentScopes = req.swagger.operation["x-security-scopes"];
  console.log("AUTH: Check for scopes:");

  console.log(scopes);
  console.log(schema);
  var token = req.headers.authorization;

  console.log("in verify " + scopes + " -> " + token)

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
        Array.isArray(scopes) &&
        decodedToken &&
        decodedToken.role
      ) {
	    console.log("User has role " + decodedToken.role + " in JWT");
        // check if the role is valid for this endpoint
        var roleMatch = scopes.indexOf(decodedToken.role) !== -1;
        // check if the issuer matches
        var issuerMatch = decodedToken.iss == issuer;

        // you can add more verification checks for the
        // token here if necessary, such as checking if
        // the username belongs to an active user
	console.log("Check if user is active:" + decodedToken.sub + "!");
	Service.isActiveUser(decodedToken.sub).then(function (bRC) {

          if (roleMatch && issuerMatch) {
            //add the token to the request so that we
            //can access it in the endpoint code if necessary
            req.auth = decodedToken;
		 console.log("Add AUTH to request object");
            //if there is no error, just return null in the callback
            return true;
          } else {
            //return the error in the callback if there is one
            return false;
          }
	})
	.catch(function () {
	  console.error("User not active");
	  return false;
	});
      } else {
        //return the error in the callback if the JWT was not verified
        return false;
      }
    });
	  return true;
  } else {
    //return the error in the callback if the Authorization header doesn't have the correct format
    return false;
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
