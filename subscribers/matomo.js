// subscribers

const emitter = require('events').EventEmitter;
const eventEmitter = require('../utils/eventer').em;

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

const MatomoTracker = require('matomo-tracker');
let matomo = null;
if (process.env.MATOMO_URL !== '') {
  matomo = new MatomoTracker(process.env.MATOMO_ID, process.env.MATOMO_URL);
}
const baseUrl = 'https://api.binarytransparency.net';

/**
 * @function
 * Get remote IP number by connection or header data.
 * @private
 * @returns {string} IP number
 */
function getRemoteAddr (req) {
  if (req.headers['x-forwarded-for']) {
    const aIPs = req.headers['x-forwarded-for'].split(',');
    const firstIP = aIPs[0];
    logger.debug(firstIP);
    return firstIP;
  }
  if (req.headers['x-real-ip']) return req.headers['x-real-ip'];

  if (req.ip) return req.ip;
  if (req._remoteAddress) return req._remoteAddress;
  const sock = req.socket;
  if (sock.socket) return sock.socket.remoteAddress;
  return sock.remoteAddress;
}

eventEmitter.on('apihit', function getApiHit (req) {
  logger.debug('In subscriber');

  if (matomo == null) return;

  const url = req.url;
  const urlparts = url.split('/');
  const urlMethod = urlparts[0] + '/' + urlparts[1] + '/' + urlparts[2];
  const reqMethod = req.method;
  const reqUseragent = req.headers['user-agent'];
  const reqLanguage = req.headers['accept-language'];

  logger.debug('log ' + urlMethod);
  matomo.track({
    url: baseUrl + urlMethod,
    action_name: 'API call',
    token_auth: process.env.MATOMO_TOKEN_AUTH,
    cip: getRemoteAddr(req),
    ca: 1,
    ua: reqUseragent,
    lang: reqLanguage,
    cvar: JSON.stringify({
      1: ['API version', urlparts[1]],
      2: ['HTTP method', reqMethod]
    })
  });
});

eventEmitter.on('posthit', function getPostHit (urlpath) {
  logger.debug('In subscriber');

  if (matomo == null) return;

  matomo.track({
    url: baseUrl + urlpath,
    action_name: 'POST call',
    token_auth: process.env.MATOMO_TOKEN_AUTH
  });
});

module.exports = {}
