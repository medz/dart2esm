import { describe, expect, test, vi } from 'vitest';

describe('classes/inheritance.mjs', () => {
  test('exports native JS classes with extends and super constructors', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./inheritance.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'dog Rex 4',
        'dog Rex 5',
        'animal true',
        'dog true',
      ]);

      const dog = new module.Dog('Ada', 2);
      expect(dog).toBeInstanceOf(module.Dog);
      expect(dog).toBeInstanceOf(module.Animal);
      expect(dog.name).toBe('Ada');
      expect(dog.age).toBe(2);
      expect(dog.describe()).toBe('dog Ada 2');
      expect(dog.birthday()).toBe('dog Ada 3');
    } finally {
      log.mockRestore();
    }
  });
});
