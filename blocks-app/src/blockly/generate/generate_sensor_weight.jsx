import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock["rs485_3kg_begin"] = function (block) {
	var id = block.getFieldValue("id");
	var code = `#EXTINC#include <ModbusMaster.h>#END\n
		#VARIABLE ModbusMaster rs485_weight;#END\n
		\n
		#SETUP Wire.begin();#END\n
		#SETUP Serial2.begin(9600);#END\n
		#SETUP rs485_weight.begin(${id}, Serial2);#END\n
		#LOOP_EXT_CODE uint8_t result_rs485_weight;#END\n
		#LOOP_EXT_CODE rs485_weight.readHoldingRegisters(0, 2);#END\n`;
	return code;
};

javascriptGenerator.forBlock["rs485_3kg_read"] = function (block) {
	var offset = block.getFieldValue("offset");
	var code = `rs485_weight.getResponseBuffer(1) + Number(${offset})`;
	return [code, javascriptGenerator.ORDER_NONE];
};