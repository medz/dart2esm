import 'package:dart2esm/src/third_party/kernel/kernel.dart' as k;

enum DiagnosticSeverity { info, warning, error }

enum DiagnosticPhase {
  driver,
  frontend,
  kernel,
  analysis,
  lowering,
  optimization,
  runtime,
  emit,
}

final class SourceSpan {
  const SourceSpan({
    required this.uri,
    required this.line,
    required this.column,
    this.offset,
  });

  final Uri uri;
  final int line;
  final int column;
  final int? offset;

  @override
  String toString() => '$uri:$line:$column';
}

SourceSpan? kernelSourceSpan(Object? node) {
  if (node is! k.TreeNode) return null;
  final location = node.location;
  if (location == null) return null;
  return SourceSpan(
    uri: location.file,
    line: location.line,
    column: location.column,
    offset: node.fileOffset == k.TreeNode.noOffset ? null : node.fileOffset,
  );
}

final class CompilerDiagnostic {
  const CompilerDiagnostic({
    required this.code,
    required this.severity,
    required this.phase,
    required this.message,
    this.span,
    this.related = const [],
  });

  final String code;
  final DiagnosticSeverity severity;
  final DiagnosticPhase phase;
  final String message;
  final SourceSpan? span;
  final List<CompilerDiagnostic> related;

  bool get isError => severity == DiagnosticSeverity.error;

  String render({bool includeCode = true}) {
    final prefix = [
      if (span case final span?) '$span',
      if (includeCode) '${severity.name} $code',
    ].join(' - ');
    return prefix.isEmpty ? message : '$prefix: $message';
  }

  @override
  String toString() => render();
}
