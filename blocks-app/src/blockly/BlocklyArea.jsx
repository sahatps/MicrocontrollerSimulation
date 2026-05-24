/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react';

import './blockystyle.css';

// Blockly core
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import * as En from 'blockly/msg/en';

// Components
import Toolbar from '../components/toolbar/Toolbar';
import CatalogBar from '../components/catalog/CatalogBar';
import ControlBar from '../components/controlbar/ControlBar';

// Custom blocks & generators
import './block/index_block.jsx';
import './generate/index_generate.jsx';

import TexttoCode from "../function/TexttoCode";


// Set Blockly language
Blockly.setLocale(En);

const BLOCK_TEST_EXAMPLES = [
    {
        value: '',
        label: 'Block tests...',
    },
    {
        value: 'sht31_fan_demo',
        label: 'SHT31 + Fan Demo',
        xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="80" y="80">
    <statement name="DO">
      <block type="sht31_begin_i2c">
        <next>
          <block type="serial_usb_init"></block>
        </next>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="440" y="80">
    <statement name="DO">
      <block type="sht31_read_init_i2c">
        <next>
          <block type="controls_if">
            <mutation else="1"></mutation>
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">GT</field>
                <value name="A">
                  <block type="sht31_read_temp_i2c"></block>
                </value>
                <value name="B">
                  <shadow type="math_number">
                    <field name="NUM">30</field>
                  </shadow>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="fan_on">
                <field name="PIN">4</field>
              </block>
            </statement>
            <statement name="ELSE">
              <block type="fan_off">
                <field name="PIN">4</field>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`
    }
];

const BlocklyArea = () => {

    /* -------------------- refs -------------------- */
    const blocklyDiv = useRef(null);
    const workspaceRef = useRef(null);
    const fileInputRef = useRef(null);

    /* -------------------- state -------------------- */
    const defaultHeaders = `#include <HandySense.h>
#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include "time.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#SETUP
setPin_Relay(32, 33, 25, 26);
setPin_SW(36, 39, 34, 35);
setPin_ErrorSensor(19, 18, 5);
#END

`;
    const [code, setCode] = useState(defaultHeaders);
    const [isCodeView, setIsCodeView] = useState(false);
    const [catalogVisible, setCatalogVisible] = useState(false);
    const [autoSync, setAutoSync] = useState(false);
    const [selectedExample, setSelectedExample] = useState('');
    const autoSyncRef = useRef(false);

    /* -------------------- UI handlers -------------------- */
    const toggleCodeView = () => {
        setIsCodeView(prev => !prev);
    };

    const toggleCatalog = () => {
        setCatalogVisible(prev => !prev);
    };

    const handleCatalogComponentClick = (comp) => {
        if (!workspaceRef.current) return;
        try {
            workspaceRef.current.getToolbox().selectItemByPosition(comp.categoryIndex);
        } catch (e) {
            console.warn('Could not select toolbox category', e);
        }
    };

    /* -------------------- SAVE WORKSPACE -------------------- */
    const saveWorkspace = (workspace) => {
        if (!workspace) return;

        const xml = Blockly.Xml.workspaceToDom(workspace);
        const text = Blockly.Xml.domToText(xml);

        const blob = new Blob([text], { type: 'text/xml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'blockly.xml';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    /* -------------------- LOAD WORKSPACE -------------------- */
    const loadWorkspace = (file, workspace) => {
        if (!file || !workspace) return;

        const reader = new FileReader();
        reader.onload = () => {
            console.log(reader.result);
            loadWorkspaceFromXmlText(String(reader.result), workspace);
        };
        reader.readAsText(file);
    };

    /* -------------------- LOCK MAIN BLOCKS -------------------- */
    const lockMainBlocks = (workspace) => {
        const blocks = workspace.getAllBlocks(false);
        blocks.forEach(block => {
            if (block.type === 'arduino_setup' || block.type === 'arduino_loop') {
                block.setDeletable(false);
                block.setMovable(true);
            }
        });
    };

    const createMainBlocks = (workspace) => {
        const placeMainBlock = (blockType, x, y) => {
            const block = workspace.newBlock(blockType);
            block.setDeletable(false);
            block.setMovable(true);
            block.initSvg();
            block.render();
            block.moveBy(x, y);
        };

        placeMainBlock('arduino_setup', 80, 80);
        placeMainBlock('arduino_loop', 440, 80);
        lockMainBlocks(workspace);
    };

    const syncGeneratedCode = (workspace) => {
        const generatedCode = javascriptGenerator.workspaceToCode(workspace);
        const fullCode = defaultHeaders + generatedCode;
        setCode(fullCode);

        if (autoSyncRef.current) {
            const convertedCode = TexttoCode(fullCode);
            window.parent.postMessage({ source: 'bfarm', type: 'code-sync', code: convertedCode }, '*');
        }
    };

    const loadWorkspaceFromXmlText = (xmlText, workspace) => {
        if (!workspace) return;

        workspace.clear();

        if (xmlText.trim()) {
            const xml = Blockly.utils.xml.textToDom(xmlText);
            Blockly.Xml.domToWorkspace(xml, workspace);
        } else {
            createMainBlocks(workspace);
        }

        lockMainBlocks(workspace);
        Blockly.svgResize(workspace);
        syncGeneratedCode(workspace);
    };

    const handleExampleChange = (exampleKey) => {
        setSelectedExample(exampleKey);
        if (!workspaceRef.current) return;

        const example = BLOCK_TEST_EXAMPLES.find((item) => item.value === exampleKey);
        if (!example) return;

        loadWorkspaceFromXmlText(example.xml || '', workspaceRef.current);
    };

    /* -------------------- INIT BLOCKLY -------------------- */
    useEffect(() => {

        const toolboxConfig = {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: 'HS Generic',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-hslogo' },
                    contents: [
                        { kind: 'block', type: 'HandySense_Setup' },
                        { kind: 'block', type: 'HandySense_Update' },
                        { kind: 'block', type: 'HandySense_setTime_Interval_Sensor' },
                        { kind: 'block', type: 'HandySense_setTime_Interval_publishData' },
                        { kind: 'block', type: 'HandySense_setPin_Relay' },
                        { kind: 'block', type: 'HandySense_setPin_SensorError' },
                        { kind: 'block', type: 'HandySense_brownout' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Solution',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-solution' },
                    contents: [
                        {
                            kind: "category",
                            name: "Alternate Wetting and Drying",
                            cssConfig: { icon: 'icon_list i-l-awd' },
                            contents: [
                                { kind: "block", type: "HandySense_awdv1" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Evapotranspiration",
                            cssConfig: { icon: 'icon_list i-l-etc' },
                            contents: [
                                { kind: "block", type: "HandySense_et0v1_begin" },
                                { kind: "block", type: "HandySense_et0v1_et0" },
                                { kind: "block", type: "HandySense_et0v1_etc" }
                            ]
                        },
                        {
                            kind: "category",
                            name: "Fertilizer Control",
                            cssConfig: { icon: 'icon_list i-l-fertilizer' },
                            contents: [
                                { kind: "block", type: "Initial_Fertilizer" },
                                { kind: "block", type: "Load_preferences" },
                                { kind: "block", type: "Clear_preferences" },
                                { kind: "block", type: "Print_preferences" },
                                { kind: "block", type: "control_EC" },
                                { kind: "block", type: "control_pH" },
                                { kind: "block", type: "Read_pH" },
                                { kind: "block", type: "Read_temp" },
                                { kind: "block", type: "Read_EC" },
                                { kind: "block", type: "set_preferences" },
                                { kind: "block", type: "set_single_preferences" },
                                { kind: "block", type: "read_single_preferences" }
                            ]
                        },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Sensor',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-sensor' },
                    contents: [
                        {
                            kind: "category",
                            name: "Carbon dioxide",
                            cssConfig: { icon: 'icon_list i-l-co2' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "Weather_HTCo2PLx_begin_rs485" },
                                { kind: "block", type: "Weather_HTCo2PLx_read_co2_rs485" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Humidity",
                            cssConfig: { icon: 'icon_list i-l-humidity' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "sht31_begin_rs" },
                                { kind: "block", type: "sht31_read_humid_rs" },
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "I2C protocol", "web-class": "headline" },
                                { kind: "block", type: "sht31_begin_i2c" },
                                { kind: "block", type: "sht31_read_init_i2c" },
                                { kind: "block", type: "sht31_read_humid_i2c" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Light",
                            cssConfig: { icon: 'icon_list i-l-light' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "rs485_light_begin" },
                                { kind: "block", type: "rs485_Light_read" },
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "I2C protocol", "web-class": "headline" },
                                { kind: "block", type: "bh1750_begin" },
                                { kind: "block", type: "bh1750_read" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "pH",
                            cssConfig: { icon: 'icon_list i-l-ph' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "rs485_PH_begin" },
                                { kind: "block", type: "rs485_PH_read" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Pressure",
                            cssConfig: { icon: 'icon_list i-l-pressure' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "Weather_HTCo2PLx_begin_rs485" },
                                { kind: "block", type: "Weather_HTCo2PLx_read_pressure_rs485" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Rain",
                            cssConfig: { icon: 'icon_list i-l-rain' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "Rain_begin_rs485" },
                                { kind: "block", type: "Rain_read_rs485" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Temperature",
                            cssConfig: { icon: 'icon_list i-l-temp' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "sht31_begin_rs" },
                                { kind: "block", type: "sht31_read_temp_rs" },
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "I2C protocol", "web-class": "headline" },
                                { kind: "block", type: "sht31_begin_i2c" },
                                { kind: "block", type: "sht31_read_init_i2c" },
                                { kind: "block", type: "sht31_read_temp_i2c" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Weight",
                            cssConfig: { icon: 'icon_list i-l-weight' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "rs485_3kg_begin" },
                                { kind: "block", type: "rs485_3kg_read" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Wind",
                            cssConfig: { icon: 'icon_list i-l-wind' },
                            contents: [
                                { kind: "sep", gap: 12 },
                                { kind: "label", text: "MODBUS protocol", "web-class": "headline" },
                                { kind: "block", type: "Wind_begin_rs485" },
                                { kind: "block", type: "Wind_read_rs485" },
                                { kind: "block", type: "Wind_speed_begin_rs485" },
                                { kind: "block", type: "Wind_speed_read_rs485" },
                            ]
                        },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Analog',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-analog' },
                    contents: [
                        { kind: "sep", gap: 12 },
                        { kind: "label", text: "Read Current", "web-class": "headline" },
                        { kind: 'block', type: 'Read4_20_mA_MCP3424' },
                        { kind: 'block', type: 'Read4_20_mA_MCP3424_map' },
                        { kind: "label", text: "Read Voltage", "web-class": "headline" },
                        { kind: 'block', type: 'ReadAnalog_MCP3424' },
                        { kind: 'block', type: 'ReadAnalog_from_MPC3424' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Electronic',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-electronic' },
                    contents: [
                        { kind: "sep", gap: 12 },
                        { kind: "label", text: "Button", "web-class": "headline" },
                        { kind: 'block', type: 'sw_on_pressed' },
                        { kind: 'block', type: 'sw_on_release' },
                        { kind: 'block', type: 'sw_pressed' },
                        { kind: 'block', type: 'sw_release' },
                        { kind: "label", text: "LED", "web-class": "headline" },
                        { kind: 'block', type: 'led_control_on' },
                        { kind: 'block', type: 'led_control_off' },
                        { kind: "label", text: "Relay", "web-class": "headline" },
                        { kind: 'block', type: 'relay_on' },
                        { kind: 'block', type: 'relay_off' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Components',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-electronic' },
                    contents: [
                        {
                            kind: 'category',
                            name: 'Input',
                            colour: '#77af5a',
                            contents: [
                                { kind: "label", text: "Slide Switch", "web-class": "headline" },
                                { kind: 'block', type: 'slide_switch_read' },
                                { kind: "label", text: "Potentiometer", "web-class": "headline" },
                                { kind: 'block', type: 'potentiometer_read' },
                                { kind: "label", text: "Joystick", "web-class": "headline" },
                                { kind: 'block', type: 'joystick_x' },
                                { kind: 'block', type: 'joystick_y' },
                                { kind: "label", text: "DipSwitch8", "web-class": "headline" },
                                { kind: 'block', type: 'dip_switch_read' },
                                { kind: "label", text: "KY040 Rotary", "web-class": "headline" },
                                { kind: 'block', type: 'ky040_read' },
                            ]
                        },
                        {
                            kind: 'category',
                            name: 'Display & LED',
                            colour: '#77af5a',
                            contents: [
                                { kind: "label", text: "RGB LED", "web-class": "headline" },
                                { kind: 'block', type: 'rgb_led_set' },
                                { kind: "label", text: "LED Bar", "web-class": "headline" },
                                { kind: 'block', type: 'led_bar_set' },
                                { kind: "label", text: "NeoPixel", "web-class": "headline" },
                                { kind: 'block', type: 'neopixel_set' },
                                { kind: "label", text: "LED Ring", "web-class": "headline" },
                                { kind: 'block', type: 'led_ring_set' },
                                { kind: "label", text: "Seven Segment", "web-class": "headline" },
                                { kind: 'block', type: 'seven_seg_show' },
                                { kind: "label", text: "LCD", "web-class": "headline" },
                                { kind: 'block', type: 'lcd_print' },
                            ]
                        },
                        {
                            kind: 'category',
                            name: 'Actuator',
                            colour: '#77af5a',
                            contents: [
                                { kind: "label", text: "Buzzer", "web-class": "headline" },
                                { kind: 'block', type: 'buzzer_on' },
                                { kind: 'block', type: 'buzzer_off' },
                                { kind: "label", text: "Servo", "web-class": "headline" },
                                { kind: 'block', type: 'servo_write' },
                                { kind: "label", text: "Fan", "web-class": "headline" },
                                { kind: 'block', type: 'fan_on' },
                                { kind: 'block', type: 'fan_off' },
                                { kind: "label", text: "Water Pump", "web-class": "headline" },
                                { kind: 'block', type: 'water_pump_on' },
                                { kind: 'block', type: 'water_pump_off' },
                                { kind: "label", text: "Misting Pump", "web-class": "headline" },
                                { kind: 'block', type: 'misting_pump_on' },
                                { kind: 'block', type: 'misting_pump_off' },
                            ]
                        },
                        {
                            kind: 'category',
                            name: 'Sensor',
                            colour: '#77af5a',
                            contents: [
                                { kind: "label", text: "NTC Temperature", "web-class": "headline" },
                                { kind: 'block', type: 'ntc_temperature' },
                                { kind: "label", text: "Sound Sensor", "web-class": "headline" },
                                { kind: 'block', type: 'sound_read' },
                                { kind: "label", text: "HC-SR04 Ultrasonic", "web-class": "headline" },
                                { kind: 'block', type: 'hcsr04_distance' },
                                { kind: "label", text: "Photoresistor", "web-class": "headline" },
                                { kind: 'block', type: 'photoresistor_read' },
                                { kind: "label", text: "DS1307 Clock", "web-class": "headline" },
                                { kind: 'block', type: 'ds1307_read' },
                            ]
                        },
                    ]
                },
                {
                    kind: 'category',
                    name: 'GPIO',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-gpio' },
                    contents: [
                        { kind: 'block', type: 'io_setpin' },
                        { kind: 'block', type: 'io_digital_read' },
                        { kind: 'block', type: 'io_digital_write' },
                        { kind: 'block', type: 'io_analog_read' },
                        { kind: 'block', type: 'io_analog_write' },
                        { kind: 'block', type: 'io_pwm_write' },
                        { kind: 'block', type: 'io_pulse_in' },
                        { kind: 'block', type: 'io_shift_in' },
                        { kind: 'block', type: 'io_shift_out' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Variables',
                    colour: '#77af5a',
                    custom: 'VARIABLE',
                    cssConfig: { icon: 'icon_category i-variables' }
                },
                {
                    kind: 'category',
                    name: 'Math',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-math' },
                    contents: [
                        { kind: 'block', type: 'math_number', fields: { NUM: 123 } },
                        { kind: 'block', type: 'math_arithmetic' },
                        { kind: 'block', type: 'math_single' },
                        { kind: 'block', type: 'math_trig' },
                        { kind: 'block', type: 'math_constant' },
                        { kind: 'block', type: 'math_number_property' },
                        { kind: 'block', type: 'math_round' },
                        { kind: 'block', type: 'math_on_list' },
                        { kind: 'block', type: 'math_modulo' },
                        {
                            kind: 'block',
                            type: 'math_constrain',
                            inputs: {
                                LOW: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                                HIGH: { shadow: { type: 'math_number', fields: { NUM: 100 } } }
                            }
                        },
                        {
                            kind: 'block',
                            type: 'math_random_int',
                            inputs: {
                                FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                                TO: { shadow: { type: 'math_number', fields: { NUM: 100 } } }
                            }
                        },
                        { kind: 'block', type: 'math_random_float' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Text',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-text' },
                    contents: [
                        { kind: 'block', type: 'text' },
                        { kind: 'block', type: 'text_join' },
                        { kind: 'block', type: 'text_append', inputs: { TEXT: { shadow: { type: 'text' } } } },
                        { kind: 'block', type: 'text_length', inputs: { VALUE: { shadow: { type: 'text' } } } },
                        { kind: 'block', type: 'text_isEmpty', inputs: { VALUE: { shadow: { type: 'text' } } } },
                        { kind: 'block', type: 'text_changeCase', inputs: { TEXT: { shadow: { type: 'text' } } } },
                        { kind: 'block', type: 'text_trim', inputs: { TEXT: { shadow: { type: 'text' } } } },
                        { kind: 'block', type: 'text_print', inputs: { TEXT: { shadow: { type: 'text' } } } },
                        { kind: 'block', type: 'text_prompt_ext', inputs: { TEXT: { shadow: { type: 'text' } } } }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Functions',
                    colour: '#77af5a',
                    custom: 'PROCEDURE',
                    cssConfig: { icon: 'icon_category i-functions' }
                },
                {
                    kind: 'category',
                    name: 'Logic',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-logiccc' },
                    contents: [
                        { kind: 'block', type: 'controls_if' },
                        { kind: 'block', type: 'logic_compare' },
                        { kind: 'block', type: 'logic_operation' },
                        { kind: 'block', type: 'logic_negate' },
                        { kind: 'block', type: 'logic_boolean' },
                        { kind: 'block', type: 'logic_null' },
                        { kind: 'block', type: 'logic_ternary' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Loops',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-loop' },
                    contents: [
                        {
                            kind: 'block',
                            type: 'controls_repeat_ext',
                            inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } } }
                        },
                        { kind: 'block', type: 'controls_whileUntil' },
                        {
                            kind: 'block',
                            type: 'controls_for',
                            inputs: {
                                FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                                TO: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
                                BY: { shadow: { type: 'math_number', fields: { NUM: 1 } } }
                            }
                        },
                        { kind: 'block', type: 'controls_forEach' },
                        { kind: 'block', type: 'controls_flow_statements' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Task',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-task' },
                    contents: [
                        { kind: "label", text: "Custom task", "web-class": "headline" },
                        {
                            kind: 'block',
                            type: 'task_io_interrupt',
                            inputs: { pin: { shadow: { type: 'math_number', fields: { NUM: 1 } } } }
                        },
                        {
                            kind: 'block',
                            type: 'task_timer_interrupt',
                            inputs: { delay: { shadow: { type: 'math_number', fields: { NUM: 500 } } } }
                        },
                        {
                            kind: 'block',
                            type: 'task_timer_interrupt_once',
                            inputs: { delay: { shadow: { type: 'math_number', fields: { NUM: 500 } } } }
                        },
                        { kind: 'block', type: 'task_task' },

                        { kind: "label", text: "Auto task", "web-class": "headline" },
                        {
                            kind: 'block',
                            type: 'task_io_interrupt_ext',
                            inputs: { pin: { shadow: { type: 'math_number', fields: { NUM: 1 } } } }
                        },
                        {
                            kind: 'block',
                            type: 'task_timer_interrupt_ext',
                            inputs: { delay: { shadow: { type: 'math_number', fields: { NUM: 500 } } } }
                        },
                        {
                            kind: 'block',
                            type: 'task_timer_interrupt_once_ext',
                            inputs: { delay: { shadow: { type: 'math_number', fields: { NUM: 500 } } } }
                        },
                        { kind: 'block', type: 'task_task_ext' },

                        { kind: "label", text: "Stopper", "web-class": "headline" },
                        { kind: 'block', type: 'task_detach_timer' },
                        {
                            kind: 'block',
                            type: 'task_detach_gpio',
                            inputs: { pin: { shadow: { type: 'math_number', fields: { NUM: 500 } } } }
                        },


                    ]
                },
                {
                    kind: 'category',
                    name: 'Time',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-time' },
                    contents: [
                        { kind: "sep", gap: 12 },
                        { kind: "label", text: "Delay time", "web-class": "headline" },
                        {
                            kind: 'block',
                            type: 'time_delay',
                            inputs: { delay: { shadow: { type: 'math_number', fields: { NUM: 500 } } } }
                        },
                        {
                            kind: 'block',
                            type: 'time_delay_microsec',
                            inputs: { delay: { shadow: { type: 'math_number', fields: { NUM: 1000 } } } }
                        },
                        { kind: "label", text: "Internet time", "web-class": "headline" },
                        { kind: 'block', type: 'time_sync' },
                        { kind: 'block', type: 'time_get_year' },
                        { kind: 'block', type: 'time_get_month' },
                        { kind: 'block', type: 'time_get_day' },
                        { kind: 'block', type: 'time_get_day_of_week' },
                        { kind: 'block', type: 'time_get_hour' },
                        { kind: 'block', type: 'time_get_minute' },
                        { kind: 'block', type: 'time_get_second' },
                        { kind: 'block', type: 'time_millis' },
                        { kind: 'block', type: 'time_micros' },

                        { kind: "label", text: "Local time", "web-class": "headline" },
                        { kind: 'block', type: 'setup_hardware_RTC2' },
                        { kind: 'block', type: 'print_rtc_time' },
                        { kind: 'block', type: 'update_system_time_with_rtc2' },
                        { kind: 'block', type: 'get_rtc_year' },
                        { kind: 'block', type: 'get_rtc_month' },
                        { kind: 'block', type: 'get_rtc_day' },
                        { kind: 'block', type: 'get_rtc_wday' },
                        { kind: 'block', type: 'get_rtc_hour' },
                        { kind: 'block', type: 'get_rtc_minute' },
                        { kind: 'block', type: 'get_rtc_second' },
                        { kind: 'block', type: 'set_rtc_time2' },
                        { kind: 'block', type: 'set_system_time2' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Cronjob',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-cronjob' },
                    contents: [
                        { kind: 'block', type: 'CJOB_begin' },
                        { kind: 'block', type: 'CJOB_add_schedule_time' },
                        { kind: 'block', type: 'CJOB_add_schedule_weekday' },
                        { kind: 'block', type: 'CJOB_add_schedule_datetime' },
                        { kind: 'block', type: 'CJOB_addschedule_every_seconds' },
                        { kind: 'block', type: 'CJOB_addschedule_every_minutes' },
                        { kind: 'block', type: 'CJOB_addschedule_every_hours' },
                        { kind: 'block', type: 'CJOB_addschedule' },
                        { kind: 'block', type: 'CJOB_enable_schedule' },
                        { kind: 'block', type: 'CJOB_disable_schedule' },
                        { kind: 'block', type: 'CJOB_delete_schedule' },

                    ]
                },
                {
                    kind: 'category',
                    name: 'WiFi',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-wifi' },
                    contents: [
                        { kind: 'block', type: 'wifi_connect' },
                        { kind: 'block', type: 'wifi_ap' },
                        { kind: 'block', type: 'wifi_start_server' },
                        { kind: 'block', type: 'wifi_server_on' },
                        {
                            kind: 'block',
                            type: 'wifi_server_send',
                            inputs: { text: { shadow: { type: 'text', fields: { TEXT: ["Hello B-FARM!"] } } } }
                        },
                        { kind: 'block', type: 'wifi_get_ip_addr' },
                        { kind: 'block', type: 'wifi_get_ap_ip_addr' },
                        { kind: 'block', type: 'wifi_get_arg' },

                    ]
                },
                {
                    kind: 'category',
                    name: 'Bluetooth',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-bluetooth' },
                    contents: [
                        { kind: 'block', type: 'bt_start' },
                        {
                            kind: 'block',
                            type: 'bt_send_string',
                            inputs: { text: { shadow: { type: 'text', fields: { TEXT: ["Hello B-FARM!"] } } } }
                        },
                        { kind: 'block', type: 'bt_on_receive' },
                        { kind: 'block', type: 'bt_read_data' },
                        { kind: 'block', type: 'bt_read_line' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Serial',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-serial' },
                    contents: [
                        { kind: 'block', type: 'serial_usb_init' },
                        { kind: 'block', type: 'serial_hardware_init' },
                        { kind: 'block', type: 'serial_available' },
                        {
                            kind: 'block',
                            type: 'serial_write_data',
                            inputs: { text: { shadow: { type: 'text', fields: { TEXT: ["Hello B-FARM!"] } } } }
                        },
                        { kind: 'block', type: 'serial_write_newline' },
                        { kind: 'block', type: 'serial_read_line' },
                        { kind: 'block', type: 'serial_read_until' },

                    ]
                },
                {
                    kind: 'category',
                    name: 'Cloud',
                    colour: '#77af5a',
                    cssConfig: { icon: 'icon_category i-cloud' },
                    contents: [
                        {
                            kind: "category",
                            name: "NETPIE",
                            cssConfig: { icon: 'icon_list i-l-netpie' },
                            contents: [
                                { kind: "block", type: "netpie_begin" },
                                { kind: "block", type: "netpie_connect" },
                                { kind: "block", type: "callback_netpie" },
                                { kind: "block", type: "callback_setup" },
                                { kind: "block", type: "netpie_topic" },
                                { kind: "block", type: "pub_topic" },
                                { kind: "block", type: "payload" },
                                // { kind: "block", type: "text" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "MAGELLAN",
                            cssConfig: { icon: 'icon_list i-l-magellan' },
                            contents: [
                                { kind: "block", type: "magellan_begin" },
                                { kind: "block", type: "magellan_begin3" },
                                { kind: "block", type: "magellan_reconnect" },
                                { kind: "block", type: "magellan_isconnected" },
                                { kind: "block", type: "magellan_interval" },
                                { kind: "block", type: "magellan_interval2" },
                                { kind: "block", type: "callback_magellan" },
                                { kind: "block", type: "extract_value" },
                                { kind: "block", type: "conv_val" },
                                { kind: "block", type: "condition_key" },
                                { kind: "block", type: "condition_value" },
                                // { kind: "block", type: "magellan_condition_callback" },
                                { kind: "block", type: "magellan_request" },
                                { kind: "block", type: "magellan_sensor_add" },
                                { kind: "block", type: "magellan_sensor_add_txt" },
                                { kind: "block", type: "magellan_sensor_report" },
                                { kind: "block", type: "magellan_client_config_add" },
                                { kind: "block", type: "magellan_client_config_add_txt" },
                                { kind: "block", type: "magellan_client_config_send" },
                            ]
                        },
                        {
                            kind: "category",
                            name: "Thingspeak",
                            cssConfig: { icon: 'icon_list i-l-thingspeak' },
                            contents: [
                                { kind: "block", type: "Thingspeak_begin" },
                                { kind: "block", type: "Thingspeak_connectWifi" },
                                { kind: "block", type: "Thingspeak_Finish" },
                                { kind: "block", type: "Thingspeak_set_field_value" },
                            ]
                        },
                    ]
                }
            ]
        };

        workspaceRef.current = Blockly.inject(blocklyDiv.current, {
            toolbox: toolboxConfig,
            grid: {
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true
            },
            trashcan: true,
            zoom: {
                controls: true,
                wheel: false,
                startScale: 1,
                maxScale: 3,
                minScale: 0.3
            },
            move: {
                scrollbars: true,
                drag: true,
                wheel: false
            }
        });

        const workspace = workspaceRef.current;

        /* ----- create main blocks ----- */
        createMainBlocks(workspace);

        /* ----- update code on change ----- */
        workspace.addChangeListener(() => {
            syncGeneratedCode(workspace);
        });

        return () => {
            workspace.dispose();
        };

    }, []);

    /* -------------------- SEND TO HACKCABLE -------------------- */
    const sendCodeToHackCable = () => {
        if (!workspaceRef.current) return;
        const generatedCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
        const fullCode = defaultHeaders + generatedCode;
        const convertedCode = TexttoCode(fullCode);
        window.parent.postMessage({ source: 'bfarm', type: 'code-sync', code: convertedCode }, '*');
    };

    /* -------------------- SYNC AUTOSYNC REF -------------------- */
    useEffect(() => { autoSyncRef.current = autoSync; }, [autoSync]);

    /* -------------------- RESIZE + INCOMING CODE LISTENER -------------------- */
    useEffect(() => {
        const handleMessage = (e) => {
            if (!e.data) return;
            if (e.data.source === 'shell' && e.data.type === 'resize' && workspaceRef.current) {
                Blockly.svgResize(workspaceRef.current);
            }
            if (e.data.source === 'hackcable' && e.data.type === 'code-sync' && typeof e.data.code === 'string') {
                setCode(e.data.code);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    /* -------------------- RESIZE ON PANEL TOGGLE -------------------- */
    useEffect(() => {
        const timer = setTimeout(() => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
        }, 320);
        return () => clearTimeout(timer);
    }, [isCodeView, catalogVisible]);

    /* -------------------- CODE GENERATION -------------------- */
    const handleGenerateCode = () => {
        if (!workspaceRef.current) return;

        const generatedCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
        const fullCode = defaultHeaders + generatedCode;
        setCode(fullCode);

        const convertedCode = TexttoCode(fullCode);
        console.log(convertedCode);

        // Download as .txt file
        const blob = new Blob([convertedCode], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'generated_code.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleVerifyCode = async () => {
        const generatedCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
        const fullCode = defaultHeaders + generatedCode;
        const convertedCode = TexttoCode(fullCode);
        console.log(convertedCode);
        try {
            const body = JSON.stringify({ code: convertedCode });
            console.log("Sending code for verification:", body);
            const response = await fetch('http://localhost:3001/api/verify-arduino', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });
            const result = await response.json();
            console.log(result);
        } catch (error) {
            console.error("Error verifying code:", error);
        }
    }

    const handleCompiledCode = async () => {
        const generatedCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
        const fullCode = defaultHeaders + generatedCode;
        const convertedCode = TexttoCode(fullCode);
        console.log(convertedCode);
        try {
            const body = {
                "code": convertedCode,
                "fqbn": "esp32:esp32:esp32",
                "baudRate": 115200,
                "port": "COM5"
            };
            console.log("Sending code for compilation:", body);

            const response = await fetch("http://localhost:3002/compile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            console.log("response =", response);
            console.log("data =", data);
        } catch (error) {
            console.error("Error compiling code:", error);
        }
    }

    /* -------------------- RENDER -------------------- */
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

            {/* Toolbar */}
            <Toolbar
                showCode={handleGenerateCode}
                verifyCode={handleVerifyCode}
                compiledCode={handleCompiledCode}
                isCodeView={isCodeView}
                toggleCodeView={toggleCodeView}
                saveWorkspace={() => saveWorkspace(workspaceRef.current)}
                openFile={() => fileInputRef.current.click()}
                sendToHackCable={sendCodeToHackCable}
                catalogVisible={catalogVisible}
                toggleCatalog={toggleCatalog}
                selectedExample={selectedExample}
                onExampleChange={handleExampleChange}
                exampleOptions={BLOCK_TEST_EXAMPLES.map(({ value, label }) => ({ value, label }))}
            />

            {/* Hidden file input */}
            <input
                type="file"
                accept=".xml"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    loadWorkspace(file, workspaceRef.current);
                    e.target.value = '';
                }}
            />

            {/* Blockly Workspace */}
            <div style={{
                flex: 1,
                minHeight: 0,
                paddingRight: isCodeView ? '340px' : '0px',
                transition: 'padding-right 0.3s ease'
            }}>
                <div
                    ref={blocklyDiv}
                    style={{
                        height: '100%',
                        width: '100%',
                        border: '1px solid #ccc'
                    }}
                />
            </div>

            {/* Component Catalog Bar — bottom */}
            <CatalogBar
                visible={catalogVisible}
                onComponentClick={handleCatalogComponentClick}
            />

            {/* Right Control Bar (Code / I/O) */}
            <ControlBar
                code={code}
                visible={isCodeView}
                onTransfer={sendCodeToHackCable}
                autoSync={autoSync}
                onAutoSyncChange={setAutoSync}
            />
        </div>
    );
};

export default BlocklyArea;
