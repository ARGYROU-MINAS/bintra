// models/package.js


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PackageSchema = new Schema({
	id: {type: String, required: true, maxlength: 100},
	tscreated: Date,
});

//PackageSchema.virtual('idsomething').get(function() {
//	return this.whateverToDo
//});

module.exports = mongoose.model('PackageModel', PackageSchema);

