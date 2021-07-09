// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;

var mqtt=require('mqtt');
var client=null;

// initial init steps
console.log("In mqttclient initial init");

if(typeof process.env.MQTT_HOSTNAME === 'undefined' || process.env.MQTT_HOSTNAME === null) {
  console.warn("No MQTT defined");
} else {
  console.log("MQTT do connect");

  let mqttOptions = {
    clientId: "bintraService"
  };

  if(process.env.MQTT_USERNAME != "") {
    mqttOptions.username = process.env.MQTT_USERNAME;
    mqttOptions.password = process.env.MQTT_PASSWORD;
    console.log("MQTT using login " + mqttOptions.username);
  }

  let mqttUrl = process.env.MQTT_PROTO + "://" + process.env.MQTT_HOSTNAME;
  console.log(mqttUrl);
  client = mqtt.connect(mqttUrl, mqttOptions);
  client.on("error", function(error) {
    console.error("MQTT error " + error);
  });
}

eventEmitter.on('putdata', function getPutDataHit(packageName, packageVersion, packageArch, packageFamily, packageHash, isnew) {
  if(!client.connected) {
    console.log("MQTT not connected, skipping publish");
    return;
  }

  var topic;
  var msg;
  if(isnew) {
    topic = "bintra/added/" + packageFamily;
    msg = 'Add new hash ' + packageHash + ' for ' + packageName + ' (' + packageVersion + ') for ' + packageArch + ' #' + packageFamily;
  } else {
    topic = "bintra/verified/" + packageFamily;
    msg = 'Verify hash ' + packageHash + ' for ' + packageName + ' (' + packageVersion + ') for ' + packageArch + ' #' + packageFamily;
  }

  console.log("MQTT publish to " + topic);
  client.publish(topic, msg, {qos:0});

});

module.exports = {}
