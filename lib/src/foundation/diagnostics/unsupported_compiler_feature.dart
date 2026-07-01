final class UnsupportedCompilerFeature implements Exception {
  const UnsupportedCompilerFeature(this.node, this.context);

  final Object node;
  final String context;

  @override
  String toString() =>
      'dart2esm compiler does not support $context: ${node.runtimeType}';
}
