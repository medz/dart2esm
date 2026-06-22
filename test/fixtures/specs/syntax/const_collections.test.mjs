import { describe, expect, test, vi } from 'vitest';

describe('syntax/const_collections.mjs', () => {
  test('exports const collections and records as canonical frozen values', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./const_collections.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'true true',
        'true true',
        'true true',
        'true true',
        '[1, 2]',
        '{a, b}',
        '{a: 1, b: 2}',
        '(1, name: dart)',
      ]);

      expect(module.numbers).toBe(module.sameNumbers);
      expect(Object.isFrozen(module.numbers)).toBe(true);
      expect(() => {
        module.numbers.push(3);
      }).toThrow(TypeError);

      expect(module.names).toBe(module.sameNames);
      expect(Object.isFrozen(module.names)).toBe(true);
      expect(() => {
        module.names.add('c');
      }).toThrow(TypeError);

      expect(module.mapping).toBe(module.sameMapping);
      expect(Object.isFrozen(module.mapping)).toBe(true);
      expect(() => {
        module.mapping.set('c', 3);
      }).toThrow(TypeError);

      expect(module.shape).toBe(module.sameShape);
      expect(Object.isFrozen(module.shape)).toBe(true);
      expect(module.shape.$1).toBe(1);
      expect(module.shape.name).toBe('dart');
    } finally {
      log.mockRestore();
    }
  });
});
