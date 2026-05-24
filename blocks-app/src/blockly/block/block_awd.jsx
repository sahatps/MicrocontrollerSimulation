import * as Blockly from 'blockly/core';

Blockly.Blocks["HandySense_awdv1"] = {
    init: function () {
        // this.appendDummyInput()
        this.appendDummyInput()
            .appendField(
                new Blockly.FieldImage(
                    "/icon/source-code.png",
                    40,
                    40,
                    "*"
                )
            )
            .appendField("Alternate Wetting and Drying");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 20, 20, "*"))
            .appendField("NETPIE setting")
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("    ▸ Client ID")
            .appendField(new Blockly.FieldTextInput(""), "n_id");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("    ▸ Token")
            .appendField(new Blockly.FieldTextInput(""), "n_token");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("    ▸ Secret")
            .appendField(new Blockly.FieldTextInput(""), "n_secret");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField(new Blockly.FieldImage("/icon/icons8_thinkspeak.png", 20, 20, "*"))
            .appendField("Thinkspeak setting")
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField("    ▸ API")
            .appendField(new Blockly.FieldTextInput(""), "t_api");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField(new Blockly.FieldImage("/icon/sun.png", 20, 20, "*"))
            .appendField("Sensor")
        this.appendValueInput("value_sensor1")
            .appendField("    ▸ Sensor 1")
            .appendField(new Blockly.FieldTextInput("Temperature"), "name_sensor1");
        this.appendValueInput("value_sensor2")
            .appendField("    ▸ Sensor 2")
            .appendField(new Blockly.FieldTextInput("Humidity"), "name_sensor2");
        this.appendValueInput("value_sensor3")
            .appendField("    ▸ Sensor 3")
            .appendField(new Blockly.FieldTextInput("Ultrasonic"), "name_sensor3");
        // this.appendValueInput("name_sensor1")
        //   .setCheck(null)
        //   .appendField("Sensor 1");
        // this.appendValueInput("name_sensor2")
        //   .setCheck(null)
        //   .appendField("Sensor 2");
        // this.appendValueInput("name_sensor3")
        //   .setCheck(null)
        //   .appendField("Sensor 3");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField(new Blockly.FieldImage("/icon/icons8_Story_Time_96px-d.png", 20, 20, "*"))
            .appendField("Delay")
            .appendField(new Blockly.FieldTextInput("300000"), "delay");
        this.appendDummyInput();
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour("#444444");
        this.setTooltip("setup command for HandySense");
        this.setHelpUrl("");
    },
};
