import { describe, expect, test, vi } from 'vitest';

describe('classes/named_constructors.mjs', () => {
  test('exports static named constructors that allocate native class instances', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./named_constructors.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'origin!:0,0',
        'square:4,4',
        'point:2,3',
        'token alpha',
      ]);

      const origin = module.Point.origin();
      expect(origin).toBeInstanceOf(module.Point);
      expect(origin.x).toBe(0);
      expect(origin.y).toBe(0);
      expect(origin.label).toBe('origin!');
      expect(origin.describe()).toBe('origin!:0,0');

      const square = module.Point.square(7);
      expect(square).toBeInstanceOf(module.Point);
      expect(square.x).toBe(7);
      expect(square.y).toBe(7);
      expect(square.label).toBe('square');
      expect(square.describe()).toBe('square:7,7');

      const regular = new module.Point(5, 6);
      expect(regular).toBeInstanceOf(module.Point);
      expect(regular.describe()).toBe('point:5,6');

      const token = module.Token.named('beta');
      expect(token).toBeInstanceOf(module.Token);
      expect(token.value).toBe('beta');
      expect(token.describe()).toBe('token beta');

      expect(() => new module.Token()).toThrow(
        TypeError,
        'Class Token has no unnamed constructor',
      );
    } finally {
      log.mockRestore();
    }
  });
});
