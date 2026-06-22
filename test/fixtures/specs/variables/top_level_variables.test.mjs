import { describe, expect, test, vi } from 'vitest';

describe('variables/top_level_variables.mjs', () => {
  test('preserves lazy top-level state and readonly final export binding', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./top_level_variables.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'assigned 99',
        'init readFirst',
        'read 10',
        'read again 10',
        'init finalValue',
        'final 30',
        'const 40',
        'count 2',
      ]);
      expect(module.assignFirst).toBe(99);
      expect(module.readFirst).toBe(10);
      expect(module.finalValue).toBe(30);
      expect(module.constValue).toBe(40);
      expect(module.initCount).toBe(2);

      await expect(
        import('./top_level_variables_reassign_final.mjs'),
      ).rejects.toThrow(TypeError);
      await expect(
        import('./top_level_variables_reassign_var.mjs'),
      ).rejects.toThrow(TypeError);
    } finally {
      log.mockRestore();
    }
  });
});
