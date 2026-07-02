import * as Blockly from "blockly/core";

// -------------------------------
// Shared helpers
// -------------------------------
const COLOR_TASK = "#3e4b72";

const MEMORY_OPTIONS = [
  ["1024", "1024"],
  ["2048", "2048"],
  ["3072", "3072"],
  ["4096", "4096"],
  ["5120", "5120"],
  ["6144", "6144"],
  ["7168", "7168"],
  ["8192", "8192"],
];

const GPIO_EVENT_OPTIONS = [
  ["change", "BFarmEventType::PIN_CHANGE"],
  ["falling", "BFarmEventType::PIN_FALLING"],
  ["raising", "BFarmEventType::PIN_RAISING"],
];

// กันชื่อซ้ำแบบปลอดภัย (ไม่พึ่ง Blockly.JavaScript.variableDB_)
function getDistinctTextName(block, base, fieldName) {
  const ws = block.workspace;
  if (!ws) return base;

  const used = new Set();
  ws.getAllBlocks(false).forEach((b) => {
    const v = b.getFieldValue?.(fieldName);
    if (typeof v === "string" && v.trim()) used.add(v.trim());
  });

  if (!used.has(base)) return base;

  let i = 2;
  while (used.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function addMemoryField(block) {
  block
    .appendDummyInput()
    .appendField("memory:")
    .appendField(new Blockly.FieldDropdown(MEMORY_OPTIONS), "memory");
}

function setStatementConnections(block, enabled) {
  // ถ้า enabled = false ให้ “ไม่มี” previous/next connection จริง ๆ
  block.setPreviousStatement(enabled);
  block.setNextStatement(enabled);
}

// -------------------------------
// GPIO interrupt
// -------------------------------
Blockly.Blocks["task_io_interrupt"] = {
  init: function () {
    this.appendValueInput("pin")
      .setCheck("Number")
      .appendField("on GPIO pin");

    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(GPIO_EVENT_OPTIONS), "type");

    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, true);
    this.setColour(COLOR_TASK);
    this.setTooltip("Catch event when digital GPIO changes.");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["task_io_interrupt_ext"] = {
  init: function () {
    this.appendValueInput("pin")
      .setCheck("Number")
      .appendField("on GPIO pin");

    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(GPIO_EVENT_OPTIONS), "type");

    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, false);
    this.setColour(COLOR_TASK);
    this.setTooltip("Catch event when digital GPIO changes.");
    this.setHelpUrl("");
  },
};

// -------------------------------
// Timer interrupt (periodic)
// -------------------------------
Blockly.Blocks["task_timer_interrupt"] = {
  init: function () {
    const name = getDistinctTextName(this, "MyJob", "taskname");

    this.appendValueInput("delay")
      .setCheck("Number")
      .appendField("do")
      .appendField(new Blockly.FieldTextInput(name), "taskname")
      .appendField("every");

    this.appendDummyInput().appendField("milliseconds");
    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, true);
    this.setColour(COLOR_TASK);
    this.setTooltip("Run task periodically.");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["task_timer_interrupt_ext"] = {
  init: function () {
    const name = getDistinctTextName(this, "MyJob", "taskname");

    this.appendValueInput("delay")
      .setCheck("Number")
      .appendField("do")
      .appendField(new Blockly.FieldTextInput(name), "taskname")
      .appendField("every");

    this.appendDummyInput().appendField("milliseconds");
    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, false);
    this.setColour(COLOR_TASK);
    this.setTooltip("Run task periodically.");
    this.setHelpUrl("");
  },
};

// -------------------------------
// Timer interrupt (once)
// -------------------------------
Blockly.Blocks["task_timer_interrupt_once"] = {
  init: function () {
    this.appendValueInput("delay")
      .setCheck("Number")
      .appendField("do after");

    this.appendDummyInput().appendField("milliseconds");
    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, true);
    this.setColour(COLOR_TASK);
    this.setTooltip("Run task once.");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["task_timer_interrupt_once_ext"] = {
  init: function () {
    this.appendValueInput("delay")
      .setCheck("Number")
      .appendField("do after");

    this.appendDummyInput().appendField("milliseconds");
    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, false);
    this.setColour(COLOR_TASK);
    this.setTooltip("Run task once.");
    this.setHelpUrl("");
  },
};

// -------------------------------
// Concurrent task
// -------------------------------
Blockly.Blocks["task_task"] = {
  init: function () {
    this.appendDummyInput().appendField("run task");
    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, true);
    this.setColour(COLOR_TASK);
    this.setTooltip("Start concurrent task.");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["task_task_ext"] = {
  init: function () {
    this.appendDummyInput().appendField("run task");
    addMemoryField(this);

    this.appendStatementInput("callback")
      .setCheck(null)
      .appendField("do");

    this.setInputsInline(true);
    setStatementConnections(this, false);
    this.setColour(COLOR_TASK);
    this.setTooltip("Start concurrent task.");
    this.setHelpUrl("");
  },
};

// -------------------------------
// Detach / stop
// -------------------------------
Blockly.Blocks["task_detach_timer"] = {
  init: function () {
    const name = getDistinctTextName(this, "MyJob", "taskname");

    this.appendDummyInput()
      .appendField("stop task")
      .appendField(new Blockly.FieldTextInput(name), "taskname");

    this.setInputsInline(true);
    setStatementConnections(this, true);
    this.setColour(COLOR_TASK);
    this.setTooltip("Detach running task.");
    this.setHelpUrl("");
  },
};

Blockly.Blocks["task_detach_gpio"] = {
  init: function () {
    this.appendValueInput("pin")
      .setCheck("Number")
      .appendField("stop GPIO interrupt pin");

    this.setInputsInline(true);
    setStatementConnections(this, true);
    this.setColour(COLOR_TASK);
    this.setTooltip("Detach GPIO interrupt task.");
    this.setHelpUrl("");
  },
};
