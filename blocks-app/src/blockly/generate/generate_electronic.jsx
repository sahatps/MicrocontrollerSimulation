import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock["sw_on_pressed"] = function (block) {
    var ch_sw = block.getFieldValue("ch_sw");
    let REESSED = javascriptGenerator.statementToCode(block, "REESSED");
    let code = `
            if (digitalRead(sw_onboard[${ch_sw}]) == 0) {
                ${REESSED}
            }
        \n
        `;
    return code;
};
// #EXTINC #include <HandySense.h>#END

javascriptGenerator.forBlock["sw_on_release"] = function (block) {
    var ch_sw = block.getFieldValue("ch_sw");
    let RELEASE = javascriptGenerator.statementToCode(block, "RELEASE");
    let code = `
            if (digitalRead(sw_onboard[${ch_sw}]) == 1) {
                ${RELEASE}
            }
        \n
        `;
    return code;
};

javascriptGenerator.forBlock["sw_pressed"] = function (block) {
    var ch_sw = block.getFieldValue("ch_sw");
    var code = `(!digitalRead(sw_onboard[${ch_sw}]))`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock["sw_release"] = function (block) {
    var ch_sw = block.getFieldValue("ch_sw");
    var code = `(digitalRead(sw_onboard[${ch_sw}]))`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};


javascriptGenerator.forBlock["led_begin"] = function () {
    var code = "";
    code += '#EXTINC#include "MCP23008.h"#END\n';
    code += "#EXTINC#include <Wire.h>#END\n";
    code += "#VARIABLE MCP23008 MCP (0x24);#END\n";
    code += "\n";
    code += "#SETUP Wire.begin();#END\n";
    code += "#SETUP Wire.setClock(10000);#END\n";
    code += "#SETUP MCP.begin();#END\n";
    code += "#SETUP MCP.pinMode8(0x00);#END\n";
    return code;
};

//   javascriptGenerator.forBlock["led_control_on"] = function (block) {
//     var ch_led = block.getFieldValue("ch_led");
//     var code = `MCP.digitalWrite(${ch_led}, HIGH);`;
//     return code;
//   };

// javascriptGenerator.forBlock["led_control_off"] = function (block) {
// 	var ch_led = block.getFieldValue("ch_led");
// 	var code = `MCP.digitalWrite(${ch_led}, LOW);`;
// 	return code;
// };

javascriptGenerator.forBlock["led_control_on"] = function (block) {
    var ch_led = block.getFieldValue("ch_led");
    var code = `
			#EXTINC 
                #include "MCP23008.h"
			    #include <Wire.h>
            #END
            #VARIABLE 
                MCP23008 MCP (0x24);
            #END
            #SETUP 
                Wire.begin();
                Wire.setClock(10000);
                MCP.begin();
                MCP.pinMode8(0x00);
            #END
            MCP.digitalWrite(${ch_led}, HIGH);
            `;
    return code;
};

javascriptGenerator.forBlock["led_control_off"] = function (block) {
    var ch_led = block.getFieldValue("ch_led");
    var code = `
			#EXTINC 
                #include "MCP23008.h"
			    #include <Wire.h>
            #END
            #VARIABLE 
                MCP23008 MCP (0x24);
            #END
            #SETUP 
                Wire.begin();
                Wire.setClock(10000);
                MCP.begin();
                MCP.pinMode8(0x00);
            #END
            MCP.digitalWrite(${ch_led}, LOW);
            `;
    return code;
};


javascriptGenerator.forBlock['relay_on'] = function (block) {
    var ch_relay = block.getFieldValue('ch_relay');
    var code = `digitalWrite(const_relay_pin[${ch_relay}], HIGH);`;
    return code;
};

javascriptGenerator.forBlock['relay_off'] = function (block) {
    var ch_relay = block.getFieldValue('ch_relay');
    var code = `digitalWrite(const_relay_pin[${ch_relay}], LOW);`;
    return code;
};

// ===== BUZZER =====
javascriptGenerator.forBlock['buzzer_on'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, HIGH);
    `;
    return code;
};

javascriptGenerator.forBlock['buzzer_off'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, LOW);
    `;
    return code;
};

// ===== SERVO =====
javascriptGenerator.forBlock['servo_write'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var angle = javascriptGenerator.valueToCode(block, 'ANGLE', javascriptGenerator.ORDER_ATOMIC) || '0';
    var code = `
        #EXTINC #include <Servo.h> #END
        #VARIABLE Servo servo_pin${pin}; #END
        #SETUP servo_pin${pin}.attach(${pin}); #END
        servo_pin${pin}.write(${angle});
    `;
    return code;
};

