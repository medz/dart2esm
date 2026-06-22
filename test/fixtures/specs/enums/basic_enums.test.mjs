import { describe, expect, test, vi } from 'vitest';

describe('enums/basic_enums.mjs', () => {
  test('exports enum values, values list, and Dart enum display behavior', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./basic_enums.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'name red',
        'index 1',
        'count 3',
        'third blue',
        'string Color.red',
        'same true',
        'different false',
      ]);

      expect(module.Color.red.name).toBe('red');
      expect(module.Color.green.index).toBe(1);
      expect(module.Color.values.map((value) => value.name)).toEqual([
        'red',
        'green',
        'blue',
      ]);
      expect(String(module.Color.blue)).toBe('Color.blue');
      expect(Object.isFrozen(module.Color.red)).toBe(true);
      expect(Object.isFrozen(module.Color.values)).toBe(true);
      expect(() => {
        module.Color.red.name = 'changed';
      }).toThrow(TypeError);
    } finally {
      log.mockRestore();
    }
  });
});
