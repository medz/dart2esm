import { describe, expect, test, vi } from 'vitest';

describe('classes/const_instances.mjs', () => {
  test('exports user-defined const instances as frozen native objects', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./const_instances.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        '2,3 5 true',
        '0,0 15 true',
        'true',
        '4',
      ]);

      expect(module.sharedPoint).toBeInstanceOf(module.Point);
      expect(module.sharedPoint.describe()).toBe('2,3');
      expect(module.sharedPoint.sum).toBe(5);
      expect(Object.isFrozen(module.sharedPoint)).toBe(true);
      expect(() => {
        module.sharedPoint.x = 8;
      }).toThrow(TypeError);

      expect(module.sharedAdder).toBeInstanceOf(module.Adder);
      expect(module.sharedAdder.call(5)).toBe(15);
      expect(Object.isFrozen(module.sharedAdder)).toBe(true);

      expect(module.positive).toBeInstanceOf(module.Positive);
      expect(module.positive.value).toBe(4);
      expect(Object.isFrozen(module.positive)).toBe(true);
    } finally {
      log.mockRestore();
    }
  });
});
