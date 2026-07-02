import * as Blockly from 'blockly/core';

Blockly.Blocks["sw_on_pressed"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Button')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]), "ch_sw")
            .appendField('on pressed');
        this.appendStatementInput('REESSED')
            .appendField('do');
        this.setInputsInline(true);
        this.setNextStatement(true, null);
        this.setPreviousStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};

Blockly.Blocks["sw_on_release"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Button')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]), "ch_sw")
            .appendField('on release');
        this.appendStatementInput('RELEASE')
            .appendField('do');
        this.setInputsInline(true);
        this.setNextStatement(true, null);
        this.setPreviousStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};

Blockly.Blocks['sw_pressed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Button')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]), "ch_sw")
            .appendField('pressed');
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour("#0f725e");
        this.setTooltip("get A pressed or not");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sw_release'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Button')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]), "ch_sw")
            .appendField('release');
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour("#0f725e");
        this.setTooltip("get A pressed or not");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['led_begin'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('begin');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['led_control_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('LED')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]]), "ch_led")
            .appendField('on');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['led_control_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('LED')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"]]), "ch_led")
            .appendField('off');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['relay_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Relay')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]), "ch_relay")
            .appendField('on');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['relay_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Relay')
            .appendField(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]), "ch_relay")
            .appendField('off');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

// ===== BUZZER =====
Blockly.Blocks['buzzer_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Buzzer pin')
            .appendField(new Blockly.FieldNumber(8, 0, 40, 1), 'PIN')
            .appendField('on');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn buzzer on');
        this.setHelpUrl('');
    }
};

Blockly.Blocks['buzzer_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Buzzer pin')
            .appendField(new Blockly.FieldNumber(8, 0, 40, 1), 'PIN')
            .appendField('off');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn buzzer off');
        this.setHelpUrl('');
    }
};

// ===== SERVO =====
Blockly.Blocks['servo_write'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Servo pin')
            .appendField(new Blockly.FieldNumber(9, 0, 40, 1), 'PIN');
        this.appendValueInput('ANGLE')
            .setCheck('Number')
            .appendField('angle');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Set servo motor angle (0-180)');
        this.setHelpUrl('');
    }
};

// ===== FAN =====
Blockly.Blocks['fan_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Fan pin')
            .appendField(new Blockly.FieldNumber(2, 0, 40, 1), 'PIN')
            .appendField('on');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn fan on');
        this.setHelpUrl('');
    }
};

Blockly.Blocks['fan_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Fan pin')
            .appendField(new Blockly.FieldNumber(2, 0, 40, 1), 'PIN')
            .appendField('off');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn fan off');
        this.setHelpUrl('');
    }
};

// ===== WATER PUMP =====
Blockly.Blocks['water_pump_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Water Pump pin')
            .appendField(new Blockly.FieldNumber(3, 0, 40, 1), 'PIN')
            .appendField('on');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn water pump on');
        this.setHelpUrl('');
    }
};

Blockly.Blocks['water_pump_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Water Pump pin')
            .appendField(new Blockly.FieldNumber(3, 0, 40, 1), 'PIN')
            .appendField('off');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn water pump off');
        this.setHelpUrl('');
    }
};

// ===== MISTING PUMP =====
Blockly.Blocks['misting_pump_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Misting Pump pin')
            .appendField(new Blockly.FieldNumber(4, 0, 40, 1), 'PIN')
            .appendField('on');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn misting pump on');
        this.setHelpUrl('');
    }
};

Blockly.Blocks['misting_pump_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Misting Pump pin')
            .appendField(new Blockly.FieldNumber(4, 0, 40, 1), 'PIN')
            .appendField('off');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Turn misting pump off');
        this.setHelpUrl('');
    }
};

// ===== POTENTIOMETER =====
Blockly.Blocks['potentiometer_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Read Potentiometer pin')
            .appendField(new Blockly.FieldNumber(34, 0, 40, 1), 'PIN');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read potentiometer analog value (0-4095)');
        this.setHelpUrl('');
    }
};

// ===== SLIDE SWITCH =====
Blockly.Blocks['slide_switch_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Read Slide Switch pin')
            .appendField(new Blockly.FieldNumber(5, 0, 40, 1), 'PIN');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setColour("#0f725e");
        this.setTooltip('Read slide switch state (0 or 1)');
        this.setHelpUrl('');
    }
};

// ===== JOYSTICK =====
Blockly.Blocks['joystick_x'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Joystick X pin')
            .appendField(new Blockly.FieldNumber(34, 0, 40, 1), 'PIN');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read joystick X axis (0-4095)');
        this.setHelpUrl('');
    }
};

Blockly.Blocks['joystick_y'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Joystick Y pin')
            .appendField(new Blockly.FieldNumber(35, 0, 40, 1), 'PIN');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read joystick Y axis (0-4095)');
        this.setHelpUrl('');
    }
};

// ===== DIP SWITCH 8 =====
Blockly.Blocks['dip_switch_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Read DipSwitch8 pin')
            .appendField(new Blockly.FieldNumber(5, 0, 40, 1), 'PIN')
            .appendField('bit')
            .appendField(new Blockly.FieldDropdown([["0","0"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"]]), 'BIT');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setColour("#0f725e");
        this.setTooltip('Read DIP switch bit state');
        this.setHelpUrl('');
    }
};

// ===== KY040 ROTARY =====
Blockly.Blocks['ky040_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('KY040 CLK pin')
            .appendField(new Blockly.FieldNumber(5, 0, 40, 1), 'CLK')
            .appendField('DT pin')
            .appendField(new Blockly.FieldNumber(6, 0, 40, 1), 'DT');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read KY040 rotary encoder value');
        this.setHelpUrl('');
    }
};

// ===== NTC TEMPERATURE SENSOR =====
Blockly.Blocks['ntc_temperature'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('NTC Temp pin')
            .appendField(new Blockly.FieldNumber(34, 0, 40, 1), 'PIN');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read NTC temperature sensor (°C)');
        this.setHelpUrl('');
    }
};

