// controllers/rss.js

var PackagesService = require('../service/PackagesService');

const Feed = require("feed").Feed;
const maxFeedItems = 25;
const sortItemFeed = 'tsupdated';
const sortDirectionFeed = 'down';

function getInitialFeed() {
  const myfeed = new Feed({
    title: "Binary Transparency Directory",
    description: "Feed for hash code monitoring",
    id: "https://bintra.directory/",
    link: "https://bintra.directory/",
    language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
    image: "https://bintra.directory/image.png",
    favicon: "https://bintra.directory/favicon.ico",
    copyright: "All rights reserved 2021, Kai KRETSCHMANN",
    updated: new Date(),
    generator: "Feed for bintra", // optional, default = 'Feed for Node.js'
    feedLinks: {
      json: "https://api.bintra.directory/v1/feed.json",
      rss: "https://api.bintra.directory/v1/feed.rss",
      atom: "https://api.bintra.directory/v1/feed.atom"
    },
    author: {
      name: "Kai KRETSCHMANN",
      email: "kai@kretschmann.consulting",
      link: "https://kai.kretschmann.consulting"
    }
  });

  myfeed.addCategory("Technology");
  myfeed.addContributor({
    name: "Kai KRETSCHMANN",
    email: "kai@kretschmann.consulting",
    link: "https://kai.kretschmann.consulting"
  });

  return myfeed;
}

function feedRss (req, res, next) {
	var rssfeed = getInitialFeed();

    PackagesService.listPackages(0, maxFeedItems, sortItemFeed, sortDirectionFeed)
        .then(function (items) {
            items.forEach(function(entry) {
                var myid = entry._id;
                rssfeed.addItem({
title: entry.name,
id: "https://api.bintra.directory/v1/package/" + myid,
link: "https://bintra.directory/details/?id=" + myid,
description: entry.name,
date: entry.tsupdated || new Date(),
content: "Archive " + entry.name + ", version " + entry.version + " for " + entry.arch + " with hash " + entry.hash
});
            });
            res.writeHead(200, { "Content-Type": "application/rss+xml" });
            return res.end(rssfeed.rss2());
        })
        .catch(function (payload) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("error" + payload);
        });
}

function feedAtom(req, res, next) {
	var atomfeed = getInitialFeed();

    PackagesService.listPackages(0, maxFeedItems, sortItemFeed, sortDirectionFeed)
        .then(function (items) {
            items.forEach(function(entry) {
                var myid = entry._id;
                atomfeed.addItem({
title: entry.name,
link: "https://api.bintra.directory/v1/package/" + myid,
description: entry.name,
content: "Archive " + entry.name + ", version " + entry.version + " for " + entry.arch + " with hash " + entry.hash,
date: entry.tsupdated || new Date()
});
            });
            res.writeHead(200, { "Content-Type": "application/rss+xml" });
            return res.end(atomfeed.atom1());
        })
        .catch(function (payload) {
            console.error(payload);
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("error" + payload);
        });
}

function feedJson(req, res, next) {
        var jsonfeed = getInitialFeed();

    PackagesService.listPackages(0, maxFeedItems, sortItemFeed, sortDirectionFeed)
        .then(function (items) {
            items.forEach(function(entry) {
                var myid = entry._id;
                jsonfeed.addItem({
title: entry.name,
id: entry._id,
link: "https://api.bintra.directory/v1/package/" + myid,
description: entry.name,
date: entry.tsupdated || new Date(),
content: "Archive " + entry.name + ", version " + entry.version + " for " + entry.arch + " with hash " + entry.hash
});
            });
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(jsonfeed.json1());
        })
        .catch(function (payload) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("error" + payload);
        });
}

module.exports.bintraFeed = function bintraFeed (req, res, next, type) {
    switch(type) {
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
            console.error("Wrong type " + type);
    }
}

