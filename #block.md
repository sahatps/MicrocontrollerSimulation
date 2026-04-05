## Blocks (BFarm) Overview

The Blocks page is a visual programming workspace for building smart-farm and embedded workflows with drag‑and‑drop blocks. It syncs with the Circuit (HackCable) canvas and can send generated code back to HackCable for simulation or compilation.

- Visual logic building with categories for sensors, GPIO, networking, time, cronjobs, and more
- Bi‑directional sync with HackCable: receive code from Circuit; send generated code back
- Ready‑made solution blocks for common scenarios (e.g., fertilizer control, evapotranspiration)
- Code export, verification, and optional auto‑sync to Circuit


### User Flow

1) Open the Blocks page
   - Launch the dev server and open the app at the shell UI with the `#blocks` hash (Blocks tab).

2) Build your flow
   - Drag blocks from the left toolbox onto the workspace. Arrange logic for sensors, timers, conditions, and actions.

3) Sync code with Circuit (HackCable)
   - From Circuit, click “Transfer to Blocks” or enable “Auto-sync” to bring code into Blocks.
   - From Blocks, use the toolbar action to send generated code back to HackCable for simulation or wiring.

4) Iterate
   - Tweak blocks, re‑sync, and verify on Circuit. Repeat until behavior matches your needs.


### Left Sidebar Categories and Entries (excluding “Components”)

```text
HS Generic
  HandySense_Setup
  HandySense_Update
  HandySense_setTime_Interval_Sensor
  HandySense_setTime_Interval_publishData
  HandySense_setPin_Relay
  HandySense_setPin_SensorError
  HandySense_brownout

Solution
  Alternate Wetting and Drying
    HandySense_awdv1
  Evapotranspiration
    HandySense_et0v1_begin
    HandySense_et0v1_et0
    HandySense_et0v1_etc
  Fertilizer Control
    Initial_Fertilizer
    Load_preferences
    Clear_preferences
    Print_preferences
    control_EC
    control_pH
    Read_pH
    Read_temp
    Read_EC
    set_preferences
    set_single_preferences
    read_single_preferences

Sensor
  Carbon dioxide
    Weather_HTCo2PLx_begin_rs485
    Weather_HTCo2PLx_read_co2_rs485
  Humidity
    sht31_begin_rs
    sht31_read_humid_rs
    sht31_begin_i2c
    sht31_read_init_i2c
    sht31_read_humid_i2c
  Light
    rs485_light_begin
    rs485_Light_read
    bh1750_begin
    bh1750_read
  pH
    rs485_PH_begin
    rs485_PH_read
  Pressure
    Weather_HTCo2PLx_begin_rs485
    Weather_HTCo2PLx_read_pressure_rs485
  Rain
    Rain_begin_rs485
    Rain_read_rs485
  Temperature
    sht31_begin_rs
    sht31_read_temp_rs
    sht31_begin_i2c
    sht31_read_init_i2c
    sht31_read_temp_i2c
  Weight
    rs485_3kg_begin
    rs485_3kg_read
  Wind
    Wind_begin_rs485
    Wind_read_rs485
    Wind_speed_begin_rs485
    Wind_speed_read_rs485

Analog
  Read Current
    Read4_20_mA_MCP3424
    Read4_20_mA_MCP3424_map
  Read Voltage
    ReadAnalog_MCP3424
    ReadAnalog_from_MPC3424

Electronic
  Button
    sw_on_pressed
    sw_on_release
    sw_pressed
    sw_release
  LED
    led_control_on
    led_control_off
  Relay
    relay_on
    relay_off

GPIO
  io_setpin
  io_digital_read
  io_digital_write
  io_analog_read
  io_analog_write
  io_pwm_write
  io_pulse_in
  io_shift_in
  io_shift_out

Variables
  VARIABLE

Math
  math_number
  math_arithmetic
  math_single
  math_trig
  math_constant
  math_number_property
  math_round
  math_on_list
  math_modulo
  math_constrain
  math_random_int
  math_random_float

Text
  text
  text_join
  text_append
  text_length
  text_isEmpty
  text_changeCase
  text_trim
  text_print
  text_prompt_ext

Functions
  PROCEDURE

Logic
  controls_if
  logic_compare
  logic_operation
  logic_negate
  logic_boolean
  logic_null
  logic_ternary

Loops
  controls_repeat_ext
  controls_whileUntil
  controls_for
  controls_forEach
  controls_flow_statements

Task
  Custom task
    task_io_interrupt
    task_timer_interrupt
    task_timer_interrupt_once
    task_task
  Auto task
    task_io_interrupt_ext
    task_timer_interrupt_ext
    task_timer_interrupt_once_ext
    task_task_ext
  Stopper
    task_detach_timer
    task_detach_gpio

Time
  Delay time
    time_delay
    time_delay_microsec
  Internet time
    time_sync
    time_get_year
    time_get_month
    time_get_day
    time_get_day_of_week
    time_get_hour
    time_get_minute
    time_get_second
    time_millis
    time_micros
  Local time
    setup_hardware_RTC2
    print_rtc_time
    update_system_time_with_rtc2
    get_rtc_year
    get_rtc_month
    get_rtc_day
    get_rtc_wday
    get_rtc_hour
    get_rtc_minute
    get_rtc_second
    set_rtc_time2
    set_system_time2

Cronjob
  CJOB_begin
  CJOB_add_schedule_time
  CJOB_add_schedule_weekday
  CJOB_add_schedule_datetime
  CJOB_addschedule_every_seconds
  CJOB_addschedule_every_minutes
  CJOB_addschedule_every_hours
  CJOB_addschedule
  CJOB_enable_schedule
  CJOB_disable_schedule
  CJOB_delete_schedule

WiFi
  wifi_connect
  wifi_ap
  wifi_start_server
  wifi_server_on
  wifi_server_send
  wifi_get_ip_addr
  wifi_get_ap_ip_addr
  wifi_get_arg

Bluetooth
  bt_start
  bt_send_string
  bt_on_receive
  bt_read_data
  bt_read_line

Serial
  serial_usb_init
  serial_hardware_init
  serial_available
  serial_write_data
  serial_write_newline
  serial_read_line
  serial_read_until

Cloud
  NETPIE
    netpie_begin
    netpie_connect
    callback_netpie
    callback_setup
    netpie_topic
    pub_topic
    payload
  MAGELLAN
    magellan_begin
    magellan_begin3
    magellan_reconnect
    magellan_isconnected
    magellan_interval
    magellan_interval2
    callback_magellan
    extract_value
    conv_val
    condition_key
    condition_value
    magellan_request
    magellan_sensor_add
    magellan_sensor_add_txt
    magellan_sensor_report
    magellan_client_config_add
    magellan_client_config_add_txt
    magellan_client_config_send
  Thingspeak
    Thingspeak_begin
    Thingspeak_connectWifi
    Thingspeak_Finish
    Thingspeak_set_field_value
```


