import 'dart:convert';

import 'package:dart2esm/src/diagnostics/metrics.dart';
import 'package:test/test.dart';

void main() {
  test('measures raw gzip line and helper counts', () {
    const code = '''
function __dartFoo() {}
const __dartBar = 1;
const value = 2;
''';

    final metrics = CodeSizeMetrics.fromCode('sample', code);

    expect(metrics.label, 'sample');
    expect(metrics.rawBytes, utf8.encode(code).length);
    expect(metrics.gzipBytes, greaterThan(0));
    expect(metrics.lineCount, 3);
    expect(metrics.runtimeHelperCount, 2);
  });

  test('formats standalone and dart2js comparison reports', () {
    const dart2esm = CodeSizeMetrics(
      label: 'dart2esm',
      rawBytes: 200,
      gzipBytes: 100,
      lineCount: 10,
      runtimeHelperCount: 2,
    );
    const dart2js = CodeSizeMetrics(
      label: 'dart2js -O2',
      rawBytes: 50,
      gzipBytes: 25,
      lineCount: 1,
      runtimeHelperCount: 0,
    );

    expect(formatCodeSizeMetricsReport(dart2esm: dart2esm), [
      'Metrics (dart2esm): raw=200 bytes; gzip=100 bytes; lines=10; helpers=2.',
    ]);
    expect(formatCodeSizeMetricsReport(dart2esm: dart2esm, dart2js: dart2js), [
      'Metrics (dart2esm): raw=200 bytes; gzip=100 bytes; lines=10; helpers=2.',
      'Metrics (dart2js -O2): raw=50 bytes; gzip=25 bytes; lines=1; helpers=0.',
      'Metrics ratio (dart2esm/dart2js): raw=4.00x; gzip=4.00x.',
    ]);
  });
}
