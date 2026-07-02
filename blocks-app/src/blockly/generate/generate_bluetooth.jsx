import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['bt_start'] = function (block) {
    var text_name = block.getFieldValue('name');
    var code = `
#EXTINC#include "BluetoothSerial.h"#END
#VARIABLEBluetoothSerial SerialBT;#END
SerialBT.begin("${text_name}");
`;
    return code;
};

javascriptGenerator.forBlock['bt_send_string'] = function (block) {
    var value_text = javascriptGenerator.valueToCode(block, 'text', javascriptGenerator.ORDER_ATOMIC);
    var checkbox_newline = (block.getFieldValue('newline') == 'TRUE') ? 'ln' : '';
    var code = `SerialBT.print${checkbox_newline}(${value_text});\n`;
    return code;
};

javascriptGenerator.forBlock['bt_on_receive'] = function (block) {
    var statements_receiver_code = javascriptGenerator.statementToCode(block, 'receiver_code');
    var code = `while(SerialBT.available()){
    ${statements_receiver_code}
  }\n`;
    return code;
};

javascriptGenerator.forBlock['bt_read_data'] = function (block) {
    var code = `SerialBT.read()`;
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['bt_read_line'] = function (block) {
    var code = `SerialBT.readStringUntil('\\n')`;
    return [code, javascriptGenerator.ORDER_NONE];
};
