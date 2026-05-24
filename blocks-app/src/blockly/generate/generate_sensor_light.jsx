import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['rs485_light_begin'] = function (block) {
	var id = block.getFieldValue("id");
	var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster rs485_pair;#END\n
		#VARIABLE float pair;#END\n
		\n
		#SETUP Wire.begin();#END\n
		#SETUP Serial2.begin(9600);#END\n
		#SETUP rs485_pair.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE uint8_t result_pair;#END\n
		#LOOP_EXT_CODE result_pair = rs485_pair.readHoldingRegisters(0, 2);#END\n`;
	return code;
};

javascriptGenerator.forBlock['rs485_Light_read'] = function (block) {
	var code = '(rs485_pair.getResponseBuffer(0))';
	return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['bh1750_begin'] = function (block) {
	var code = '';
	code += '#EXTINC#include <BH1750.h>#END\n';
	code += '#EXTINC#include <Wire.h>#END\n';
	code += '#VARIABLE BH1750 lightMeter;#END\n';
	code += '\n';
	code += '#SETUP Wire.begin();#END\n';
	code += '#SETUP lightMeter.begin();#END\n';
	return code;
};

javascriptGenerator.forBlock['bh1750_read'] = function (block) {
	var code = 'lightMeter.readLightLevel()';
	return [code, javascriptGenerator.ORDER_NONE];
};