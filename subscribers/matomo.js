// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

var MatomoTracker = require('matomo-tracker');
var matomo = null;
if(process.env.MATOMO_URL !== "") {
  matomo = new MatomoTracker(process.env.MATOMO_ID, process.env.MATOMO_URL);
}
var baseUrl = 'https://api.binarytransparency.net';

/**
 * @function
 * Get remote IP number by connection or header data.
 * @private
 * @returns {string} IP number
 */
function getRemoteAddr(req) {
  if(req.headers['x-forwarded-for']) {
    var aIPs = req.headers['x-forwarded-for'].split(',');
    var firstIP = aIPs[0];
    logger.debug(firstIP);
    return firstIP;
  }
  if(req.headers['x-real-ip']) return req.headers['x-real-ip'];

  if (req.ip) return req.ip;
  if (req._remoteAddress) return req._remoteAddress;
  var sock = req.socket;
  if (sock.socket) return sock.socket.remoteAddress;
  return sock.remoteAddress;
}

eventEmitter.on('apihit', function getApiHit(req) {
  logger.debug("In subscriber");

  if(null == matomo) return;

  var url = req.url;
  var urlparts = url.split('/');
  var urlMethod = urlparts[0] + '/' + urlparts[1] + '/' + urlparts[2];
  var reqMethod = req.method;
  var reqUseragent = req.headers['user-agent'];
  var reqLanguage = req.headers['accept-language'];

  logger.debug("log " + urlMethod);
  matomo.track({
    url: baseUrl + urlMethod,
    action_name: 'API call',
    token_auth: process.env.MATOMO_TOKEN_AUTH,
    cip: getRemoteAddr(req),
    ca: 1,
    ua: reqUseragent,
    lang: reqLanguage,
    cvar: JSON.stringify({
      '1': ['API version', urlparts[1]],
      '2': ['HTTP method', reqMethod]
    })
  });

});

eventEmitter.on('posthit', function getPostHit(urlpath) {
  logger.debug("In subscriber");

  if(null == matomo) return;

   matomo.track({
    url: baseUrl + urlpath,
    action_name: 'POST call',
    token_auth: process.env.MATOMO_TOKEN_AUTH,
  });
});

module.exports = {}
