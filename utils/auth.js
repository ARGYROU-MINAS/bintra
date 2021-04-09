"use strict";

var LoginModel = require('../models/login.js');
const bcrypt = require ('bcrypt');
const saltRounds = 10;

var UsersService = require('../service/UsersService');

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

exports.verifyToken = async function(req, scopes, schema) {
  //these are the scopes/roles defined for the current endpoint
//  var currentScopes = req.swagger.operation["x-security-scopes"];
  console.log("AUTH: Check for scopes:");

  //console.log(req);
  var current_req_scopes = req.openapi.schema["x-security-scopes"]
  console.log(current_req_scopes);
  console.log(schema);
  var token = req.headers.authorization;

  console.log("in verify " + scopes + " -> " + token)

  //validate the 'Authorization' header. it should have the following format:
  //'Bearer tokenString'
  if (token && token.indexOf("Bearer ") == 0) {
    var tokenString = token.split(" ")[1];

    var decodedToken = jwt.verify(tokenString, sharedSecret);
    console.log("Decoded token:");
    console.log(decodedToken);
    if(!decodedToken) {
      console.error("Decode failed");
      return false;
    }

    //check if the JWT was verified correctly
    if (Array.isArray(scopes) && decodedToken.role) {
      console.log("User has role " + decodedToken.role + " in JWT");

      // check if the issuer matches
      var issuerMatch = decodedToken.iss == issuer;
      if(!issuerMatch) {
        console.error("issuer doesn't match");
        return false;
      }

      // Check if users role matches api precondition
      console.log("Check users role matching API requirements");
      var responseRole = await UsersService.hasRole(decodedToken.sub, current_req_scopes);
      if(responseRole) {
        console.log("Role matched");
      } else {
        console.error("User does not have wanted role");
        return false;
      }

      // you can add more verification checks for the
      // token here if necessary, such as checking if
      // the username belongs to an active user
      console.log("Check if user is active: " + decodedToken.sub + "?");
      var response = await UsersService.isActiveUser(decodedToken.sub);
      console.log(response);
      if(response) {
        //add the token to the request so that we
        //can access it in the endpoint code if necessary
        req.auth = decodedToken;
        console.log("Add AUTH to request object");
        return true;
      }
      console.error("User not active");
      return false;
    }
  } else {
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
