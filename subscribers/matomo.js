// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;

var PiwikTracker = require('piwik-tracker');
var piwik = null;
if(process.env.MATOMO_ID) {
  piwik = new PiwikTracker(process.env.MATOMO_ID, process.env.MATOMO_URL);
}
var baseUrl = 'https://api.bintra.directory';

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

eventEmitter.on('apihit', function getApiHit(req) {
  console.debug("In subscriber");

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

});

module.exports = {}
