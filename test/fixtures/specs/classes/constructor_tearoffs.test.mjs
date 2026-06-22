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
    const shapeLines = source
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith('const unnamed =') ||
          line.startsWith('const unnamedAgain =') ||
          line.startsWith('const named =') ||
          line.startsWith('const alias =') ||
          line.startsWith('const aliasType =') ||
          line.startsWith('const options =') ||
          line.startsWith('const intHolder =') ||
          line.startsWith('const constMakers =') ||
          line.startsWith('function $') && line.includes('_tearoff') ||
          line.startsWith('return new Box(value)') ||
          line.startsWith('return Box.named(value_1)') ||
          line.startsWith('return Box.alias(value_2)') ||
          line.startsWith('return new Options(value_3') ||
          line.startsWith('return new Holder(value_4') ||
          line.startsWith('__dartPrint(__dartEquals('),
      );

    expect(shapeLines).toEqual([
      'const unnamed = $Box_new_tearoff;',
      'const unnamedAgain = $Box_new_tearoff;',
      'const named = $Box_named_tearoff;',
      'const alias = $Box_alias_tearoff;',
      'const aliasType = $Box_new_tearoff;',
      'const options = $Options_new_tearoff;',
      'const intHolder = $Holder_new_tearoff;',
      'const constMakers = Object.freeze([$Box_new_tearoff, $Box_named_tearoff, $Box_alias_tearoff]);',
      '__dartPrint(__dartEquals(unnamed, unnamedAgain));',
      '__dartPrint(__dartEquals(unnamed, $Box_new_tearoff));',
      'function $Box_new_tearoff(value) {',
      'return new Box(value);',
      'function $Box_named_tearoff(value_1) {',
      'return Box.named(value_1);',
      'function $Box_alias_tearoff(value_2) {',
      'return Box.alias(value_2);',
      'function $Options_new_tearoff(value_3, { label = "options" } = {}) {',
      'return new Options(value_3, { label: label });',
      'function $Holder_new_tearoff(value_4) {',
      'return new Holder(value_4);',
    ]);
  });
});
