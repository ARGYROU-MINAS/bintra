'use strict';

/**
 * @module Services
 * Plain functionality in service methods.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var fs = require('fs');
const cdigit = require("cdigit");
var dateFormat = require("dateformat");
require("datejs");

/**
 * @method
 * Get lorem ipsum text.
 * @public
 *
 * @param {int} amount - Integer positive whole number of words
 * @returns String
 **/
exports.validatePackage = function(amount) {
  return new Promise(function(resolve, reject) {
    if(amount <= 0) {
      console.log("amount to small");
      reject("amount must be positive");
    }

    var sentence="";
    fs.readFile('data/lorem_ipsum.txt', 'utf8', function(err, data) {
      if (err) throw err;
      var words = data.split(" ");
      var lengthSource = words.length;
      // console.log("source lenth=" + lengthSource);
      if(lengthSource >= amount) {
        words = words.slice(0, amount);
        sentence = words.join(" ");
      } else {
        var longWords = arrayRepeat(words, amount);
        sentence = longWords.join(" ");
      }

      resolve(sentence);
    });
  });
}

