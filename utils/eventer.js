const emitter = require('events').EventEmitter;
const eventEmitter = new emitter();

module.exports = {
  em: eventEmitter
};
