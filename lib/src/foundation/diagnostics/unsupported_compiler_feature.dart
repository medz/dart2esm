import 'compiler_diagnostic.dart';

final class UnsupportedCompilerFeature implements Exception {
  const UnsupportedCompilerFeature(this.node, this.context);

  final Object node;
  final String context;

  CompilerDiagnostic toDiagnostic() {
    return CompilerDiagnostic(
      code: 'D2E2002',
      severity: DiagnosticSeverity.error,
      phase: DiagnosticPhase.lowering,
      message: toString(),
      span: kernelSourceSpan(node),
    );
  }

  @override
  String toString() =>
      'dart2esm compiler does not support $context: ${node.runtimeType}';
}
