import * as Blockly from 'blockly/core';

Blockly.Blocks['Read4_20_mA_MCP3424'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Read 4-20mA (MPC3424)")
            .appendField(new Blockly.FieldDropdown([["AIN0", "1"], ["AIN1", "2"]]), "ch");
        this.setOutput(true, null);
        this.setColour("#E67E22");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Read4_20_mA_MCP3424_map'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Read 4-20mA (MPC3424)")
            .appendField(new Blockly.FieldDropdown([["AIN0", "1"], ["AIN1", "2"]]), "ch");
        this.appendValueInput("valueMin")
            .setCheck(null)
            .appendField("valueMin:");
        this.appendValueInput("valueMax")
            .setCheck(null)
            .appendField("valueMax:");
        this.appendValueInput("OutMin")
            .setCheck(null)
            .appendField("OutMin:");
        this.appendValueInput("OutMax")
            .setCheck(null)
            .appendField("OutMax:");
        this.setOutput(true, null);
        this.setColour("#E67E22");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['ReadAnalog_MCP3424'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Read Analog (MPC3424)")
            .appendField(new Blockly.FieldDropdown([["AIN2", "3"], ["AIN3", "4"]]), "ch");
        this.setOutput(true, null);
        this.setColour("#E67E22");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['ReadAnalog_from_MPC3424'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Read Analog (MPC3424)")
            .appendField(new Blockly.FieldDropdown([["AIN2", "3"], ["AIN3", "4"]]), "ch");
        this.appendValueInput("valueMin")
            .setCheck(null)
            .appendField("valueMin:");
        this.appendValueInput("valueMax")
            .setCheck(null)
            .appendField("valueMax:");
        this.appendValueInput("OutMin")
            .setCheck(null)
            .appendField("OutMin:");
        this.appendValueInput("OutMax")
            .setCheck(null)
            .appendField("OutMax:");
        this.setOutput(true, null);
        this.setColour("#E67E22");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};