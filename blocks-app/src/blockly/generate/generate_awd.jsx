import { javascriptGenerator } from 'blockly/javascript';

// const fs = require('fs');
// const path = require('path');
// const rootDir = path.join(__dirname, '..', '..', '..');

let email_string;

try {
    const emailPath = path.join(rootDir, 'email.txt');
    email_string = "asd@asd";
    // email_string = fs.readFileSync(emailPath, 'utf8').trim();
} catch (err) {
    email_string = 'bfarm.oldversion@awd';
}

javascriptGenerator.forBlock["HandySense_awdv1"] = function (block) {
    var name_sensor1 = block.getFieldValue("name_sensor1");
    var name_sensor2 = block.getFieldValue("name_sensor2");
    var name_sensor3 = block.getFieldValue("name_sensor3");
    var value_sensor1 = javascriptGenerator.valueToCode(
        block,
        "value_sensor1",
        javascriptGenerator.ORDER_NONE
    );
    var value_sensor2 = javascriptGenerator.valueToCode(
        block,
        "value_sensor2",
        javascriptGenerator.ORDER_NONE
    );
    var value_sensor3 = javascriptGenerator.valueToCode(
        block,
        "value_sensor3",
        javascriptGenerator.ORDER_NONE
    );
    var t_api = block.getFieldValue("t_api");
    var n_token = block.getFieldValue("n_token");
    var n_secret = block.getFieldValue("n_secret");
    var n_id = block.getFieldValue("n_id");
    var delay = block.getFieldValue("delay");
    var code = `  
			#EXTINC 
				#include <ThingSpeakWriter_asukiaaa.h>
				#include <mqtt_client.h>
				#include <pub_topic.h>
			#END

			#VARIABLE
				#define WRITE_API_KEY "${t_api}"
				ThingSpeakWriter_asukiaaa channelWriter(WRITE_API_KEY);
			#END

			#FUNCTION
				void connectWifiIfNotConnected(unsigned long timeoutMs = 10000) {
					if (WiFi.status() == WL_CONNECTED) {
						return;
					}
					uint8_t startAt = millis();
					Serial.println("Connecting to WiFi.." + String(WiFi.status()));
					while (WiFi.status() != WL_CONNECTED) {
						Serial.print(".");
						if (millis() - startAt > timeoutMs) {
						Serial.println("Cannot connect to WiFi");
						break;
						}
						delay(1000);
					}
				}
				const char* Netpiemqtt_server = "broker.netpie.io";
				const int Netpiemqtt_port = 1883;
				const char* Netpiemqtt_username = "${n_token}";
				const char* Netpiemqtt_password = "${n_secret}";
				const char* Netpiemqtt_Client = "${n_id}";
				void Netpiecallback(String topic, byte* payload, unsigned int length) {
				Serial.print("Message arrived [");
				Serial.print("Message arrived [");
				Serial.print(topic);
				Serial.print("] ");
				String message;
				for (int i = 0; i < length; i++) {
					message = message + (char)payload[i];
				}

				if ((topic) == String("@private/sw0")) {
					if (((message).toInt()) == 1) {
						digitalWrite(32, 0);
						} else if (((message).toInt()) == 0) {
						digitalWrite(32, 1);
						}
					}
				}
			#END

			#SETUP
				Serial.begin(115200);
				Wire.begin();
				Wire.setClock(10000);
				setupMQTT();
				Netpieclient.setServer(Netpiemqtt_server, Netpiemqtt_port);

				Netpieclient.setCallback(Netpiecallback);
				pinMode(36, INPUT_PULLUP);
				pinMode(32, OUTPUT);
			#END

			#LOOP_EXT_CODE
				connectWifiIfNotConnected();
				channelWriter.setField(1, String(${value_sensor1}));
				int sensor1 = channelWriter.writeFields();
				if (sensor1 < 0) {
					Serial.println("Failed to send data");
				} else if (sensor1 != 200) {
					Serial.println("Sent data but failed at status code: " + String(sensor1));
				} else {
					Serial.println("Succeeded in sending data1.");
				}
				publishMessage((String("#T,1:") + String(${value_sensor1}) +
								String(",$") + String(chip_id) + String("|") +
								String("${email_string}"))
									.c_str());
				delay(1000);
				connectWifiIfNotConnected();
				channelWriter.setField(2, String(${value_sensor2}));
				int sensor2 = channelWriter.writeFields();
				if (sensor2 < 0) {
					Serial.println("Failed to send data");
				} else if (sensor2 != 200) {
					Serial.println("Sent data but failed at status code: " + String(sensor2));
				} else {
					Serial.println("Succeeded in sending data2.");
				}
				publishMessage((String("#T,2:") + String(${value_sensor2}) + String(",$") +
								String(chip_id) + String("|") + String("${email_string}"))
									.c_str());
				delay(1000);
				connectWifiIfNotConnected();
				channelWriter.setField(3,
										String(${value_sensor3}));
				int sensor3 = channelWriter.writeFields();
				if (sensor3 < 0) {
					Serial.println("Failed to send data");
				} else if (sensor3 != 200) {
					Serial.println("Sent data but failed at status code: " + String(sensor3));
				} else {
					Serial.println("Succeeded in sending data3.");
				}
				publishMessage(
					(String("#T,3:") + String(${value_sensor1}) +
					String(",$") + String(chip_id) + String("|") + String("${email_string}"))
						.c_str());
				delay(1000);
				if (!Netpieclient.connected()) {
					while (!Netpieclient.connected()) {
					Serial.print("Attempting NETPIE2020 connection...");
					if (Netpieclient.connect(Netpiemqtt_Client, Netpiemqtt_username,
											Netpiemqtt_password)) {
						Serial.println("NETPIE2020 connected");
						Netpieclient.subscribe("@private/#");
					} else {
						Serial.print("failed, rc=");
						Serial.print(client.state());
						Serial.println("try again in 5 seconds");
						delay(5000);
					}
					}
				}
				Netpieclient.loop();
				pub_topic(String("${name_sensor1}"), ${value_sensor1});
				publishMessage((String("#N,${name_sensor1}:") + String(${value_sensor1}) +
								String(",$") + String(chip_id) + String("|") +
								String("${email_string}"))
									.c_str());
				pub_topic(String("${name_sensor2}"), ${value_sensor2});
				publishMessage((String("#N,${name_sensor2}:") + String(${value_sensor2}) +
								String(",$") + String(chip_id) + String("|") +
								String("${email_string}"))
									.c_str());
				pub_topic(String("${name_sensor3}"), ${value_sensor3});
				publishMessage((String("#N,${name_sensor3}:") +
								String(${value_sensor3}) +
								String(",$") + String(chip_id) + String("|") +
								String("${email_string}"))
									.c_str());
				delay(${delay});

			#END
			`;
    return code;
};