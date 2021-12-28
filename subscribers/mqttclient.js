// subscribers

var emitter = require('events').EventEmitter;
var eventEmitter = require('../utils/eventer').em;
var os = require('os');
var mqtt=require('mqtt');
var client=null;

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

// initial init steps
logger.info("In mqttclient initial init");

if(typeof process.env.MQTT_HOSTNAME === 'undefined' || process.env.MQTT_HOSTNAME === null) {
  logger.warn("No MQTT defined");
} else {
  logger.info("MQTT do connect to " + process.env.MQTT_HOSTNAME);

  let mqttOptions = {
    clientId: "bintraService" + os.hostname()
  };

  if(process.env.MQTT_USERNAME != "") {
    mqttOptions.username = process.env.MQTT_USERNAME;
    mqttOptions.password = process.env.MQTT_PASSWORD;
    logger.info("MQTT using login " + mqttOptions.username);
  }

  let mqttUrl = process.env.MQTT_PROTO + "://" + process.env.MQTT_HOSTNAME;
  logger.info(mqttUrl);
  client = mqtt.connect(mqttUrl, mqttOptions);
  client.on("error", function(error) {
    logger.error("MQTT error " + error);
  });
}

eventEmitter.on('putdata', function getPutDataHit(packageName, packageVersion, packageArch, packageFamily, packageHash, isnew) {
  if(!client.connected) {
    logger.info("MQTT not connected, skipping publish");
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

  logger.info("MQTT publish to " + topic);
  client.publish(topic, msg, {qos:0});

});

module.exports = {}
