import { describe, expect, test, vi } from 'vitest';

describe('libraries/isolate.mjs', () => {
  test('supports worker-backed isolate ports from ESM imports', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await import('./isolate.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'receive direct|worker:true true false true true',
        'run:true false',
        'raw raw true',
      ]);
    } finally {
      log.mockRestore();
    }
  });
});
