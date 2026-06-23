import { describe, expect, test, vi } from 'vitest';

describe('imports/parts.mjs', () => {
  test('exports public declarations from Dart part files', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./parts.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'api:11 root:11 private:12',
      ]);
      expect(module.rootValue).toBe('root:11');
      expect(module.partValue).toBe(11);
      expect(new module.PartThing('js').label()).toBe('js:11');
      expect(module.privatePartLabel()).toBe('private:12');
      expect(module).not.toHaveProperty('_privatePartValue');
      expect(module).not.toHaveProperty('_PrivatePartThing');
    } finally {
      log.mockRestore();
    }
  });
});
