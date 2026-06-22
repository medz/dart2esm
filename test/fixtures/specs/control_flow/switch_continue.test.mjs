import { readFileSync } from 'node:fs';
import { describe, expect, test, vi } from 'vitest';

describe('control_flow/switch_continue.mjs', () => {
  test('matches Dart switch case continuation behavior', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await import('./switch_continue.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'zero>one>',
        'one>',
        'group>',
        'group>',
        'default>',
        'other>after>skip>jump>done>after>',
        'skip>jump>done>after>done>after>',
      ]);
    } finally {
      log.mockRestore();
    }
  });

  test('emits ESM state-machine switch continuation exactly', () => {
    const source = readFileSync(
      new URL('./switch_continue.mjs', import.meta.url),
      'utf8',
    );
    const shapeLines = source
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith('const $switchValue') ||
          line.startsWith('let $switchTarget') ||
          line.startsWith('$switchLoop') ||
          line.startsWith('switch ($switchTarget') ||
          line === '$switchTarget = 1;' ||
          line === 'continue $switchLoop;' ||
          line === '$switchTarget = 2;' ||
          line === 'break L;' ||
          line === 'break L_1;',
      );

    expect(shapeLines).toEqual([
      'const $switchValue = value;',
      'let $switchTarget = -1;',
      '$switchTarget = 1;',
      '$switchTarget = 2;',
      '$switchLoop: while ($switchTarget !== -1) {',
      'switch ($switchTarget) {',
      '$switchTarget = 1;',
      'continue $switchLoop;',
      'break L;',
      'break L;',
      'const $switchValue = (value + i);',
      'let $switchTarget = -1;',
      '$switchTarget = 1;',
      '$switchTarget = 2;',
      '$switchLoop: while ($switchTarget !== -1) {',
      'switch ($switchTarget) {',
      'break L;',
      '$switchTarget = 2;',
      'continue $switchLoop;',
      'break L_1;',
    ]);
  });
});
