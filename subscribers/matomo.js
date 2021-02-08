// subscribers

var events = require('events');
var eventEmitter = new events.eventEmitter();

eventEmitter.on('apihit', async([ data }) => {
	// ping matomo
});


