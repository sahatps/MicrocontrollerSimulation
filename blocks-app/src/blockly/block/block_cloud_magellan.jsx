import * as Blockly from 'blockly/core';

Blockly.Blocks["magellan_begin"] = {
    init: function () {
      // this.appendDummyInput()
      // .appendField(new Blockly.FieldImage(
      //   "/static/icons/icons8_electronics_96px.png",
      //   24,
      //   24,
      //   "*"))
      // this.appendDummyInput()
      //   .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Magellan Begin");
      // .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 40, 40, "*"));
      // this.appendDummyInput()
      //   .appendField("Magellan Begin");
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField("Endpoint")
        .appendField(new Blockly.FieldTextInput("magellan.ais.co.th"), "MQTT_HOST");
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField("ThingIdentifier")
        .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_IDENT");
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField("ThingSecret")
        .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_SECRET");
      // this.appendDummyInput()
      //   .setAlign(Blockly.ALIGN_LEFT)
      //   .appendField("PORT")
      //   .appendField(new Blockly.FieldTextInput("1883"), "MQTT_PORT");
      // this.appendDummyInput()
      // .appendField('setClientBuffSize')
      // .appendField(new Blockly.FieldDropdown([["default", "defaultBuffer"], ["defaultOTA", "defaultOTABuffer"]]), "MQTT_clientBuffer");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("magellan_begin");
      this.setHelpUrl("");
    }
  };

  // Blockly.Blocks["magellan_begin2"] = {
  //   init: function () {
  //     // this.appendDummyInput()
  //     // .appendField(new Blockly.FieldImage(
  //     //   "/static/icons/icons8_electronics_96px.png",
  //     //   24,
  //     //   24,
  //     //   "*"))
  //     this.appendDummyInput()
  //       .appendField(new Blockly.FieldImage(
  //         ("/icon/icon-magellan.png"),
  //         30,
  //         30,
  //         "*"))
  //       .appendField("Magellan Begin");
  //     // this.appendDummyInput()
  //     // .appendField("Magellan Begin");
  //     // this.appendDummyInput()
  //     // .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 30, 30, { alt: '*', flipRtl: 'FALSE'}));
  //     // // this.appendDummyInput()
  //     //   .appendField("Magellan Begin");
  //     this.appendValueInput("msg")
  //       .appendField("Endpoint: ");
  //     // this.setInputsInline(true);

  //     this.appendDummyInput()
  //       .setAlign(Blockly.ALIGN_LEFT)
  //       .appendField("ThingIdentifier")

  //       .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_IDENT");
  //     this.appendDummyInput()
  //       .setAlign(Blockly.ALIGN_LEFT)
  //       .appendField("ThingSecret")
  //       .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_SECRET");
  //     // this.appendDummyInput()
  //     //   .appendField('setClientBuffSize')
  //     // .appendField(new Blockly.FieldDropdown([["default", "defaultBuffer"], ["defaultOTA", "defaultOTABuffer"]]), "MQTT_clientBuffer");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#17bf28");
  //     this.setTooltip("magellan_begin");
  //     this.setHelpUrl("");
  //   }
  // };

  Blockly.Blocks["magellan_begin3"] = {
    init: function () {
      // this.appendDummyInput()
      // .appendField(new Blockly.FieldImage(
      //   "/static/icons/icons8_electronics_96px.png",
      //   24,
      //   24,
      //   "*"))
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 30, 30, "*"))
        .appendField("Magellan Begin");
      // // this.appendDummyInput()
      //   .appendField("Magellan Begin");
      this.appendDummyInput()
        .appendField("Endpoint ")
        .appendField(new Blockly.FieldDropdown([["magellan.ais.co.th", "magellan.ais.co.th"], ["enterprise-magellan.ais.co.th", "device-entmagellan.ais.co.th"]]), "endpoint");

      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField("ThingIdentifier")

        .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_IDENT");
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField("ThingSecret")
        .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_SECRET");
      // this.appendDummyInput()
      //   .appendField('setClientBuffSize')
      //   .appendField(new Blockly.FieldDropdown([["default", "defaultBuffer"], ["defaultOTA", "defaultOTABuffer"]]), "MQTT_clientBuffer");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("magellan_begin");
      this.setHelpUrl("");
    }
  };

  // Blockly.Blocks["magellan_begin4_ota"]  = {
  //   init: function() {
  //     // this.appendDummyInput()
  //     // .appendField(new Blockly.FieldImage(
  //     //   "/static/icons/icons8_electronics_96px.png",
  //     //   24,
  //     //   24,
  //     //   "*"))
  //     this.appendDummyInput()      
  //     .appendField(new Blockly.FieldImage(
  //       ("/icon/icon-magellan.png"),
  //       30,
  //       30,
  //       "*"))
  //     .appendField("Magellan Begin");
  //     this.appendDummyInput()
  //       .appendField("Endpoint ")
  //       .appendField(new Blockly.FieldDropdown([["magellan.ais.co.th", "magellan.ais.co.th"], ["enterprise-magellan.ais.co.th", "device-entmagellan.ais.co.th"]]), "endpoint");

  //     this.appendDummyInput()
  //       .setAlign(Blockly.ALIGN_LEFT)
  //       .appendField("ThingIdentifier")

  //     .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_IDENT");
  //     this.appendDummyInput()
  //       .setAlign(Blockly.ALIGN_LEFT)
  //       .appendField("ThingSecret")
  //       .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_SECRET");
  //     this.appendDummyInput()
  //       .appendField('Enable Auto OTA')
  //       .appendField(new Blockly.FieldCheckbox(true), 'MAGEL_OTA'); // Removed `this.validate.bind(this)`
  //     this.appendDummyInput()
  //       .appendField('setClientBuffSize')
  //       .appendField(new Blockly.FieldDropdown([["default", "defaultBuffer"], ["defaultOTA", "defaultOTABuffer"]]), "MQTT_clientBuffer");

  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#17bf28");
  //     this.setTooltip("magellan_begin");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks["magellan_begin4"]  = {
  //   init: function() {
  //     this.appendDummyInput()
  //       .appendField("Magellan Begin");
  //       this.appendDummyInput()
  //       .appendField("Endpoint ")
  //       .appendField(new Blockly.FieldDropdown([["Zone Maker", "magellan.ais.co.th"], ["Zone Enterprise", "device-entmagellan.ais.co.th"]]), "endpoint");

  //     this.appendDummyInput()
  //       .appendField('Custom Setting')
  //       .appendField(new Blockly.FieldCheckbox(false,this.validate.bind(this), 'CUSTOM_SETTING'), this.validate(this.getFieldValue('CUSTOM_SETTING')))

  //     // this.appendDummyInput()
  //     // .setAlign(Blockly.ALIGN_LEFT)
  //     // .appendField("ThingIdentifier")

  //     // .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_IDENT");
  //     // this.appendDummyInput()
  //     //   .setAlign(Blockly.ALIGN_LEFT)
  //     //   .appendField("ThingSecret")
  //     //   .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_SECRET");
  //     this.appendDummyInput()
  //       .appendField('setClientBuffSize')
  //       .appendField(new Blockly.FieldDropdown([["default", "defaultBuffer"], ["defaultOTA", "defaultOTABuffer"]]), "MQTT_clientBuffer");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#17bf28");
  //     this.setTooltip("magellan_begin");
  //     this.setHelpUrl("");

  //   },

  //   validate: function(newValue) {
  //     var sourceBlock = this.getSourceBlock();
  //     sourceBlock.showTextField_ = newValue == 'TRUE';
  //     sourceBlock.updateTextField();

  //     return newValue;
  //   },

  //   updateTextField: function() {
  //     var input = this.getInput('DUMMY');
  //     if (!this.showComments_) {
  //       input.removeField('MQTT_THING_IDENT');
  //       input.removeField('MQTT_THING_SECRET');
  //     // **Add comments back if checkbox is checked**
  //     } else if (this.showComments_ && !this.getField('MQTT_THING_IDENT')) {
  //       input
  //         .appendField("ThingIdentifier")
  //         .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_IDENT")
  //         .appendField("ThingSecret")
  //         .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_SECRET");
  //     }
  //   }

  // handleCheckboxChange: function(newValue) {
  //   this.showComments_ = newValue; // Update internal state
  //   this.updateCommentFields();
  // },

  // updateCommentFields: function() {
  //   let commentInput = this.getInput('DUMMY'); // Assuming the comment input is named 'DUMMY'

  //   // **Clear existing comments if checkbox is unchecked**
  //   if (!this.showComments_) {
  //     commentInput.removeField('MQTT_THING_IDENT');
  //     commentInput.removeField('MQTT_THING_SECRET');
  //   // **Add comments back if checkbox is checked**
  //   } else if (this.showComments_ && !this.getField('MQTT_THING_IDENT')) {
  //     commentInput
  //       .appendField("// ThingIdentifier")
  //       .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_IDENT")
  //       .appendField("// ThingSecret")
  //       .appendField(new Blockly.FieldTextInput(""), "MQTT_THING_SECRET");
  //   }
  // }
  // };

  // Blockly.Blocks['endpoint_maker'] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
  //     this.appendDummyInput()
  //       .appendField("zone Maker")
  //     this.setOutput(true, null);
  //     this.setColour("#FF5757");
  //     this.setTooltip("endpoint zone maker");
  //     this.setHelpUrl("magellan.ais.co.th");
  //   }
  // };


  Blockly.Blocks['magellan_isconnected'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField("Magellan Is Connected")
      this.setOutput(true, null);
      this.setColour("#17bf28");
      this.setTooltip("status MQTT isConnected");
      this.setHelpUrl("magellan.ais.co.th");
    }
  };


  // Blockly.Blocks['endpoint_enterprise'] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
  //     this.appendDummyInput()
  //       .appendField("zone Enterprise")
  //     this.setOutput(true, null);
  //     this.setColour("#FF5757");
  //     this.setTooltip("endpoint zone enterprise");
  //     this.setHelpUrl("device-entmagellan.ais.co.th");
  //   }
  // };

  Blockly.Blocks['wifi_magellan_begin'] = {
    init: function () {
      // this.appendDummyInput()
      // .appendField(new Blockly.FieldImage(
      //   "/static/icons/netpie-logo.png",
      //   24,
      //   24,
      //   "*"))
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
      this.appendDummyInput()
        .appendField("connect WiFi ssid")
        .appendField(new Blockly.FieldTextInput("config ssid"), "ssid")
        .appendField("password")
        .appendField(new Blockly.FieldTextInput("config pass"), "password");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("connect magellan WiFi");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["magellan_interval"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
      this.appendDummyInput()
        .appendField("Interval Time")
        .appendField(new Blockly.FieldTextInput("10"), "interval")
        .appendField("second.");
      // this.appendDummyInput()
      //   .appendField(new Blockly.FieldImage(
      //     "/static/icons/netpie-logo.png",
      //     24,
      //     24,
      //     "*"))
      // .appendField("MQTT CALLBACK topic");
      this.appendStatementInput("func_to_do")
        .setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["magellan_interval2"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
      this.appendDummyInput()
        .appendField("Interval Time")
      this.appendValueInput("interval")
      this.appendDummyInput()
        .appendField("second")
      // this.appendDummyInput()
      //   .appendField(new Blockly.FieldImage(
      //     "/static/icons/netpie-logo.png",
      //     24,
      //     24,
      //     "*"))
      // .appendField("MQTT CALLBACK topic");
      this.appendStatementInput("func_to_do")
        .setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  // Blockly.Blocks["callback_control"] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
  //     this.appendDummyInput()
  //       // .appendField(new Blockly.FieldImage(
  //       //   "/static/icons/netpie-logo.png",
  //       //   24,
  //       //   24,
  //       //   "*"))
  //       .appendField("CALLBACK Control");
  //     this.appendStatementInput("loop_callback")
  //       .setCheck(null);
  //     this.setInputsInline(true);
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#FF5757");
  //     this.setTooltip("Magellang Callback Control");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks["callback_report"] = {
  //   init: function() {
  //     this.appendDummyInput()
  //       // .appendField(new Blockly.FieldImage(
  //       //   "/static/icons/netpie-logo.png",
  //       //   24,
  //       //   24,
  //       //   "*"))
  //       .appendField("CALLBACK RespReport");
  //     this.appendStatementInput("loop_callback")
  //       .setCheck(null);
  //     this.setInputsInline(true);
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#FF5757");
  //     this.setTooltip("Magellang Callback RespReport");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks["callback_serverconfig"] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       // .appendField(new Blockly.FieldImage(
  //       //   "/static/icons/netpie-logo.png",
  //       //   24,
  //       //   24,
  //       //   "*"))
  //       .appendField("CALLBACK serverConfig");
  //     this.appendStatementInput("loop_callback")
  //       .setCheck(null);
  //     this.setInputsInline(true);
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#FF5757");
  //     this.setTooltip("Magellang Callback serverConfig");
  //     this.setHelpUrl("");
  //   }
  // };

  Blockly.Blocks["callback_magellan"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
      // this.appendDummyInput()
      // .appendField(new Blockly.FieldImage(
      //   "/static/icons/netpie-logo.png",
      //   24,
      //   24,
      //   "*"))
      // .appendField("CALLBACK serverConfig");
      this.appendDummyInput()
        .appendField("Magellan Callback ")
        .appendField(new Blockly.FieldDropdown([["Control & ACK", "Control"], ["Server Config", "Server Config"]]), "reqType");
      this.appendStatementInput("loop_callback")
        .setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("Magellang Callback serverConfig");
      this.setHelpUrl("");
    }
  };

  // Blockly.Blocks["subscribes_group"] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       // .appendField(new Blockly.FieldImage(
  //       //   "/static/icons/netpie-logo.png",
  //       //   24,
  //       //   24,
  //       //   "*"))
  //       .appendField("Subscribes Handler");
  //     this.appendStatementInput("loop_callback")
  //       .setCheck(null);
  //     this.setInputsInline(true);
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#FF5757");
  //     this.setTooltip("Trigger once time or once after reconnect");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks['magellan_subscribe_control'] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       .appendField("Subscribe Control")
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#4586ff");
  //     this.setTooltip("Subscribe Control");
  //     this.setHelpUrl("");
  //   }
  // };

  Blockly.Blocks['magellan_reconnect'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(
          ("/icon/icon-magellan.png"),
          25,
          25,
          "*"))
      // .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"));
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField("Magellan Reconnect")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("Magellan Reconnect");
      this.setHelpUrl("");
    }
  };

//   Blockly.Blocks['magellan_condition_callback'] = {
//     init: function () {
//       this.setInputsInline(true);
//       this.appendDummyInput()
//         .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
//         .appendField("If Sensor Name")
//         .appendField(new Blockly.FieldTextInput("SensorName"), "sensorKey");
//       this.appendDummyInput()
//         .appendField("Value ")
//         .appendField(new Blockly.FieldTextInput("Value"), "sensorValue");

//       this.appendStatementInput("DO0")
//         .setCheck(null)
//         .appendField("do");

//       this.elseifCount_ = 0; // Counter for else if conditions
//       this.elseCount_ = 0;   // Counter for else condition
//       this.setMutator(new Blockly.Mutator(['else_if', 'else'])); // Add mutator
//       this.setPreviousStatement(true, null);
//       this.setNextStatement(true, null);
//       this.setColour("#17bf28");
//       this.setTooltip("");
//       this.setHelpUrl("");
//       this.updateShape_(); // Updates the block to add/remove fields
//     },

//     mutationToDom: function () {
//       var container = document.createElement('mutation');
//       container.setAttribute('elseif', this.elseifCount_);
//       container.setAttribute('else', this.elseCount_);
//       return container;
//     },

//     domToMutation: function (xmlElement) {
//       this.elseifCount_ = parseInt(xmlElement.getAttribute('elseif'), 10);
//       this.elseCount_ = parseInt(xmlElement.getAttribute('else'), 10);
//       this.updateShape_();
//     },

//     decompose: function (workspace) {
//       var containerBlock = workspace.newBlock('if_else_mutator');
//       containerBlock.initSvg();
//       var connection = containerBlock.getInput('STACK').connection;

//       // Add elseif conditions
//       for (var i = 0; i < this.elseifCount_; i++) {
//         var elseifBlock = workspace.newBlock('else_if');
//         elseifBlock.initSvg();
//         connection.connect(elseifBlock.previousConnection);
//         connection = elseifBlock.nextConnection;
//       }

//       // Add else condition if exists
//       if (this.elseCount_) {
//         var elseBlock = workspace.newBlock('else');
//         elseBlock.initSvg();
//         connection.connect(elseBlock.previousConnection);
//       }

//       return containerBlock;
//     },

//     compose: function (containerBlock) {
//       var clauseBlock = containerBlock.getInputTargetBlock('STACK');
//       this.elseifCount_ = 0;
//       this.elseCount_ = 0;

//       var statementConnections = [null];

//       while (clauseBlock) {
//         if (clauseBlock.type === 'else_if') {
//           this.elseifCount_++;
//           statementConnections.push(clauseBlock.statementConnection_);
//         } else if (clauseBlock.type === 'else') {
//           this.elseCount_++;
//           statementConnections.push(clauseBlock.statementConnection_);
//         }
//         clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
//       }

//       this.updateShape_();

//       for (var i = 0; i < this.elseifCount_; i++) {
//         Blockly.Mutator.reconnect(statementConnections[i + 1], this, 'DO' + (i + 1));
//       }
//       if (this.elseCount_) {
//         Blockly.Mutator.reconnect(statementConnections[this.elseifCount_ + 1], this, 'ELSE');
//       }
//     },

//     updateShape_: function () {
//       if (this.getInput('ELSE')) {
//         this.removeInput('ELSE');
//       }
//       for (let i = 1; this.getInput('DO' + i); i++) {
//         this.removeInput('DO' + i);
//       }

//       // Add or update else if blocks
//       for (let i = 1; i <= this.elseifCount_; i++) {
//         this.appendStatementInput('DO' + i)
//           .setCheck(null)
//           .appendField("else if Value")
//           .appendField(new Blockly.FieldTextInput("Value" + i), "sensorValue" + i);
//       }

//       // Add or update else block
//       if (this.elseCount_) {
//         this.appendStatementInput('ELSE')
//           .setCheck(null)
//           .appendField("else");
//       }
//     }
//   };


//   // Mutator container block for if-else block
//   Blockly.Blocks['if_else_mutator'] = {
//     init: function () {
//       this.appendDummyInput()
//         .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
//         .appendField("if-else structure");
//       this.appendStatementInput('STACK');
//       this.setColour("#17bf28");
//       this.setTooltip("");
//       this.contextMenu = false;
//     }
//   };

//   Blockly.Blocks['else_if'] = {
//     init: function () {
//       this.appendDummyInput()
//         .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
//         .appendField("else if value")
//         .appendField(new Blockly.FieldTextInput("sensorValue"), "sensorValue");
//       this.appendStatementInput("DO")
//         .setCheck(null)
//         .appendField("do");
//       this.setPreviousStatement(true);
//       this.setNextStatement(true);
//       this.setColour("#17bf28");
//       this.setTooltip("Else if block with custom value input");
//       this.setHelpUrl("");
//     }
//   };

//   Blockly.Blocks['else'] = {
//     init: function () {
//       this.appendDummyInput()
//         .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
//         .appendField("else");
//       this.appendStatementInput("DO")
//         .setCheck(null)
//       // .appendField("do");
//       this.setPreviousStatement(true);
//       this.setNextStatement(true);
//       this.setColour("#17bf28");
//       this.setTooltip("Else block");
//       this.setHelpUrl("");
//     }
//   };


  //   Blockly.Blocks['sensor_key_value'] = {
  //     init: function () {
  //         this.setInputsInline(true);
  //         this.appendDummyInput()
  //             .appendField("Is Key")
  //             .appendField(new Blockly.FieldTextInput("Key"), "sensorKey");
  //         this.appendDummyInput()
  //             .appendField("Value")
  //             .appendField(new Blockly.FieldTextInput("Value"), "sensorValue");

  //         this.appendStatementInput("DO0")
  //             .setCheck(null)
  //             .appendField("do");

  //         this.elseifCount_ = 0; // Counter for else if conditions
  //         this.elseCount_ = 0;   // Counter for else condition
  //         this.setMutator(new Blockly.Mutator(['else_if', 'else'])); // Add mutator for else if and else
  //         this.setPreviousStatement(true, null);
  //         this.setNextStatement(true, null);
  //         this.setColour("#4586ff");
  //         this.setTooltip("");
  //         this.setHelpUrl("");
  //         this.updateShape_();
  //     },

  //     mutationToDom: function () {
  //         var container = document.createElement('mutation');
  //         container.setAttribute('elseif', this.elseifCount_);
  //         container.setAttribute('else', this.elseCount_);
  //         return container;
  //     },

  //     domToMutation: function (xmlElement) {
  //         this.elseifCount_ = parseInt(xmlElement.getAttribute('elseif'), 10);
  //         this.elseCount_ = parseInt(xmlElement.getAttribute('else'), 10);
  //         this.updateShape_();
  //     },

  //     decompose: function (workspace) {
  //         var containerBlock = workspace.newBlock('if_else_mutator');
  //         containerBlock.initSvg();
  //         var connection = containerBlock.getInput('STACK').connection;

  //         // Add elseif conditions
  //         for (var i = 0; i < this.elseifCount_; i++) {
  //             var elseifBlock = workspace.newBlock('else_if');
  //             elseifBlock.initSvg();
  //             connection.connect(elseifBlock.previousConnection);
  //             connection = elseifBlock.nextConnection;
  //         }

  //         // Add else condition if it exists
  //         if (this.elseCount_) {
  //             var elseBlock = workspace.newBlock('else');
  //             elseBlock.initSvg();
  //             connection.connect(elseBlock.previousConnection);
  //         }

  //         return containerBlock;
  //     },

  //     compose: function (containerBlock) {
  //         var clauseBlock = containerBlock.getInputTargetBlock('STACK');
  //         this.elseifCount_ = 0;
  //         this.elseCount_ = 0;

  //         var statementConnections = [null];

  //         // Handle "else if" and "else" blocks
  //         while (clauseBlock) {
  //             if (clauseBlock.type === 'else_if') {
  //                 this.elseifCount_++;
  //                 statementConnections.push(clauseBlock.statementConnection_);
  //             } else if (clauseBlock.type === 'else') {
  //                 this.elseCount_++;
  //                 statementConnections.push(clauseBlock.statementConnection_);
  //             }
  //             clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
  //         }

  //         this.updateShape_();

  //         // Reconnect the statements after mutation
  //         for (var i = 0; i < this.elseifCount_; i++) {
  //             Blockly.Mutator.reconnect(statementConnections[i + 1], this, 'DO' + (i + 1));
  //         }
  //         if (this.elseCount_) {
  //             Blockly.Mutator.reconnect(statementConnections[this.elseifCount_ + 1], this, 'ELSE');
  //         }
  //     },

  //     updateShape_: function () {
  //         // Remove all inputs for else if and else
  //         if (this.getInput('ELSE')) {
  //             this.removeInput('ELSE');
  //         }
  //         for (var i = 1; this.getInput('DO' + i); i++) {
  //             this.removeInput('DO' + i);
  //         }

  //         // Recreate else if statements
  //         for (var i = 1; i <= this.elseifCount_; i++) {
  //             this.appendStatementInput('DO' + i)
  //                 .setCheck(null)
  //                 .appendField("else if")
  //                 .appendField(new Blockly.FieldTextInput("sensorValue"), "sensorValue" + i); // Custom input field
  //         }

  //         // Recreate else statement if needed
  //         if (this.elseCount_) {
  //             this.appendStatementInput('ELSE')
  //                 .setCheck(null)
  //                 .appendField("else");
  //         }
  //     }
  // };


  // Blockly.Blocks['array_mutator_container'] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("Array");
  //     this.appendStatementInput('STACK');
  //     this.setColour(160);
  //     this.setTooltip("");
  //     this.contextMenu = false;
  //   }
  // };

  // // Array element block used within the mutator
  // Blockly.Blocks['array_element'] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("Item");
  //     this.setPreviousStatement(true);
  //     this.setNextStatement(true);
  //     this.setColour(160);
  //     this.setTooltip("");
  //     this.contextMenu = false;
  //   }
  // };

  // // JavaScript code generation for the custom block
  // Blockly.JavaScript['dynamic_array'] = function (block) {
  //   var code = '[';
  //   for (var i = 0; i < block.itemCount_; i++) {
  //     var value = Blockly.JavaScript.valueToCode(block, 'ADD' + i, Blockly.JavaScript.ORDER_ATOMIC);
  //     code += (value || 'null') + (i < block.itemCount_ - 1 ? ', ' : '');
  //   }
  //   code += ']';
  //   return [code, Blockly.JavaScript.ORDER_ATOMIC];
  // };

  // Blockly.Blocks['magellan_subscribe_report'] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       .appendField("Subscribe Response Report")
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#4586ff");
  //     this.setTooltip("Subscribe Response Report");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks['magellan_subscribe_server_config'] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       .appendField("Subscribe ServerConfig")
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#4586ff");
  //     this.setTooltip("Subscribe ServerConfig");
  //     this.setHelpUrl("");
  //   }
  // };

  Blockly.Blocks['magellan_subscribe'] = {
    init: function () {
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Subscribe ")
        .appendField(new Blockly.FieldDropdown([["Control", "Control"], ["Server Config", "Server Config"]]), "reqType");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['magellan_request'] = {
    init: function () {
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Request Value ")
        .appendField(new Blockly.FieldDropdown([["Control", "Control"], ["Server Config", "Server Config"]]), "reqType");
      this.appendDummyInput()
        .appendField(" From Sensor Name ")
        .appendField(new Blockly.FieldTextInput("SensorName"), "sensorKey")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['magellan_sensor_add'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Add Sensor Name: ")
        .appendField(new Blockly.FieldTextInput("SensorName"), "sensorKey")
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.appendValueInput("sensorValue")
        .appendField("Value: ");
      this.setTooltip("Add Sensor");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['magellan_sensor_add_txt'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Add Sensor Name: ")
        .appendField(new Blockly.FieldTextInput("SensorName"), "sensorKey")
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.appendDummyInput()
        .appendField(" type ")
        .appendField(new Blockly.FieldDropdown([["String", "String"], ["Int", "Int"], ["Float", "Float"], ["Boolean", "Boolean"]]), "sensor_type");
      this.appendDummyInput()
        .appendField("Value")
        .appendField(new Blockly.FieldTextInput("Value"), "sensorValue")
      this.setTooltip("Add Sensor");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['magellan_sensor_report'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Report Sensor");
      this.setTooltip("Report Sensor");
      this.appendStatementInput("report_sensor")
        .setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['magellan_client_config_add'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Add Client Config Name: ")
        .appendField(new Blockly.FieldTextInput("ConfigName"), "sensorKey")
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.appendValueInput("sensorValue")
        .appendField("Value: ");
      this.setTooltip("Add Client config");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['magellan_client_config_add_txt'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Add Client Config Name: ")
        .appendField(new Blockly.FieldTextInput("ConfigName"), "sensorKey")
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.appendDummyInput()
        .appendField(" type ")
        .appendField(new Blockly.FieldDropdown([["String", "String"], ["Int", "Int"], ["Float", "Float"], ["Boolean", "Boolean"]]), "sensor_type");
      this.appendDummyInput()
        .appendField("Value")
        .appendField(new Blockly.FieldTextInput("Value"), "sensorValue")
      this.setTooltip("Add Client config");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['magellan_client_config_send'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Send Client Config");
      this.setTooltip("Send Client Config");
      this.appendStatementInput("client_config_save")
        .setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#17bf28");
      this.setHelpUrl("");
    }
  };


  Blockly.Blocks['condition_key'] = {
    init: function () {
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("On Sensor Name: ")
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["==", "=="], ["!=", "!="]]), "condition");
      this.appendDummyInput()
        .appendField(" ")
        .appendField(new Blockly.FieldTextInput("SensorName"), "eqKey")
      this.setOutput(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  // Blockly.Blocks['magellan_set_ota_auto'] = {
  //   init: function () {
  //     this.setInputsInline(true);
  //     this.appendDummyInput()
  //       .appendField("Set OTA Auto Update")
  //     this.appendDummyInput()
  //       .appendField(new Blockly.FieldDropdown([["Enable", "Enable"], ["Disable", "Disable"]]), "otaEnable");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#4586ff");
  //     this.setTooltip("");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks['magellan_check_update_ota'] = {
  //   init: function () {
  //     this.setInputsInline(true);
  //     this.appendDummyInput()
  //       .appendField("Check Update OTA")
  //     // this.appendDummyInput()
  //     //   .appendField(new Blockly.FieldDropdown([["Enable", "Enable"], ["Disable", "Disable"]]), "otaEnable");
  //     // this.setPreviousStatement(true, null);
  //     // this.setNextStatement(true, null);     
  //     this.setOutput(true, null);
  //     this.setColour("#4586ff");
  //     this.setWarningText("Not recommend to use this block high frequency inside loop should use once \n, this function make while loop and do the job until success or fail this maybe interrupt cycle working you code in the loop");
  //     this.setTooltip("");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks['magellan_get_ota_auto'] = {
  //   init: function () {
  //     this.setInputsInline(true);
  //     this.appendDummyInput()
  //       .appendField("Get Auto Update OTA")
  //     // this.appendDummyInput()
  //     //   .appendField(new Blockly.FieldDropdown([["Enable", "Enable"], ["Disable", "Disable"]]), "otaEnable");
  //     // this.setPreviousStatement(true, null);
  //     // this.setNextStatement(true, null);     
  //     this.setOutput(true, null);
  //     this.setColour("#4586ff");
  //     this.setTooltip("");
  //     this.setHelpUrl("");
  //   }
  // };

  // Blockly.Blocks['magellan_exec_ota'] = {
  //   init: function () {
  //     this.setInputsInline(true);
  //     this.appendDummyInput()
  //       .appendField("Execute OTA")
  //     // this.appendDummyInput()
  //     //   .appendField(new Blockly.FieldDropdown([["Enable", "Enable"], ["Disable", "Disable"]]), "otaEnable");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setColour("#4586ff");
  //     this.setTooltip("");
  //     this.setHelpUrl("");
  //   }
  // };

  Blockly.Blocks['condition_value'] = {
    init: function () {
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("On Value Name: ")
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["==", "=="], ["!=", "!="]]), "condition");
      this.appendDummyInput()
        .appendField(" ")
        .appendField(new Blockly.FieldTextInput("value"), "eqValue")
      this.setOutput(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['extract_value'] = {
    init: function () {
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Value")
      // this.appendDummyInput()
      //   .appendField(new Blockly.FieldDropdown([["String", "String"],["Int", "Int"], ["Float", "Float"], ["Boolean", "Boolean"]]), "extract_type");
      // this.appendDummyInput()
      //   .appendField(" ")
      //   .appendField(new Blockly.FieldTextInput("value"), "eqValue")
      this.setOutput(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['conv_val'] = {
    init: function () {
      this.setInputsInline(true);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(("/icon/icon-magellan.png"), 25, 25, "*"))
        .appendField("Convert");
      this.appendValueInput("val_conv");
      this.appendDummyInput()
        .appendField(" to ")
        .appendField(new Blockly.FieldDropdown([["String", "String"], ["Int", "Int"], ["Float", "Float"], ["Boolean", "Boolean"]]), "type_sec");
      this.setOutput(true, null);
      this.setColour("#17bf28");
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };
