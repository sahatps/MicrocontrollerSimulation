import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['Read4_20_mA_MCP3424'] = function (block) {
	var ch = block.getFieldValue('ch');
	var code = `Read4_20mA_MPC3424(${ch})`;
	return [code, javascriptGenerator.ORDER_ATOMIC];
};
javascriptGenerator.forBlock['CJOB_begin'] = function (block) {
		var code = ''
		code += '#EXTINC#include <time.h>#END\n';
		code += '#EXTINC#include "cjob.h"#END\n';
		code += '#VARIABLE int CJOB_begin;#END\n';
		code += '\n';
		code += '#LOOP_EXT_CODE Cron.delay();#END\n'

		return code;
	};

	javascriptGenerator.forBlock['CJOB_addschedule'] = function (block) {

		var schedule = block.getFieldValue('schedule').trim();

		let _oneshort = (block.getFieldValue('_oneshort') == 'TRUE') ? 'true' : 'false';
		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
		let _jobname = block.getFieldValue('jobname').trim();


		var code = '';

		if (_jobname.length > 0) {
			code += '#VARIABLE CronID_t id_' + _jobname + ';#END\n';
			code += '#VARIABLE'
			code += 'void ' + _jobname + '();\n'
			code += '\n#END'
			code += '#FUNCTION'
			code += 'void ' + _jobname + '(){\n\n'
			code += statements_callback
			code += '}\n'
			code += '\n'
			code += '\n#END'
			code += 'id_' + _jobname + '=Cron.create(\"' + schedule + '\"' + ',' + _jobname + ',' + _oneshort + '); \n\n';
		} else {
			alert("กรุณาใส่ชื่อ CronJob Schedule name");
		}


		return code;
	};

	javascriptGenerator.forBlock['CJOB_addschedule_every_seconds'] = function (block) {
		"use strict";
		let _second = block.getFieldValue('_second');
		let _oneshort = (block.getFieldValue('_oneshort') == 'TRUE') ? 'true' : 'false';
		let _jobname = block.getFieldValue('jobname').trim();
		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');

		var code = ''


		if (_jobname.length > 0) {
			code += '#VARIABLE CronID_t id_' + _jobname + ';#END\n';
			code += '#VARIABLE'
			code += 'void ' + _jobname + '();\n'
			code += '\n#END'
			code += '#FUNCTION'
			code += 'void ' + _jobname + '(){\n\n'
			code += statements_callback
			code += '}\n'
			code += '\n'
			code += '\n#END'

			code += 'id_' + _jobname + '=Cron.create(' + '"' + _second + ' ' + '*' + ' ' + '*' + ' ' + '*' + ' ' + '*' + ' ' + '*' + '"' + ',' + _jobname + ',' + _oneshort + ');\n';
		} 

		return code;
	};



	javascriptGenerator.forBlock['CJOB_add_schedule_time'] = function (block) {
		"use strict";

		let _hour = block.getFieldValue('_hour');
		let _minute = block.getFieldValue('_minute');
		let _second = block.getFieldValue('_second');
		let _oneshort = (block.getFieldValue('_oneshort') == 'TRUE') ? 'true' : 'false';
		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
		let _jobname = block.getFieldValue('jobname').trim();

		var code = '';

		if (_jobname.length > 0) {
			code += '#VARIABLE CronID_t id_' + _jobname + ';#END\n';
			code += '#VARIABLE'
			code += 'void ' + _jobname + '();\n'
			code += '\n#END'
			code += '#FUNCTION'
			code += 'void ' + _jobname + '(){\n\n'
			code += statements_callback
			code += '}\n'
			code += '\n'
			code += '\n#END'
			code += 'id_' + _jobname + '=Cron.create(' + '"' + _second + ' ' + _minute + ' ' + _hour + ' ' + '*' + ' ' + '*' + ' ' + '*' + '"' + ',' + _jobname + ',' + _oneshort + ');\n'
		} 

		return code;
	};

	javascriptGenerator.forBlock['CJOB_add_schedule_datetime'] = function (block) {
		"use strict";
		let _month = block.getFieldValue('_month');
		let _day = block.getFieldValue('_day');
		let _hour = block.getFieldValue('_hour');
		let _minute = block.getFieldValue('_minute');
		let _second = block.getFieldValue('_second');
		let _oneshort = (block.getFieldValue('_oneshort') == 'TRUE') ? 'true' : 'false';
		let _jobname = block.getFieldValue('jobname').trim();
		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');


		var code = ''
		if (_jobname.length > 0) {
			code += '#VARIABLE CronID_t id_' + _jobname + ';#END\n';
			code += '#VARIABLE'
			code += 'void ' + _jobname + '();\n'
			code += '\n#END'
			code += '#FUNCTION'
			code += 'void ' + _jobname + '(){\n\n'
			code += statements_callback
			code += '}\n'
			code += '\n'
			code += '\n#END'
			code += 'id_' + _jobname + '=Cron.create(' + '"' + _second + ' ' + _minute + ' ' + _hour + ' ' + _day + ' ' + _month + ' ' + '*' + '"' + ',' + _jobname + ',' + _oneshort + ');\n'
		}

		return code;
	};

	javascriptGenerator.forBlock['CJOB_add_schedule_weekday'] = function (block) {
		"use strict";
		let _Sun = (block.getFieldValue('_Sun') == 'TRUE') ? 'true' : 'false';
		let _Mon = (block.getFieldValue('_Mon') == 'TRUE') ? 'true' : 'false';
		let _Tue = (block.getFieldValue('_Tue') == 'TRUE') ? 'true' : 'false';
		let _Wed = (block.getFieldValue('_Wed') == 'TRUE') ? 'true' : 'false';
		let _Thu = (block.getFieldValue('_Thu') == 'TRUE') ? 'true' : 'false';
		let _Fri = (block.getFieldValue('_Fri') == 'TRUE') ? 'true' : 'false';
		let _Sat = (block.getFieldValue('_Sat') == 'TRUE') ? 'true' : 'false';

		let _hour = block.getFieldValue('_hour');
		let _minute = block.getFieldValue('_minute');
		let _second = block.getFieldValue('_second');
		let _oneshort = (block.getFieldValue('_oneshort') == 'TRUE') ? 'true' : 'false';
		let _jobname = block.getFieldValue('jobname').trim();
		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');


		let code = ''
		let weekday_select = ''
		var firstday = 'true'

		if (_jobname.length > 0) {
			code += '#VARIABLE CronID_t id_' + _jobname + ';#END\n';
			code += '#VARIABLE'
			code += 'void ' + _jobname + '();\n'
			code += '\n#END'
			code += '#FUNCTION'
			code += 'void ' + _jobname + '(){\n\n'
			code += statements_callback
			code += '}\n'
			code += '\n'
			code += '\n#END'

			if (_Sun == 'true') {
				if (firstday == 'true') {
					firstday = 'false'
				} else {
					weekday_select += ','
				}
				weekday_select += '0'
			}
			if (_Mon == 'true') {
				if (firstday == 'true') {
					firstday = 'false'
				} else {
					weekday_select += ','
				}
				weekday_select += '1'
			}
			if (_Tue == 'true') {
				if (firstday == 'true') {
					firstday = 'false'
				} else {
					weekday_select += ','
				}
				weekday_select += '2'
			}
			if (_Wed == 'true') {
				if (firstday == 'true') {
					firstday = 'false'
				} else {
					weekday_select += ','
				}
				weekday_select += '3'
			}
			if (_Thu == 'true') {
				if (firstday == 'true') {
					firstday = 'false'
				} else {
					weekday_select += ','
				}
				weekday_select += '4'
			}
			if (_Fri == 'true') {
				if (firstday == 'true') {
					firstday = 'false'
				} else {
					weekday_select += ','
				}
				weekday_select += '5'
			}
			if (_Sat == 'true') {
				if (firstday == 'true') {
					firstday = 'false'
				} else {
					weekday_select += ','
				}
				weekday_select += '6'
			}

			if (weekday_select.length == 13) {
				code += 'id_' + _jobname + '=Cron.create(' + '"' + _second + ' ' + _minute + ' ' + _hour + ' ' + '*' + ' ' + '*' + ' ' + '*' + '"' + ',' + _jobname + ',' + _oneshort + ');\n'
			} else if (weekday_select.length > 0) {
				code += 'id_' + _jobname + '=Cron.create(' + '"' + _second + ' ' + _minute + ' ' + _hour + ' ' + '*' + ' ' + '*' + ' ' + weekday_select + '"' + ',' + _jobname + ',' + _oneshort + ');\n'
			}
			
		} 

		return code;
	};


	javascriptGenerator.forBlock['CJOB_addschedule_every_minutes'] = function (block) {
		"use strict";
		let _minute = block.getFieldValue('_minute');
		let _second = block.getFieldValue('_second');
		let _oneshort = (block.getFieldValue('_oneshort') == 'TRUE') ? 'true' : 'false';

		let _jobname = block.getFieldValue('jobname').trim();


		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');

		var code = ''
		if (_jobname.length > 0) {
			code += '#VARIABLE CronID_t id_' + _jobname + ';#END\n';
			code += '#VARIABLE'
			code += 'void ' + _jobname + '();\n'
			code += '\n#END'
			code += '#FUNCTION'
			code += 'void ' + _jobname + '(){\n\n'
			code += statements_callback
			code += '}\n'
			code += '\n'
			code += '\n#END'
			code += 'id_' + _jobname + '=Cron.create(' + '"' + _second + ' ' + _minute + ' ' + '*' + ' ' + '*' + ' ' + '*' + ' ' + '*' + '"' + ',' + _jobname + ',' + _oneshort + ');\n'
		} 

		return code;
	};
	javascriptGenerator.forBlock['CJOB_addschedule_every_hours'] = function (block) {
		"use strict";
		let _hour = block.getFieldValue('_hour');
		let _minute = block.getFieldValue('_minute');
		let _second = block.getFieldValue('_second');
		let _oneshort = (block.getFieldValue('_oneshort') == 'TRUE') ? 'true' : 'false';
		let _jobname = block.getFieldValue('jobname').trim();

		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');

		var code = ''
		if (_jobname.length > 0) {
			code += '#VARIABLE CronID_t id_' + _jobname + ';#END\n';
			code += '#VARIABLE'
			code += 'void ' + _jobname + '();\n'
			code += '\n#END'
			code += '#FUNCTION'
			code += 'void ' + _jobname + '(){\n\n'
			code += statements_callback
			code += '}\n'
			code += '\n'
			code += '\n#END'
			code += 'id_' + _jobname + '=Cron.create(' + '"' + _second + ' ' + _minute + ' ' + _hour + ' ' + '*' + ' ' + '*' + ' ' + '*' + '"' + ',' + _jobname + ',' + _oneshort + ');\n'
		} 


		return code;
	};
/*	
	javascriptGenerator.forBlock['CJOB_runnow'] = function (block) {
		let statements_callback = javascriptGenerator.statementToCode(block, 'callback');

		var code = ''
		code += statements_callback

		return code;
	};
*/
	javascriptGenerator.forBlock['CJOB_delete_schedule'] = function (block) {

		let _jobname = block.getFieldValue('jobname').trim();

		var code = ''

		if (_jobname.length > 0) {
			code += 'Cron.free(id_' + _jobname + '); \n'
		}

		return code;
	};
	javascriptGenerator.forBlock['CJOB_enable_schedule'] = function (block) {

		let _jobname = block.getFieldValue('jobname').trim();

		var code = ''

		if (_jobname.length > 0) {
			code += 'Cron.enable(id_' + _jobname + '); \n'
		}

		return code;
	};
	javascriptGenerator.forBlock['CJOB_disable_schedule'] = function (block) {

		let _jobname = block.getFieldValue('jobname').trim();

		var code = ''

		if (_jobname.length > 0) {
			code += 'Cron.disable(id_' + _jobname + '); \n'
		} 
		return code;
	}