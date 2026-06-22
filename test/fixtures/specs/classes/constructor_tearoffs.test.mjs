import { readFileSync } from 'node:fs';
import { describe, expect, test, vi } from 'vitest';

describe('classes/constructor_tearoffs.mjs', () => {
  test('runs constructor tear-offs with Dart identity behavior', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await import('./constructor_tearoffs.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'box:1',
        'named:2',
        'named:3',
        'box:4',
        'options:5',
        'custom:6',
        '7',
        'box:8',
        'named:9',
        'named:10',
        'true',
        'true',
      ]);
    } finally {
      log.mockRestore();
    }
  });

  test('emits canonical native ESM constructor tear-off functions exactly', () => {
    const source = readFileSync(
      new URL('./constructor_tearoffs.mjs', import.meta.url),
      'utf8',
    );
    const shapeLines = [];
    let inTearoffFunction = false;
    for (const rawLine of source.split('\n')) {
      const line = rawLine.trim();
      if (
        line.startsWith('const unnamed =') ||
        line.startsWith('const unnamedAgain =') ||
        line.startsWith('const named =') ||
        line.startsWith('const alias =') ||
        line.startsWith('const aliasType =') ||
        line.startsWith('const options =') ||
        line.startsWith('const intHolder =') ||
        line.startsWith('const constMakers =') ||
        line.startsWith('__dartPrint(__dartEquals(')
      ) {
        shapeLines.push(line);
        continue;
      }
      if (line.startsWith('function $') && line.includes('_tearoff')) {
        shapeLines.push(line);
        inTearoffFunction = true;
        continue;
      }
      if (inTearoffFunction && line.startsWith('return ')) {
        shapeLines.push(line);
        continue;
      }
      if (inTearoffFunction && line === '}') {
        inTearoffFunction = false;
      }
    }

    expect(shapeLines).toEqual([
      'const unnamed = $Box_new_tearoff;',
      'const unnamedAgain = $Box_new_tearoff;',
      'const named = $Box_named_tearoff;',
      'const alias = $Box_alias_tearoff;',
      'const aliasType = $Box_new_tearoff;',
      'const options = $Options_new_tearoff;',
      'const intHolder = $Holder_new_tearoff;',
      'const constMakers = __dartConst("[\\"list\\",\\"FunctionType(Box Function(int))\\",[\\"constructorTearOff\\",\\"constructor:Box.\\"],[\\"constructorTearOff\\",\\"constructor:Box.named\\"],[\\"redirectingFactoryTearOff\\",\\"procedure:Box.alias\\"]]", () => Object.freeze([$Box_new_tearoff, $Box_named_tearoff, $Box_alias_tearoff]));',
      '__dartPrint(__dartEquals(unnamed, unnamedAgain));',
      '__dartPrint(__dartEquals(unnamed, $Box_new_tearoff));',
      'function $Box_new_tearoff(value) {',
      'return new Box(value);',
      'function $Box_named_tearoff(value) {',
      'return Box.named(value);',
      'function $Box_alias_tearoff(value) {',
      'return Box.alias(value);',
      'function $Options_new_tearoff(value, { label = "options" } = {}) {',
      'return new Options(value, { label: label });',
      'function $Holder_new_tearoff(value) {',
      'return new Holder(value);',
    ]);
  });
});
