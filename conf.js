// config/matomo.js

require('custom-env').env(true);

var tmpUrl;

if(process.env.MONGO_USERNAME) {
	tmpUrl = 'mongodb://' + process.env.MONGO_USERNAME + ':' + process.env.MONGO_PASSWORD + '@' + process.env.MONGO_HOSTNAME + ':' + process.env.MONGO_PORT + '/' + process.env.MONGO_DB + '?authSource=admin';
} else {
	tmpUrl = 'mongodb://' + process.env.MONGO_HOSTNAME + ':' + process.env.MONGO_PORT + '/' + process.env.MONGO_DB + '?authSource=admin';
}

module.exports = {
	mongoHost: process.env.MONGO_HOSTNAME,
	mongoPort: process.env.MONGO_PORT,
	mongoDb: process.env.MONGO_DB,
	mongoUrl: tmpUrl
};