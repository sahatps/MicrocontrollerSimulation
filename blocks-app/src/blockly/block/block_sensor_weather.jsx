import * as Blockly from 'blockly/core';

Blockly.Blocks['Weather_HTCo2PLx_begin_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Weather begin  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Weather_HTCo2PLx_read_humidity_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Weather_HTCo2PLx read —  Humidity_RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Weather_HTCo2PLx_read_temperature_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Weather_HTCo2PLx read —  Temperature_RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Weather_HTCo2PLx_read_co2_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Weather Co2 read — RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Weather_HTCo2PLx_read_pressure_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Weather Pressure read — RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Weather_HTCo2PLx_read_lux_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Weather_HTCo2PLx read —  Lux_RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};
Blockly.Blocks['Par_begin_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Par  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Par_read_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Par read —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Rain_begin_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Rain begin  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Rain_read_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Rain read —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Wind_begin_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Wind direction begin  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Wind_read_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Wind direction read —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Wind_speed_begin_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Wind speed begin  —  RS485")
            .appendField("id : ")
            .appendField(new Blockly.FieldTextInput("1"), "id");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Wind_speed_read_rs485'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Wind speed read —  RS485");
        this.setOutput(true, null);
        this.setColour("#663300");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};