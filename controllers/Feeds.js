// controllers/rss.js

var PackagesService = require('../service/PackagesService');

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

const Feed = require("feed").Feed;
const maxFeedItems = 25;
const sortItemFeed = 'tsupdated';
const sortDirectionFeed = 'down';

const API_BASE_URL = "https://api.binarytransparency.net/v1/";
const WEB_URL = "https://bintra.directory/";
const MY_NAME = "Kai KRETSCHMANN";
const MY_EMAIL = "kai@kretschmann.consulting";
const MY_WEB_URL = "https://kai.kretschmann.consulting";

function getInitialFeed() {
    const myfeed = new Feed({
        title: "Binary Transparency Directory",
        description: "Feed for hash code monitoring",
        id: WEB_URL,
        link: WEB_URL,
        language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
        image: WEB_URL + "image.png",
        favicon: WEB_URL + "favicon.ico",
        copyright: "All rights reserved 2021, " + MY_NAME,
        updated: new Date(),
        generator: "Feed for bintra", // optional, default = 'Feed for Node.js'
        feedLinks: {
            json: API_BASE_URL + "feed.json",
            rss: API_BASE_URL + "feed.rss",
            atom: API_BASE_URL + "feed.atom"
        },
        author: {
            name: MY_NAME,
            email: MY_EMAIL,
            link: MY_WEB_URL
        }
    });

    myfeed.addCategory("Technology");
    myfeed.addContributor({
        name: MY_NAME,
        email: MY_EMAIL,
        link: MY_WEB_URL
    });

    return myfeed;
}

function createContent(entry) {
    return "Archive " + entry.name + ", version " + entry.version + " for " +
        entry.arch + ", " + entry.family + " with hash " + entry.hash
}

function replyWithError(res, payload) {
    res.writeHead(500, {"Content-Type": "text/plain"});
    return res.end("error " + payload);
}

function feedRss(req, res, next) {
    var rssfeed = getInitialFeed();

    PackagesService.listPackages(0, maxFeedItems, sortItemFeed, sortDirectionFeed, 30)
        .then(function(items) {
            items.forEach(function(entry) {
                var myid = entry._id;
                rssfeed.addItem({
                    title: entry.name,
                    id: API_BASE_URL + "package/" + myid,
                    link: WEB_URL + "details/?id=" + myid,
                    description: entry.name,
                    date: entry.tsupdated || new Date(),
                    content: createContent(entry)
                });
            });
            res.writeHead(200, {
                "Content-Type": "application/rss+xml"
            });
            return res.end(rssfeed.rss2());
        })
        .catch(function(payload) {
	        return replyWithError(res, payload);
        });
}

function feedAtom(req, res, next) {
    var atomfeed = getInitialFeed();

    PackagesService.listPackages(0, maxFeedItems, sortItemFeed, sortDirectionFeed, 30)
        .then(function(items) {
            items.forEach(function(entry) {
                var myid = entry._id;
                atomfeed.addItem({
                    title: entry.name,
                    link: API_BASE_URL + "package/" + myid,
                    description: entry.name,
                    date: entry.tsupdated || new Date(),
                    content: createContent(entry)
                });
            });
            res.writeHead(200, {
                "Content-Type": "application/rss+xml"
            });
            return res.end(atomfeed.atom1());
        })
        .catch(function(payload) {
	        return replyWithError(res, payload);
        });
}

function feedJson(req, res, next) {
    var jsonfeed = getInitialFeed();

    PackagesService.listPackages(0, maxFeedItems, sortItemFeed, sortDirectionFeed, 30)
        .then(function(items) {
            items.forEach(function(entry) {
                var myid = entry._id;
                jsonfeed.addItem({
                    title: entry.name,
                    id: entry._id,
                    link: API_BASE_URL + "package/" + myid,
                    description: entry.name,
                    date: entry.tsupdated || new Date(),
                    content: createContent(entry)
                });
            });
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            return res.end(jsonfeed.json1());
        })
        .catch(function(payload) {
	        return replyWithError(res, payload);
        });
}

module.exports.bintraFeed = function bintraFeed(req, res, next, type) {
    switch (type) {
        case 'rss':
            feedRss(req, res, next);
            break;
        case 'atom':
            feedAtom(req, res, next);
            break;
        case 'json':
            feedJson(req, res, next);
            break;
        default:
            logger.error("Wrong type " + type);
    }
};
