import { javascriptGenerator } from 'blockly/javascript';

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

javascriptGenerator.forBlock["wifi_connect"] = function (block) {
    var text_ssid = block.getFieldValue("ssid");
    var text_password = block.getFieldValue("password");
    var code = `#EXTINC #include <getchip.h>#END\n
    #FUNCTION uint32_t chip_id = 0; #END\n

    WiFi.begin("${text_ssid}","${text_password}");
    while(WiFi.status() != WL_CONNECTED){ 
      delay(500); 
    }\n
    setup_chipid("${email_string}");
    for (int i = 0; i < 17; i = i + 8) {
      chip_id |= ((ESP.getEfuseMac() >> (40 - i)) & 0xff) << i;
    }
    #LOOP_EXT_CODE loop_chipid("${email_string}");#END\n`;
    return code;
};

javascriptGenerator.forBlock["wifi_connect_v2"] = function (block) {
    var text_ssid = block.getFieldValue("ssid");
    var text_password = block.getFieldValue("password");
    var argtype = block.getFieldValue("argtype");
    var argdetail = block.getFieldValue("argdetail");
    // var code += '#EXTINC#include "SHT31.h"#END\n';
    var code = `#EXTINC #include <getchip.h>#END\n
          #FUNCTION String argtype = "${argtype}";#END\n
          #FUNCTION String argdetail = "${argdetail}";#END\n
          WiFi.begin("${text_ssid}","${text_password}");
          while(WiFi.status() != WL_CONNECTED){
          delay(500);
          Serial.println((WiFi.localIP().toString()));}
          setup_chipid("${email_string}");
          #LOOP_EXT_CODE loop_chipid("${email_string}");#END\n`;
    return code;
};

javascriptGenerator.forBlock["wifi_ap"] = function (block) {
    var text_ssid = block.getFieldValue("ssid");
    var text_password = block.getFieldValue("password");
    var code = `#SETUP  WiFi.softAP("${text_ssid}", "${text_password}");\n#END`;
    return code;
};

javascriptGenerator.forBlock["wifi_http_get"] = function (block) {
    var value_url = javascriptGenerator.valueToCode(
        block,
        "url",
        javascriptGenerator.ORDER_ATOMIC
    );
    var code = `...`;
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["wifi_http_post"] = function (block) {
    var value_url = javascriptGenerator.valueToCode(
        block,
        "url",
        javascriptGenerator.ORDER_ATOMIC
    );
    var value_data = javascriptGenerator.valueToCode(
        block,
        "data",
        javascriptGenerator.ORDER_ATOMIC
    );
    var dropdown_content_type = block.getFieldValue("content_type");
    var code = `...`;
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["wifi_start_server"] = function (block) {
    var text_port = block.getFieldValue("port");
    var code = `#VARIABLE  WebServer server(80);#END
  server.begin();
  #LOOP_EXT_CODE server.handleClient();\n #END`;
    return code;
};

javascriptGenerator.forBlock["wifi_server_on"] = function (block) {
    var text_event_name = block.getFieldValue("event_name");
    var statements_event_do = javascriptGenerator.statementToCode(
        block,
        "event_do"
    );
    var code = `server.on("${text_event_name}",[](){
    ${statements_event_do}
  });\n`;
    return code;
};

javascriptGenerator.forBlock["wifi_server_send"] = function (block) {
    var dropdown_status = block.getFieldValue("status");
    var dropdown_content_type = block.getFieldValue("content_type");
    var value_text = javascriptGenerator.valueToCode(
        block,
        "text",
        javascriptGenerator.ORDER_ATOMIC
    );
    var code = `server.send(${dropdown_status}, "${dropdown_content_type}", ${value_text});\n`;
    return code;
};

javascriptGenerator.forBlock["wifi_get_ip_addr"] = function (block) {
    var code = `WiFi.localIP().toString()`;
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["wifi_get_ap_ip_addr"] = function (block) {
    var code = `WiFi.softAPIP().toString()`;
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock["wifi_get_arg"] = function (block) {
    var text_arg_name = block.getFieldValue("arg_name");
    if (text_arg_name) {
        var code = `#FUNCTIONString getArgParams(String name){
  for (uint8_t i = 0; i < server.args(); i++) {
    if(String(server.argName(i)) == name){
      return String(server.arg(i));
    }
  }
  return String("");
}
#ENDgetArgParams(String("${text_arg_name}"))`;
    } else {
        var code = 'String("")';
    }
    return [code, javascriptGenerator.ORDER_NONE];
};