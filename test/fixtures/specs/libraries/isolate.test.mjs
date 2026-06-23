import { describe, expect, test, vi } from 'vitest';

describe('libraries/isolate.mjs', () => {
  test('supports same-thread isolate ports from ESM imports', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await import('./isolate.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'receive direct|worker true',
        'raw raw true',
      ]);
    } finally {
      log.mockRestore();
    }
  });
});
