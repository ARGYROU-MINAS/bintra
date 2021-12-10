// subscribers

var Masto = require('mastodon');


function dotoot(t) {
  var M = new Masto({
    access_token: process.env.TOOTAUTH,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: process.env.TOOTAPI
  });

  M.post('statuses', { status: t } ).then(resp => {
    console.log('Did post status');
  });
};

module.exports = dotoot;

