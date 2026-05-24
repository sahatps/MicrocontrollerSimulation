import * as Blockly from 'blockly/core';

Blockly.Blocks['arduino_setup'] = {
  init: function () {
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Setup");
    this.setColour(120); // green
    this.setTooltip("Arduino setup function");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['arduino_loop'] = {
  init: function () {
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Loop");

    this.setColour(120); // green
    this.setTooltip("Arduino main loop function");
    this.setHelpUrl("");
  }
};
