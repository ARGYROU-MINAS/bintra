// models/package.js


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PackageSchema = new Schema({
	tscreated: {type: Date, default: Date.now},
	name: {type: String, required: true},
	version: {type: String, required: true},
	arch: {type: String, required: true},
	hash: {type: String, required: true},
	count: {type: Number, required: true, min: 1, default: 1},
});

//PackageSchema.virtual('idsomething').get(function() {
//	return this.whateverToDo
//});

module.exports = mongoose.model('PackageModel', PackageSchema);

