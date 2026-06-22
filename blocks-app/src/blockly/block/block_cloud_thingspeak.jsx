import * as Blockly from 'blockly/core';
import { publicAssetUrl } from '../../utils/asset-url';

Blockly.Blocks["Thingspeak_begin"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage(
                publicAssetUrl("icon/icons8_thinkspeak.png"),
                24,
                24,
                "*"))
            .appendField("Thingspeak Begin");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("WRITE API KEY")
            .appendField(new Blockly.FieldTextInput(""), "WRITE_API_KEY");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("WIFI SSID")
            .appendField(new Blockly.FieldTextInput(""), "WIFI_SSID");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("WIFI PASS")
            .appendField(new Blockly.FieldTextInput(""), "WIFI_PASS");

        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1730BA");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};


Blockly.Blocks["Thingspeak_connectWifi"] = {
    init: function () {

        this.appendDummyInput()
            .appendField(new Blockly.FieldImage(
                publicAssetUrl("icon/icons8_thinkspeak.png"),
                24,
                24,
                "*"))
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("connectWifi")

        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1730BA");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks["Thingspeak_Finish"] = {
    init: function () {

        this.appendDummyInput()
            .appendField(new Blockly.FieldImage(
                publicAssetUrl("icon/icons8_thinkspeak.png"),
                24,
                24,
                "*"))
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("Finish")


        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1730BA");
        this.setTooltip("");
        this.setHelpUrl("");
    }
};



Blockly.Blocks['Thingspeak_set_field_value'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .appendField(new Blockly.FieldImage(
                publicAssetUrl("icon/icons8_thinkspeak.png"),
                24,
                24,
                "*"))
            .appendField("set field")
            .appendField(new Blockly.FieldDropdown([
                ["1", "1"],
                ["2", "2"],
                ["3", "3"],
                ["4", "4"],
                ["5", "5"],
                ["6", "6"],
                ["7", "7"],
                ["8", "8"],
                ["9", "9"],
                ["10", "10"]
            ]), "VAR_NAME")
            .setCheck("Number")
            .appendField("Set sensor");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1730BA");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};
