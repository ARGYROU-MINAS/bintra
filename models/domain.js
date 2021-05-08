// models/login.js


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var DomainSchema = new Schema({
    tscreated: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
        required: true
    }
});

DomainSchema.index({
    name: 1
}, {
    unique: true
});

module.exports = mongoose.model('DomainModel', DomainSchema);