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
          line === 'if ($error instanceof NotFound) {' ||
          line ===
            'const stack = ($error?.stack ?? "<javascript stack unavailable>");' ||
          line === 'if (typeof $error === "string") {' ||
          line === 'if ($error != null) {' ||
          line === 'throw $error;',
      );

    expect(shapeLines).toEqual([
      '} catch ($error) {',
      'if ($error instanceof ParseIssue) {',
      'if ($error instanceof NotFound) {',
      'const stack = ($error?.stack ?? "<javascript stack unavailable>");',
      'if (typeof $error === "string") {',
      'if ($error != null) {',
      'throw $error;',
      '} catch ($error) {',
      'if ($error != null) {',
      'throw $error;',
      '} catch ($error) {',
      'if ($error instanceof ParseIssue) {',
      'if ($error != null) {',
      'throw $error;',
      'throw $error;',
      '} catch ($error) {',
      'if ($error instanceof NotFound) {',
      'throw $error;',
    ]);
  });
});
