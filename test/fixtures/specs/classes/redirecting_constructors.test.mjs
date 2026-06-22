import { describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';

describe('classes/redirecting_constructors.mjs', () => {
  test('redirects generative constructors without losing newTarget or fields', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./redirecting_constructors.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'point:0,0',
        'alias:4,5',
        'default:0,1',
        'mirror:5,5',
        '0..10',
        '5..15',
        'default:1:true',
        'from:2:true',
        'off:3:false',
        'animal Rex dog! 4',
        'animal Tiny dog! 1 toy ball',
        'point:0,0 red',
        'default:0,1 wrapped',
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

      const pair = new module.Pair();
      expect(pair).toBeInstanceOf(module.Pair);
      expect(pair.left).toBe(0);
      expect(pair.right).toBe(1);
      expect(pair.label).toBe('default');
      expect(pair.describe()).toBe('default:0,1');

      const mirror = module.Pair.mirror(5);
      expect(mirror).toBeInstanceOf(module.Pair);
      expect(mirror.left).toBe(5);
      expect(mirror.right).toBe(5);
      expect(mirror.label).toBe('mirror');
      expect(mirror.describe()).toBe('mirror:5,5');

      const defaultRange = module.Range.start();
      expect(defaultRange).toBeInstanceOf(module.Range);
      expect(defaultRange.start).toBe(0);
      expect(defaultRange.end).toBe(10);
      expect(defaultRange.describe()).toBe('0..10');

      const shiftedRange = module.Range.start(5);
      expect(shiftedRange).toBeInstanceOf(module.Range);
      expect(shiftedRange.start).toBe(5);
      expect(shiftedRange.end).toBe(15);
      expect(shiftedRange.describe()).toBe('5..15');

      const explicitRange = module.Range.between(3, 4);
      expect(explicitRange).toBeInstanceOf(module.Range);
      expect(explicitRange.describe()).toBe('3..4');

      const defaults = module.Options.defaults();
      expect(defaults).toBeInstanceOf(module.Options);
      expect(defaults.count).toBe(1);
      expect(defaults.label).toBe('default');
      expect(defaults.enabled).toBe(true);
      expect(defaults.describe()).toBe('default:1:true');

      const fromDefault = module.Options.from({ count: 2 });
      expect(fromDefault).toBeInstanceOf(module.Options);
      expect(fromDefault.count).toBe(2);
      expect(fromDefault.label).toBe('from');
      expect(fromDefault.enabled).toBe(true);
      expect(fromDefault.describe()).toBe('from:2:true');

      const fromCustom = module.Options.from({ count: 4, label: 'custom' });
      expect(fromCustom).toBeInstanceOf(module.Options);
      expect(fromCustom.count).toBe(4);
      expect(fromCustom.label).toBe('custom');
      expect(fromCustom.enabled).toBe(true);
      expect(fromCustom.describe()).toBe('custom:4:true');

      const disabled = module.Options.disabled(3);
      expect(disabled).toBeInstanceOf(module.Options);
      expect(disabled.count).toBe(3);
      expect(disabled.label).toBe('off');
      expect(disabled.enabled).toBe(false);
      expect(disabled.describe()).toBe('off:3:false');

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

      const colored = module.ColoredPoint.zero('blue');
      expect(colored).toBeInstanceOf(module.ColoredPoint);
      expect(colored).toBeInstanceOf(module.Point);
      expect(colored.x).toBe(0);
      expect(colored.y).toBe(0);
      expect(colored.label).toBe('point');
      expect(colored.color).toBe('blue');
      expect(colored.describe()).toBe('point:0,0 blue');

      const wrapped = new module.WrappedPair('box');
      expect(wrapped).toBeInstanceOf(module.WrappedPair);
      expect(wrapped).toBeInstanceOf(module.Pair);
      expect(wrapped.left).toBe(0);
      expect(wrapped.right).toBe(1);
      expect(wrapped.label).toBe('default');
      expect(wrapped.wrapper).toBe('box');
      expect(wrapped.describe()).toBe('default:0,1 box');

      expect(() => new module.Range()).toThrow(
        'Class Range has no unnamed constructor',
      );
      expect(() => new module.Options()).toThrow(
        'Class Options has no unnamed constructor',
      );
    } finally {
      log.mockRestore();
    }
  });

  test('emits native ESM redirecting constructor shapes exactly', () => {
    const source = readFileSync(
      new URL('./redirecting_constructors.mjs', import.meta.url),
      'utf8',
    );
    const shapeLines = source
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith('return Reflect.construct(Point') ||
          line.startsWith('return $Point_named($newTarget') ||
          line.startsWith('return $Pair_named(new.target') ||
          line.startsWith('return $Pair_named($newTarget') ||
          line.startsWith('return $Range_between($newTarget') ||
          line.startsWith('return $Options_named($newTarget') ||
          line.startsWith('return $Dog_full($newTarget') ||
          line.startsWith('return $Puppy_full($newTarget') ||
          line.startsWith('const $self = $Point_zero'),
      );

    expect(shapeLines).toEqual([
      'return Reflect.construct(Point, [0, 0], $newTarget);',
      'return $Point_named($newTarget, value, (value + 1), "alias");',
      'return $Pair_named(new.target, 0, 1, "default");',
      'return $Pair_named($newTarget, value, value, "mirror");',
      'return $Range_between($newTarget, start, (start + 10));',
      'return $Options_named($newTarget, { count: 1 });',
      'return $Options_named($newTarget, { count: count, label: label });',
      'return $Options_named($newTarget, { count: count, label: "off", enabled: false });',
      'return $Dog_full($newTarget, name, age, "dog");',
      'return $Puppy_full($newTarget, name, 1, "ball");',
      'const $self = $Point_zero($newTarget);',
    ]);
  });
});
