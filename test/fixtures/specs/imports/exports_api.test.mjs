import { describe, expect, test, vi } from 'vitest';

describe('imports/exports_api.mjs', () => {
  test('exports selected local Dart library declarations as ESM bindings', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./exports_api.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'api:7 9 hidden:9',
      ]);
      expect(module.exportedValue).toBe(7);
      expect(new module.ExportedThing('js').label()).toBe('js:7');
      expect(module).not.toHaveProperty('hiddenValue');
      expect(module).not.toHaveProperty('HiddenThing');
    } finally {
      log.mockRestore();
    }
  });
});
