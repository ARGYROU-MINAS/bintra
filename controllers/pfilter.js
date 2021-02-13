'use strict';

function cleanupString(s) {
	var sNew = s.replace(/[^a-zA-Z0-9\-\._]/gi, '');
	if(sNew != s) {
		console.warn("Filtered invalid chars");
	}
	return sNew;
}

function cleanupStringHex(s) {
	var sNew = s.replace(/[^a-fA-F0-9]/gi, '');
	if(sNew != s) {
		console.warn("Filtered invalid chars");
	}
	return sNew;
}

module.exports = function (req, res, next) {
	console.debug("In pfilter: " + req.url);
    if(req.url.startsWith("/docs/") || req.url.startsWith("/api-docs")) {
	    console.debug("static stuff OK");
	    next();
    } else {
/*
packageName: {
    path: [ 'paths', '/package', 'get', 'parameters', '0' ],
    schema: {
      in: 'query',
      name: 'packageName',
      description: 'package name from extracted meta info',
      required: true,
      type: 'string'
    },
    originalValue: 'a',
    value: 'a'
  }
*/
	    for(var [key, structure] of Object.entries(req.swagger.params)) {
		    console.debug(key + ":" + structure.value);
            switch(key) {
                case "packageName":
                case "packageArch":
                case "packageVersion":
                    structure.value = cleanupString(structure.value);
                    break;
                case "packageHash":
                    structure.value = cleanupStringHex(structure.value);
                    break;
            }
	    }
        next();
    }
};