// ===== SOUND SENSOR =====
Blockly.Blocks['sound_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Sound Sensor pin')
            .appendField(new Blockly.FieldNumber(34, 0, 40, 1), 'PIN');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read sound sensor analog value');
        this.setHelpUrl('');
    }
};

// ===== HC-SR04 ULTRASONIC =====
Blockly.Blocks['hcsr04_distance'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('HC-SR04 TRIG pin')
            .appendField(new Blockly.FieldNumber(5, 0, 40, 1), 'TRIG')
            .appendField('ECHO pin')
            .appendField(new Blockly.FieldNumber(18, 0, 40, 1), 'ECHO');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read HC-SR04 ultrasonic distance (cm)');
        this.setHelpUrl('');
    }
};

// ===== PHOTORESISTOR =====
Blockly.Blocks['photoresistor_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Photoresistor pin')
            .appendField(new Blockly.FieldNumber(34, 0, 40, 1), 'PIN');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read photoresistor light level (0-4095)');
        this.setHelpUrl('');
    }
};

// ===== RGB LED =====
Blockly.Blocks['rgb_led_set'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('RGB LED R pin')
            .appendField(new Blockly.FieldNumber(9, 0, 40, 1), 'RPIN')
            .appendField('G pin')
            .appendField(new Blockly.FieldNumber(10, 0, 40, 1), 'GPIN')
            .appendField('B pin')
            .appendField(new Blockly.FieldNumber(11, 0, 40, 1), 'BPIN');
        this.appendValueInput('RED').setCheck('Number').appendField('R');
        this.appendValueInput('GREEN').setCheck('Number').appendField('G');
        this.appendValueInput('BLUE').setCheck('Number').appendField('B');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Set RGB LED color (0-255 each)');
        this.setHelpUrl('');
    }
};

// ===== LED BAR =====
Blockly.Blocks['led_bar_set'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('LED Bar data pin')
            .appendField(new Blockly.FieldNumber(8, 0, 40, 1), 'DATA')
            .appendField('clock pin')
            .appendField(new Blockly.FieldNumber(9, 0, 40, 1), 'CLK');
        this.appendValueInput('LEVEL').setCheck('Number').appendField('level');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Set LED bar level (0-10)');
        this.setHelpUrl('');
    }
};

// ===== NEOPIXEL =====
Blockly.Blocks['neopixel_set'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('NeoPixel pin')
            .appendField(new Blockly.FieldNumber(6, 0, 40, 1), 'PIN')
            .appendField('index')
            .appendField(new Blockly.FieldNumber(0, 0, 100, 1), 'INDEX');
        this.appendValueInput('RED').setCheck('Number').appendField('R');
        this.appendValueInput('GREEN').setCheck('Number').appendField('G');
        this.appendValueInput('BLUE').setCheck('Number').appendField('B');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Set NeoPixel color (R, G, B: 0-255)');
        this.setHelpUrl('');
    }
};

// ===== SEVEN SEGMENT =====
Blockly.Blocks['seven_seg_show'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('7-Segment pin')
            .appendField(new Blockly.FieldNumber(8, 0, 40, 1), 'PIN');
        this.appendValueInput('VALUE').setCheck('Number').appendField('value');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Display value on seven segment display');
        this.setHelpUrl('');
    }
};

// ===== LED RING =====
Blockly.Blocks['led_ring_set'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('LED Ring pin')
            .appendField(new Blockly.FieldNumber(6, 0, 40, 1), 'PIN')
            .appendField('index')
            .appendField(new Blockly.FieldNumber(0, 0, 23, 1), 'INDEX');
        this.appendValueInput('RED').setCheck('Number').appendField('R');
        this.appendValueInput('GREEN').setCheck('Number').appendField('G');
        this.appendValueInput('BLUE').setCheck('Number').appendField('B');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Set LED Ring pixel color');
        this.setHelpUrl('');
    }
};

// ===== LCD =====
Blockly.Blocks['lcd_print'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('LCD')
            .appendField(new Blockly.FieldDropdown([["16x2","1602"],["20x4","2004"]]), 'TYPE')
            .appendField('row')
            .appendField(new Blockly.FieldDropdown([["0","0"],["1","1"],["2","2"],["3","3"]]), 'ROW')
            .appendField('col')
            .appendField(new Blockly.FieldNumber(0, 0, 19, 1), 'COL');
        this.appendValueInput('TEXT').setCheck('String').appendField('print');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#0f725e");
        this.setTooltip('Print text on LCD display');
        this.setHelpUrl('');
    }
};

// ===== DS1307 CLOCK =====
Blockly.Blocks['ds1307_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('DS1307 read')
            .appendField(new Blockly.FieldDropdown([
                ["year","year"],
                ["month","month"],
                ["day","day"],
                ["hour","hour"],
                ["minute","minute"],
                ["second","second"]
            ]), 'FIELD');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour("#0f725e");
        this.setTooltip('Read DS1307 RTC clock field');
        this.setHelpUrl('');
    }
};