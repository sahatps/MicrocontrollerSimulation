import * as Blockly from 'blockly/core';

Blockly.Blocks['sht31_begin'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 begin");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#ffa791");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sht31_read_init'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 init");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#ffa791");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sht31_read_temp'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 read temp");
        this.setOutput(true, null);
        this.setColour("#ffa791");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

// Blockly.Blocks['sht20_read_temperature'] = {
// 	init: function () {
// 		this.appendDummyInput()
// 			.appendField("SHT20 read temperature (*C)");
// 		this.setOutput(true, null);
// 		this.setColour(135);
// 		this.setTooltip("Read temperature from SHT20");
// 		this.setHelpUrl("");
// 	}
// };

Blockly.Blocks['sht31_read_humidity'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 read humidity (%RH)");
        this.setOutput(true, null);
        this.setColour("#ffa791");
        this.setTooltip("Read humidity from SHT31");
        this.setHelpUrl("");
    }
};


// <------------------------------------------------->

Blockly.Blocks['sht31_begin_i2c'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 begin  —  I2C");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#996633");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sht31_read_init_i2c'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 read  —  I2C");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#996633");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sht31_read_temp_i2c'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 read temperature ('C)  —  I2C");
        this.setOutput(true, null);
        this.setColour("#996633");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sht31_read_humid_i2c'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 read humidity (%RH)  —  I2C");
        this.setOutput(true, null);
        this.setColour("#996633");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};


Blockly.Blocks['sht31_begin_rs'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 begin  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sht31_read_temp_rs'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 read temperature ('C)  —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['sht31_read_humid_rs'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("SHT31 read humidity (%RH)  —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};
