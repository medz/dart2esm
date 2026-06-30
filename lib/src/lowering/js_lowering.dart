import '../js_ast/js_ast.dart';
import 'semantic_ir.dart';

JsProgram lowerSemanticProgramToJs(EsmSemanticProgram program) {
  return JsProgram(program.body.map(lowerSemanticStatementToJs).toList());
}

JsStatement lowerSemanticStatementToJs(EsmSemanticStatement statement) {
  return switch (statement) {
    EsmEntrypointInvocation() => _lowerEntrypointInvocation(statement),
  };
}

JsStatement _lowerEntrypointInvocation(EsmEntrypointInvocation statement) {
  final call = JsCallExpression(callee: JsIdentifier(statement.targetName));
  return JsExpressionStatement(
    statement.awaitCompletion ? JsAwaitExpression(call) : call,
  );
}
