import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock["Initial_Fertilizer"] = function () {

    var code = `
	#EXTINC
    #include <Preferences.h>
    #include <fertilizer.h>
    #END
    preferences.begin("credentials", false);
    load_preferences();
	`;
    return code;
};


javascriptGenerator.forBlock["Load_preferences"] = function () {

    var code = `
	load_preferences();
	`;
    return code;
};

javascriptGenerator.forBlock["Clear_preferences"] = function () {

    var code = `
	clear_preferences();
	`;
    return code;
};

javascriptGenerator.forBlock["Print_preferences"] = function () {

    var code = `
	print_config();
	`;
    return code;
};

javascriptGenerator.forBlock['Read_pH'] = function (block) {
    var _adc_ph = javascriptGenerator.valueToCode(block, '_adc_ph', javascriptGenerator.ORDER_NONE);
    var code = ``;
    code += `(float)(PHcompute(${_adc_ph}))`
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['Read_temp'] = function (block) {
    var _adc_temp = javascriptGenerator.valueToCode(block, '_adc_temp', javascriptGenerator.ORDER_NONE);
    var code = ``;
    code += `(float)(Tempcompute(${_adc_temp}))`
    return [code, javascriptGenerator.ORDER_NONE];
};
javascriptGenerator.forBlock['Read_EC'] = function (block) {
    var _adc_ec = javascriptGenerator.valueToCode(block, '_adc_ec', javascriptGenerator.ORDER_NONE);
    var _adc_temp = javascriptGenerator.valueToCode(block, '_adc_temp', javascriptGenerator.ORDER_NONE);
    var code = ``;
    code += `(int)(ECcompute(${_adc_ec},${_adc_temp}))`
    return [code, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['set_preferences'] = function (block) {
    "use strict";
    var _ph4 = javascriptGenerator.valueToCode(block, '_ph4', javascriptGenerator.ORDER_NONE);
    var _ph7 = javascriptGenerator.valueToCode(block, '_ph7', javascriptGenerator.ORDER_NONE);
    var _ph10 = javascriptGenerator.valueToCode(block, '_ph7', javascriptGenerator.ORDER_NONE);
    var _ec0 = javascriptGenerator.valueToCode(block, '_ec0', javascriptGenerator.ORDER_NONE);
    var _ec1413 = javascriptGenerator.valueToCode(block, '_ec1413', javascriptGenerator.ORDER_NONE);
    var _calTemp = javascriptGenerator.valueToCode(block, '_calTemp', javascriptGenerator.ORDER_NONE);
    //var _ec5000 = javascriptGenerator.valueToCode(block, '_ec5000', javascriptGenerator.ORDER_NONE);
    var _phmin = javascriptGenerator.valueToCode(block, '_phmin', javascriptGenerator.ORDER_NONE);
    var _phmax = javascriptGenerator.valueToCode(block, '_phmax', javascriptGenerator.ORDER_NONE);
    var _ecmin = javascriptGenerator.valueToCode(block, '_ecmin', javascriptGenerator.ORDER_NONE);
    var _phdur = javascriptGenerator.valueToCode(block, '_phdur', javascriptGenerator.ORDER_NONE);
    var _ecdur = javascriptGenerator.valueToCode(block, '_ecdur', javascriptGenerator.ORDER_NONE);
    var code = ``;
    code += `calTemp=${_calTemp};calPH4=${_ph4};calPH7=${_ph7};calPH10=${_ph10};calEC0=${_ec0};calEC1413=${_ec1413};PHthresh_min=${_phmin};PHthresh_max=${_phmax};ECthresh_min=${_ecmin};PHdura_value=${_phdur};ECdura_value=${_ecdur};\n`
    code += `set_preferences();\n`
    return code;
};

javascriptGenerator.forBlock['set_single_preferences'] = function (block) {
    "use strict";
    var _param = block.getFieldValue('_param');
    var _value = javascriptGenerator.valueToCode(block, '_value', javascriptGenerator.ORDER_NONE);
    var code = ``;
    code += `${_param}=${_value};\n`
    code += `set_preferences();\n`
    return code;
};

javascriptGenerator.forBlock['read_single_preferences'] = function (block) {
    var _param = block.getFieldValue('_param');
    var code = ``;
    code += `${_param}`
    return [code, javascriptGenerator.ORDER_NONE];
};