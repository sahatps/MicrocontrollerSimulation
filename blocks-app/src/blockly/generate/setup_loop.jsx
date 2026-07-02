import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['arduino_setup'] = function (block) {
  const statements = javascriptGenerator.statementToCode(block, 'DO');

  return `
void setup() {
${statements}
}`;
};

javascriptGenerator.forBlock['arduino_loop'] = function (block) {
  const statements = javascriptGenerator.statementToCode(block, 'DO');

  return `
void loop() {
${statements}
}`;
};
