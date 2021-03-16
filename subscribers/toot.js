// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;

var Masto = require('mastodon');
var M = new Masto({
  access_token: process.env.TOOTAUTH,
  timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
  api_url: process.env.TOOTAPI
})

var baseUrl = 'https://api.bintra.directory';

eventEmitter.on('putdata', function getPutDataHit(packageName, packageVersion, packageArch, packageFamily, packageHash, isnew) {
  console.debug("In toot subscriber");

  var t;
  if(isnew) {
    t = 'Add new hash ' + packageHash + ' for ' + packageName + ' (' + packageVersion + ') for ' + packageArch;
  } else {
    t = 'Validate ' + packageName + ' (' + packageVersion + ') for ' + packageArch;
  }

  t = t + ' #binarytransparency';

  M.post('statuses', { status: t } ).then(resp => {
    console.log('Did post status');
  });

});

module.exports = {}
