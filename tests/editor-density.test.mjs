import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('../src/styles.css', import.meta.url),'utf8');
const struct=readFileSync(new URL('../src/components/StructFieldAccordionList.jsx', import.meta.url),'utf8');
const qos=readFileSync(new URL('../src/components/qos/QosPolicyAccordion.jsx', import.meta.url),'utf8');
for (const s of [
  '.struct-field-accordion.ant-collapse',
  '.qos-entity-accordion.ant-collapse',
  '.qos-policy-accordion.ant-collapse',
  '.qos-policy-accordion > .ant-collapse-item { border:0; border-bottom:',
  '.qos-policy-accordion > .ant-collapse-item:last-child { border-bottom:0; }',
  '.struct-field-accordion > .ant-collapse-item { border:1px',
  '.qos-entity-accordion > .ant-collapse-item { margin-bottom:6px; border:1px',
  '.qos-policy-accordion > .ant-collapse-item > .ant-collapse-content {',
]) assert.ok(css.includes(s),'Missing compact hierarchy CSS: '+s);
assert.doesNotMatch(css,/\.qos-policy-accordion \.ant-collapse-item \{ border:1px/);
assert.match(struct,/Collapse/);
assert.match(qos,/QosPolicyFieldControl/);
assert.match(css,/Keep focus indicators and all input-control borders/);
console.log('PASS editor visual hierarchy: single outer frames, policy dividers, unchanged input controls');
