"use strict";

require('custom-env').env(true);

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

const p_env = /\.env/g;

var webFilterOK = exports.webFilterOK = function(req) {
    var u = req.originalUrl;
    logger.debug(u);

    if(u.startsWith('//')) return false;
    if(u.search(p_env) > -1) return false;


    return true;
};

