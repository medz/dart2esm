import { describe, expect, test, vi } from 'vitest';

describe('classes/unnamed_redirecting_constructors.mjs', () => {
  test('redirects unnamed constructors while preserving new expressions', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./unnamed_redirecting_constructors.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'default:0,1',
        'animal Rex dog! 4',
      ]);

      const pair = new module.Pair();
      expect(pair).toBeInstanceOf(module.Pair);
      expect(pair.left).toBe(0);
      expect(pair.right).toBe(1);
      expect(pair.label).toBe('default');
      expect(pair.describe()).toBe('default:0,1');

      const explicitPair = module.Pair.named(2, 3, 'named');
      expect(explicitPair).toBeInstanceOf(module.Pair);
      expect(explicitPair.describe()).toBe('named:2,3');

      const dog = new module.Dog();
      expect(dog).toBeInstanceOf(module.Dog);
      expect(dog).toBeInstanceOf(module.Animal);
      expect(dog.name).toBe('Rex');
      expect(dog.age).toBe(4);
      expect(dog.label).toBe('dog!');
      expect(dog.describe()).toBe('animal Rex dog! 4');

      const namedDog = module.Dog.named('Ada', 3);
      expect(namedDog).toBeInstanceOf(module.Dog);
      expect(namedDog).toBeInstanceOf(module.Animal);
      expect(namedDog.describe()).toBe('animal Ada dog! 3');
    } finally {
      log.mockRestore();
    }
  });
});
