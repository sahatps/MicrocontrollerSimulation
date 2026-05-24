import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['Read4_20_mA_MCP3424'] = function (block) {
    var ch = block.getFieldValue('ch');
    var code = `Read4_20mA_MPC3424(${ch})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['task_io_interrupt'] = function (block) {
    let value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);
    let dropdown_type = block.getFieldValue('type');
    let memory = block.getFieldValue('memory');
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let code = `#EXTINC#include "BFarmEvent.h"#END
                #VARIABLE BFarmEvent bfarmevt;#END
                bfarmevt.attach("",${dropdown_type},
                  [](){
                    ${statements_callback}
                  },${value_pin}, ${memory});
                \n`;
    return code;
};

javascriptGenerator.forBlock['task_io_interrupt_ext'] = function (block) {
    let value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);
    let dropdown_type = block.getFieldValue('type');
    let memory = block.getFieldValue('memory');
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
#BLOCKSETUP
bfarmevt.attach("",${dropdown_type},
  [](){
    ${statements_callback}
  },${value_pin}, ${memory});
#END
\n`;
    return code;
};

javascriptGenerator.forBlock['task_timer_interrupt'] = function (block) {
    let text_taskname = block.getFieldValue('taskname');
    let value_delay = javascriptGenerator.valueToCode(block, 'delay', javascriptGenerator.ORDER_ATOMIC);
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let memory = block.getFieldValue('memory');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
bfarmevt.attach("${text_taskname}",BFarmEventType::EVERY,
  [](){
    ${statements_callback}
  },${value_delay}, ${memory});
\n`;
    return code;
};

javascriptGenerator.forBlock['task_timer_interrupt_ext'] = function (block) {
    let text_taskname = block.getFieldValue('taskname');
    let value_delay = javascriptGenerator.valueToCode(block, 'delay', javascriptGenerator.ORDER_ATOMIC);
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let memory = block.getFieldValue('memory');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
#BLOCKSETUP
bfarmevt.attach("${text_taskname}",BFarmEventType::EVERY,
  [](){
    ${statements_callback}
  },${value_delay}, ${memory});
#END
\n`;
    return code;
};

javascriptGenerator.forBlock['task_timer_interrupt_once'] = function (block) {
    let value_delay = javascriptGenerator.valueToCode(block, 'delay', javascriptGenerator.ORDER_ATOMIC);
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let memory = block.getFieldValue('memory');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
bfarmevt.attach("",BFarmEventType::ONCE,
  [](){
    ${statements_callback}
  },${value_delay}, ${memory});
\n`;
    return code;
};

javascriptGenerator.forBlock['task_timer_interrupt_once_ext'] = function (block) {
    let value_delay = javascriptGenerator.valueToCode(block, 'delay', javascriptGenerator.ORDER_ATOMIC);
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let memory = block.getFieldValue('memory');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
#BLOCKSETUP
bfarmevt.attach("",BFarmEventType::ONCE,
  [](){
    ${statements_callback}
  },${value_delay}, ${memory});
#END
\n`;
    return code;
};
javascriptGenerator.forBlock['task_task'] = function (block) {
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let memory = block.getFieldValue('memory');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
bfarmevt.attach("",BFarmEventType::TASK,
  [](){
    ${statements_callback}
    vTaskDelete( NULL );
  },0, ${memory});
\n`;
    return code;
};
javascriptGenerator.forBlock['task_task_ext'] = function (block) {
    let statements_callback = javascriptGenerator.statementToCode(block, 'callback');
    let memory = block.getFieldValue('memory');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
#BLOCKSETUP
bfarmevt.attach("",BFarmEventType::TASK,
  [](){
    ${statements_callback}
    vTaskDelete( NULL );
  },0, ${memory});
#END
\n`;
    return code;
};
javascriptGenerator.forBlock['task_detach_timer'] = function (block) {
    let text_taskname = block.getFieldValue('taskname');
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
bfarmevt.detach("${text_taskname}");\n`;
    return code;
};
javascriptGenerator.forBlock['task_detach_gpio'] = function (block) {
    let value_pin = javascriptGenerator.valueToCode(block, 'pin', javascriptGenerator.ORDER_ATOMIC);
    let code = `#EXTINC#include "BFarmEvent.h"#END
#VARIABLE BFarmEvent bfarmevt;#END
bfarmevt.detach(${value_pin});\n`;
    return code;
};