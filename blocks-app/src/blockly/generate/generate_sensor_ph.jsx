import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['rs485_PH_begin'] = function (block) {
	var id = block.getFieldValue("id");
	var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster PHrs485;#END\n
		#VARIABLE float PH;#END\n
		\n
		#SETUP Wire.begin();#END\n
		#SETUP Serial2.begin(9600);#END\n
		#SETUP PHrs485.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE uint8_t result_PH;#END\n
		#LOOP_EXT_CODE result_PH = PHrs485.readHoldingRegisters(0, 2);#END\n`;
	return code;
};

javascriptGenerator.forBlock['rs485_PH_read'] = function (block) {
	var code = '(PHrs485.getResponseBuffer(1)/10.00f)';
	return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['rs485_PH_read_temp'] = function (block) {
	var code = '(PHrs485.getResponseBuffer(0)/10.00f)';
	return [code, javascriptGenerator.ORDER_NONE];
};