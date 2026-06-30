import 'dart:convert';
import 'dart:io';

final class CodeSizeMetrics {
  const CodeSizeMetrics({
    required this.label,
    required this.rawBytes,
    required this.gzipBytes,
    required this.lineCount,
    required this.runtimeHelperCount,
  });

  factory CodeSizeMetrics.fromCode(String label, String code) {
    final bytes = utf8.encode(code);
    return CodeSizeMetrics(
      label: label,
      rawBytes: bytes.length,
      gzipBytes: gzip.encode(bytes).length,
      lineCount: code.isEmpty ? 0 : const LineSplitter().convert(code).length,
      runtimeHelperCount: countRuntimeHelperDeclarations(code),
    );
  }

  final String label;
  final int rawBytes;
  final int gzipBytes;
  final int lineCount;
  final int runtimeHelperCount;
}

Future<CodeSizeMetrics> measureCodeSizeFile(String label, File file) async {
  return CodeSizeMetrics.fromCode(label, await file.readAsString());
}

int countRuntimeHelperDeclarations(String code) {
  final helpers = <String>{};
  for (final match in _runtimeHelperDeclarationPattern.allMatches(code)) {
    helpers.add(match.group(1)!);
  }
  return helpers.length;
}

List<String> formatCodeSizeMetricsReport({
  required CodeSizeMetrics dart2esm,
  CodeSizeMetrics? dart2js,
}) {
  return [
    _formatCodeSizeMetrics(dart2esm),
    if (dart2js != null) ...[
      _formatCodeSizeMetrics(dart2js),
      'Metrics ratio (dart2esm/dart2js): raw=${_formatRatio(dart2esm.rawBytes, dart2js.rawBytes)}; gzip=${_formatRatio(dart2esm.gzipBytes, dart2js.gzipBytes)}.',
    ],
  ];
}

String _formatCodeSizeMetrics(CodeSizeMetrics metrics) {
  return 'Metrics (${metrics.label}): raw=${metrics.rawBytes} bytes; gzip=${metrics.gzipBytes} bytes; lines=${metrics.lineCount}; helpers=${metrics.runtimeHelperCount}.';
}

String _formatRatio(int numerator, int denominator) {
  if (denominator == 0) {
    return 'n/a';
  }
  return '${(numerator / denominator).toStringAsFixed(2)}x';
}

final _runtimeHelperDeclarationPattern = RegExp(
  r'^(?:function|const|let|var|class)\s+(__dart[A-Za-z0-9_$]*)\b',
  multiLine: true,
);
