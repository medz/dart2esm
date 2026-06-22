import { describe, expect, test, vi } from 'vitest';

describe('classes/redirecting_constructors.mjs', () => {
  test('redirects named constructors without losing newTarget or fields', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./redirecting_constructors.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'point:0,0',
        'alias:4,5',
        'animal Rex dog! 4',
        'animal Tiny dog! 1 toy ball',
      ]);

      const zero = module.Point.zero();
      expect(zero).toBeInstanceOf(module.Point);
      expect(zero.describe()).toBe('point:0,0');

      const alias = module.Point.alias(7);
      expect(alias).toBeInstanceOf(module.Point);
      expect(alias.x).toBe(7);
      expect(alias.y).toBe(8);
      expect(alias.label).toBe('alias');
      expect(alias.describe()).toBe('alias:7,8');

      const dog = module.Dog.named('Ada', 3);
      expect(dog).toBeInstanceOf(module.Dog);
      expect(dog).toBeInstanceOf(module.Animal);
      expect(dog.name).toBe('Ada');
      expect(dog.source).toBe('animal');
      expect(dog.age).toBe(3);
      expect(dog.label).toBe('dog!');
      expect(dog.describe()).toBe('animal Ada dog! 3');

      const puppy = module.Puppy.named('Tiny');
      expect(puppy).toBeInstanceOf(module.Puppy);
      expect(puppy).toBeInstanceOf(module.Dog);
      expect(puppy).toBeInstanceOf(module.Animal);
      expect(puppy.name).toBe('Tiny');
      expect(puppy.source).toBe('animal');
      expect(puppy.age).toBe(1);
      expect(puppy.label).toBe('dog!');
      expect(puppy.toy).toBe('ball');
      expect(puppy.describe()).toBe('animal Tiny dog! 1 toy ball');
    } finally {
      log.mockRestore();
    }
  });
});
