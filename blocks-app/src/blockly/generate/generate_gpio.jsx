import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['Read4_20_mA_MCP3424'] = function (block) {
	var ch = block.getFieldValue('ch');
	var code = `Read4_20mA_MPC3424(${ch})`;
	return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['io_setpin'] = function(block) {
  var value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);
  var dropdown_mode = block.getFieldValue('mode');  
  var code = `pinMode(${value_pin},${dropdown_mode});\n`;
  return code;
};

javascriptGenerator.forBlock['io_digital_read'] = function(block) {
  var value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);  
  var code = `digitalRead(${value_pin})`;
  return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['io_digital_write'] = function(block) {
  var value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);
  var value_value = javascriptGenerator.valueToCode(block, 'value', javascriptGenerator.ORDER_ATOMIC);  
  var code = `digitalWrite(${value_pin},${value_value});\n`;
  return code;
};

javascriptGenerator.forBlock['io_analog_read'] = function(block) {
  var value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);  
  var code = `analogRead(${value_pin})`;
  return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['io_analog_write'] = function(block) {
  var value_pin = block.getFieldValue('pin');
  var value_value = javascriptGenerator.valueToCode(block, 'value', javascriptGenerator.ORDER_ATOMIC);  
  var code = `dacWrite(${value_pin},${value_value});\n`;
  return code;
};

javascriptGenerator.forBlock['io_pwm_write'] = function(block) {
  var value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);
  var value_value = javascriptGenerator.valueToCode(block, 'value', javascriptGenerator.ORDER_ATOMIC);  
  var code = `analogWrite(${value_pin}, ${value_value});`;
  return code;
};

javascriptGenerator.forBlock['io_pulse_in'] = function(block) {
  var value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);
  var dropdown_state = block.getFieldValue('state');
  var number_timeout = block.getFieldValue('timeout');  
  var code = `pulseIn(${value_pin},${dropdown_state},${number_timeout})`;  
  return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['io_shift_in'] = function(block) {
  var number_data_pin = block.getFieldValue('data_pin');
  var number_clock_pin = block.getFieldValue('clock_pin');
  var dropdown_bit_order = block.getFieldValue('bit_order');  
  var code = `shiftIn(${number_data_pin},${number_clock_pin},${dropdown_bit_order})`;  
  return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['io_shift_out'] = function(block) {
  var value_data = javascriptGenerator.valueToCode(block, 'data', javascriptGenerator.ORDER_ATOMIC);
  var number_data_pin = block.getFieldValue('data_pin');
  var number_clock_pin = block.getFieldValue('clock_pin');
  var dropdown_bit_order = block.getFieldValue('bit_order');  
  var code = `shiftOut(${number_data_pin},${number_clock_pin},${dropdown_bit_order},${value_data});\n`;
  return code;
};
