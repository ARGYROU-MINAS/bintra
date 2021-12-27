var mongoose = require('mongoose');
const {
    mongoHost,
    mongoPort,
    mongoDb,
    mongoUrl,
    saltRounds
} = require('../conf');
console.log(mongoUrl);
mongoose.set('useCreateIndex', true);
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var loginModel = require('../models/login.js');

var cmdArgs = process.argv.slice(2);

exports.loginModel = loginModel;
exports.cmdArgs = cmdArgs;
exports.saltRounds = saltRounds;

const setUserStatus = (username, newstatus) => {
	loginModel.updateOne(
    	{ name: username },
    	{ $set: {status: newstatus} }
	).then(result => {
    	console.log(result);
    	if(result.nModified != 1) {
        	console.log("Entry not found");
			return false;
    	}
		return true;
	}).catch(error => {
    	console.log("Had an error " + error);
    	return false;
	});
}

exports.setUserStatus = setUserStatus;

