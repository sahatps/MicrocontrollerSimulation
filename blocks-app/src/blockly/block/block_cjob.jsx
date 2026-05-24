import * as Blockly from 'blockly/core';

/** ---------- shared helpers (keep in this file) ---------- */
function getNameDB() {
  // Version-safe variable/name DB (some Blockly versions use nameDB_)
  return (Blockly.JavaScript && (Blockly.JavaScript.variableDB_ || Blockly.JavaScript.nameDB_)) || null;
}

function distinctJobName(base = 'MyJob') {
  const db = getNameDB();
  return db ? db.getDistinctName(base, Blockly.Variables.NAME_TYPE) : base;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function rangeDropdown(min, max) {
  return Array.from({ length: max - min + 1 }, (_, i) => {
    const v = i + min;
    return [pad2(v), String(v)];
  });
}

const DD_HOURS = rangeDropdown(0, 23); // 00-23
const DD_MINSEC = rangeDropdown(0, 59); // 00-59
const DD_DAYS = rangeDropdown(1, 31); // 01-31
const DD_MONTHS = [
  ['Jan', '1'], ['Feb', '2'], ['Mar', '3'], ['Apr', '4'],
  ['May', '5'], ['Jun', '6'], ['Jul', '7'], ['Aug', '8'],
  ['Sep', '9'], ['Oct', '10'], ['Nov', '11'], ['Dec', '12'],
];

// Period dropdown for */N
const DD_PERIOD = [
  ['1', '*'], ['2', '*/2'], ['3', '*/3'], ['4', '*/4'], ['5', '*/5'],
  ['6', '*/6'], ['10', '*/10'], ['12', '*/12'], ['15', '*/15'],
  ['20', '*/20'], ['30', '*/30'],
];

function addPrevNext(block) {
  block.setPreviousStatement(true, null);
  block.setNextStatement(true, null);
}

function addOneshot(fieldRowInput, fieldName = '_oneshort', defaultFalse = true) {
  // Checkbox values must be "TRUE"/"FALSE" (string)
  fieldRowInput
    .appendField(' one shot')
    .appendField(new Blockly.FieldCheckbox(defaultFalse ? 'FALSE' : 'TRUE'), fieldName);
}

/** -------------------- blocks -------------------- */

Blockly.Blocks['CJOB_begin'] = {
  init: function () {
    this.appendDummyInput().appendField('CronJob Setup');
    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_addschedule'] = {
  init: function () {
    const job_name = distinctJobName('MyJob');
    const commentText =
      '+-------------- second (0 - 59)\n' +
      '| +---------------- minute (0 - 59)\n' +
      '| | +------------- hour (0 - 23)\n' +
      '| | | +---------- day of month (1 - 31)\n' +
      '| | | | +------- month (1 - 12)\n' +
      '| | | | | +---- day of week (0 - 7)(Sunday=0)\n' +
      '| | | | | |\n' +
      '* * * * * *\n';

    this.appendDummyInput().appendField('CronJob add schedule');

    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(job_name), 'jobname');

    const row = this.appendDummyInput()
      .appendField('schedule')
      .appendField(new Blockly.FieldTextInput('* 1 * * * * '), 'schedule');

    addOneshot(row, '_oneshort', true);

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do job');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip(commentText);
    this.setHelpUrl('');
    this.setCommentText(commentText);
  }
};

Blockly.Blocks['CJOB_addschedule_every_seconds'] = {
  init: function () {
    const job_name = distinctJobName('MyJob');

    this.appendDummyInput().appendField('CronJob add schedule second period');

    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(job_name), 'jobname');

    const row = this.appendDummyInput()
      .appendField('schedule every')
      .appendField(new Blockly.FieldDropdown(DD_PERIOD), '_second')
      .appendField('seconds');

    addOneshot(row, '_oneshort', true);

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do job');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_addschedule_every_minutes'] = {
  init: function () {
    const job_name = distinctJobName('MyJob');

    this.appendDummyInput().appendField('CronJob add schedule minute period');

    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(job_name), 'jobname');

    this.appendDummyInput()
      .appendField('schedule every')
      .appendField(new Blockly.FieldDropdown(DD_PERIOD), '_minute')
      .appendField('minutes');

    const row2 = this.appendDummyInput()
      .appendField('at second:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_second');

    addOneshot(row2, '_oneshort', true);

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do job');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_addschedule_every_hours'] = {
  init: function () {
    const job_name = distinctJobName('MyJob');

    this.appendDummyInput().appendField('CronJob add schedule hour period');

    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(job_name), 'jobname');

    this.appendDummyInput()
      .appendField('schedule every')
      .appendField(new Blockly.FieldDropdown(DD_PERIOD), '_hour')
      .appendField('hours');

    const row2 = this.appendDummyInput()
      .appendField('at minute:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_minute')
      .appendField('second:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_second');

    addOneshot(row2, '_oneshort', true);

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do job');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_add_schedule_time'] = {
  init: function () {
    const job_name = distinctJobName('MyJob');

    this.appendDummyInput().appendField('CronJob add daily schedule time');

    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(job_name), 'jobname');

    const row = this.appendDummyInput()
      .appendField('HH:')
      .appendField(new Blockly.FieldDropdown(DD_HOURS), '_hour')
      .appendField('MM:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_minute')
      .appendField('SS:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_second');

    addOneshot(row, '_oneshort', true);

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do job');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_add_schedule_datetime'] = {
  init: function () {
    const job_name = distinctJobName('MyJob');

    this.appendDummyInput().appendField('CronJob add schedule datetime');

    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(job_name), 'jobname');

    const row = this.appendDummyInput()
      .appendField('Month:')
      .appendField(new Blockly.FieldDropdown(DD_MONTHS), '_month')
      .appendField('Day:')
      .appendField(new Blockly.FieldDropdown(DD_DAYS), '_day')
      .appendField('HH:')
      .appendField(new Blockly.FieldDropdown(DD_HOURS), '_hour')
      .appendField('MM:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_minute')
      .appendField('SS:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_second');

    addOneshot(row, '_oneshort', true);

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do job');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_add_schedule_weekday'] = {
  init: function () {
    const job_name = distinctJobName('MyJob');

    this.appendDummyInput().appendField('CronJob add schedule weekday');

    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(job_name), 'jobname');

    this.appendDummyInput()
      .appendField('WeekDay:')
      .appendField(new Blockly.FieldCheckbox('TRUE'), '_Mon').appendField('Mon')
      .appendField(new Blockly.FieldCheckbox('TRUE'), '_Tue').appendField('Tue')
      .appendField(new Blockly.FieldCheckbox('TRUE'), '_Wed').appendField('Wed')
      .appendField(new Blockly.FieldCheckbox('TRUE'), '_Thu').appendField('Thu')
      .appendField(new Blockly.FieldCheckbox('TRUE'), '_Fri').appendField('Fri')
      .appendField(new Blockly.FieldCheckbox('TRUE'), '_Sat').appendField('Sat')
      .appendField(new Blockly.FieldCheckbox('TRUE'), '_Sun').appendField('Sun');

    const row2 = this.appendDummyInput()
      .appendField('Time:')
      .appendField('HH:')
      .appendField(new Blockly.FieldDropdown(DD_HOURS), '_hour')
      .appendField('MM:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_minute')
      .appendField('SS:')
      .appendField(new Blockly.FieldDropdown(DD_MINSEC), '_second');

    addOneshot(row2, '_oneshort', true);

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do job');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_delete_schedule'] = {
  init: function () {
    this.appendDummyInput().appendField('CronJob delete schedule');
    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(''), 'jobname');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_enable_schedule'] = {
  init: function () {
    this.appendDummyInput().appendField('CronJob enable schedule');
    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(''), 'jobname');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_disable_schedule'] = {
  init: function () {
    this.appendDummyInput().appendField('CronJob disable schedule');
    this.appendDummyInput()
      .appendField('Job name')
      .appendField(new Blockly.FieldTextInput(''), 'jobname');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['CJOB_runnow'] = {
  init: function () {
    this.appendDummyInput().appendField('CronJob runnow');

    this.appendStatementInput('callback')
      .setCheck(null)
      .appendField('to do');

    addPrevNext(this);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};
