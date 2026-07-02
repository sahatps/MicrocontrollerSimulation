import * as Blockly from 'blockly/core';

Blockly.Blocks['time_delay'] = {
    init: function () {
        this.appendValueInput("delay")
            .setCheck("Number")
            .appendField("delay");
        this.appendDummyInput()
            .appendField("millisecond");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(0);
        this.setTooltip("pause running program for awhile");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_delay_microsec'] = {
    init: function () {
        this.appendValueInput("delay")
            .setCheck("Number")
            .appendField("delay");
        this.appendDummyInput()
            .appendField("microseconds");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(0);
        this.setTooltip("pause running program for awhile");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_sync'] = {
    init: function () {
        this.appendDummyInput()
            // .appendField(new Blockly.FieldImage("/static/icons/icons8_wifi_26px.png", 20, 20, "*"))
            .appendField("sync internet time");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(0);
        this.setTooltip("sync time from internet (wifi & internet needed)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_get_year'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get year");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("get now year (use sync time block first)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_get_month'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get month");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("get now month (1-12) (use sync time block first)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_get_day'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get day of month");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("get day of month (1-31) (use sync time block first)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_get_day_of_week'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get day of week");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("get day of week (Sunday = 0 , Monday = 1 , ... , Saturday = 6) (use sync time block first)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_get_hour'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get hour");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("get hour of day (0-23) (use sync time block first)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_get_minute'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get minute");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("get minute of now hour 0-59 (use sync time block first)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_get_second'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get second");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("get now second 0-59 (use sync time block first)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_millis'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("timestamp millisecond");
        this.setInputsInline(true);
        this.setOutput(true, ["Number", "uint32_t"]);
        this.setColour(0);
        this.setTooltip("get time since program start in millisecond");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['time_micros'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("timestamp microsecond");
        this.setInputsInline(true);
        this.setOutput(true, ["Number", "uint32_t"]);
        this.setColour(0);
        this.setTooltip("get time since program start in microsecond");
        this.setHelpUrl("");
    }
};

Blockly.Blocks["setup_hardware_RTC2"] = {
    init: function () {
        this.appendDummyInput().appendField("setup hardware RTC");
        this.appendDummyInput("")
            .appendField("RTC IC : ")
            .appendField(
                new Blockly.FieldDropdown([
                    ["DS1307", "RTC_DS1307"],
                    ["DS1388", "RTC_DS1388"],
                    ["DS3231", "RTC_DS3231"],
                    ["PCF8523", "RTC_PCF8523"],
                    ["PCF8563", "RTC_PCF8563"],
                ]),
                "_rtc"
            );
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#cb7070");
        this.setTooltip("setup RTC");
        this.setHelpUrl("");
    },
};
Blockly.Blocks["print_rtc_time"] = {
    init: function () {
        this.appendDummyInput().appendField("print rtc time");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#cb7070");
        this.setTooltip("print rtc time");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["update_system_time_with_rtc2"] = {
    init: function () {
        this.appendDummyInput().appendField("update system time with rtc");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#cb7070");
        this.setTooltip("update system time with rtc");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["get_rtc_time"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc time");
        this.setOutput(true, "String");
        this.setColour("#cb7070");
        this.setTooltip("get rtc time");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["get_rtc_year"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc: year");
        this.setOutput(true, "Number");
        this.setColour("#cb7070");
        this.setTooltip("get rtc year");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["get_rtc_month"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc: month");
        this.setOutput(true, "Number");
        this.setColour("#cb7070");
        this.setTooltip("get rtc month");
        this.setHelpUrl("");
    },
};
Blockly.Blocks["get_rtc_day"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc: day");
        this.setOutput(true, "Number");
        this.setColour("#cb7070");
        this.setTooltip("get rtc day");
        this.setHelpUrl("");
    },
};
Blockly.Blocks["get_rtc_wday"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc: weekday");
        this.setOutput(true, "Number");
        this.setColour("#cb7070");
        this.setTooltip("0-Sunday ... 6-Saturday");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["get_rtc_hour"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc: hour");
        this.setOutput(true, "Number");
        this.setColour("#cb7070");
        this.setTooltip("get rtc hour");
        this.setHelpUrl("");
    },
};
Blockly.Blocks["get_rtc_minute"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc: minute");
        this.setOutput(true, "Number");
        this.setColour("#cb7070");
        this.setTooltip("get rtc minute");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["get_rtc_second"] = {
    init: function () {
        this.appendDummyInput().appendField("get rtc: second");
        this.setOutput(true, "Number");
        this.setColour("#cb7070");
        this.setTooltip("get rtc second");
        this.setHelpUrl("");
    },
};
Blockly.Blocks["set_rtc_time2"] = {
    init: function () {
        this.appendDummyInput().appendField("set RTC time:");
        this.appendValueInput("_year").setCheck(["Number"]).appendField("Year:");
        this.appendValueInput("_month")
            .setCheck(["Number"])
            .appendField("Month:");
        this.appendValueInput("_day").setCheck(["Number"]).appendField("Day:");
        this.appendValueInput("_hour").setCheck(["Number"]).appendField("HH:");
        this.appendValueInput("_minute").setCheck(["Number"]).appendField("MM:");
        this.appendValueInput("_second").setCheck(["Number"]).appendField("SS:");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#cb7070");
        this.setTooltip("set RTC time");
        this.setHelpUrl("");
    },
};

Blockly.Blocks["set_system_time2"] = {
    init: function () {
        this.appendDummyInput().appendField("set system time:");
        this.appendValueInput("_year").setCheck(["Number"]).appendField("Year:");
        this.appendValueInput("_month")
            .setCheck(["Number"])
            .appendField("Month:");
        this.appendValueInput("_day").setCheck(["Number"]).appendField("Day:");
        this.appendValueInput("_hour").setCheck(["Number"]).appendField("HH:");
        this.appendValueInput("_minute").setCheck(["Number"]).appendField("MM:");
        this.appendValueInput("_second").setCheck(["Number"]).appendField("SS:");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#cb7070");
        this.setTooltip("set system time");
        this.setHelpUrl("");
    },
};