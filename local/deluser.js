const c = require('./common.js');

const username = c.cmdArgs[0];
console.log('Disable user name=' + username);

c.setUserStatus(username, 'deleted');
