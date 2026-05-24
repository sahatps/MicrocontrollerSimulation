import * as Blockly from 'blockly/core';

Blockly.Blocks['Initial_Fertilizer'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Initial_Fertilizer");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Initial Fertilizer");
        this.setHelpUrl("");
    }
};


Blockly.Blocks['Load_preferences'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Load config from Flash memory");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Load config");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Clear_preferences'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Load Default config to Flash memory");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Clear config to default");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Print_preferences'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Print all config from Flash memory");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("print all config");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['control_EC'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Control EC");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Control EC");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['control_pH'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Control pH");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Control pH");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['Read_pH'] = {
    init: function () {
        this.appendValueInput("_adc_ph")
            .setCheck(["Number"])
            .appendField("Read pH from ADC (uVolt)");
        this.setOutput(true, "Number");
        this.setColour("#444444");
        this.setTooltip("Read pH");
        this.setHelpUrl("");
    }
};
Blockly.Blocks['Read_temp'] = {
    init: function () {
        this.appendValueInput("_adc_temp")
            .setCheck(["Number"])
            .appendField("Read Temperatute from ADC (uVolt)");
        this.setOutput(true, "Number");
        this.setColour("#444444");
        this.setTooltip("Read temperatute");
        this.setHelpUrl("");
    }
};
Blockly.Blocks['Read_EC'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Read EC ");
        this.appendValueInput("_adc_ec")
            .setCheck(["Number"])
            .appendField("EC from ADC (uVolt)");
        this.appendValueInput("_adc_temp")
            .setCheck(["Number"])
            .appendField("Temperatute (celsius)");
        this.setOutput(true, "Number");
        this.setColour("#444444");
        this.setTooltip("Read EC");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['set_preferences'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Set Parameter:");
        this.appendValueInput("_ph4")
            .setCheck(["Number"])
            .appendField("pH4:");
        this.appendValueInput("_ph7")
            .setCheck(["Number"])
            .appendField("pH7:");
        this.appendValueInput("_ph10")
            .setCheck(["Number"])
            .appendField("pH10:");
        this.appendValueInput("_ec0")
            .setCheck(["Number"])
            .appendField("EC0:");
        this.appendValueInput("_ec1413")
            .setCheck(["Number"])
            .appendField("EC1413:");
        this.appendValueInput("_calTemp")
            .setCheck(["Number"])
            .appendField("EC1413 Cal Temp:");
        //this.appendValueInput("_ec5000")
        //	.setCheck(["Number"])
        //	.appendField("EC5000:");
        this.appendValueInput("_phmin")
            .setCheck(["Number"])
            .appendField("pH Lower set point:");
        this.appendValueInput("_phmax")
            .setCheck(["Number"])
            .appendField("pH Upper set point:");
        this.appendValueInput("_phdur")
            .setCheck(["Number"])
            .appendField("pH inject duration(sec):");
        this.appendValueInput("_ecmin")
            .setCheck(["Number"])
            .appendField("EC Lower set point:");
        this.appendValueInput("_ecdur")
            .setCheck(["Number"])
            .appendField("Fertilize inject duration (sec):");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Set Parameter");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['set_single_preferences'] = {
    init: function () {
        this.appendDummyInput("")
            .appendField("Set Parameter : ")
            .appendField(new Blockly.FieldDropdown([
                ["pH4", "calPH4"], ["pH7", "calPH7"], ["pH10", "calPH10"], ["EC0", "calEC0"], ["EC1413", "calEC1413"], ["EC1413 Cal Temp", "calTemp"], ["pH Lower set point", "PHthresh_min"]
                , ["pH Upper set point", "PHthresh_max"], ["pH inject duration(sec)", "PHdura_value"], ["EC Lower set point", "ECthresh_min"], ["Fertilize inject duration (sec)", "ECdura_value"]]), "_param");
        this.appendValueInput("_value")
            .setCheck(["Number"])
            .appendField("");

        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Set Parameter");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['read_single_preferences'] = {
    init: function () {
        this.appendDummyInput("")
            .appendField("Read Parameter : ")
            .appendField(new Blockly.FieldDropdown([
                ["pH4", "calPH4"], ["pH7", "calPH7"], ["pH10", "calPH10"], ["EC0", "calEC0"], ["EC1413", "calEC1413"], ["EC1413 Cal Temp", "calTemp"], ["pH Lower set point", "PHthresh_min"]
                , ["pH Upper set point", "PHthresh_max"], ["pH inject duration(sec)", "PHdura_value"], ["EC Lower set point", "ECthresh_min"], ["Fertilize inject duration (sec)", "ECdura_value"]]), "_param");

        this.setOutput(true, "Number");
        this.setColour("#444444");
        this.setTooltip("Read Parameter");
        this.setHelpUrl("");
    }
};