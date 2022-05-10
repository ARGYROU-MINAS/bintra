const Emitter = require('events').EventEmitter;
const eventEmitter = new Emitter();

module.exports = {
  em: eventEmitter
};
