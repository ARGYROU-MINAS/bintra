// controllers/rss.js

var Service = require('../service/PackagesService');

const Feed = require("feed").Feed;

function getInitialFeed() {
  const myfeed = new Feed({
    title: "Binary Transparency Directory",
    description: "Feed for hash code monitoring",
    id: "http://bintra.directory/",
    link: "http://bintra.directory/",
    language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
    image: "http://bintra.directory/image.png",
    favicon: "http://bintra.directory/favicon.ico",
    copyright: "All rights reserved 2021, Kai KRETSCHMANN",
    updated: new Date(),
    generator: "Feed for bintra", // optional, default = 'Feed for Node.js'
    feedLinks: {
      json: "http://bintra.directory/feed.json",
      rss: "http://bintra.directory/feed.rss",
      atom: "http://bintra.directory/feed.atom"
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

module.exports.rss = function (req, res, next) {
	var rssfeed = getInitialFeed();

    Service.listPackages()
        .then(function (items) {
            items.forEach(function(entry) {
                var myid = entry._id;
                var x = rssfeed.addItem({
title: entry.name,
id: entry._id,
link: "http://api.bintra.directory/v1/package/" + myid,
description: entry.name,
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
};

module.exports.atom = function (req, res, next) {
	var atomfeed = getInitialFeed();

    Service.listPackages()
        .then(function (items) {
            console.log("before loop");
            items.forEach(function(entry) {
                var myid = entry._id;
                var x = atomfeed.addItem({
title: entry.name,
id: entry._id,
link: "http://api.bintra.directory/v1/package/" + myid,
description: entry.name,
content: "Archive " + entry.name + ", version " + entry.version + " for " + entry.arch + " with hash " + entry.hash
});
            });
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end(atomfeed.atom1());
        })
        .catch(function (payload) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("error" + payload);
        });
};
