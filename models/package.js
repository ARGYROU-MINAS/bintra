// models/package.js


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PackageSchema = new Schema({
    tscreated: {
        type: Date,
        required: true
    },
    tsupdated: {
        type: Date,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    version: {
        type: String,
        required: true
    },
    arch: {
        type: String,
        required: true
    },
    family: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoginModel'
    }
});

PackageSchema.index({
    name: 1,
    version: 1,
    arch: 1,
    family: 1,
    hash: 1
}, {
    unique: true
});
PackageSchema.index({
    name: 1,
    version: 1,
    arch: 1,
    family: 1
}, {
    unique: false
});
PackageSchema.index({
    tscreated: 1
});
PackageSchema.index({
    count: 1
});


module.exports = mongoose.model('PackageModel', PackageSchema);