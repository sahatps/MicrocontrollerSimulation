import * as Blockly from 'blockly/core';

Blockly.Blocks['io_setpin'] = {
    init: function () {
        this.appendValueInput("pin")
            .setCheck("Number")
            .appendField("set pin");
        this.getInput("pin").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">25</field>' +
                '</shadow>'
            )
        );
        this.appendDummyInput()
            .appendField("as")
            .appendField(new Blockly.FieldDropdown([["OUTPUT", "OUTPUT"], ["INPUT", "INPUT"], ["INPUT_PULLUP", "INPUT_PULLUP"]]), "mode");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(45);
        this.setTooltip("set pin mode");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['io_digital_read'] = {
    init: function () {
        this.appendValueInput("pin")
            .setCheck("Number")
            .appendField("digital read pin");
        this.getInput("pin").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">32</field>' +
                '</shadow>'
            )
        );
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(45);
        this.setTooltip("digital read in");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['io_digital_write'] = {
    init: function () {
        this.appendValueInput("pin")
            .setCheck("Number")
            .appendField("digital write pin");
        this.getInput("pin").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">33</field>' +
                '</shadow>'
            )
        );
        this.appendValueInput("value")
            .setCheck(["Number", "Boolean"])
            .appendField("value");
        this.getInput("value").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">1</field>' +
                '</shadow>'
            )
        );
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(45);
        this.setTooltip("digital write pin");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['io_analog_read'] = {
    init: function () {
        this.appendValueInput("pin")
            .setCheck("Number")
            .appendField("read analog input pin ");
        this.getInput("pin").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">36</field>' +
                '</shadow>'
            )
        );
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(45);
        this.setTooltip("read analog value from pin");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['io_analog_write'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("analog write pin")
        .appendField(new Blockly.FieldDropdown([["DAC1 GPIO25","25"], ["DAC2 GPIO26","26"]]), "pin");
    this.appendValueInput("value")
        .setCheck("Number")
        .appendField("value");
        this.getInput("value").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">128</field>' +
                '</shadow>'
            )
        );
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(45);
 this.setTooltip("analog write to pin , value from 0-255");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['io_pwm_write'] = {
    init: function () {
        this.appendValueInput("pin")
            .setCheck("Number")
            .appendField("PWM write pin");
        this.getInput("pin").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">28</field>' +
                '</shadow>'
            )
        );
        this.appendValueInput("value")
            .setCheck("Number")
            .appendField("value");
        this.getInput("value").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">128</field>' +
                '</shadow>'
            )
        );
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(45);
        this.setTooltip("write PWM to pin (value 0-255) at 5KHz");
        this.setHelpUrl("https://en.wikipedia.org/wiki/Pulse-width_modulation");
    }
};

Blockly.Blocks['io_pulse_in'] = {
    init: function () {
        this.appendValueInput("pin")
            .setCheck("Number")
            .appendField("read pulse in from pin");
        this.getInput("pin").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">36</field>' +
                '</shadow>'
            )
        );
        this.appendDummyInput()
            .appendField("state")
            .appendField(new Blockly.FieldDropdown([["HIGH", "1"], ["LOW", "0"]]), "state")
            .appendField("timeout (ms)")
            .appendField(new Blockly.FieldNumber(1000, 1), "timeout");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(45);
        this.setTooltip("read pulse in from pin");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['io_shift_in'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("read shift in data from pin (data")
            .appendField(new Blockly.FieldNumber(0, 0, 50), "data_pin")
            .appendField("clock pin")
            .appendField(new Blockly.FieldNumber(0, 0, 50), "clock_pin")
            .appendField(") bit order")
            .appendField(new Blockly.FieldDropdown([["MSB_first", "MSBFIRST"], ["LSB_first", "LSBFIRST"]]), "bit_order");
        this.setOutput(true, null);
        this.setColour(45);
        this.setTooltip("read shift in");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['io_shift_out'] = {
    init: function () {
        this.appendValueInput("data")
            .setCheck("Number")
            .appendField("shift out data");
        this.getInput("data").connection.setShadowDom(
            Blockly.utils.xml.textToDom(
                '<shadow type="math_number">' +
                '  <field name="NUM">127</field>' +
                '</shadow>'
            )
        );
        this.appendDummyInput()
            .appendField("  from pin (data")
            .appendField(new Blockly.FieldNumber(0, 0, 50), "data_pin")
            .appendField("clock pin")
            .appendField(new Blockly.FieldNumber(0, 0, 50), "clock_pin")
            .appendField(") bit order")
            .appendField(new Blockly.FieldDropdown([["MSB_first", "MSBFIRST"], ["LSB_first", "LSBFIRST"]]), "bit_order");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(45);
        this.setTooltip("shift out data");
        this.setHelpUrl("");
    }
};