const mongoose = require('mongoose');
const {
  mongoHost,
  mongoPort,
  mongoDb,
  mongoUrl,
  saltRounds
} = require('../conf');

// used by main caller
const cmdArgs = process.argv.slice(2);

const bcrypt = require('bcrypt');
const loginModel = require('../models/login.js');

exports.loginModel = loginModel;
exports.cmdArgs = cmdArgs;
exports.saltRounds = saltRounds;

exports.doconnect = function () {
  return new Promise(function (resolve, reject) {
    console.log("connect to DB: '" + mongoUrl + "'");
    mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
    mongoose.connection.on('connecting', err => { if (err) { console.error(err); } console.log('connecting'); });
    mongoose.connection.on('connected', err => { if (err) { console.error(err); } console.log('connected'); });
    mongoose.connection.on('open', err => { if (err) { console.error(err); } console.log('open'); });
    mongoose.connect(mongoUrl, {}).then(
      () => {
        console.log('DB OK');
        resolve('OK');
      },
      err => {
        console.log('DB connect error' + err);
        reject(err);
      });
  });
}

exports.setUserStatus = function (username, newstatus) {
  return new Promise(function (resolve, reject) {
    console.log('cstate=' + mongoose.connection.readyState);
    loginModel.updateOne(
      { name: username },
      { $set: { status: newstatus } }
    ).then(result => {
      if (result.matchedCount !== 1) {
        console.log('Entry not found');
        reject(Error('not found'));
      }
      resolve(result);
    }).catch(error => {
      console.log('Had an error ' + error);
      reject(error);
    });
  });
}

exports.setUserPasswd = function (username, newpassword) {
  return new Promise(function (resolve, reject) {
    console.log(username);
    const hash = bcrypt.hashSync(newpassword, saltRounds);
    loginModel.updateOne(
      { name: username },
      { $set: { passwd: hash } }
    ).then(result => {
      if (result.matchedCount !== 1) {
        console.log('Entry not found');
        reject(Error('not found'));
      }
      resolve(result);
    }).catch(error => {
      console.log('Had an error ' + error);
      reject(error);
    });
  });
}
