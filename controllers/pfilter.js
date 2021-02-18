'use strict';

function cleanupString(s) {
	var sNew = s.replace(/[^a-zA-Z0-9\-\._ ]/gi, '');
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
    if(req.url == "/" || req.url.startsWith("/docs/") || req.url.startsWith("/api-docs")) {
	    console.debug("static stuff OK");
	    next();
    } else {
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
                case "id":
                    structure.value = cleanupStringHex(structure.value);
                    if(structure.value.length != 24) {
                        console.error("ID must be 24 hex chars");
                        res.writeHead(400, { "Content-Type": "application/json" });
                        var response = { message: "Error: ID must be 24 hex chars" };
                        return res.end(JSON.stringify(response));
                    }
                    break;
              }
	    }
        next();
    }
};
