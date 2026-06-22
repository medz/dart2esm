import { readFileSync } from 'node:fs';
import { describe, expect, test, vi } from 'vitest';

describe('control_flow/exceptions.mjs', () => {
  test('matches Dart exception handler behavior', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await import('./exceptions.mjs');

      expect(log.mock.calls.map(([value]) => value)).toEqual([
        'parse:line',
        'missing:index:trace',
        'string:text',
        'fallback',
        'caught:start',
        'finally:caught',
        'rethrow:inner',
      ]);
    } finally {
      log.mockRestore();
    }
  });

  test('emits ordered ESM catch guards and rethrow exactly', () => {
    const source = readFileSync(
      new URL('./exceptions.mjs', import.meta.url),
      'utf8',
    );
    const shapeLines = source
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line === '} catch ($error) {' ||
          line === 'if ($error instanceof ParseIssue) {' ||
          line === '} else if ($error instanceof NotFound) {' ||
          line ===
            'const stack = $error?.stack ?? "<javascript stack unavailable>";' ||
          line === '} else if (typeof $error === "string") {' ||
          line === '} else if ($error != null) {' ||
          line === 'throw $error;' ||
          line === '} catch ($error_1) {' ||
          line === 'if ($error_1 instanceof ParseIssue) {' ||
          line === '} else if ($error_1 != null) {' ||
          line === '(() => { throw $error_1; })();' ||
          line === 'throw $error_1;',
      );

    expect(shapeLines).toEqual([
      '} catch ($error) {',
      'if ($error instanceof ParseIssue) {',
      '} else if ($error instanceof NotFound) {',
      'const stack = $error?.stack ?? "<javascript stack unavailable>";',
      '} else if (typeof $error === "string") {',
      '} else if ($error != null) {',
      'throw $error;',
      '} catch ($error) {',
      'throw $error;',
      '} catch ($error_1) {',
      'if ($error_1 instanceof ParseIssue) {',
      '} else if ($error_1 != null) {',
      '(() => { throw $error_1; })();',
      'throw $error_1;',
      '} catch ($error) {',
      'throw $error;',
    ]);
  });
});
