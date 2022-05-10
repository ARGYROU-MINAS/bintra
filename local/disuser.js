const c = require('./common.js');

const username = c.cmdArgs[0];
console.log('Disable user name=' + username);

c.doconnect().then(function (db) {
  c.setUserStatus(username, 'disabled')
    .then(function (payload) {
      console.log('Did update');
      process.exit(0);
    })
    .catch(function (payload) {
      console.error('Had error');
      process.exit(1);
    })
})
  .catch(function (err) {
    console.error('connect error ' + err);
    process.exit(1);
  });
