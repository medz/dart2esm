import { describe, expect, test, vi } from 'vitest';

describe('classes/operators.mjs', () => {
  test('exports Dart operators as callable ESM class properties', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./operators.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        '4,6 -1,-2',
        '1 9 false',
        'true false',
      ]);

      const a = new module.Vec(1, 2);
      const b = new module.Vec(3, 4);
      expect(a['+'](b).describe()).toBe('4,6');
      expect(a['unary-']().describe()).toBe('-1,-2');
      expect(a['<'](b)).toBe(true);
      expect(a['=='](new module.Vec(1, 2))).toBe(true);
      expect(a['[]'](0)).toBe(1);
      a['[]='](1, 9);
      expect(a.describe()).toBe('1,9');
    } finally {
      log.mockRestore();
    }
  });
});
