import { describe, expect, test, vi } from 'vitest';

describe('classes/factory_bodies.mjs', () => {
  test('exports named and unnamed factory constructors as native class entries', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./factory_bodies.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual(['7 0 3', '8 4']);

      const parsed = module.Token.parse('8');
      const zero = module.Token.zero();
      const normalized = new module.Token(-4);

      expect(parsed).toBeInstanceOf(module.Token);
      expect(zero).toBeInstanceOf(module.Token);
      expect(normalized).toBeInstanceOf(module.Token);
      expect([parsed.value, zero.value, normalized.value]).toEqual([8, 0, 4]);
    } finally {
      log.mockRestore();
    }
  });
});
