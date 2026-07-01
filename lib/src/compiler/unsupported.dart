final class NewCompilerUnsupported implements Exception {
  const NewCompilerUnsupported(this.node, this.context);

  final Object node;
  final String context;

  @override
  String toString() =>
      'New compiler core does not support $context: ${node.runtimeType}';
}
