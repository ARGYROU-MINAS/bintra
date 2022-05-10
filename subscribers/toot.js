// subscribers

const eventEmitter = require('../utils/eventer').em;

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

const myworker = require('../worker/worker');

eventEmitter.on('putdata', function getPutDataHit (packageName, packageVersion, packageArch, packageFamily, packageHash, isnew) {
  if (process.env.TOOTAUTH === 'XXX') return;
  logger.debug('In toot subscriber');

  let t;
  if (isnew) {
    t = 'Add new hash ' + packageHash + ' for ' + packageName + ' (' + packageVersion + ') for ' + packageArch + ' #' + packageFamily;
  } else {
    logger.info('Skip toot if not new');
    return;
  }

  t = t + ' #binarytransparency';

  myworker.doqueue(t);
});

module.exports = {}
