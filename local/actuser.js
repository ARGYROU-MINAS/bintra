const c = require('./common.js');

var username = c.cmdArgs[0];
console.log("Enable user name=" + username);

c.setUserStatus(username, "active");
