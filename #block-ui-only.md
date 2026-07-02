## Blocks (BFarm) Overview (UI-only)

This file lists only blocks that appear in the toolbox menu (left sidebar), excluding Components.


The Blocks page is a visual programming workspace for building smart-farm and embedded workflows with dragâ€‘andâ€‘drop blocks. It syncs with the Circuit (HackCable) canvas and can send generated code back to HackCable for simulation or compilation.

- Visual logic building with categories for sensors, GPIO, networking, time, cronjobs, and more
- Biâ€‘directional sync with HackCable: receive code from Circuit; send generated code back
- Readyâ€‘made solution blocks for common scenarios (e.g., fertilizer control, evapotranspiration)
- Code export, verification, and optional autoâ€‘sync to Circuit


### User Flow

1) Open the Blocks page
   - Launch the dev server and open the app at the shell UI with the `#blocks` hash (Blocks tab).

2) Build your flow
   - Drag blocks from the left toolbox onto the workspace. Arrange logic for sensors, timers, conditions, and actions.

3) Sync code with Circuit (HackCable)
   - From Circuit, click â€œTransfer to Blocksâ€ or enable â€œAuto-syncâ€ to bring code into Blocks.
   - From Blocks, use the toolbar action to send generated code back to HackCable for simulation or wiring.

4) Iterate
   - Tweak blocks, reâ€‘sync, and verify on Circuit. Repeat until behavior matches your needs.


### Left Sidebar Categories and Entries (excluding â€œComponentsâ€)

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




### Exact generated code by block (bullets + snippets, excluding â€œComponentsâ€)

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
  - Weather_HTCo2PLx_read_co2_rs485
    ```text
    ((rs485_Weather_HTCo2PLx.getResponseBuffer(3) / 1.00f))
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
  // Canonical Blockly JS â†’ C-style expressions (e.g., a+b, sqrt(x), random(), constrain(...))
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

#### Cloud
- NETPIE
  - netpie_begin
    ```text
    #EXTINC #include <pub_topic.h> #END
    #EXTINC #include <mqtt_client.h> #END
    #FUNCTION const char* Netpiemqtt_server="..."; const int Netpiemqtt_port=...; ... #END
    setupMQTT();
    Netpieclient.setServer(Netpiemqtt_server, Netpiemqtt_port);
    ```
  - netpie_connect
    ```text
    if (!Netpieclient.connected()) { Netpieclient.connect(...); Netpieclient.subscribe("@private/#"); }
    Netpieclient.loop();
    ```
  - callback_netpie
    ```text
    #FUNCTION void Netpiecallback(String topic,byte* payload,unsigned int length){ ... <loop_callback> ... } #END
    ```
  - callback_setup
    ```text
    Netpieclient.setCallback(Netpiecallback);
    ```
  - netpie_topic
    ```text
    topic
    ```
  - pub_topic
    ```text
    #EXTINC #include <pub_topic.h> #END
    pub_topic("<topic>", <value>);
    publishMessage((String("#N,<topic>:") + String(<value>) + String(",$") + String(chip_id) + String("|") + String("<email>")).c_str());
    ```
  - payload
    ```text
    (message).toInt()
    ```
- MAGELLAN
  - magellan_begin
    ```text
    #EXTINC #include <MAGELLAN_MQTT.h> #END
    #EXTINC #include <mqtt_client.h> #END
    #VARIABLE WiFiClient WiFi_client; MAGELLAN_MQTT magel(WiFi_client); #END
    #FUNCTION String thingIdentifier="..."; String thingSecret="..."; #END
    setting.endpoint="..."; setting.ThingIdentifier=thingIdentifier; setting.ThingSecret=thingSecret; setting.clientBufferSize=defaultOTABuffer;
    magel.begin(setting); setupMQTT();
    #LOOP_EXT_CODE magel.loop(); magel.subscribes([](){ magel.subscribe.serverConfig(PLAINTEXT); magel.subscribe.control(PLAINTEXT); }); #END
    ```
  - magellan_begin3
    ```text
    // Same as magellan_begin, with endpoint from block field "endpoint"
    ```
  - magellan_reconnect
    ```text
    magel.reconnect();
    ```
  - magellan_isconnected
    ```text
    magel.isConnected()
    ```
  - magellan_interval
    ```text
    #LOOP_EXT_CODE magel.interval(<interval>, [](){ <func_to_do> }); #END
    ```
  - magellan_interval2
    ```text
    #LOOP_EXT_CODE magel.interval(<interval_expr>, [](){ <func_to_do> }); #END
    ```
  - callback_magellan
    ```text
    magel.getControl(...<loop_callback>...); magel.control.ACK(key, value);
    // or: magel.getServerConfig(...<loop_callback>...)
    ```
  - extract_value
    ```text
    String(value)
    ```
  - conv_val
    ```text
    String(<value>).toFloat()
    ```
  - condition_key
    ```text
    String(key)
    ```
  - condition_value
    ```text
    String(value)
    ```
  - magellan_request
    ```text
    magel.getServerConfig();
    // or: magel.getControl();
    ```
  - magellan_sensor_add
    ```text
    magel.sensor.add("<sensorKey>", <sensorValue>);
    publishMessage((String("#A,<sensorKey>:") + String(<sensorValue>) + String(",$") + String(chip_id) + String("|") + String("<email>")).c_str());
    ```
  - magellan_sensor_add_txt
    ```text
    magel.sensor.add("<sensorKey>", "<typedValue>");
    ```
  - magellan_sensor_report
    ```text
    <report_sensor>
    magel.sensor.report();
    ```
  - magellan_client_config_add
    ```text
    magel.clientConfig.add("<configKey>", <configValue>);
    ```
  - magellan_client_config_add_txt
    ```text
    magel.clientConfig.add("<configKey>", "<typedValue>");
    ```
  - magellan_client_config_send
    ```text
    <send_client_config>
    magel.clientConfig.send();
    ```
- Thingspeak
  - Thingspeak_begin
    ```text
    #EXTINC #include <ThingSpeakWriter_asukiaaa.h> #END
    #EXTINC #include <mqtt_client.h> #END
    #SETUP Serial.begin(115200);#END
    #FUNCTION #define WRITE_API_KEY "..."; #define WIFI_SSID "..."; #define WIFI_PASS "..."; ThingSpeakWriter_asukiaaa channelWriter(WRITE_API_KEY); void connectWifiIfNotConnected(...){...} #END
    setupMQTT();
    ```
  - Thingspeak_connectWifi
    ```text
    connectWifiIfNotConnected();
    ```
  - Thingspeak_Finish
    ```text
    int result = channelWriter.writeFields();
    // print status by result code
    ```
  - Thingspeak_set_field_value
    ```text
    connectWifiIfNotConnected();
    channelWriter.setField(<field>, String(<value>));
    int sensor<field> = channelWriter.writeFields();
    publishMessage((String("#T,<field>:") + String(<value>) + String(",$") + String(chip_id) + String("|") + String("<email>")).c_str());
    delay(1000);
    ```

