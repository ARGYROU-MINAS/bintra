// config/matomo.js

require('custom-env').env(true);

module.exports = {
	host: process.env.MONGO_HOSTNAME,
	port: process.env.MONGO_PORT,
	db: process.env.MONGO_DB,
	url: 'mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin'
};
