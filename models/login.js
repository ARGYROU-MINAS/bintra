// models/login.js

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const LoginSchema = new Schema({
  tscreated: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  passwd: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'api'],
    required: true,
    default: 'user'
  },
  status: {
    type: String,
    enum: ['register', 'active', 'disabled', 'deleted'],
    required: true,
    default: 'disabled'
  }
});

LoginSchema.index({
  name: 1
}, {
  unique: true
});
LoginSchema.index({
  tscreated: 1
});

module.exports = mongoose.model('LoginModel', LoginSchema);
