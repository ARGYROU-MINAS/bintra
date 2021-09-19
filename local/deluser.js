const c = require('./common.js');

var username = c.cmdArgs[0];
console.log("Disable user name=" + username);

c.setUserStatus(username, "deleted");
