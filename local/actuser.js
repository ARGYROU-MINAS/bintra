const c = require('./common.js');

var username = c.cmdArgs[0];
console.log("Enable user name=" + username);

let b = c.setUserStatus(username, "active");
if(!b) {
	console.error("error found")
}
