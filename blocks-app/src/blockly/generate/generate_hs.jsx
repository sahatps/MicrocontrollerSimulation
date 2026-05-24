import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['HandySense_Setup'] = function (block) {
    var code = `  
  setup_HandySense();
  `;
    return code;
};

javascriptGenerator.forBlock['HandySense_Update'] = function (block) {
    var value_Soil_RawData = javascriptGenerator.valueToCode(block, 'Soil_RawData', javascriptGenerator.ORDER_NONE);
    var value_Light_RawData = javascriptGenerator.valueToCode(block, 'Light_RawData', javascriptGenerator.ORDER_NONE);
    var value_Temp_RawData = javascriptGenerator.valueToCode(block, 'Temp_RawData', javascriptGenerator.ORDER_NONE);
    var value_Hum_RawData = javascriptGenerator.valueToCode(block, 'Hum_RawData', javascriptGenerator.ORDER_NONE);
    var code = `
  loop_HandySense(${value_Soil_RawData},${value_Light_RawData},${value_Temp_RawData},${value_Hum_RawData});
  `;
    return code;
};

javascriptGenerator.forBlock['HandySense_CalSoilSensor'] = function (block) {
    var value_analog_RawData = javascriptGenerator.valueToCode(block, 'RawAnalog', javascriptGenerator.ORDER_NONE);
    var code = `analog_to_percent(${value_analog_RawData})`;
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['HandySense_setTime_Interval_Sensor'] = function (block) {
    //var value_analog_RawData = javascriptGenerator.valueToCode(block, 'RawAnalog', javascriptGenerator.ORDER_NONE);
    var dropdown_Time_Interval_Sensor = block.getFieldValue('Time_Interval_Sensor');
    var code = `eventInterval = ${dropdown_Time_Interval_Sensor};\n
                eventInterval_brightness = ${dropdown_Time_Interval_Sensor};\n`;
    return code;
};
javascriptGenerator.forBlock['HandySense_setTime_Interval_publishData'] = function (block) {
    //var value_analog_RawData = javascriptGenerator.valueToCode(block, 'RawAnalog', javascriptGenerator.ORDER_NONE);
    var dropdown_Time_Interval_publishData = block.getFieldValue('Time_Interval_publishData');
    var code = `eventInterval_publishData = ${dropdown_Time_Interval_publishData};\n`;
    return code;
};
javascriptGenerator.forBlock['HandySense_setPin_Relay'] = function (block) {
    var value_RelayPin1 = javascriptGenerator.valueToCode(block, 'RelayPin1', javascriptGenerator.ORDER_NONE);
    var value_RelayPin2 = javascriptGenerator.valueToCode(block, 'RelayPin2', javascriptGenerator.ORDER_NONE);
    var value_RelayPin3 = javascriptGenerator.valueToCode(block, 'RelayPin3', javascriptGenerator.ORDER_NONE);
    var value_RelayPin4 = javascriptGenerator.valueToCode(block, 'RelayPin4', javascriptGenerator.ORDER_NONE);
    var code = `setPin_Relay(${value_RelayPin1},${value_RelayPin2},${value_RelayPin3},${value_RelayPin4});`;
    return code;
};
javascriptGenerator.forBlock['HandySense_setPin_SensorError'] = function (block) {
    var value_SensorError1 = javascriptGenerator.valueToCode(block, 'SensorError1', javascriptGenerator.ORDER_NONE);
    var value_SensorError2 = javascriptGenerator.valueToCode(block, 'SensorError2', javascriptGenerator.ORDER_NONE);
    var value_SensorError3 = javascriptGenerator.valueToCode(block, 'SensorError3', javascriptGenerator.ORDER_NONE);
    var code = `setPin_ErrorSensor(${value_SensorError1},${value_SensorError2},${value_SensorError3});`;
    return code;
};
javascriptGenerator.forBlock['HandySense_statusRelay'] = function (block) {
    var dropdown_Relay_ch = block.getFieldValue('Relay_ch');
    var code = `RelayStatus[${dropdown_Relay_ch}]`;
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['HandySense_Set_statusRelay'] = function (block) {
    //var value_analog_RawData = javascriptGenerator.valueToCode(block, 'RawAnalog', javascriptGenerator.ORDER_NONE);
    var dropdown_Relay_ch = block.getFieldValue('Relay_ch');
    var value_Relay_Status = javascriptGenerator.valueToCode(block, 'Relay_Status', javascriptGenerator.ORDER_NONE);
    var code = `RelayStatus[${dropdown_Relay_ch}] = ${value_Relay_Status};\n`;
    if (value_Relay_Status == '0') {
        code += `Close_relay(${dropdown_Relay_ch});\n`;
        code += `check_sendData_status = 1;\n`;
    }
    else if (value_Relay_Status == '1') {
        code += `Open_relay(${dropdown_Relay_ch});\n`;
        code += `check_sendData_status = 1;\n`;
    }

    return code;
};
javascriptGenerator.forBlock['HandySense_Update_StatusRelay'] = function (block) {
    var code = `check_sendData_status = 1;\n`;
    return code;
};

javascriptGenerator.forBlock['HandySense_setPin_OldPCB'] = function (block) {
    var code = `LED_WIFI = 26;\nLED_SERVER = 27;\n
                setPin_Relay(32,33,25,26);
                setPin_ErrorSensor(19,18,5);\n
                type_RTC = 0;
    `;
    return code;
};
javascriptGenerator.forBlock['HandySense_statusSensor'] = function (block) {
    var dropdown_Sensor_type = block.getFieldValue('Sensor_type');
    var code = `ErrorSensor_Status[${dropdown_Sensor_type}]`;
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['HandySense_Map'] = function (block) {
    var value_input = javascriptGenerator.valueToCode(block, 'input', javascriptGenerator.ORDER_NONE);
    var value_in_min = javascriptGenerator.valueToCode(block, 'in_min', javascriptGenerator.ORDER_NONE);
    var value_in_max = javascriptGenerator.valueToCode(block, 'in_max', javascriptGenerator.ORDER_NONE);
    var value_out_min = javascriptGenerator.valueToCode(block, 'out_min', javascriptGenerator.ORDER_NONE);
    var value_out_max = javascriptGenerator.valueToCode(block, 'out_max', javascriptGenerator.ORDER_NONE);

    //var code = `map(${value_input},${value_in_min},${value_in_max},${value_out_min},${value_out_max})`;
    var code = `map(${value_input},${value_in_min},${value_in_max},${value_out_min},${value_out_max})`;

    return [code, javascriptGenerator.ORDER_NONE];
};


javascriptGenerator.forBlock['HandySense_brownout'] = function (block) {
    var code = `#SETUP WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);#END`;
    return code;
};