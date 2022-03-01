"use strict";

require('custom-env').env(true);

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

const p_env = /\.env/g;
const p_php = /\.php/g;
const p_git = /\.git/g;
const p_wp  = /wp-(admin|content|login)/g;

var webFilterOK = exports.webFilterOK = function(req) {
    var u = req.originalUrl;
    if(u.indexOf('?') > -1) {
        logger.debug("Had to split argument off");
        u = u.split('?')[0];
    }
    logger.debug(u);

    if(u.startsWith('//')) return false;
    if(u.search(p_env) > -1) return false;
    if(u.search(p_php) > -1) return false;
    if(u.search(p_git) > -1) return false;
    if(u.search(p_wp) > -1) return false;


    return true;
};

