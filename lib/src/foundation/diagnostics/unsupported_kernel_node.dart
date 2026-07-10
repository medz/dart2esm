import 'compiler_diagnostic.dart';

final class UnsupportedKernelNode implements Exception {
  UnsupportedKernelNode(this.node, this.context);

  final Object node;
  final String context;

  CompilerDiagnostic toDiagnostic() {
    return CompilerDiagnostic(
      code: 'D2E2001',
      severity: DiagnosticSeverity.error,
      phase: DiagnosticPhase.kernel,
      message: toString(),
      span: kernelSourceSpan(node),
    );
  }

  @override
  String toString() =>
      'Unsupported Kernel node in $context: ${node.runtimeType}';
}
