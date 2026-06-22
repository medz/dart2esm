import { describe, expect, test, vi } from 'vitest';

describe('enums/enhanced_enums.mjs', () => {
  test('exports enhanced enum singleton instances with fields and methods', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./enhanced_enums.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'entry ready 0',
        'fields 500 Failed',
        'getter true false',
        'method ready:200:Ready',
        'values 2 failed',
        'static failed true',
        'string Status.failed',
      ]);

      expect(module.Status.ready.name).toBe('ready');
      expect(module.Status.ready.code).toBe(200);
      expect(module.Status.ready.label).toBe('Ready');
      expect(module.Status.ready.ok).toBe(true);
      expect(module.Status.failed.ok).toBe(false);
      expect(module.Status.ready.describe()).toBe('ready:200:Ready');
      expect(module.Status.fallback).toBe(module.Status.failed);
      expect(module.Status.isErrorCode(500)).toBe(true);
      expect(module.Status.values).toEqual([
        module.Status.ready,
        module.Status.failed,
      ]);
      expect(Object.isFrozen(module.Status.ready)).toBe(true);
      expect(String(module.Status.failed)).toBe('Status.failed');
    } finally {
      log.mockRestore();
    }
  });
});
