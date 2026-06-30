sealed class JsNode {
  const JsNode();
}

final class JsProgram extends JsNode {
  const JsProgram(this.body);

  final List<JsStatement> body;
}

sealed class JsStatement extends JsNode {
  const JsStatement();
}

final class JsExpressionStatement extends JsStatement {
  const JsExpressionStatement(this.expression);

  final JsExpression expression;
}

sealed class JsExpression extends JsNode {
  const JsExpression();
}

final class JsIdentifier extends JsExpression {
  const JsIdentifier(this.name);

  final String name;
}

final class JsStringLiteral extends JsExpression {
  const JsStringLiteral(this.value);

  final String value;
}

final class JsNumberLiteral extends JsExpression {
  const JsNumberLiteral(this.value);

  final num value;
}

final class JsBooleanLiteral extends JsExpression {
  const JsBooleanLiteral(this.value);

  final bool value;
}

final class JsNullLiteral extends JsExpression {
  const JsNullLiteral();
}

final class JsArrayExpression extends JsExpression {
  const JsArrayExpression(this.elements);

  final List<JsExpression> elements;
}

final class JsObjectExpression extends JsExpression {
  const JsObjectExpression(this.properties);

  final List<JsObjectProperty> properties;
}

final class JsObjectProperty extends JsNode {
  const JsObjectProperty({required this.key, required this.value});

  final String key;
  final JsExpression value;
}

final class JsCallExpression extends JsExpression {
  const JsCallExpression({required this.callee, this.arguments = const []});

  final JsExpression callee;
  final List<JsExpression> arguments;
}

final class JsAwaitExpression extends JsExpression {
  const JsAwaitExpression(this.expression);

  final JsExpression expression;
}
