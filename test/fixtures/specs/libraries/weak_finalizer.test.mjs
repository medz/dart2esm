import { describe, expect, test, vi } from 'vitest';

describe('libraries/weak_finalizer.mjs', () => {
  test('supports WeakReference and Finalizer from external ESM imports', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./weak_finalizer.mjs');
      const token = new module.PlainToken('js');
      const weak = module.makeWeak(token);

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'weak true dart',
        'weakType true true',
        'finalizer true 0',
      ]);
      expect(weak.target).toBe(token);
      expect(weak.toString()).toBe('WeakReference');
      expect(module.describeWeak(token)).toBe('true true');
      expect(module.describeFinalizer(token)).toBe('true 0');
    } finally {
      log.mockRestore();
    }
  });
});
