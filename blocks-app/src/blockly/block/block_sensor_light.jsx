import * as Blockly from 'blockly/core';

Blockly.Blocks["rs485_light_begin"] = {
    init: function () {
        this.appendDummyInput().appendField("DT-Par485 begin  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["rs485_Light_read"] = {
    init: function () {
        this.appendDummyInput().appendField("DT-Par485 read  —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks['bh1750_begin'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("BH1750 begin  —  I2C");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#996633");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bh1750_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("BH1750 read  —  I2C");
        this.setOutput(true, null);
        this.setColour("#996633");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};