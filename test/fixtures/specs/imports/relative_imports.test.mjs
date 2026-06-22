import { describe, expect, test, vi } from 'vitest';

describe('imports/relative_imports.mjs', () => {
  test('bundles relative Dart imports as internal ESM declarations', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./relative_imports.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'add 10',
        'hello esm 7',
        'counter 2',
      ]);
      expect(module).toHaveProperty('main');
      expect(module).not.toHaveProperty('add');
      expect(module).not.toHaveProperty('Greeter');
    } finally {
      log.mockRestore();
    }
  });
});
