import { describe, expect, test, vi } from 'vitest';

describe('classes/static_members.mjs', () => {
  test('exports class static fields as JS properties with Dart lazy semantics', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./static_members.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'offset 3',
        'init total',
        'first 10',
        'bump 17',
        'instance 25',
        'double 50',
        'init readonly',
        'readonly 40',
        'count 2',
      ]);

      expect(module.Accumulator.offset).toBe(3);
      expect(module.Accumulator.total).toBe(25);
      module.Accumulator.total = 100;
      expect(module.Accumulator.total).toBe(100);
      expect(module.Accumulator.bump(2)).toBe(105);
      expect(module.Accumulator.doubledTotal).toBe(210);
      expect(module.Accumulator.readonly).toBe(40);
      expect(() => {
        module.Accumulator.readonly = 41;
      }).toThrow(TypeError);
      expect(module.initCount).toBe(2);
    } finally {
      log.mockRestore();
    }
  });
});
