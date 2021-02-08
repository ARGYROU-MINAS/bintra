// models/package.js


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PackageSchema = new Schema({
	tscreated: Date,
	name: {type: String, required: true},
	version: {type: String, required: true},
	hash: {type: String, required: true},
});

//PackageSchema.virtual('idsomething').get(function() {
//	return this.whateverToDo
//});

module.exports = mongoose.model('PackageModel', PackageSchema);

