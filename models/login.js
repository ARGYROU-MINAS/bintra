// models/login.js


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var LoginSchema = new Schema({
	tscreated: {type: Date, default: Date.now},
	name: {type: String, required: true},
	email: {type: String, required: false},
	passwd: {type: String, required: true},
});

LoginSchema.index({name: 1}, {unique: true});
LoginSchema.index({tscreated: 1});

module.exports = mongoose.model('LoginModel', LoginSchema);

