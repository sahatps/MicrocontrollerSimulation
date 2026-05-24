import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['Read4_20_mA_MCP3424'] = function (block) {
	var ch = block.getFieldValue('ch');
	var code = `Read4_20mA_MPC3424(${ch})`;
	return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['Read4_20_mA_MCP3424_map'] = function (block) {
	var ch = block.getFieldValue('ch');
	var valueMin = javascriptGenerator.valueToCode(block, 'valueMin', javascriptGenerator.ORDER_ATOMIC);
	var valueMax = javascriptGenerator.valueToCode(block, 'valueMax', javascriptGenerator.ORDER_ATOMIC);
	var OutMin = javascriptGenerator.valueToCode(block, 'OutMin', javascriptGenerator.ORDER_ATOMIC);
	var OutMax = javascriptGenerator.valueToCode(block, 'OutMax', javascriptGenerator.ORDER_ATOMIC);
	var code = `Read4_20mA_MPC3424_map(${ch}, ${valueMin}, ${valueMax}, ${OutMin}, ${OutMax})`;
	return [code, javascriptGenerator.ORDER_ATOMIC];
};

    javascriptGenerator.forBlock['ReadAnalog_MCP3424'] = function (block) {
        var ch = block.getFieldValue('ch');
        var code = `ReadAnalog_MPC3424(${ch})`;
        return [code, javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock['ReadAnalog_from_MPC3424'] = function (block) {
        var ch = block.getFieldValue('ch');
        var valueMin = javascriptGenerator.valueToCode(block, 'valueMin', javascriptGenerator.ORDER_ATOMIC);
        var valueMax = javascriptGenerator.valueToCode(block, 'valueMax', javascriptGenerator.ORDER_ATOMIC);
        var OutMin = javascriptGenerator.valueToCode(block, 'OutMin', javascriptGenerator.ORDER_ATOMIC);
        var OutMax = javascriptGenerator.valueToCode(block, 'OutMax', javascriptGenerator.ORDER_ATOMIC);
        var code = `ReadAnalog_from_MPC3424(${ch}, ${valueMin}, ${valueMax}, ${OutMin}, ${OutMax})`;
        return [code, javascriptGenerator.ORDER_ATOMIC];
    };