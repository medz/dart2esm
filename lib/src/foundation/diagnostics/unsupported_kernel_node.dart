final class UnsupportedKernelNode implements Exception {
  UnsupportedKernelNode(this.node, this.context);

  final Object node;
  final String context;

  @override
  String toString() =>
      'Unsupported Kernel node in $context: ${node.runtimeType}';
}