### Predefined code generated by each block (excluding “Components”)

Below are the code templates each block emits. Placeholders like pin/value/ids reflect block fields or inputs. Lines with #EXTINC/#VARIABLE/#SETUP/#LOOP_EXT_CODE/#FUNCTION are preprocessor directives used by the converter to place code into the correct sections.

#### HS Generic
```text
HandySense_Setup                      => (defined in HS generators; initializes HandySense)
HandySense_Update                     => (defined in HS generators; periodic update call)
HandySense_setTime_Interval_Sensor    => (set sensor read interval)
HandySense_setTime_Interval_publishData => (set publish interval)
HandySense_setPin_Relay               => (configure relay pins)
HandySense_setPin_SensorError         => (configure error sensor pins)
HandySense_brownout                   => (enable/disable brownout handling)
```

#### Solution
```text
Alternate Wetting and Drying
  HandySense_awdv1                    => AWD control routine scaffold
Evapotranspiration
  HandySense_et0v1_begin              => ET0 setup/initialization
  HandySense_et0v1_et0                => compute ET0
  HandySense_et0v1_etc                => compute ETC
Fertilizer Control
  Initial_Fertilizer                  => initialize fertilizer subsystem
  Load_preferences                    => load preferences
  Clear_preferences                   => clear preferences
  Print_preferences                   => print preferences
  control_EC                          => EC control step
  control_pH                          => pH control step
  Read_pH                             => read pH value
  Read_temp                           => read temperature for fertilizer
  Read_EC                             => read EC value
  set_preferences                     => set preferences object
  set_single_preferences              => set single preference
  read_single_preferences             => read single preference
```

#### Sensor
```text
Carbon dioxide (Weather HTCo2PLx, RS485)
  Weather_HTCo2PLx_begin_rs485        =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_Weather_HTCo2PLx;#END
    #VARIABLE float Weather_HTCo2PLx;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #SETUP Serial2.begin(9600, SERIAL_8N1, RXD, TXD);#END
    #SETUP rs485_Weather_HTCo2PLx.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_rs485_Weather_HTCo2PLx; #END
    #LOOP_EXT_CODE result_rs485_Weather_HTCo2PLx = rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10);#END
  Weather_HTCo2PLx_read_humidity_rs485  => ((rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.00f))
  Weather_HTCo2PLx_read_temperature_rs485 => ((rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.00f))
  Weather_HTCo2PLx_read_co2_rs485        => ((rs485_Weather_HTCo2PLx.getResponseBuffer(3) / 1.00f))
  Weather_HTCo2PLx_read_pressure_rs485   => ((rs485_Weather_HTCo2PLx.getResponseBuffer(5) / 1.00f))
  Weather_HTCo2PLx_read_lux_rs485        => ((rs485_Weather_HTCo2PLx.getResponseBuffer(7)))

Humidity (SHT31)
  sht31_begin_rs                      =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_sht31Meter;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_sht31Meter.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_temp;#END
    #LOOP_EXT_CODE rs485_sht31Meter.readHoldingRegisters(0, 2);#END
  sht31_read_humid_rs                 => (rs485_sht31Meter.getResponseBuffer(1) / 10.00f)
  sht31_begin_i2c                     =>
    #EXTINC#include "SHT31.h"#END
    #EXTINC#include <Wire.h>#END
    #VARIABLE SHT31 sht;#END
    #SETUP Wire.begin();#END
    #SETUP Wire.setClock(10000);#END
    #SETUP sht.begin(0x44);#END
  sht31_read_init_i2c                 => sht.read();
  sht31_read_humid_i2c                => sht.getHumidity()

Light
  rs485_light_begin                   =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_pair;#END
    #VARIABLE float pair;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_pair.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_pair;#END
    #LOOP_EXT_CODE result_pair = rs485_pair.readHoldingRegisters(0, 2);#END
  rs485_Light_read                    => (rs485_pair.getResponseBuffer(0))
  bh1750_begin                        =>
    #EXTINC#include <BH1750.h>#END
    #EXTINC#include <Wire.h>#END
    #VARIABLE BH1750 lightMeter;#END
    #SETUP Wire.begin();#END
    #SETUP lightMeter.begin();#END
  bh1750_read                         => lightMeter.readLightLevel()

pH (RS485)
  rs485_PH_begin                      =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster PHrs485;#END
    #VARIABLE float PH;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP PHrs485.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_PH;#END
    #LOOP_EXT_CODE result_PH = PHrs485.readHoldingRegisters(0, 2);#END
  rs485_PH_read                       => (PHrs485.getResponseBuffer(1)/10.00f)
  rs485_PH_read_temp                  => (PHrs485.getResponseBuffer(0)/10.00f)

Pressure
  Weather_HTCo2PLx_read_pressure_rs485 => ((rs485_Weather_HTCo2PLx.getResponseBuffer(5) / 1.00f))

Rain (RS485)
  Rain_begin_rs485                    =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_rain;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #VARIABLE float rain;#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_rain.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_rain;#END
    #LOOP_EXT_CODE result_rain = rs485_rain.readHoldingRegisters(0, 2);#END
  Rain_read_rs485                     => ((((rs485_rain.getResponseBuffer(0)) / 10.0f)))

Temperature
  sht31_read_temp_rs                  => (rs485_sht31Meter.getResponseBuffer(0) / 10.00f)
  sht31_read_temp_i2c                 => sht.getTemperature()

Weight (RS485)
  rs485_3kg_begin                     =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_weight;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_weight.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_rs485_weight;#END
    #LOOP_EXT_CODE rs485_weight.readHoldingRegisters(0, 2);#END
  rs485_3kg_read                      => rs485_weight.getResponseBuffer(1) + Number(<offset>)

Wind (RS485)
  Wind_begin_rs485                    =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_windd;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #VARIABLE float windd;#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_windd.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_windd;#END
    #LOOP_EXT_CODE result_windd = rs485_windd.readHoldingRegisters(0, 2);#END
  Wind_read_rs485                     => ((((rs485_windd.getResponseBuffer(0)) / 10.0f)))
  Wind_speed_begin_rs485              =>
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_winds;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #VARIABLE float winds;#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_winds.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_winds;#END
    #LOOP_EXT_CODE result_winds = rs485_winds.readHoldingRegisters(0, 2);#END
  Wind_speed_read_rs485               => ((((rs485_winds.getResponseBuffer(0)) / 10.0f)))
```

