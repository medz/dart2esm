import 'package:kernel/kernel.dart' as k;

bool switchCanContinueToCase(k.SwitchStatement statement) {
  final targets = statement.cases.toSet();
  for (final switchCase in statement.cases) {
    if (_containsContinueToSwitchCase(switchCase.body, targets)) {
      return true;
    }
  }
  return false;
}

bool _containsContinueToSwitchCase(
  k.Statement statement,
  Set<k.SwitchCase> targets,
) {
  switch (statement) {
    case k.ContinueSwitchStatement():
      return targets.contains(statement.target);
    case k.Block():
      return statement.statements.any(
        (child) => _containsContinueToSwitchCase(child, targets),
      );
    case k.LabeledStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.ExpressionStatement() ||
        k.EmptyStatement() ||
        k.ReturnStatement() ||
        k.VariableDeclaration() ||
        k.BreakStatement() ||
        k.AssertStatement():
      return false;
    case k.FunctionDeclaration():
      return false;
    case k.IfStatement():
      return _containsContinueToSwitchCase(statement.then, targets) ||
          (statement.otherwise != null &&
              _containsContinueToSwitchCase(statement.otherwise!, targets));
    case k.WhileStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.DoStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.ForStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.ForInStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.SwitchStatement():
      return statement.cases.any(
        (switchCase) => _containsContinueToSwitchCase(switchCase.body, targets),
      );
    case k.TryCatch():
      return _containsContinueToSwitchCase(statement.body, targets) ||
          statement.catches.any(
            (catchNode) =>
                _containsContinueToSwitchCase(catchNode.body, targets),
          );
    case k.TryFinally():
      return _containsContinueToSwitchCase(statement.body, targets) ||
          _containsContinueToSwitchCase(statement.finalizer, targets);
    case k.AssertBlock():
      return statement.statements.any(
        (child) => _containsContinueToSwitchCase(child, targets),
      );
    default:
      return false;
  }
}

bool functionBodyUsesLexicalReceiver(k.Statement body) {
  final visitor = _LexicalReceiverUseVisitor();
  body.accept(visitor);
  return visitor.found;
}

final class _LexicalReceiverUseVisitor extends k.RecursiveVisitor {
  bool found = false;

  @override
  void defaultDartType(k.DartType node) {}

  @override
  void visitSuperMethodInvocation(k.SuperMethodInvocation node) {
    found = true;
  }

  @override
  void visitAbstractSuperMethodInvocation(
    k.AbstractSuperMethodInvocation node,
  ) {
    found = true;
  }

  @override
  void visitSuperPropertyGet(k.SuperPropertyGet node) {
    found = true;
  }

  @override
  void visitSuperPropertySet(k.SuperPropertySet node) {
    found = true;
  }

  @override
  void visitAbstractSuperPropertyGet(k.AbstractSuperPropertyGet node) {
    found = true;
  }

  @override
  void visitAbstractSuperPropertySet(k.AbstractSuperPropertySet node) {
    found = true;
  }

  @override
  void visitThisExpression(k.ThisExpression node) {
    found = true;
  }

  @override
  void visitInstanceInvocation(k.InstanceInvocation node) {
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitInstanceGetterInvocation(k.InstanceGetterInvocation node) {
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitInstanceGet(k.InstanceGet node) {
    node.receiver.accept(this);
  }

  @override
  void visitInstanceSet(k.InstanceSet node) {
    node.receiver.accept(this);
    node.value.accept(this);
  }

  @override
  void visitInstanceTearOff(k.InstanceTearOff node) {
    node.receiver.accept(this);
  }

  @override
  void visitEqualsCall(k.EqualsCall node) {
    node.left.accept(this);
    node.right.accept(this);
  }

  @override
  void visitStaticInvocation(k.StaticInvocation node) {
    _visitArguments(node.arguments);
  }

  @override
  void visitConstructorInvocation(k.ConstructorInvocation node) {
    _visitArguments(node.arguments);
  }

  @override
  void visitStaticGet(k.StaticGet node) {}

  @override
  void visitStaticSet(k.StaticSet node) {
    node.value.accept(this);
  }

  @override
  void visitStaticTearOff(k.StaticTearOff node) {}

  @override
  void visitConstructorTearOff(k.ConstructorTearOff node) {}

  @override
  void visitLocalFunctionInvocation(k.LocalFunctionInvocation node) {
    _visitArguments(node.arguments);
  }

  @override
  void visitFunctionDeclaration(k.FunctionDeclaration node) {}

  @override
  void visitFunctionExpression(k.FunctionExpression node) {}

  void _visitArguments(k.Arguments arguments) {
    for (final positional in arguments.positional) {
      positional.accept(this);
    }
    for (final named in arguments.named) {
      named.value.accept(this);
    }
  }
}
