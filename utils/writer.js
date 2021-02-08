var ResponsePayload = function(code, payload) {
  this.code = code;
  this.payload = payload;
}

function setHeaders(response) {
  response.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '-1');
}

exports.respondWithCode = function(code, payload) {
  return new ResponsePayload(code, payload);
}

var writeText = exports.writeText = function(response, payload, code) {
  setHeaders(response);
  response.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8'});
  response.end(payload);
}

var writeJson = exports.writeJson = function(response, arg1, arg2) {
  var code;
  var payload;

  if(arg1 && arg1 instanceof ResponsePayload) {
    writeJson(response, arg1.payload, arg1.code);
    return;
  }

  if(arg2 && Number.isInteger(arg2)) {
    code = arg2;
  }
  else {
    if(arg1 && Number.isInteger(arg1)) {
      code = arg1;
    }
  }

  if(arg1) {
    payload = arg1;
  }

  if(!code) {
    // if no response code given, we default to 200
    code = 200;
  }
  if(typeof payload === 'object') {
    payload = JSON.stringify(payload, null, 2);
  }

  setHeaders(response);

  if(code >= 400) {
    response.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8'});
  } else {
    response.writeHead(code, {'Content-Type': 'application/json'});
  }
  response.end(payload);
}
