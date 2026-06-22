import { describe, expect, test, vi } from 'vitest';

describe('variables/primitive_exports.mjs', () => {
  test('supports direct named ESM imports for primitive Dart variables', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const consumer = await import('./primitive_exports_consumer.mjs');

      expect(consumer.observedPrimitiveExports).toEqual([1, 2, 1]);
      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'a 1',
        'b 2',
        'c 1',
      ]);

      const importedBindings = await import('./primitive_exports_reassign_imports.mjs');
      expect(() => importedBindings.assignFinalImport()).toThrow(TypeError);
      expect(() => importedBindings.assignConstImport()).toThrow(TypeError);
      expect(() => importedBindings.assignMutableImport()).toThrow(TypeError);

      const module = await import('./primitive_exports.mjs');
      expect(() => {
        module.a = 2;
      }).toThrow(TypeError);
      expect(() => {
        module.b = 3;
      }).toThrow(TypeError);
      expect(() => {
        module.c = 4;
      }).toThrow(TypeError);
      expect([module.a, module.b, module.c]).toEqual([1, 2, 1]);
    } finally {
      log.mockRestore();
    }
  });
});