#### Analog
```text
Read Current
  Read4_20_mA_MCP3424                 => Read4_20mA_MPC3424(<ch>)
  Read4_20_mA_MCP3424_map             => (mapped value; see generator)
Read Voltage
  ReadAnalog_MCP3424                  => ReadAnalog_MCP3424(...)
  ReadAnalog_from_MPC3424             => ReadAnalog_from_MPC3424(...)
```

#### Electronic
```text
Button
  sw_on_pressed                       => if (digitalRead(sw_onboard[<ch>]) == 0) { ... }
  sw_on_release                       => if (digitalRead(sw_onboard[<ch>]) == 1) { ... }
  sw_pressed                          => (!digitalRead(sw_onboard[<ch>]))
  sw_release                          => (digitalRead(sw_onboard[<ch>]))
LED
  led_control_on                      =>
    #EXTINC <MCP23008.h>, <Wire.h> / #VARIABLE MCP23008 MCP(0x24)
    #SETUP Wire.begin(); Wire.setClock(10000); MCP.begin(); MCP.pinMode8(0x00);
    MCP.digitalWrite(<ch>, HIGH);
  led_control_off                     => same as above, LOW
Relay
  relay_on                            => digitalWrite(const_relay_pin[<ch>], HIGH);
  relay_off                           => digitalWrite(const_relay_pin[<ch>], LOW);

Sensors/Actuators (selected examples)
  buzzer_on/off                       => pinMode(PIN, OUTPUT); digitalWrite(PIN, HIGH/LOW);
  servo_write                         =>
    #EXTINC <Servo.h> / #VARIABLE Servo servo_pin<Pin>;
    #SETUP servo_pin<Pin>.attach(Pin);
    servo_pin<Pin>.write(<angle>);
  fan_on/off, water_pump_on/off,
  misting_pump_on/off                 => pinMode(PIN, OUTPUT); digitalWrite(PIN, HIGH/LOW);
  potentiometer_read                  => analogRead(PIN)
  slide_switch_read                   => digitalRead(PIN)
  joystick_x / joystick_y             => analogRead(PIN)
  dip_switch_read                     => digitalRead(PIN + BIT)
  ky040_read                          =>
    #VARIABLE counters/state; #SETUP pinMode(CLK, INPUT); pinMode(DT, INPUT);
    ... inline lambda returning count ...
  ntc_temperature                     =>
    #VARIABLE NTC constants; expression using analogRead(PIN) and log(...)
  sound_read, photoresistor_read      => analogRead(PIN)
  rgb_led_set                         =>
    #SETUP pinMode(R/G/B, OUTPUT);
    analogWrite(R, r); analogWrite(G, g); analogWrite(B, b);
  led_bar_set                         =>
    #EXTINC <Grove_LED_Bar.h> / #VARIABLE Grove_LED_Bar ledBar(clk,data,0)
    #SETUP ledBar.begin(); ledBar.setLevel(level);
  neopixel_set / led_ring_set         =>
    #EXTINC <Adafruit_NeoPixel.h> / #VARIABLE Adafruit_NeoPixel n(...)
    #SETUP n.begin(); n.show(); n.setPixelColor(...); n.show();
  seven_seg_show                      =>
    #EXTINC <TM1637Display.h> / #VARIABLE TM1637Display display(DIO,CLK)
    #SETUP display.setBrightness(...); display.showNumberDec(value, false);
  lcd_print                           =>
    #EXTINC <LiquidCrystal_I2C.h> <Wire.h>; #VARIABLE LiquidCrystal_I2C lcd(0x27, WxH)
    #SETUP Wire.begin(); lcd.init(); lcd.backlight();
    lcd.setCursor(col,row); lcd.print(text);
  ds1307_read                         =>
    #EXTINC <RTClib.h> <Wire.h>; #VARIABLE RTC_DS1307 rtc; #SETUP Wire.begin(); rtc.begin();
    rtc.now().<field>()
```

#### GPIO
```text
io_setpin                             => pinMode(<pin>, <mode>);
io_digital_read                       => digitalRead(<pin>)
io_digital_write                      => digitalWrite(<pin>, <value>);
io_analog_read                        => analogRead(<pin>)
io_analog_write                       => dacWrite(<pin>, <value>);
io_pwm_write                          => analogWrite(<pin>, <value>);
io_pulse_in                           => pulseIn(<pin>, <state>, <timeout>)
io_shift_in                           => shiftIn(<data_pin>, <clock_pin>, <bit_order>)
io_shift_out                          => shiftOut(<data_pin>, <clock_pin>, <bit_order>, <data>);
```

