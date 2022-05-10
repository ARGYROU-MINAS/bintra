// models/domain.js

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const DomainSchema = new Schema({
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
