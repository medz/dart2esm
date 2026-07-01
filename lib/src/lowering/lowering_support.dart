part of 'kernel_to_esm_ast.dart';

final class _ContinueSwitchTarget {
  const _ContinueSwitchTarget({
    required this.stateName,
    required this.loopLabel,
    required this.caseIndex,
  });

  final String stateName;
  final String loopLabel;
  final int caseIndex;
}

bool _switchCanContinueToCase(k.SwitchStatement statement) {
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

final class _VariableReferenceVisitor extends k.RecursiveVisitor {
  _VariableReferenceVisitor(this.variable);

  final k.VariableDeclaration variable;
  bool found = false;

  @override
  void defaultDartType(k.DartType node) {}

  @override
  void visitStaticInvocation(k.StaticInvocation node) {
    node.arguments.accept(this);
  }

  @override
  void visitConstructorInvocation(k.ConstructorInvocation node) {
    node.arguments.accept(this);
  }

  @override
  void visitInstanceInvocation(k.InstanceInvocation node) {
    node.receiver.accept(this);
    node.arguments.accept(this);
  }

  @override
  void visitEqualsCall(k.EqualsCall node) {
    node.left.accept(this);
    node.right.accept(this);
  }

  @override
  void visitVariableGet(k.VariableGet node) {
    if (node.variable == variable) {
      found = true;
      return;
    }
    super.visitVariableGet(node);
  }
}

const _binaryOperators = {
  '+': EsmBinaryOperator.add,
  '-': EsmBinaryOperator.subtract,
  '*': EsmBinaryOperator.multiply,
  '/': EsmBinaryOperator.divide,
  '%': EsmBinaryOperator.remainder,
  '<': EsmBinaryOperator.lessThan,
  '<=': EsmBinaryOperator.lessThanOrEqual,
  '>': EsmBinaryOperator.greaterThan,
  '>=': EsmBinaryOperator.greaterThanOrEqual,
  '&': EsmBinaryOperator.bitAnd,
  '|': EsmBinaryOperator.bitOr,
  '^': EsmBinaryOperator.bitXor,
  '<<': EsmBinaryOperator.leftShift,
  '>>': EsmBinaryOperator.signedRightShift,
  '>>>': EsmBinaryOperator.unsignedRightShift,
};
