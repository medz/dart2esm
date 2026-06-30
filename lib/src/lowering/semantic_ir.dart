sealed class EsmSemanticNode {
  const EsmSemanticNode();
}

final class EsmSemanticProgram extends EsmSemanticNode {
  const EsmSemanticProgram(this.body);

  final List<EsmSemanticStatement> body;
}

sealed class EsmSemanticStatement extends EsmSemanticNode {
  const EsmSemanticStatement();
}

final class EsmEntrypointInvocation extends EsmSemanticStatement {
  const EsmEntrypointInvocation({
    required this.targetName,
    required this.awaitCompletion,
  });

  final String targetName;
  final bool awaitCompletion;
}
