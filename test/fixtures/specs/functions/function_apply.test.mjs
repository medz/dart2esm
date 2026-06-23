import { describe, expect, test, vi } from 'vitest';

describe('functions/function_apply.mjs', () => {
  test('supports Function.apply and external ESM imports', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./function_apply.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'positional 5',
        'named ADA:3',
        'local 9',
        'forward dart:2',
      ]);
      expect(module.add(4, 5)).toBe(9);
      expect(module.describe('js', { count: 2, loud: true })).toBe('JS:2');
      expect(
        module.invokeDescribe(
          module.describe,
          ['imported'],
          new Map([['count', 4]]),
        ),
      ).toBe('imported:4');
    } finally {
      log.mockRestore();
    }
  });
});
