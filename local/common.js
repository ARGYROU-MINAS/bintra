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

module.exports = {
    loginModel: LoginModel,
    cmdArgs: cmdArgs,
    saltRounds: saltRounds
};
