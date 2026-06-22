import { describe, expect, test, vi } from 'vitest';

describe('classes/basic_classes.mjs', () => {
  test('exports a working Counter class and preserves main behavior', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./basic_classes.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'value 7',
        'double 14',
      ]);
      expect(module).toHaveProperty('Counter');
      expect(module).toHaveProperty('main');

      const counter = new module.Counter(5);
      expect(counter.value).toBe(5);
      counter.add(6);
      expect(counter.value).toBe(11);
      expect(counter.doubled).toBe(22);
    } finally {
      log.mockRestore();
    }
  });
});
