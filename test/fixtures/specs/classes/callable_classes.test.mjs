import { describe, expect, test, vi } from 'vitest';

describe('classes/callable_classes.mjs', () => {
  test('exports callable classes as ESM classes with call methods', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./callable_classes.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual(['7 8 8']);
      expect(module.add2).toBeInstanceOf(module.Adder);
      expect(module.add2.call(5)).toBe(7);

      const add4 = new module.Adder(4);
      expect(add4.call(5)).toBe(9);
      expect(module.apply(add4.call.bind(add4), 6)).toBe(10);
    } finally {
      log.mockRestore();
    }
  });
});
