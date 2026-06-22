import { describe, expect, test, vi } from 'vitest';

describe('records/basic_records.mjs', () => {
  test('exports frozen record values with positional and named access', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./basic_records.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'pair 1 two',
        'named v2 2',
        'mixed 3 v3',
        'record (3, label: v3)',
        'equals true',
        'ordered (a: 2, z: 1)',
        'ordered equals true',
      ]);

      expect(module.fixedRecord.$1).toBe(4);
      expect(module.fixedRecord.label).toBe('four');
      expect(Object.isFrozen(module.fixedRecord)).toBe(true);

      const named = module.makeNamed(7);
      expect(named.label).toBe('v7');
      expect(named.value).toBe(7);
      expect(Object.isFrozen(named)).toBe(true);
      expect(() => {
        named.value = 8;
      }).toThrow(TypeError);

      const mixed = module.makeMixed(9);
      expect(mixed.$1).toBe(9);
      expect(mixed.label).toBe('v9');
      expect(String(mixed)).toBe('(9, label: v9)');
    } finally {
      log.mockRestore();
    }
  });
});
