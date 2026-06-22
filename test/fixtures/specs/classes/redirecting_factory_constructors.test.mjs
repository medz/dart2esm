import { describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';

describe('classes/redirecting_factory_constructors.mjs', () => {
  test('redirects factory constructors to generative and factory targets', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./redirecting_factory_constructors.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'square:2',
        'named:3',
        'named:4',
        'square:5',
        'default:8',
        'options:9',
        'custom:6',
        'button:button',
        'button:primary',
      ]);

      const unnamed = new module.Shape(10);
      expect(unnamed).toBeInstanceOf(module.Square);
      expect(unnamed.describe()).toBe('square:10');

      const named = module.Shape.named(11);
      expect(named).toBeInstanceOf(module.Square);
      expect(named.describe()).toBe('named:11');

      const alias = module.Shape.alias(12);
      expect(alias).toBeInstanceOf(module.Square);
      expect(alias.describe()).toBe('named:12');

      const newAlias = module.Shape.newAlias(14);
      expect(newAlias).toBeInstanceOf(module.Square);
      expect(newAlias.describe()).toBe('square:14');

      const withDefault = module.Shape.withDefault();
      expect(withDefault).toBeInstanceOf(module.Square);
      expect(withDefault.describe()).toBe('default:8');

      const optionsDefault = module.Shape.options();
      expect(optionsDefault).toBeInstanceOf(module.Square);
      expect(optionsDefault.describe()).toBe('options:9');

      const optionsCustom = module.Shape.options({
        size: 13,
        label: 'custom',
      });
      expect(optionsCustom).toBeInstanceOf(module.Square);
      expect(optionsCustom.describe()).toBe('custom:13');

      const widget = module.Widget.d();
      expect(widget).toBeInstanceOf(module.Button);
      expect(widget.describe()).toBe('button:button');

      const namedWidget = module.Widget.named('secondary');
      expect(namedWidget).toBeInstanceOf(module.Button);
      expect(namedWidget.describe()).toBe('button:secondary');
    } finally {
      log.mockRestore();
    }
  });

  test('emits native ESM factory constructor shapes exactly', () => {
    const source = readFileSync(
      new URL('./redirecting_factory_constructors.mjs', import.meta.url),
      'utf8',
    );
    const shapeLines = source
      .split('\n')
      .filter((line) =>
        /return (new Square|Square\.|Shape\.named|new Button|Button\.named)/.test(
          line.trim(),
        ),
      )
      .map((line) => line.trim());

    expect(shapeLines).toEqual([
      'return new Square(size);',
      'return Square.named(size);',
      'return Shape.named(size);',
      'return new Square(size);',
      'return Square.withDefault(size);',
      'return Square.options({ size: size, label: label });',
      'return new Button();',
      'return Button.named(label);',
    ]);
  });
});
