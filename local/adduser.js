
var mongoose = require('mongoose');
const { mongoHost, mongoPort, mongoDb, mongoUrl } = require('../conf');
console.log(mongoHost + mongoUrl);
mongoose.connect(mongoUrl, { useNewUrlParser: true, useInifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var LoginModel = require('../models/login.js');
const bcrypt = require ('bcrypt');
const saltRounds = 10;

var cmdArgs = process.argv.slice(2);
var username = cmdArgs[0];
var password = cmdArgs[1];
console.log("Add user name=" + username + " Password=" + password);

// salt, hash, and store
bcrypt.hash(password, saltRounds, async function(err, hash) {
  let values = [hash, username]; // query values
  var login = new LoginModel({name: username, passwd: hash});

  // store hash in database
  await login.save();
});

