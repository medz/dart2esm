import { describe, expect, test, vi } from 'vitest';

describe('control_flow/for_variables.mjs', () => {
  test('lowers multiple for-loop variables into one native JS let header', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./for_variables.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'walk 8',
        'walk 21',
      ]);
      expect(module.pairWalk(2, 7)).toBe(27);
    } finally {
      log.mockRestore();
    }
  });
});
