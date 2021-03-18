'use strict';

function cleanupString(s) {
	var sNew = s.replace(/[^a-zA-Z0-9\-\._ ~:+]/gi, '');
	if(sNew != s) {
		console.warn("Filtered invalid chars");
	}
	return sNew;
}

function cleanupNumber(s) {
        var sNew = s.replace(/[^0-9]/gi, '');
        if(sNew != s) {
                console.warn("Filtered invalid number chars");
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
    console.log("In pfilter: " + req.url);
    //console.log(req);
    if(req.url == "/" || req.url.startsWith("/docs/") || req.url.startsWith("/api-docs")) {
	    console.debug("static stuff OK");
	    next();
    } else {
	    for(var [key, value] of Object.entries(req.query)) {
		    console.debug(key + ":" + value);
              switch(key) {
                case "count":
                    req.query[key] = cleanupNumber(value);
                    break;
                case "packageName":
                case "packageArch":
                case "packageVersion":
                case "packageFamily":
                    req.query[key] = cleanupString(value);
                    break;
                case "packageHash":
                    req.query[key] = cleanupStringHex(value);
                    break;
                case "id":
                    req.query[key] = cleanupStringHex(value);
                    if(value.length != 24) {
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
