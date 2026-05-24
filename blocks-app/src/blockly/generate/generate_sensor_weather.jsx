import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['Weather_HTCo2PLx_begin_rs485'] = function (block) {
    var id = block.getFieldValue("id");
    var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster rs485_Weather_HTCo2PLx;#END\n
		#VARIABLE float Weather_HTCo2PLx;#END\n
		#VARIABLE #define RXD 16#END\n
		#VARIABLE #define TXD 17#END\n

		\n
		#SETUP Serial2.begin(9600, SERIAL_8N1, RXD, TXD);#END\n
		#SETUP rs485_Weather_HTCo2PLx.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE uint8_t result_rs485_Weather_HTCo2PLx; #END\n
		#LOOP_EXT_CODE result_rs485_Weather_HTCo2PLx =rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10);#END\n`
    return code;
};


javascriptGenerator.forBlock["Weather_HTCo2PLx_read_humidity_rs485"] = function () {
    var code = `((rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.00f))`;
    return [code, javascriptGenerator.ORDER_NONE];

};

javascriptGenerator.forBlock["Weather_HTCo2PLx_read_temperature_rs485"] = function () {
    var code = `((rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.00f)) `;
    return [code, javascriptGenerator.ORDER_NONE];

};

javascriptGenerator.forBlock["Weather_HTCo2PLx_read_co2_rs485"] = function () {
    var code = `((rs485_Weather_HTCo2PLx.getResponseBuffer(3) / 1.00f)) `;
    return [code, javascriptGenerator.ORDER_NONE];

};

javascriptGenerator.forBlock["Weather_HTCo2PLx_read_pressure_rs485"] = function () {
    var code = `((rs485_Weather_HTCo2PLx.getResponseBuffer(5) / 1.00f)) `;
    return [code, javascriptGenerator.ORDER_NONE];

};

javascriptGenerator.forBlock["Weather_HTCo2PLx_read_lux_rs485"] = function () {
    var code = `((rs485_Weather_HTCo2PLx.getResponseBuffer(7)))`;
    return [code, javascriptGenerator.ORDER_NONE];

};

javascriptGenerator.forBlock['Par_begin_rs485'] = function (block) {
    var id = block.getFieldValue("id");
    var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster rs485_LightPar;#END\n
		#VARIABLE #define RXD 16#END\n
		#VARIABLE #define TXD 17#END\n
		#VARIABLE float LightPar;#END\n
		\n
		#SETUP Serial2.begin(9600);#END\n
		#SETUP rs485_LightPar.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE     uint8_t result_LightPar;#END\n
		#LOOP_EXT_CODE     result_LightPar = rs485_LightPar.readHoldingRegisters(0, 2);#END\n`
    return code;
};

javascriptGenerator.forBlock['Par_read_rs485'] = function (block) {
    var code = '((((rs485_LightPar.getResponseBuffer(0)))))';
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['Rain_begin_rs485'] = function (block) {
    var id = block.getFieldValue("id");
    var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster rs485_rain;#END\n
		#VARIABLE #define RXD 16#END\n
		#VARIABLE #define TXD 17#END\n
		#VARIABLE float rain;#END\n
		\n
		#SETUP Serial2.begin(9600);#END\n
		#SETUP rs485_rain.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE     uint8_t result_rain;#END\n
		#LOOP_EXT_CODE     result_rain = rs485_rain.readHoldingRegisters(0, 2);#END\n`
    return code;
};

javascriptGenerator.forBlock['Rain_read_rs485'] = function (block) {
    var code = '((((rs485_rain.getResponseBuffer(0)) / 10.0f)))';
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['Wind_begin_rs485'] = function (block) {
    var id = block.getFieldValue("id");
    var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster rs485_windd;#END\n
		#VARIABLE #define RXD 16#END\n
		#VARIABLE #define TXD 17#END\n
		#VARIABLE float windd;#END\n
		\n
		#SETUP Serial2.begin(9600);#END\n
		#SETUP rs485_windd.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE     uint8_t result_windd;#END\n
		#LOOP_EXT_CODE     result_windd = rs485_windd.readHoldingRegisters(0, 2);#END\n`
    return code;
};

javascriptGenerator.forBlock['Wind_read_rs485'] = function (block) {
    var code = '((((rs485_windd.getResponseBuffer(0)) / 10.0f)))';
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['Wind_speed_begin_rs485'] = function (block) {
    var id = block.getFieldValue("id");
    var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster rs485_winds;#END\n
		#VARIABLE #define RXD 16#END\n
		#VARIABLE #define TXD 17#END\n
		#VARIABLE float winds;#END\n
		\n
		#SETUP Serial2.begin(9600);#END\n
		#SETUP rs485_winds.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE     uint8_t result_winds;#END\n
		#LOOP_EXT_CODE     result_winds = rs485_winds.readHoldingRegisters(0, 2);#END\n`
    return code;
};

javascriptGenerator.forBlock['Wind_speed_read_rs485'] = function (block) {
    var code = '((((rs485_winds.getResponseBuffer(0)) / 10.0f)))';
    return [code, javascriptGenerator.ORDER_NONE];
};