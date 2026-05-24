import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock["WIFI_begin"] = function (block) {
    var text_ssid = block.getFieldValue("ssid");
    var text_password = block.getFieldValue("password");
    var code = `WiFi.begin("${text_ssid}","${text_password}");
            while(WiFi.status() != WL_CONNECTED){ 
            delay(500); 
        }\n`;
    return code;
};
javascriptGenerator.forBlock["Thingspeak_begin"] = function (block) {
    var text_WRITE_API_KEY = block.getFieldValue("WRITE_API_KEY");
    var text_WIFI_SSID = block.getFieldValue("WIFI_SSID");
    var text_WIFI_PASS = block.getFieldValue("WIFI_PASS");

    var code = `
    #EXTINC #include <ThingSpeakWriter_asukiaaa.h> #END
    #EXTINC #include <mqtt_client.h> #END\n
    #SETUP Serial.begin(115200);#END
    #FUNCTION
    #define WRITE_API_KEY "${text_WRITE_API_KEY}"
    #define WIFI_SSID "${text_WIFI_SSID}"
    #define WIFI_PASS "${text_WIFI_PASS}"
    ThingSpeakWriter_asukiaaa channelWriter(WRITE_API_KEY)\n;   
    
    
     void connectWifiIfNotConnected(unsigned long timeoutMs = 10000) {
        if (WiFi.status() == WL_CONNECTED) {
          return;
        }
        WiFi.begin(WIFI_SSID, WIFI_PASS);
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
      }  #END   
      setupMQTT();
    `;
    return code;

};

javascriptGenerator.forBlock["Thingspeak_connectWifi"] = function () {
    var code = `
       connectWifiIfNotConnected();
      `;
    return code;

};

javascriptGenerator.forBlock["Thingspeak_Finish"] = function () {
    var code = `
      int result = channelWriter.writeFields();
    if (result  < 0) {
      Serial.println("Failed to send data");
    } else if (result  != 200) {
      Serial.println("Sent data but failed at status code: " + String(result));
    } else {
      Serial.println("Succeeded in sending data.");
    } 
      
      `;
    return code;

};


// const fs = require('fs');
// const path = require('path');
// const rootDir = path.join(__dirname, '..', '..', '..');

let email_string;

try {
    email_string = "asd@asd";
    // email_string = fs.readFileSync(emailPath, 'utf8').trim();
} catch (err) {
    email_string = 'bfarm.oldversion@awd';
}

javascriptGenerator.forBlock['Thingspeak_set_field_value'] = function (block) {
    var varName = block.getFieldValue('VAR_NAME');
    var value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT);
    var code = '';

    code += '#EXTINC';
    code += ['1', '2'].includes(varName) ? ' unsigned int ' : ' float ';
    code += varName + '; #END\n';
    code += value ? varName + ' = ' + value + ';' : varName + ' = 0;';
    // eslint-disable-next-line no-redeclare
    var code = `
      connectWifiIfNotConnected();
      channelWriter.setField(${varName}, String(${value}));
      int sensor${varName} = channelWriter.writeFields();
      if (sensor${varName}  < 0) {
        Serial.println("Failed to send data");
      } else if (sensor${varName}  != 200) {
        Serial.println("Sent data but failed at status code: " + String(sensor${varName} ));
      } else {
        Serial.println("Succeeded in sending data${varName}.");
      } 
      publishMessage((String("#T,${varName}:") + String(${value}) + String(",$") + String(chip_id) + String("|") + String("${email_string}")).c_str());
      delay(1000);
    `;

    return code;
};