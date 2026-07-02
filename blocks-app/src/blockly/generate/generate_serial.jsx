import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['Read4_20_mA_MCP3424'] = function (block) {
	var ch = block.getFieldValue('ch');
	var code = `Read4_20mA_MPC3424(${ch})`;
	return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['serial_usb_init'] = function(block) {
  var dropdown_baudrate = block.getFieldValue('baudrate');
  var code = `Serial.begin(${dropdown_baudrate});\n`;
  return code;
};

javascriptGenerator.forBlock['serial_hardware_init'] = function(block) {
  var dropdown_baudrate = block.getFieldValue('baudrate');
  var number_rx = block.getFieldValue('rx');
  var number_tx = block.getFieldValue('tx');
  var dropdown_type = block.getFieldValue('type');
  var code = `${dropdown_type}.begin(${dropdown_baudrate});\n`;
  return code;
};

javascriptGenerator.forBlock['serial_available'] = function(block) {
  var dropdown_type = block.getFieldValue('type');
  var code = `${dropdown_type}.available()`;
  return [code, javascriptGenerator.ORDER_NONE];
};


javascriptGenerator.forBlock['serial_write_newline'] = function(block) {
  var dropdown_type = block.getFieldValue('type');
  var code = `${dropdown_type}.println();\n`;
  return code;
};

javascriptGenerator.forBlock['serial_write_data'] = function(block) {
  var value_text = javascriptGenerator.valueToCode(block, 'text', javascriptGenerator.ORDER_ATOMIC);
  var dropdown_type = block.getFieldValue('type');
  var checkbox_newline = (block.getFieldValue('newline') == 'TRUE')? 'ln' : '';
  var code = `${dropdown_type}.print${checkbox_newline}(${value_text});\n`;
  return code;
};

javascriptGenerator.forBlock['serial_read_line'] = function(block) {
  var dropdown_type = block.getFieldValue('type');  
  var code = `${dropdown_type}.readStringUntil('\\n')`;
  return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['serial_read_until'] = function(block) {
  var text_endstring = block.getFieldValue('endstring');
  var dropdown_type = block.getFieldValue('type');
  var code = `${dropdown_type}.readStringUntil('${text_endstring}')`;
  return [code, javascriptGenerator.ORDER_ATOMIC];
};
