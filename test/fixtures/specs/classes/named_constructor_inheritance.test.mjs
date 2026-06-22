import { describe, expect, test, vi } from 'vitest';

describe('classes/named_constructor_inheritance.mjs', () => {
  test('exports derived named constructors as native subclass instances', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./named_constructor_inheritance.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'animal Rex named dog! 4',
        'animal Ada dog 2',
        'animal Mia cat 9',
      ]);

      const dog = module.Dog.named('Grace', 5);
      expect(dog).toBeInstanceOf(module.Dog);
      expect(dog).toBeInstanceOf(module.Animal);
      expect(dog.name).toBe('Grace');
      expect(dog.age).toBe(5);
      expect(dog.label).toBe('named dog!');
      expect(dog.describe()).toBe('animal Grace named dog! 5');

      const regular = new module.Dog(3, 'Ada');
      expect(regular).toBeInstanceOf(module.Dog);
      expect(regular).toBeInstanceOf(module.Animal);
      expect(regular.name).toBe('Ada');
      expect(regular.age).toBe(3);
      expect(regular.label).toBe('dog');
      expect(regular.describe()).toBe('animal Ada dog 3');

      const cat = module.Cat.named('Mia');
      expect(cat).toBeInstanceOf(module.Cat);
      expect(cat).toBeInstanceOf(module.Animal);
      expect(cat.name).toBe('Mia');
      expect(cat.lives).toBe(9);
      expect(cat.describe()).toBe('animal Mia cat 9');

      expect(() => new module.Cat()).toThrow(
        TypeError,
        'Class Cat has no unnamed constructor',
      );
    } finally {
      log.mockRestore();
    }
  });
});
