import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['Read4_20_mA_MCP3424'] = function (block) {
    var ch = block.getFieldValue('ch');
    var code = `Read4_20mA_MPC3424(${ch})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};


javascriptGenerator.forBlock['time_delay'] = function (block) {
    var value_delay = javascriptGenerator.valueToCode(block, 'delay', javascriptGenerator.ORDER_ATOMIC);
    var code = `delay(${value_delay});\n`;
    return code;
};

javascriptGenerator.forBlock['time_delay_microsec'] = function (block) {
    var value_delay = javascriptGenerator.valueToCode(block, 'delay', javascriptGenerator.ORDER_ATOMIC);
    var code = `delayMicroseconds(${value_delay});\n`;
    return code;
};


javascriptGenerator.forBlock['time_sync'] = function (block) {
    var code = `#EXTINC#include "BFarmTime.h"#END
#VARIABLE BFarmTime bfarmtime;#END
bfarmtime.sync();\n`;
    return code;
};

javascriptGenerator.forBlock['time_get_year'] = function (block) {
    var code = 'bfarmtime.getYear()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_get_month'] = function (block) {
    var code = 'bfarmtime.getMonth()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_get_day'] = function (block) {
    var code = 'bfarmtime.getDayOfMonth()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_get_day_of_week'] = function (block) {
    var code = 'bfarmtime.getDayOfWeek()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_get_hour'] = function (block) {
    var code = 'bfarmtime.getHour()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_get_minute'] = function (block) {
    var code = 'bfarmtime.getMinute()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_get_second'] = function (block) {
    var code = 'bfarmtime.getSecond()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_millis'] = function (block) {
    var code = 'millis()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['time_micros'] = function (block) {
    var code = 'micros()';
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['setup_hardware_RTC2'] = function (block) {
    var _rtc = block.getFieldValue('_rtc');
    //code += '#EXTINC#include <RTClib.h>#END\n';
    var code = `
		#EXTINC 
		//#include "RTC2.h"
		#include "time_utility.h"
		#END
		#FUNCTION
		void print_rtc_time(void)
		{
  		RTCnow = rtc2.now();
  		char timeStamp[20];
 		sprintf(timeStamp,"%04d-%02d-%02d %02d:%02d:%02d",RTCnow.year(),RTCnow.month(),RTCnow.day(),RTCnow.hour(),RTCnow.minute(),RTCnow.second());
  		Serial.println(timeStamp);
		}
		void set_rtc_time2(int year,int month,int day,int hour,int minute,int second)
		{
  			rtc2.adjust(DateTime(year, month, day, hour, minute,second));
		}
		void update_system_time_with_rtc2(void)
		{
  		RTCnow = rtc2.now();
  		set_system_time(RTCnow.year(), RTCnow.month(), RTCnow.day(), RTCnow.hour(), RTCnow.minute(), RTCnow.second());
		}

		#END
		#VARIABLE

		void print_rtc_time(void);
		void set_rtc_time2(int year,int month,int day,int hour,int minute,int second);
		void update_system_time_with_rtc2(void);

		${_rtc} rtc2;
		DateTime RTCnow;
		#END
		#SETUP
	
		#END

		#LOOP_EXT_CODE
	
		#END
		rtc2.begin();
	
	`;
    return code;
};

javascriptGenerator.forBlock['update_system_time_with_rtc2'] = function () {
    var code = '';
    code += 'update_system_time_with_rtc2();\n';
    return code;
};

javascriptGenerator.forBlock['set_rtc_time2'] = function (block) {
    "use strict";
    var _year = javascriptGenerator.valueToCode(block, '_year', javascriptGenerator.ORDER_ATOMIC);
    var _month = javascriptGenerator.valueToCode(block, '_month', javascriptGenerator.ORDER_ATOMIC);
    var _day = javascriptGenerator.valueToCode(block, '_day', javascriptGenerator.ORDER_ATOMIC);
    var _hour = javascriptGenerator.valueToCode(block, '_hour', javascriptGenerator.ORDER_ATOMIC);
    var _minute = javascriptGenerator.valueToCode(block, '_minute', javascriptGenerator.ORDER_ATOMIC);
    var _second = javascriptGenerator.valueToCode(block, '_second', javascriptGenerator.ORDER_ATOMIC);
    var code = ``;
    //		code += 'set_rtc_time(2022,11,15,12,23,34);\n'
    code += `set_rtc_time2(${_year},${_month},${_day},${_hour},${_minute},${_second});\n`
    return code;
};

javascriptGenerator.forBlock['set_system_time2'] = function (block) {
    "use strict";

    var _year = javascriptGenerator.valueToCode(block, '_year', javascriptGenerator.ORDER_ATOMIC);
    var _month = javascriptGenerator.valueToCode(block, '_month', javascriptGenerator.ORDER_ATOMIC);
    var _day = javascriptGenerator.valueToCode(block, '_day', javascriptGenerator.ORDER_ATOMIC);
    var _hour = javascriptGenerator.valueToCode(block, '_hour', javascriptGenerator.ORDER_ATOMIC);
    var _minute = javascriptGenerator.valueToCode(block, '_minute', javascriptGenerator.ORDER_ATOMIC);
    var _second = javascriptGenerator.valueToCode(block, '_second', javascriptGenerator.ORDER_ATOMIC);
    var code = ``;
    //code += '#EXTINC#include "time_utility.h"#END\n';
    code += `set_system_time(${_year},${_month},${_day},${_hour},${_minute},${_second});\n`
    return code;
};

javascriptGenerator.forBlock['print_rtc_time'] = function () {
    var code = '';
    code += 'print_rtc_time();\n';
    return code;
};

javascriptGenerator.forBlock['get_rtc_time'] = function () {
    var code = '';
    // code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    // code += 'get_rtc_time()';
    code += 'rtc2.now()';
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['get_rtc_year'] = function () {
    var code = '';
    // code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    // code += 'get_rtc_year()';
    code += 'rtc2.now().year()';
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['get_rtc_month'] = function () {
    var code = '';
    // code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    // code += 'get_rtc_month()';
    code += 'rtc2.now().month()';
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['get_rtc_day'] = function () {
    var code = '';
    // code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    // code += 'get_rtc_day()';
    code += 'rtc2.now().day()';
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['get_rtc_hour'] = function () {
    var code = '';
    // code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    // code += 'get_rtc_hour()';
    code += 'rtc2.now().hour()';
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['get_rtc_minute'] = function () {
    var code = '';
    // code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    // code += 'get_rtc_minute()';
    code += 'rtc2.now().minute()';
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['get_rtc_second'] = function () {
    var code = '';
    // code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    // code += 'get_rtc_second()';
    code += 'rtc2.now().second()';
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['get_rtc_wday'] = function () {
    var code = '';
    code += '#EXTINC#include "rtc_ds1388.h"#END\n';
    code += 'get_rtc_weekday()';
    return [code, javascriptGenerator.ORDER_NONE];
};
