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
          line === '} catch ($error_3) {' ||
          line === 'if ($error_3 instanceof ParseIssue) {' ||
          line === '} else if ($error_3 != null) {' ||
          line === '(() => { throw $error_3; })();' ||
          line === 'throw $error_3;' ||
          line === '} catch ($error_2) {' ||
          line === 'if ($error_2 instanceof NotFound) {' ||
          line === 'throw $error_2;',
      );

    expect(shapeLines).toEqual([
      '} catch ($error) {',
      'if ($error instanceof ParseIssue) {',
      '} else if ($error instanceof NotFound) {',
      'const stack = $error?.stack ?? "<javascript stack unavailable>";',
      '} else if (typeof $error === "string") {',
      '} else if ($error != null) {',
      'throw $error;',
      '} catch ($error_3) {',
      'if ($error_3 instanceof ParseIssue) {',
      '} else if ($error_3 != null) {',
      '(() => { throw $error_3; })();',
      'throw $error_3;',
      '} catch ($error_2) {',
      'if ($error_2 instanceof NotFound) {',
      'throw $error_2;',
    ]);
  });
});
