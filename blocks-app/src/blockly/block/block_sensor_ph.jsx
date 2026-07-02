import * as Blockly from 'blockly/core';

Blockly.Blocks['rs485_PH_begin'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("pH begin  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['rs485_PH_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Read pH  —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['rs485_PH_read_temp'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Read Temp  —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

