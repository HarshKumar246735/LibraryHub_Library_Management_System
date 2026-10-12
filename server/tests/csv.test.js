import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, toCsv } from '../utils/csv.js';

test('quotes, commas and newlines are escaped', () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line1\nline2'), '"line1\nline2"');
});
test('formula injection is neutralised', () => {
  assert.equal(csvCell('=SUM(A1:A9)'), "'=SUM(A1:A9)");
  assert.equal(csvCell('@cmd'), "'@cmd");
  assert.equal(csvCell('-5+3'), "'-5+3");
});
test('null, numbers and dates render sensibly', () => {
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(15), '15');
  assert.equal(csvCell(new Date('2026-10-10T00:00:00Z')), '2026-10-10T00:00:00.000Z');
});
test('toCsv joins header and rows with CRLF', () => {
  assert.equal(toCsv(['A', 'B'], [[1, 'x,y']]), 'A,B\r\n1,"x,y"');
});
