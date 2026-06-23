import { describe, expect, test, vi } from 'vitest';

describe('variables/top_level_variables.mjs', () => {
  test('exports top-level variables as native ESM let and const bindings', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./top_level_variables.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'init readFirst',
        'init assignFirst',
        'init finalValue',
        'get computed',
        'set computed 40',
        'initial 20',
        'assigned 99',
        'read 10',
        'read again 10',
        'final 30',
        'const 40',
        'get computed',
        'computed 6 41 backing 40',
        'count 3',
      ]);
      expect(module.assignFirst).toBe(99);
      expect(module.readFirst).toBe(10);
      expect(module.finalValue).toBe(30);
      expect(module.constValue).toBe(40);
      expect(module.initCount).toBe(3);

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
