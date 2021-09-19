var mongoose = require('mongoose');
const {
    mongoHost,
    mongoPort,
    mongoDb,
    mongoUrl,
    saltRounds
} = require('../conf');
console.log(mongoHost + mongoUrl);
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var LoginModel = require('../models/login.js');
const bcrypt = require('bcrypt');

var cmdArgs = process.argv.slice(2);
var username = cmdArgs[0];
var password = cmdArgs[1];
console.log("Change user name=" + username + " Password=" + password);

// salt, hash, and store
bcrypt.hash(password, saltRounds, async function(err, hash) {
    await LoginModel.updateOne(
        {name: username},
        { $set: {passwd: hash}}
    );
    console.log("Did change");

    process.exit();
});
