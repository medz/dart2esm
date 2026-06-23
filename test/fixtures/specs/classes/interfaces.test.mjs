import { describe, expect, test, vi } from 'vitest';

describe('classes/interfaces.mjs', () => {
  test('exports interface surfaces for JS consumers', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./interfaces.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'ada person:ada true',
      ]);

      const thing = new module.NamedThing();
      expect('name' in thing).toBe(true);
      expect(() => thing.describe()).toThrow(
        'Abstract member NamedThing.describe',
      );

      const person = new module.Person('ada');
      expect(person).toBeInstanceOf(module.NamedThing);
      expect(person.name).toBe('ada');
      person.name = 'grace';
      expect(person.describe()).toBe('person:grace');
    } finally {
      log.mockRestore();
    }
  });
});
