import { describe, expect, test, vi } from 'vitest';

describe('imports/reexport_api.mjs', () => {
  test('exports declarations through local Dart re-export chains', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const module = await import('./reexport_api.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'api:3 barrel:5 4 hidden:4',
      ]);
      expect(module.leafValue).toBe(3);
      expect(new module.LeafThing('js').label()).toBe('js:3');
      expect(new module.BarrelThing().label()).toBe('barrel:5');
      expect(module).not.toHaveProperty('barrelValue');
      expect(module).not.toHaveProperty('privateBarrelLabel');
      expect(module).not.toHaveProperty('_privateBarrelValue');
      expect(module).not.toHaveProperty('_PrivateBarrelThing');
      expect(module).not.toHaveProperty('hiddenLeafValue');
      expect(module).not.toHaveProperty('HiddenLeafThing');
    } finally {
      log.mockRestore();
    }
  });
});
