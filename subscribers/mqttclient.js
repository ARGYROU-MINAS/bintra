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
  if(typeof client === 'undefined' || client === null || !client.connected) {
    console.log("MQTT do connect");

    client = mqtt.connect("mqtts://" + process.env.MQTT_HOSTNAME,
    {
      clientId: "bintraService",
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD
    });
    client.on("error", function(error) {
      console.error("MQTT error " + error);
    });
  } else {
    console.log("Reuse MQTT client connection");
  }
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

  client.publish(topic, msg, {qos:0});

});

module.exports = {}
