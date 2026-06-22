import { describe, expect, test, vi } from 'vitest';

describe('classes/named_super_constructors.mjs', () => {
  test('threads newTarget through named super constructors', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./named_super_constructors.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'named animal! Rex dog! 4',
        'named animal! Tiny dog! 1 toy ball',
      ]);

      const dog = module.Dog.named('Ada', 3);
      expect(dog).toBeInstanceOf(module.Dog);
      expect(dog).toBeInstanceOf(module.Animal);
      expect(dog.name).toBe('Ada');
      expect(dog.source).toBe('named animal!');
      expect(dog.age).toBe(3);
      expect(dog.label).toBe('dog!');
      expect(dog.describe()).toBe('named animal! Ada dog! 3');

      const puppy = module.Puppy.named('Tiny', 1, 'rope');
      expect(puppy).toBeInstanceOf(module.Puppy);
      expect(puppy).toBeInstanceOf(module.Dog);
      expect(puppy).toBeInstanceOf(module.Animal);
      expect(puppy.name).toBe('Tiny');
      expect(puppy.source).toBe('named animal!');
      expect(puppy.age).toBe(1);
      expect(puppy.label).toBe('dog!');
      expect(puppy.toy).toBe('rope');
      expect(puppy.describe()).toBe('named animal! Tiny dog! 1 toy rope');

      expect(() => new module.Animal()).toThrow(
        TypeError,
        'Class Animal has no unnamed constructor',
      );
      expect(() => new module.Dog()).toThrow(
        TypeError,
        'Class Dog has no unnamed constructor',
      );
      expect(() => new module.Puppy()).toThrow(
        TypeError,
        'Class Puppy has no unnamed constructor',
      );
    } finally {
      log.mockRestore();
    }
  });
});
