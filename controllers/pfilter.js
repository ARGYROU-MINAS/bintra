'use strict';

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

function cleanupString(s) {
    var sNew = s.replace(/[^a-zA-Z0-9\-\._ ~:+]/gi, '');
    if (sNew != s) {
        logger.warn("Filtered invalid chars");
    }
    return sNew;
}


function cleanupName(s) {
    var sNew = s.replace(/[^a-z0-9\-\.]/gi, '');
    if (sNew != s) {
        logger.warn("Filtered invalid chars");
    }
    return sNew;
}


function cleanupWord(s) {
    var sNew = s.replace(/[^a-zA-Z]/gi, '');
    if (sNew != s) {
        logger.warn("Filtered invalid chars");
    }
    return sNew;
}

function cleanupNumber(s) {
    var sNew = s.replace(/[^0-9]/gi, '');
    if (sNew != s) {
        logger.warn("Filtered invalid number chars");
    }
    return sNew;
}

function cleanupStringHex(s) {
    var sNew = s.replace(/[^a-fA-F0-9]/gi, '');
    if (sNew != s) {
        logger.warn("Filtered invalid chars");
    }
    return sNew;
}

module.exports = function(req, res, next) {
    logger.info("In pfilter: " + req.url);
    if (!req.url.startsWith("/v1/")) {
        logger.debug("Ignore non API stuff");
        next();
    } else {
        for (var [key, value] of Object.entries(req.query)) {
            logger.debug(key + ":" + value);
            switch (key) {
                case "count":
                case "skip":
                case "page":
                case "size":
                    req.query[key] = cleanupNumber(value);
                    break;
                case "packageName":
                case "packageArch":
                case "packageVersion":
                case "packageFamily":
                    req.query[key] = cleanupString(value);
                    break;
                case "packageHash":
                    req.query[key] = cleanupStringHex(value);
                    break;
                case "name":
                    req.query[key] = cleanupName(value);
                    break;
                case "sort":
                case "sorters":
                case "direction":
                    req.query[key] = cleanupWord(value);
                    break;
                case "id":
                    req.query[key] = cleanupStringHex(value);
                    if (value.length != 24) {
                        logger.error("ID must be 24 hex chars");
                        res.writeHead(400, {
                            "Content-Type": "application/json"
                        });
                        var response = {
                            message: "Error: ID must be 24 hex chars"
                        };
                        return res.end(JSON.stringify(response));
                    }
                    break;
                default:
                    logger.warn("Don't know about " + key);
                    break;
            }
        }
        next();
    }
};
