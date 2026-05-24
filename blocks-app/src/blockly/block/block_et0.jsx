import * as Blockly from 'blockly/core';

Blockly.Blocks["HandySense_et0v1_begin"] = {
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
            .appendField("Evapotranspiration Begin");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField(new Blockly.FieldImage("/icon/sun.png", 20, 20, "*"))
            .appendField("Sensor");
        this.appendValueInput("value_temp").appendField("  ▸ Temperature (°C)");
        this.appendValueInput("value_humi").appendField("  ▸ Humidity (%)");
        this.appendValueInput("value_wind").appendField("  ▸ Wind speed 2 meter (m/s)");
        this.appendValueInput("value_radw").appendField("  ▸ Net surface radiation (MJ/m²/day)");
        this.appendValueInput("value_Heat").appendField("  ▸ Heat flow in soil (MJ/m²/day)");
        this.appendDummyInput()
            .setAlign(Blockly.inputs.Align.LEFT)
            .appendField(new Blockly.FieldImage("/icon/plus.png", 20, 20, "*"))
            .appendField("Setting more");
        this.appendValueInput("value_kc").appendField("  ▸ Crop Coefficient");
        this.appendDummyInput();
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#444444");
        this.setTooltip("Begin for ET0 and ETc");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["HandySense_et0v1_et0"] = {
    init: function () {
        // this.appendDummyInput()
        this.appendDummyInput()
            .appendField(
                new Blockly.FieldImage(
                    "/icon/source-code.png",
                    24,
                    24,
                    "*"
                )
            )
            .appendField("Read ET0");
        this.setOutput(true, null);
        this.setColour("#444444");
        this.setTooltip("Read for Evapotranspiration");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["HandySense_et0v1_etc"] = {
    init: function () {
        // this.appendDummyInput()
        this.appendDummyInput()
            .appendField(
                new Blockly.FieldImage(
                    "/icon/source-code.png",
                    24,
                    24,
                    "*"
                )
            )
            .appendField("Read ETc");
        this.setOutput(true, null);
        this.setColour("#444444");
        this.setTooltip("Read for Evapotranspiration");
        this.setHelpUrl("");
    },
};
