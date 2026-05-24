import * as Blockly from 'blockly/core';

Blockly.Blocks["WIFI_begin"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("connect WiFi ssid")
            .appendField(new Blockly.FieldTextInput("test"), "ssid")
            .appendField("password")
            .appendField(new Blockly.FieldTextInput("test"), "password");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("connect WiFi");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["WIFI_begin_2"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("connect WiFi ssid")
            .appendField(new Blockly.FieldTextInput("test"), "ssid")
            .appendField("password")
            .appendField(new Blockly.FieldTextInput("test"), "password");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("connect WiFi");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["WIFI_begin_3"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("connect WiFi ssid")
            .appendField(new Blockly.FieldTextInput("test"), "ssid")
            .appendField("password")
            .appendField(new Blockly.FieldTextInput("test"), "password");
        // this.appendDummyInput()
        //   .appendField("คุณปลูกพืชอะไร")
        //   .appendField(
        //     new Blockly.FieldTextInput("ปลูกต้น..."),
        //     "plant"
        //   );
        this.appendDummyInput()
            .appendField("เกษตร")
            .appendField(new Blockly.FieldDropdown([["-", "-"], ["การปลูกพืช", "การปลูกพืช"], ["การปศุสัตว์", "การปศุสัตว์"], ["การประมง", "การประมง"]]), "argtype")
            .appendField("คือ")
            .appendField(
                new Blockly.FieldTextInput("#ต้นมะระ #เกษตรอินทรีย์ #ไฮโดรโปนิกส์"),
                "argdetail"
            );
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("connect WiFi");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["netpie_begin"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("NETPIE Begin");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("HOST")
            .appendField(
                new Blockly.FieldTextInput("broker.netpie.io"),
                "MQTT_HOST"
            );
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("Client ID")
            .appendField(new Blockly.FieldTextInput(""), "CLIENT_ID");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("Token")
            .appendField(new Blockly.FieldTextInput(""), "MQTT_USERNAME");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("Secret")
            .appendField(new Blockly.FieldTextInput(""), "MQTT_PASSWORD");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_LEFT)
            .appendField("PORT")
            .appendField(new Blockly.FieldTextInput("1883"), "MQTT_PORT");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["netpie_connect"] = {
    init: function () {
        let clientId =
            "CLIENT-" + Math.random().toString(36).substring(5).toUpperCase();
        this.appendDummyInput()
            .appendField(
                new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*")
            )
            .appendField("CONNECT")
            .appendField(new Blockly.FieldTextInput(""), "MQTT_CLIENT_ID");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["pub_topic"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("pub_topic");

        this.appendDummyInput()
            .appendField("TOPIC")
            .appendField(
                new Blockly.FieldTextInput("topic_to_pub"),
                "topic_to_pub_netpie"
            );
        this.appendValueInput("value_to_pub_netpie")
            .setCheck(null)
            .appendField("value_to_pub");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["payload"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("message(payload)");
        this.setOutput(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["netpie_topic"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("Topic_netpie");
        this.setOutput(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

// Blockly.Blocks["text"] = {
//     init: function () {
//         this.appendDummyInput()
//             .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
//             .appendField("Text")
//             .appendField(new Blockly.FieldTextInput(""), "text_");
//         this.setOutput(true, null);
//         this.setColour("#FF5757");
//         this.setTooltip("");
//         this.setHelpUrl("");
//     },
// };

Blockly.Blocks["callback_netpie"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(
                new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*")
            )
            .appendField("MQTT CALLBACK topic");
        this.appendStatementInput("loop_callback").setCheck(null);
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["callback_topic"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("Topic_Callback")
            .appendField(new Blockly.FieldTextInput(""), "topic_callback");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["callback_setup"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/icon/netpie-logo.png", 24, 24, "*"))
            .appendField("Callback_Setup");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF5757");
        this.setTooltip("");
        this.setHelpUrl("");
    },
};