#### Variables
```text
VARIABLE                              => Standard Blockly variables category (let/vars in generated flow)
```

#### Math
```text
math_number                           => numeric literal
math_arithmetic                       => a (+|−|×|÷) b
math_single                           => unary math (sqrt, abs, etc.)
math_trig                             => trig functions
math_constant                         => PI, E, etc.
math_number_property                  => numeric property checks
math_round                            => round/floor/ceil(x)
math_on_list                          => list math ops
math_modulo                           => a % b
math_constrain                        => constrain(x, low, high)
math_random_int                       => random(a, b)
math_random_float                     => random()
```

#### Text
```text
text                                  => "literal"
text_join                             => concat
text_append                           => var += text
text_length                           => text.length
text_isEmpty                          => text == ""
text_changeCase                       => toUpperCase/toLowerCase
text_trim                             => trim
text_print                            => Serial.print/println (via converter)
text_prompt_ext                       => input prompt (runtime-dependent)
```

#### Functions
```text
PROCEDURE                             => Blockly procedures mapped to functions
```

#### Logic
```text
controls_if                           => if / else if / else
logic_compare                         => a == b, a < b, etc.
logic_operation                       => a && b, a || b
logic_negate                          => !a
logic_boolean                         => true / false
logic_null                            => nullptr / null
logic_ternary                         => cond ? a : b
```

#### Loops
```text
controls_repeat_ext                   => for (i=0; i<N; i++)
controls_whileUntil                   => while / do-while
controls_for                          => for (var i=from; i<=to; i+=by)
controls_forEach                      => for-each over list
controls_flow_statements              => break / continue
```

#### Task
```text
Custom task
  task_io_interrupt                   => attach interrupt on pin → handler
  task_timer_interrupt                => timer interrupt at interval
  task_timer_interrupt_once           => one-shot timer interrupt
  task_task                           => create task/thread
Auto task
  task_io_interrupt_ext               => auto-wired variant
  task_timer_interrupt_ext            => auto-wired variant
  task_timer_interrupt_once_ext       => auto-wired variant
  task_task_ext                       => auto-wired variant
Stopper
  task_detach_timer                   => detach timer
  task_detach_gpio                    => detach GPIO interrupt
```

#### Time
```text
Delay time
  time_delay                          => delay(<ms>);
  time_delay_microsec                 => delayMicroseconds(<us>);
Internet time
  time_sync                           =>
    #EXTINC #include "BFarmTime.h" #END
    #VARIABLE BFarmTime bfarmtime; #END
    bfarmtime.sync();
  time_get_year/month/day/...         => bfarmtime.getYear()/getMonth()/...
  time_millis                         => millis()
  time_micros                         => micros()
Local time
  setup_hardware_RTC2                 =>
    #EXTINC "time_utility.h" #END
    #FUNCTION print_rtc_time(), set_rtc_time2(...), update_system_time_with_rtc2() { ... } #END
    #VARIABLE <RTC> rtc2; DateTime RTCnow; #END
    rtc2.begin();
  print_rtc_time                      => print_rtc_time();
  update_system_time_with_rtc2        => update_system_time_with_rtc2();
  get_rtc_year/month/day/hour/minute/second => rtc2.now().year()/month()/...
  set_rtc_time2                       => set_rtc_time2(y,m,d,h,mi,s);
  set_system_time2                    => set_system_time(y,m,d,h,mi,s);
```

#### Cronjob
```text
CJOB_begin                             => CJOB.begin();
CJOB_add_schedule_time                 => add schedule by time
CJOB_add_schedule_weekday              => add schedule by weekday
CJOB_add_schedule_datetime             => add schedule by datetime
CJOB_addschedule_every_seconds/minutes/hours => add periodic schedules
CJOB_addschedule                       => generic add schedule
CJOB_enable_schedule                   => enable schedule
CJOB_disable_schedule                  => disable schedule
CJOB_delete_schedule                   => delete schedule
```

#### WiFi
```text
wifi_connect                          =>
  #EXTINC #include <getchip.h> #END
  #FUNCTION uint32_t chip_id = 0; #END
  WiFi.begin("ssid","password"); while(WiFi.status()!=WL_CONNECTED){ delay(500); }
  setup_chipid("<email>"); for(...){ chip_id |= ((ESP.getEfuseMac() >> ...) & 0xff) << i; }
  #LOOP_EXT_CODE loop_chipid("<email>"); #END
wifi_ap                               =>
  #SETUP WiFi.softAP("ssid","password"); #END
wifi_start_server                     =>
  #VARIABLE WebServer server(80); #END
  server.begin();
  #LOOP_EXT_CODE server.handleClient(); #END
wifi_server_on                        =>
  server.on("<path>", [](){ <statements> });
wifi_server_send                      =>
  server.send(<status>, "<content_type>", <text>);
wifi_get_ip_addr                      => WiFi.localIP().toString()
wifi_get_ap_ip_addr                   => WiFi.softAPIP().toString()
wifi_get_arg                          =>
  #FUNCTION String getArgParams(String name){ for(i...) if(server.argName(i)==name) return server.arg(i); return ""; } #END
  getArgParams("<arg_name>")
```

#### Bluetooth
```text
bt_start                              => start BT (generator initializes Bluetooth stack)
bt_send_string                        => send text via BT
bt_on_receive                         => on receive callback
bt_read_data / bt_read_line           => read from BT buffer
```

#### Serial
```text
serial_usb_init                       => Serial.begin(...)
serial_hardware_init                  => Serial1/2.begin(...)
serial_available                      => Serial.available()
serial_write_data                     => Serial.print(<text>);
serial_write_newline                  => Serial.println();
serial_read_line                      => read until newline
serial_read_until                     => read until delimiter
```


