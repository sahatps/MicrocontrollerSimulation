import { javascriptGenerator } from 'blockly/javascript';
import * as Blockly from 'blockly/core';

// -------------------------------
// Helpers
function sanitizeProcName(raw) {
  let s = String(raw ?? '').trim();

  // space -> underscore
  s = s.replace(/\s+/g, '_');

  // keep only [a-zA-Z0-9_]
  s = s.replace(/[^\w]/g, '');

  // cannot start with digit (C/C++)
  if (/^\d/.test(s)) s = '_' + s;

  // empty fallback
  if (!s) s = 'func';

  return s;
}

function getProcNameFromBlock(block) {
  return sanitizeProcName(block.getFieldValue('NAME'));
}

// -------------------------------
function getNameDB() {
  const db = javascriptGenerator.nameDB_ || javascriptGenerator.variableDB_;
  if (!db) {
    // ถ้าเจอ error นี้ = ลืม javascriptGenerator.init(workspace) ก่อน workspaceToCode
    throw new Error('NameDB is not initialized. Call javascriptGenerator.init(workspace) before generating code.');
  }
  return db;
}

function getProcedureName(block) {
  // Blockly procedure name should be mapped via NAME_TYPE
  const nameDB = getNameDB();
  return nameDB.getName(block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
}

function getTypedArgs(block) {
  const nameDB = getNameDB();
  const argsIncType = [];

  for (let i = 0; i < block.arguments_.length; i++) {
    const argName = nameDB.getName(block.arguments_[i], Blockly.Variables.NAME_TYPE);
    const vType =
      (Blockly.dbNameType && Blockly.dbNameType[argName] && Blockly.dbNameType[argName].type)
        ? Blockly.dbNameType[argName].type
        : 'int';
    argsIncType.push(`${vType} ${argName}`);
  }

  return argsIncType;
}

function applyStatementPrefixAndTrap(block, branch) {
  let out = branch;

  if (javascriptGenerator.STATEMENT_PREFIX) {
    const id = block.id.replace(/\$/g, '$$$$');
    out =
      javascriptGenerator.prefixLines(
        javascriptGenerator.STATEMENT_PREFIX.replace(/%1/g, '\'' + id + '\''),
        javascriptGenerator.INDENT
      ) + out;
  }

  if (javascriptGenerator.INFINITE_LOOP_TRAP) {
    out = javascriptGenerator.INFINITE_LOOP_TRAP.replace(/%1/g, '\'' + block.id + '\'') + out;
  }

  return out;
}

function inferReturnType(block, returnExpr) {
  // 1) Prefer type from connected RETURN input block
  const child = block.getInputTargetBlock('RETURN');
  if (child && child.outputConnection && Array.isArray(child.outputConnection.check_)) {
    const t = child.outputConnection.check_[0];
    if (t) return String(t).toLowerCase();
  }

  // 2) Fallback: if returnExpr is a single variable token and exists in dbNameType
  //    (avoid mapping for complex expression like "a + b")
  const token = (returnExpr || '').trim();
  const isSingleToken = /^[A-Za-z_]\w*$/.test(token);
  if (isSingleToken && Blockly.dbNameType && Blockly.dbNameType[token]) {
    return Blockly.dbNameType[token].type;
  }

  return 'void';
}

function makeProcedureDefinitionCode({ funcName, returnType, argsIncType, branch, returnStmt }) {
  return (
`#VARIABLE ${returnType} ${funcName}(${argsIncType.join(', ')});#END
#FUNCTION
${returnType} ${funcName}(${argsIncType.join(', ')}) {
${branch}${returnStmt}}
#END`
  );
}

function ensureDefinitions() {
  if (!javascriptGenerator.definitions_) javascriptGenerator.definitions_ = {};
}

// -------------------------------
// Procedures (with return)
// -------------------------------
javascriptGenerator.forBlock['procedures_defreturn'] = function (block) {
  const funcName = getProcNameFromBlock(block);
  const argsIncType = getTypedArgs(block);

  let branch = javascriptGenerator.statementToCode(block, 'STACK');
  branch = applyStatementPrefixAndTrap(block, branch);

  const returnExpr =
    javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || '';

  const returnType = inferReturnType(block, returnExpr);

  let returnStmt = '';
  if (returnType !== 'void') {
    const expr = returnExpr || '0';
    returnStmt = `${javascriptGenerator.INDENT}return ${expr};\n`;
  } else {
    // void: normally no return needed; only return; if user plugged something weird into RETURN
    if (returnExpr) returnStmt = `${javascriptGenerator.INDENT}return;\n`;
  }

  let code = makeProcedureDefinitionCode({
    funcName,
    returnType,
    argsIncType,
    branch,
    returnStmt,
  });

  code = javascriptGenerator.scrub_(block, code);
  ensureDefinitions();
  javascriptGenerator.definitions_['%' + funcName] = code;

  return null;
};

// -------------------------------
// Procedures (without return)
// -------------------------------
javascriptGenerator.forBlock['procedures_defnoreturn'] = function (block) {
  const funcName = getProcNameFromBlock(block);
  const argsIncType = getTypedArgs(block);

  let branch = javascriptGenerator.statementToCode(block, 'STACK');
  branch = applyStatementPrefixAndTrap(block, branch);

  const returnType = 'void';
  const returnStmt = '';

  let code = makeProcedureDefinitionCode({
    funcName,
    returnType,
    argsIncType,
    branch,
    returnStmt,
  });

  code = javascriptGenerator.scrub_(block, code);
  ensureDefinitions();
  javascriptGenerator.definitions_['%' + funcName] = code;

  return null;
};

// -------------------------------
// Calls
// -------------------------------
javascriptGenerator.forBlock['procedures_callreturn'] = function (block) {
  const funcName = sanitizeProcName(block.getFieldValue('NAME'));
  const args = [];
  for (let i = 0; i < block.arguments_.length; i++) {
    args[i] = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_COMMA) || 'null';
  }
  return [`${funcName}(${args.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

javascriptGenerator.forBlock['procedures_callnoreturn'] = function (block) {
  const funcName = sanitizeProcName(block.getFieldValue('NAME'));
  const args = [];
  for (let i = 0; i < block.arguments_.length; i++) {
    args[i] = javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_COMMA) || 'null';
  }
  return `${funcName}(${args.join(', ')});\n`;
};

// -------------------------------
// if return
// -------------------------------
javascriptGenerator.forBlock['procedures_ifreturn'] = function (block) {
  const condition =
    javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';

  let code = `if (${condition}) {\n`;
  if (block.hasReturnValue_) {
    const value =
      javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || '0';
    code += `${javascriptGenerator.INDENT}return ${value};\n`;
  } else {
    code += `${javascriptGenerator.INDENT}return;\n`;
  }
  code += '}\n';
  return code;
};
