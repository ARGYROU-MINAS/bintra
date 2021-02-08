'use strict';

/**
 * @module controller
 * API controller for methods mapping.
 * @license MIT
 * @author Kai KRETSCHMANN <kai@kretschmann.consulting>
 */

var utils = require('../utils/writer.js');
var Users = require('../service/PackagesService');

var PiwikTracker = require('piwik-tracker');
var piwik = null;
if(process.env.MATOMO_ID) {
  piwik = new PiwikTracker(process.env.MATOMO_ID, process.env.MATOMO_URL);
}
var baseUrl = 'https://demodata.eu';

/**
 * @function
 * Get remote IP number by connection or header data.
 * @private
 * @returns {string} IP number
 */
function getRemoteAddr(req) {
  if(req.headers['x-real-ip']) return req.headers['x-real-ip'];

  if (req.ip) return req.ip;
  if (req._remoteAddress) return req._remoteAddress;
  var sock = req.socket;
  if (sock.socket) return sock.socket.remoteAddress;
  return sock.remoteAddress;
}

/**
 * @function
 * Log API access, reduced to method without argument data.
 * @private
 * @param {object} req - web request object
 */
function trackMethod(req) {
  if(null == piwik) return;
  var url = req.url;
  var urlparts = url.split('/');
  var urlMethod = urlparts[0] + '/' + urlparts[1] + '/' + urlparts[2];
  console.log("log " + urlMethod);
  piwik.track({
    url: baseUrl + urlMethod,
    action_name: 'API call',
    token_auth: process.env.MATOMO_TOKEN_AUTH,
    cip: getRemoteAddr(req),
    ua: req.headers['user-agent'],
    lang: req.headers['accept-language'],
    cvar: JSON.stringify({
      '1': ['API version', urlparts[1]],
      '2': ['HTTP method', req.method]
    })
  });
}

/**
 * @method
 * Expose API lorem ipsum.
 * @public
 */
module.exports.validatePackage = function validatePackage (req, res, next) {
  var amount = req.swagger.params['amount'].value;

  trackMethod(req);

  Packages.validatePackage(amount)
    .then(function (payload) {
      utils.writeText(res, payload, 200);
    })
    .catch(function (payload) {
      utils.writeText(res, payload, 400);
    });
};