### Exact generated code by block (bullets + snippets, excluding “Components”)

Note: Dynamic fields like <id>, <pin>, <value> reflect block inputs. Generator markers (#EXTINC/#VARIABLE/#SETUP/#FUNCTION/#LOOP_EXT_CODE) are preserved as they are inserted into the proper sections by the converter.

#### HS Generic
- HandySense_Setup
  ```text
  setup_HandySense();
  ```
- HandySense_Update
  ```text
  loop_HandySense(<Soil>,<Light>,<Temp>,<Hum>);
  ```
- HandySense_setTime_Interval_Sensor
  ```text
  eventInterval = <ms>;
  eventInterval_brightness = <ms>;
  ```
- HandySense_setTime_Interval_publishData
  ```text
  eventInterval_publishData = <ms>;
  ```
- HandySense_setPin_Relay
  ```text
  setPin_Relay(<r1>,<r2>,<r3>,<r4>);
  ```
- HandySense_setPin_SensorError
  ```text
  setPin_ErrorSensor(<e1>,<e2>,<e3>);
  ```
- HandySense_brownout
  ```text
  #SETUP WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);#END
  ```

#### Solution
- Alternate Wetting and Drying
  - HandySense_awdv1
    ```text
    #EXTINC <ThingSpeakWriter_asukiaaa.h> <mqtt_client.h> <pub_topic.h> #END
    #FUNCTION connectWifiIfNotConnected(...){...} Netpiecallback(...){...} #END
    #SETUP Serial.begin(115200); Wire.begin(); Wire.setClock(10000); setupMQTT(); ... #END
    #LOOP_EXT_CODE connectWifiIfNotConnected(); channelWriter.setField(...); ... Netpieclient.loop(); pub_topic(...); publishMessage(...); delay(<ms>); #END
    ```
- Evapotranspiration
  - HandySense_et0v1_begin
    ```text
    #EXTINC <ThingSpeakWriter_asukiaaa.h> <mqtt_client.h> <pub_topic.h> #END
    #VARIABLE const float gamma_const=0.066; const float cp=1.013*1e-3; const float rho=1.225; #END
    #FUNCTION float calculateETo(...){...} float calculateETc(...){...} #END
    float Kc=<kc>; float T=<temp>; float RH=<humi>; float u2=<wind>; float Rn=<radw>; float G=<heat>;
    float es=...; float ea=...; float delta=...; float ra=208.0/u2; float rs=100.0;
    float ETo = calculateETo(...); float ETc = calculateETc(Kc, ETo);
    ```
  - HandySense_et0v1_et0
    ```text
    ETo
    ```
  - HandySense_et0v1_etc
    ```text
    ETc
    ```
- Fertilizer Control
  - Initial_Fertilizer
    ```text
    #EXTINC <Preferences.h> <fertilizer.h> #END
    preferences.begin("credentials", false);
    load_preferences();
    ```
  - Load_preferences
    ```text
    load_preferences();
    ```
  - Clear_preferences
    ```text
    clear_preferences();
    ```
  - Print_preferences
    ```text
    print_config();
    ```
  - Read_pH
    ```text
    (float)(PHcompute(<adc_ph>))
    ```
  - Read_temp
    ```text
    (float)(Tempcompute(<adc_temp>))
    ```
  - Read_EC
    ```text
    (int)(ECcompute(<adc_ec>,<adc_temp>))
    ```
  - set_preferences
    ```text
    calTemp=<calTemp>;calPH4=<ph4>;calPH7=<ph7>;calPH10=<ph10>;calEC0=<ec0>;calEC1413=<ec1413>;PHthresh_min=<phmin>;PHthresh_max=<phmax>;ECthresh_min=<ecmin>;PHdura_value=<phdur>;ECdura_value=<ecdur>;
    set_preferences();
    ```
  - set_single_preferences
    ```text
    <param>=<value>;
    set_preferences();
    ```
  - read_single_preferences
    ```text
    <param>
    ```

#### Sensor
- Carbon dioxide (Weather HTCo2PLx, RS485)
  - Weather_HTCo2PLx_begin_rs485
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_Weather_HTCo2PLx;#END
    #VARIABLE float Weather_HTCo2PLx;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #SETUP Serial2.begin(9600, SERIAL_8N1, RXD, TXD);#END
    #SETUP rs485_Weather_HTCo2PLx.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_rs485_Weather_HTCo2PLx; #END
    #LOOP_EXT_CODE result_rs485_Weather_HTCo2PLx =rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10);#END
    ```
  - Weather_HTCo2PLx_read_humidity_rs485
    ```text
    ((rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.00f))
    ```
  - Weather_HTCo2PLx_read_temperature_rs485
    ```text
    ((rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.00f))
    ```
  - Weather_HTCo2PLx_read_co2_rs485
    ```text
    ((rs485_Weather_HTCo2PLx.getResponseBuffer(3) / 1.00f))
    ```
  - Weather_HTCo2PLx_read_pressure_rs485
    ```text
    ((rs485_Weather_HTCo2PLx.getResponseBuffer(5) / 1.00f))
    ```
  - Weather_HTCo2PLx_read_lux_rs485
    ```text
    ((rs485_Weather_HTCo2PLx.getResponseBuffer(7)))
    ```
- Humidity (SHT31)
  - sht31_begin_rs
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_sht31Meter;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_sht31Meter.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_temp;#END
    #LOOP_EXT_CODE rs485_sht31Meter.readHoldingRegisters(0, 2);#END
    ```
  - sht31_read_humid_rs
    ```text
    (rs485_sht31Meter.getResponseBuffer(1) / 10.00f)
    ```
  - sht31_begin_i2c
    ```text
    #EXTINC#include "SHT31.h"#END
    #EXTINC#include <Wire.h>#END
    #VARIABLE SHT31 sht;#END
    #SETUP Wire.begin();#END
    #SETUP Wire.setClock(10000);#END
    #SETUP sht.begin(0x44);#END
    ```
  - sht31_read_init_i2c
    ```text
    sht.read();
    ```
  - sht31_read_humid_i2c
    ```text
    sht.getHumidity()
    ```
  - sht31_read_temp_rs
    ```text
    (rs485_sht31Meter.getResponseBuffer(0) / 10.00f)
    ```
  - sht31_read_temp_i2c
    ```text
    sht.getTemperature()
    ```
- Light
  - rs485_light_begin
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_pair;#END
    #VARIABLE float pair;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_pair.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_pair;#END
    #LOOP_EXT_CODE result_pair = rs485_pair.readHoldingRegisters(0, 2);#END
    ```
  - rs485_Light_read
    ```text
    (rs485_pair.getResponseBuffer(0))
    ```
  - bh1750_begin
    ```text
    #EXTINC#include <BH1750.h>#END
    #EXTINC#include <Wire.h>#END
    #VARIABLE BH1750 lightMeter;#END
    #SETUP Wire.begin();#END
    #SETUP lightMeter.begin();#END
    ```
  - bh1750_read
    ```text
    lightMeter.readLightLevel()
    ```
- pH (RS485)
  - rs485_PH_begin
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster PHrs485;#END
    #VARIABLE float PH;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP PHrs485.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_PH;#END
    #LOOP_EXT_CODE result_PH = PHrs485.readHoldingRegisters(0, 2);#END
    ```
  - rs485_PH_read
    ```text
    (PHrs485.getResponseBuffer(1)/10.00f)
    ```
  - rs485_PH_read_temp
    ```text
    (PHrs485.getResponseBuffer(0)/10.00f)
    ```
- Rain (RS485)
  - Rain_begin_rs485
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_rain;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #VARIABLE float rain;#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_rain.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_rain;#END
    #LOOP_EXT_CODE result_rain = rs485_rain.readHoldingRegisters(0, 2);#END
    ```
  - Rain_read_rs485
    ```text
    ((((rs485_rain.getResponseBuffer(0)) / 10.0f)))
    ```
- Weight (RS485)
  - rs485_3kg_begin
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_weight;#END
    #SETUP Wire.begin();#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_weight.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_rs485_weight;#END
    #LOOP_EXT_CODE rs485_weight.readHoldingRegisters(0, 2);#END
    ```
  - rs485_3kg_read
    ```text
    rs485_weight.getResponseBuffer(1) + Number(<offset>)
    ```
- Wind (RS485)
  - Wind_begin_rs485
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_windd;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #VARIABLE float windd;#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_windd.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_windd;#END
    #LOOP_EXT_CODE result_windd = rs485_windd.readHoldingRegisters(0, 2);#END
    ```
  - Wind_read_rs485
    ```text
    ((((rs485_windd.getResponseBuffer(0)) / 10.0f)))
    ```
  - Wind_speed_begin_rs485
    ```text
    #EXTINC#include <ModbusMaster.h>#END
    #VARIABLE ModbusMaster rs485_winds;#END
    #VARIABLE #define RXD 16#END
    #VARIABLE #define TXD 17#END
    #VARIABLE float winds;#END
    #SETUP Serial2.begin(9600);#END
    #SETUP rs485_winds.begin(<id>, Serial2);#END
    #LOOP_EXT_CODE uint8_t result_winds;#END
    #LOOP_EXT_CODE result_winds = rs485_winds.readHoldingRegisters(0, 2);#END
    ```
  - Wind_speed_read_rs485
    ```text
    ((((rs485_winds.getResponseBuffer(0)) / 10.0f)))
    ```

#### Analog
- Read4_20_mA_MCP3424
  ```text
  Read4_20mA_MPC3424(<ch>)
  ```
- Read4_20_mA_MCP3424_map
  ```text
  Read4_20mA_MPC3424_map(<ch>, <inMin>, <inMax>, <outMin>, <outMax>)
  ```
- ReadAnalog_MCP3424
  ```text
  ReadAnalog_MPC3424(<ch>)
  ```
- ReadAnalog_from_MPC3424
  ```text
  ReadAnalog_from_MPC3424(<ch>, <inMin>, <inMax>, <outMin>, <outMax>)
  ```

#### Electronic
- Buttons
  - sw_on_pressed
    ```text
    if (digitalRead(sw_onboard[<ch>]) == 0) { ... }
    ```
  - sw_on_release
    ```text
    if (digitalRead(sw_onboard[<ch>]) == 1) { ... }
    ```
  - sw_pressed
    ```text
    (!digitalRead(sw_onboard[<ch>]))
    ```
  - sw_release
    ```text
    (digitalRead(sw_onboard[<ch>]))
    ```
- LED (MCP23008)
  - led_control_on
    ```text
    #EXTINC #include "MCP23008.h" #include <Wire.h> #END
    #VARIABLE MCP23008 MCP (0x24); #END
    #SETUP Wire.begin(); Wire.setClock(10000); MCP.begin(); MCP.pinMode8(0x00); #END
    MCP.digitalWrite(<ch>, HIGH);
    ```
  - led_control_off
    ```text
    ...same setup...
    MCP.digitalWrite(<ch>, LOW);
    ```
- Relay
  - relay_on
    ```text
    digitalWrite(const_relay_pin[<ch>], HIGH);
    ```
  - relay_off
    ```text
    digitalWrite(const_relay_pin[<ch>], LOW);
    ```
- Actuators/Sensors quick refs
  - buzzer_on / buzzer_off
    ```text
    #SETUP pinMode(<PIN>, OUTPUT); #END
    digitalWrite(<PIN>, HIGH|LOW);
    ```
  - servo_write
    ```text
    #EXTINC #include <Servo.h> #END
    #VARIABLE Servo servo_pin<PIN>; #END
    #SETUP servo_pin<PIN>.attach(<PIN>); #END
    servo_pin<PIN>.write(<ANGLE>);
    ```
  - fan_on/off, water_pump_on/off, misting_pump_on/off
    ```text
    #SETUP pinMode(<PIN>, OUTPUT); #END
    digitalWrite(<PIN>, HIGH|LOW);
    ```
  - potentiometer_read / sound_read / photoresistor_read
    ```text
    analogRead(<PIN>)
    ```
  - slide_switch_read
    ```text
    digitalRead(<PIN>)
    ```
  - joystick_x / joystick_y
    ```text
    analogRead(<PIN>)
    ```
  - dip_switch_read
    ```text
    digitalRead(<PIN> + <BIT>)
    ```
  - ky040_read
    ```text
    #VARIABLE int ky040_counter_<CLK>=0; int ky040_last_clk_<CLK>=LOW; #END
    #SETUP pinMode(<CLK>, INPUT); pinMode(<DT>, INPUT); #END
    ( ... inline pulse/dir logic ... )
    ```
  - ntc_temperature
    ```text
    (1.0 / (log(((4095.0 / analogRead(<PIN>)) - 1.0)) / NTC_BETA_<PIN> + (1.0 / (25.0 + 273.15))) - 273.15)
    ```
  - rgb_led_set
    ```text
    #SETUP pinMode(<R>,OUTPUT); pinMode(<G>,OUTPUT); pinMode(<B>,OUTPUT); #END
    analogWrite(<R>, <r>); analogWrite(<G>, <g>); analogWrite(<B>, <b>);
    ```
  - led_bar_set
    ```text
    #EXTINC #include "Grove_LED_Bar.h" #END
    #VARIABLE Grove_LED_Bar ledBar_<DATA>(<CLK>, <DATA>, 0); #END
    #SETUP ledBar_<DATA>.begin(); #END
    ledBar_<DATA>.setLevel(<level>);
    ```
  - neopixel_set / led_ring_set
    ```text
    #EXTINC #include <Adafruit_NeoPixel.h> #END
    #VARIABLE Adafruit_NeoPixel neopixel_<PIN>(..., <PIN>, ...); #END
    #SETUP neopixel_<PIN>.begin(); neopixel_<PIN>.show(); #END
    neopixel_<PIN>.setPixelColor(<idx>, neopixel_<PIN>.Color(<r>,<g>,<b>)); neopixel_<PIN>.show();
    ```
  - seven_seg_show
    ```text
    #EXTINC #include <TM1637Display.h> #END
    #VARIABLE TM1637Display display_<DIO>(<DIO>, <DIO+1>); #END
    #SETUP display_<DIO>.setBrightness(0x0f); #END
    display_<DIO>.showNumberDec(<value>, false);
    ```
  - lcd_print
    ```text
    #EXTINC #include <LiquidCrystal_I2C.h> #include <Wire.h> #END
    #VARIABLE LiquidCrystal_I2C lcd_i2c(0x27, <W>, <H>); #END
    #SETUP Wire.begin(); lcd_i2c.init(); lcd_i2c.backlight(); #END
    lcd_i2c.setCursor(<col>, <row>); lcd_i2c.print(<text>);
    ```
  - ds1307_read
    ```text
    #EXTINC #include "RTClib.h" #include <Wire.h> #END
    #VARIABLE RTC_DS1307 rtc_ds1307; #END
    #SETUP Wire.begin(); rtc_ds1307.begin(); #END
    rtc_ds1307.now().<field>()
    ```

#### GPIO
- io_setpin
  ```text
  pinMode(<pin>,<mode>);
  ```
- io_digital_read
  ```text
  digitalRead(<pin>)
  ```
- io_digital_write
  ```text
  digitalWrite(<pin>,<value>);
  ```
- io_analog_read
  ```text
  analogRead(<pin>)
  ```
- io_analog_write
  ```text
  dacWrite(<pin>,<value>);
  ```
- io_pwm_write
  ```text
  analogWrite(<pin>, <value>);
  ```
- io_pulse_in
  ```text
  pulseIn(<pin>,<state>,<timeout>)
  ```
- io_shift_in
  ```text
  shiftIn(<data_pin>,<clock_pin>,<bit_order>)
  ```
- io_shift_out
  ```text
  shiftOut(<data_pin>,<clock_pin>,<bit_order>,<data>);
  ```

#### Variables
- VARIABLE
  ```text
  // Standard Blockly variables (type inferred); mapped in generator
  ```

#### Math
- math_number / arithmetic / single / trig / constant / number_property / round / on_list / modulo / constrain / random_int / random_float
  ```text
  // Canonical Blockly JS → C-style expressions (e.g., a+b, sqrt(x), random(), constrain(...))
  ```

#### Text
- text / join / append / length / isEmpty / changeCase / trim / print / prompt_ext
  ```text
  // Text ops; print maps to Serial.print/println through converter
  ```

#### Functions
- procedures_defreturn / defnoreturn / callreturn / callnoreturn / ifreturn
  ```text
  #VARIABLE <retType> <name>(<typed args>);#END
  #FUNCTION <retType> <name>(<typed args>) { ... return <expr>; } #END
  <name>(args...);
  ```

#### Logic
- controls_if / logic_compare / operation / negate / boolean / null / ternary
  ```text
  if (...) {...} else if (...) {...} else {...}
  a == b, a && b, !a, true/false, nullptr, cond ? a : b
  ```

#### Loops
- controls_repeat_ext / whileUntil / for / forEach / flow_statements
  ```text
  for (int i=0; i<N; i++) {...}
  while(...) {...}
  break; continue;
  ```

#### Task
- task_io_interrupt
  ```text
  #EXTINC#include "BFarmEvent.h"#END
  #VARIABLE BFarmEvent bfarmevt;#END
  bfarmevt.attach("",<type>, [](){ <body> }, <pin>, <memory>);
  ```
- task_io_interrupt_ext
  ```text
  #EXTINC#include "BFarmEvent.h"#END
  #VARIABLE BFarmEvent bfarmevt;#END
  #BLOCKSETUP
  bfarmevt.attach("",<type>, [](){ <body> }, <pin>, <memory>);
  #END
  ```
- task_timer_interrupt / task_timer_interrupt_ext
  ```text
  #EXTINC#include "BFarmEvent.h"#END
  #VARIABLE BFarmEvent bfarmevt;#END
  bfarmevt.attach("<name>",BFarmEventType::EVERY, [](){ <body> }, <delay>, <memory>);
  ```
- task_timer_interrupt_once / _once_ext
  ```text
  bfarmevt.attach("",BFarmEventType::ONCE, [](){ <body> }, <delay>, <memory>);
  ```
- task_task / task_task_ext
  ```text
  bfarmevt.attach("",BFarmEventType::TASK, [](){ <body>; vTaskDelete(NULL); }, 0, <memory>);
  ```
- task_detach_timer
  ```text
  bfarmevt.detach("<name>");
  ```
- task_detach_gpio
  ```text
  bfarmevt.detach(<pin>);
  ```

#### Time
- time_delay / time_delay_microsec
  ```text
  delay(<ms>);
  delayMicroseconds(<us>);
  ```
- time_sync
  ```text
  #EXTINC#include "BFarmTime.h"#END
  #VARIABLE BFarmTime bfarmtime;#END
  bfarmtime.sync();
  ```
- time_get_year/month/day/day_of_week/hour/minute/second
  ```text
  bfarmtime.getYear()  // etc.
  ```
- time_millis / time_micros
  ```text
  millis()
  micros()
  ```
- setup_hardware_RTC2
  ```text
  #EXTINC //#include "RTC2.h" #include "time_utility.h" #END
  #FUNCTION print_rtc_time(){...} set_rtc_time2(...){...} update_system_time_with_rtc2(){...} #END
  #VARIABLE <RTC> rtc2; DateTime RTCnow; #END
  rtc2.begin();
  ```
- print_rtc_time / update_system_time_with_rtc2 / set_rtc_time2 / set_system_time2 / get_rtc_*
  ```text
  print_rtc_time();
  update_system_time_with_rtc2();
  set_rtc_time2(y,m,d,h,mi,s);
  set_system_time(y,m,d,h,mi,s);
  // getters use rtc2.now().field()
  ```

#### Cronjob
- CJOB_begin
  ```text
  #EXTINC#include <time.h>#END
  #EXTINC#include "cjob.h"#END
  #VARIABLE int CJOB_begin;#END
  #LOOP_EXT_CODE Cron.delay();#END
  ```
- CJOB_add_schedule_time / _weekday / _datetime / _every_seconds / _every_minutes / _every_hours / addschedule
  ```text
  #VARIABLE CronID_t id_<name>;#END
  #VARIABLE void <name>(); #END
  #FUNCTION void <name>() { <callback> } #END
  id_<name> = Cron.create("<cron expr>", <name>, <oneShot>);
  ```
- CJOB_enable_schedule / disable / delete
  ```text
  Cron.enable(id_<name>);
  Cron.disable(id_<name>);
  Cron.free(id_<name>);
  ```

#### WiFi
- wifi_connect
  ```text
  #EXTINC #include <getchip.h>#END
  #FUNCTION uint32_t chip_id = 0; #END
  WiFi.begin("<ssid>","<password>");
  while(WiFi.status() != WL_CONNECTED){ delay(500); }
  setup_chipid("<email>");
  for (int i = 0; i < 17; i = i + 8) { chip_id |= ((ESP.getEfuseMac() >> (40 - i)) & 0xff) << i; }
  #LOOP_EXT_CODE loop_chipid("<email>");#END
  ```
- wifi_ap
  ```text
  #SETUP  WiFi.softAP("<ssid>", "<password>");
  ```
- wifi_start_server
  ```text
  #VARIABLE  WebServer server(80);#END
  server.begin();
  #LOOP_EXT_CODE server.handleClient(); #END
  ```
- wifi_server_on
  ```text
  server.on("<path>", [](){
    <statements>
  });
  ```
- wifi_server_send
  ```text
  server.send(<status>, "<content_type>", <text>);
  ```
- wifi_get_ip_addr / wifi_get_ap_ip_addr
  ```text
  WiFi.localIP().toString()
  WiFi.softAPIP().toString()
  ```
- wifi_get_arg
  ```text
  #FUNCTIONString getArgParams(String name){ for (uint8_t i = 0; i < server.args(); i++) { if(String(server.argName(i)) == name){ return String(server.arg(i)); } } return String(""); }#END
  getArgParams("<arg>")
  ```

#### Bluetooth
- bt_start
  ```text
  #EXTINC#include "BluetoothSerial.h"#END
  #VARIABLEBluetoothSerial SerialBT;#END
  SerialBT.begin("<name>");
  ```
- bt_send_string
  ```text
  SerialBT.print[ln](<text>);
  ```
- bt_on_receive
  ```text
  while(SerialBT.available()){
    <receiver_code>
  }
  ```
- bt_read_data / bt_read_line
  ```text
  SerialBT.read()
  SerialBT.readStringUntil('\n')
  ```

#### Serial
- serial_usb_init
  ```text
  Serial.begin(<baud>);
  ```
- serial_hardware_init
  ```text
  <SerialX>.begin(<baud>);
  ```
- serial_available
  ```text
  <SerialX>.available()
  ```
- serial_write_data
  ```text
  <SerialX>.print[ln](<text>);
  ```
- serial_write_newline
  ```text
  <SerialX>.println();
  ```
- serial_read_line / serial_read_until
  ```text
  <SerialX>.readStringUntil('\\n')
  <SerialX>.readStringUntil('<char>')
  ```