// ===== FAN =====
javascriptGenerator.forBlock['fan_on'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, HIGH);
    `;
    return code;
};

javascriptGenerator.forBlock['fan_off'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, LOW);
    `;
    return code;
};

// ===== WATER PUMP =====
javascriptGenerator.forBlock['water_pump_on'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, HIGH);
    `;
    return code;
};

javascriptGenerator.forBlock['water_pump_off'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, LOW);
    `;
    return code;
};

// ===== MISTING PUMP =====
javascriptGenerator.forBlock['misting_pump_on'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, HIGH);
    `;
    return code;
};

javascriptGenerator.forBlock['misting_pump_off'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #SETUP pinMode(${pin}, OUTPUT); #END
        digitalWrite(${pin}, LOW);
    `;
    return code;
};

// ===== POTENTIOMETER =====
javascriptGenerator.forBlock['potentiometer_read'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `analogRead(${pin})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== SLIDE SWITCH =====
javascriptGenerator.forBlock['slide_switch_read'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `digitalRead(${pin})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== JOYSTICK =====
javascriptGenerator.forBlock['joystick_x'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `analogRead(${pin})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['joystick_y'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `analogRead(${pin})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== DIP SWITCH 8 =====
javascriptGenerator.forBlock['dip_switch_read'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var bit = block.getFieldValue('BIT');
    var code = `digitalRead(${pin} + ${bit})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== KY040 ROTARY =====
javascriptGenerator.forBlock['ky040_read'] = function (block) {
    var clk = block.getFieldValue('CLK');
    var dt = block.getFieldValue('DT');
    var code = `
        #VARIABLE
            int ky040_counter_${clk} = 0;
            int ky040_last_clk_${clk} = LOW;
        #END
        #SETUP pinMode(${clk}, INPUT); pinMode(${dt}, INPUT); #END
        (digitalRead(${clk}) != ky040_last_clk_${clk} ? (ky040_last_clk_${clk} = digitalRead(${clk}), ky040_last_clk_${clk} == LOW ? (digitalRead(${dt}) != ky040_last_clk_${clk} ? ky040_counter_${clk}++ : ky040_counter_${clk}--) : 0, ky040_counter_${clk}) : ky040_counter_${clk})
    `;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== NTC TEMPERATURE SENSOR =====
javascriptGenerator.forBlock['ntc_temperature'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `
        #VARIABLE
            const float NTC_BETA_${pin} = 3950.0;
            const float NTC_NOMINAL_${pin} = 10000.0;
        #END
        (1.0 / (log(((4095.0 / analogRead(${pin})) - 1.0)) / NTC_BETA_${pin} + (1.0 / (25.0 + 273.15))) - 273.15)
    `;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== SOUND SENSOR =====
javascriptGenerator.forBlock['sound_read'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `analogRead(${pin})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== HC-SR04 ULTRASONIC =====
javascriptGenerator.forBlock['hcsr04_distance'] = function (block) {
    var trig = block.getFieldValue('TRIG');
    var echo = block.getFieldValue('ECHO');
    var code = `
        #SETUP pinMode(${trig}, OUTPUT); pinMode(${echo}, INPUT); #END
        ([&](){ digitalWrite(${trig}, LOW); delayMicroseconds(2); digitalWrite(${trig}, HIGH); delayMicroseconds(10); digitalWrite(${trig}, LOW); return pulseIn(${echo}, HIGH) * 0.034 / 2; })()
    `;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== PHOTORESISTOR =====
javascriptGenerator.forBlock['photoresistor_read'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var code = `analogRead(${pin})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

// ===== RGB LED =====
javascriptGenerator.forBlock['rgb_led_set'] = function (block) {
    var rpin = block.getFieldValue('RPIN');
    var gpin = block.getFieldValue('GPIN');
    var bpin = block.getFieldValue('BPIN');
    var r = javascriptGenerator.valueToCode(block, 'RED', javascriptGenerator.ORDER_ATOMIC) || '0';
    var g = javascriptGenerator.valueToCode(block, 'GREEN', javascriptGenerator.ORDER_ATOMIC) || '0';
    var b = javascriptGenerator.valueToCode(block, 'BLUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    var code = `
        #SETUP pinMode(${rpin}, OUTPUT); pinMode(${gpin}, OUTPUT); pinMode(${bpin}, OUTPUT); #END
        analogWrite(${rpin}, ${r}); analogWrite(${gpin}, ${g}); analogWrite(${bpin}, ${b});
    `;
    return code;
};

// ===== LED BAR =====
javascriptGenerator.forBlock['led_bar_set'] = function (block) {
    var data = block.getFieldValue('DATA');
    var clk = block.getFieldValue('CLK');
    var level = javascriptGenerator.valueToCode(block, 'LEVEL', javascriptGenerator.ORDER_ATOMIC) || '0';
    var code = `
        #EXTINC #include "Grove_LED_Bar.h" #END
        #VARIABLE Grove_LED_Bar ledBar_${data}(${clk}, ${data}, 0); #END
        #SETUP ledBar_${data}.begin(); #END
        ledBar_${data}.setLevel(${level});
    `;
    return code;
};

// ===== NEOPIXEL =====
javascriptGenerator.forBlock['neopixel_set'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var index = block.getFieldValue('INDEX');
    var r = javascriptGenerator.valueToCode(block, 'RED', javascriptGenerator.ORDER_ATOMIC) || '0';
    var g = javascriptGenerator.valueToCode(block, 'GREEN', javascriptGenerator.ORDER_ATOMIC) || '0';
    var b = javascriptGenerator.valueToCode(block, 'BLUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    var code = `
        #EXTINC #include <Adafruit_NeoPixel.h> #END
        #VARIABLE Adafruit_NeoPixel neopixel_${pin}(60, ${pin}, NEO_GRB + NEO_KHZ800); #END
        #SETUP neopixel_${pin}.begin(); neopixel_${pin}.show(); #END
        neopixel_${pin}.setPixelColor(${index}, neopixel_${pin}.Color(${r}, ${g}, ${b})); neopixel_${pin}.show();
    `;
    return code;
};

// ===== SEVEN SEGMENT =====
javascriptGenerator.forBlock['seven_seg_show'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    var clkPin = parseInt(pin) + 1;
    var code = `
        #EXTINC #include <TM1637Display.h> #END
        #VARIABLE TM1637Display display_${pin}(${pin}, ${clkPin}); #END
        #SETUP display_${pin}.setBrightness(0x0f); #END
        display_${pin}.showNumberDec(${value}, false);
    `;
    return code;
};

// ===== LED RING =====
javascriptGenerator.forBlock['led_ring_set'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var index = block.getFieldValue('INDEX');
    var r = javascriptGenerator.valueToCode(block, 'RED', javascriptGenerator.ORDER_ATOMIC) || '0';
    var g = javascriptGenerator.valueToCode(block, 'GREEN', javascriptGenerator.ORDER_ATOMIC) || '0';
    var b = javascriptGenerator.valueToCode(block, 'BLUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    var code = `
        #EXTINC #include <Adafruit_NeoPixel.h> #END
        #VARIABLE Adafruit_NeoPixel ledring_${pin}(24, ${pin}, NEO_GRB + NEO_KHZ800); #END
        #SETUP ledring_${pin}.begin(); ledring_${pin}.show(); #END
        ledring_${pin}.setPixelColor(${index}, ledring_${pin}.Color(${r}, ${g}, ${b})); ledring_${pin}.show();
    `;
    return code;
};

// ===== LCD =====
javascriptGenerator.forBlock['lcd_print'] = function (block) {
    var type = block.getFieldValue('TYPE');
    var row = block.getFieldValue('ROW');
    var col = block.getFieldValue('COL');
    var text = javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_ATOMIC) || '""';
    var dims = type === '1602' ? '16, 2' : '20, 4';
    var code = `
        #EXTINC #include <LiquidCrystal_I2C.h> #include <Wire.h> #END
        #VARIABLE LiquidCrystal_I2C lcd_i2c(0x27, ${dims}); #END
        #SETUP Wire.begin(); lcd_i2c.init(); lcd_i2c.backlight(); #END
        lcd_i2c.setCursor(${col}, ${row}); lcd_i2c.print(${text});
    `;
    return code;
};

// ===== DS1307 CLOCK =====
javascriptGenerator.forBlock['ds1307_read'] = function (block) {
    var field = block.getFieldValue('FIELD');
    var code = `
        #EXTINC #include "RTClib.h" #include <Wire.h> #END
        #VARIABLE RTC_DS1307 rtc_ds1307; #END
        #SETUP Wire.begin(); rtc_ds1307.begin(); #END
        rtc_ds1307.now().${field}()
    `;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};
