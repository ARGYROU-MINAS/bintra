'use strict';

require('custom-env').env(true);

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

const pEnv = /\.env/g;
const pPhp = /\.php/g;
const pGit = /\.git/g;
const pWp = /wp-(admin|content|login)/g;

exports.webFilterOK = function (req) {
  let u = req.originalUrl;
  if (u.indexOf('?') > -1) {
    logger.debug('Had to split argument off');
    u = u.split('?')[0];
  }
  logger.debug(u);

  if (u.startsWith('//')) return false;
  if (u.search(pEnv) > -1) return false;
  if (u.search(pPhp) > -1) return false;
  if (u.search(pGit) > -1) return false;
  if (u.search(pWp) > -1) return false;

  logger.debug('Query was clean');
  return true;
};
