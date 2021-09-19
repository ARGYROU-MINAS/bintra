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

var cmdArgs = process.argv.slice(2);
var username = cmdArgs[0];
console.log("Disable user name=" + username);

// store
LoginModel.updateOne(
    { name: username },
    { $set: {status: "deleted"} }
).then(result => {
    console.log("Did change " + result);
    process.exit();
}).catch(error => {
    console.log("Had an error " + error);
    process.exit();
});

