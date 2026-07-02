import * as Blockly from 'blockly/core';

Blockly.Blocks['HandySense_Setup'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("HandySense Setup");

        // this.appendValueInput("URL_HandySense")
        //     .setCheck("String")
        //     .appendField("Link");

        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour("#3498DB");
        this.setTooltip("Setup link or endpoint for HandySense");
        this.setHelpUrl("");
    }
};

Blockly.Blocks["HandySense_setPin_OldPCB"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('setPin original HandySense PCB');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};

Blockly.Blocks['HandySense_Update'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("HandySense_Loop");
        this.appendValueInput("Soil_RawData")
            .setCheck(null)
            .appendField("Soil (0-100) %");
        this.appendValueInput("Light_RawData")
            .setCheck(null)
            .appendField("Light (0 - 188000) kLux");
        this.appendValueInput("Temp_RawData")
            .setCheck(null)
            .appendField("Temp (-40 - 125) 'C");
        this.appendValueInput("Hum_RawData")
            .setCheck(null)
            .appendField("Humidity (0-100) %");
        //this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip("Update data from sensor to Wed app");
        this.setHelpUrl("");
    }
};

Blockly.Blocks["HandySense_setPin_Relay"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('HandySense setPin Relay');
        this.appendValueInput("RelayPin1")
            .setCheck(null)
            .appendField("NO 1:");
        this.appendValueInput("RelayPin2")
            .setCheck(null)
            .appendField("NO 2:");
        this.appendValueInput("RelayPin3")
            .setCheck(null)
            .appendField("NO 3:");
        this.appendValueInput("RelayPin4")
            .setCheck(null)
            .appendField("NO 4:");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};

Blockly.Blocks["HandySense_setPin_SensorError"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('HandySense setPin SensorError');
        this.appendValueInput("SensorError1")
            .setCheck(null)
            .appendField("Soil:");
        this.appendValueInput("SensorError2")
            .setCheck(null)
            .appendField("Light:");
        this.appendValueInput("SensorError3")
            .setCheck(null)
            .appendField("Temp:");
        // this.appendValueInput("SensorError4")
        //     .setCheck(null)
        //     .appendField("NO 4:");      
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};

Blockly.Blocks["HandySense_setTime_Interval_Sensor"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('setTime Update Sensor')
            .appendField(new Blockly.FieldDropdown([["2", "2000"], ["0.5", "500"], ["1", "1000"], ["1.5", "1500"], ["2", "2000"], ["2.5", "2500"], ["3", "3000"], ["5", "5000"]]), "Time_Interval_Sensor")
            .appendField('Second');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};

Blockly.Blocks["HandySense_setTime_Interval_publishData"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('setTime PublishData')
            .appendField(new Blockly.FieldDropdown([["60", "60000"], ["30", "30000"], ["60", "60000"], ["90", "90000"], ["120", "120000"]]), "Time_Interval_publishData")
            .appendField('Second');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};
Blockly.Blocks['HandySense_CalSoilSensor'] = {
    init: function () {
        this.appendValueInput("RawAnalog")
            .setCheck(null)
            .appendField("Analog to Percent");
        this.setInputsInline(true);
        this.setOutput(true, ["float", "Number"]);
        this.setColour("#3498DB");
        this.setTooltip("Read ID object");
        this.setHelpUrl("");
    }
};
Blockly.Blocks["HandySense_statusRelay"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Status of Relay No:')
            .appendField(new Blockly.FieldDropdown([["1", "0"], ["2", "1"], ["3", "2"], ["4", "3"]]), "Relay_ch")
        this.setInputsInline(true);
        this.setOutput(true, ["int", "Number"]);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};
Blockly.Blocks["HandySense_Set_statusRelay"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Set Relay No:')
            .appendField(new Blockly.FieldDropdown([["1", "0"], ["2", "1"], ["3", "2"], ["4", "3"]]), "Relay_ch")
            .appendField('Status:');
        this.appendValueInput("Relay_Status")
            .setCheck(null)
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};
Blockly.Blocks["HandySense_Update_StatusRelay"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Update Relay Status to Web');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};
Blockly.Blocks["HandySense_statusSensor"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Status of Sensor type:')
            .appendField(new Blockly.FieldDropdown([["Soil", "0"], ["Light", "1"], ["Temp", "2"]]), "Sensor_type")
        this.setInputsInline(true);
        this.setOutput(true, ["int", "Number"]);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};
Blockly.Blocks["HandySense_Map"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Map เทียบบัญญัติไตรยางค์');
        this.appendValueInput("input")
            .setCheck(null)
            .appendField("INPUT:");
        this.appendValueInput("in_min")
            .setCheck(null)
            .appendField("in_min:");
        this.appendValueInput("in_max")
            .setCheck(null)
            .appendField("in_max:");
        this.appendValueInput("out_min")
            .setCheck(null)
            .appendField("out_min:");
        this.appendValueInput("out_max")
            .setCheck(null)
            .appendField("out_max:");
        this.setOutput(true, ["float", "Number"]);
        this.setColour("#3498DB");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};


Blockly.Blocks["HandySense_brownout"] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Disable brown out');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#222222");
        this.setTooltip('');
        this.setHelpUrl('');
    }
};