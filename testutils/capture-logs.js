'use strict';

var util = require('util');

var originalLogFunction = console.log;
var originalErrorFunction = console.error;

const beforeEachCb = function() {
    var currentTest = this.currentTest;
    console.log = function captureLog() {
      var formattedMessage = util.format.apply(util, arguments);
      currentTest.consoleOutputs = (currentTest.consoleOutputs || []).concat(formattedMessage);
    };
    console.error = function captureError() {
      var formattedMessage = util.format.apply(util, arguments);
      currentTest.consoleErrors = (currentTest.consoleErrors || []).concat(formattedMessage);
    };
};

const afterEachCb = function() {
    console.log = originalLogFunction;
    console.error = originalErrorFunction;
};

const captureLogs = function() {
    if (typeof beforeEach !== 'function') {
        throw Error('Mocha was not loaded');
    }

    beforeEach(beforeEachCb);
    afterEach(afterEachCb);
};

module.exports = captureLogs;
module.exports.beforeEachCb = beforeEachCb;
module.exports.afterEachCb = afterEachCb;
