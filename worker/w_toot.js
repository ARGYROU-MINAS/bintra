// subscribers

var Masto = require('mastodon');
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

function dotoot(t) {
  var M = new Masto({
    access_token: process.env.TOOTAUTH,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: process.env.TOOTAPI
  });

  logger.debug("!!! Tooting " + t);
/*  M.post('statuses', { status: t } ).then(resp => {
    logger.info('Did post status');
  }); */

};

module.exports = dotoot;
