part of 'esm_codegen.dart';

extension _StatementPrinter on _EsmPrinter {
  void _emitStatement(EsmStatement statement) {
    switch (statement) {
      case EsmExpressionStatement():
        _writeIndented('${_emitExpression(statement.expression)};');
      case EsmBlockStatement():
        _emitBlockStatement(statement);
      case EsmLabeledStatement():
        _emitLabeledStatement(statement);
      case EsmBreakStatement():
        final label = statement.label;
        _writeIndented(label == null ? 'break;' : 'break $label;');
      case EsmContinueStatement():
        final label = statement.label;
        _writeIndented(label == null ? 'continue;' : 'continue $label;');
      case EsmVariableDeclaration():
        final keyword = statement.mutable ? 'let' : 'const';
        final exportPrefix = statement.export ? 'export ' : '';
        final initializer = statement.initializer;
        final binding = _emitBinding(statement.binding);
        _writeIndented(
          initializer == null
              ? '$exportPrefix$keyword $binding;'
              : '$exportPrefix$keyword $binding = ${_emitExpression(initializer)};',
        );
      case EsmIfStatement():
        _emitIfStatement(statement);
      case EsmWhileStatement():
        _emitWhileStatement(statement);
      case EsmDoStatement():
        _emitDoStatement(statement);
      case EsmSwitchStatement():
        _emitSwitchStatement(statement);
      case EsmForStatement():
        _emitForStatement(statement);
      case EsmReturnStatement():
        final expression = statement.expression;
        _writeIndented(
          expression == null
              ? 'return;'
              : 'return ${_emitExpression(expression)};',
        );
      case EsmThrowStatement():
        _writeIndented('throw ${_emitExpression(statement.expression)};');
      case EsmTryStatement():
        _emitTryStatement(statement);
    }
  }

  void _emitBlockStatement(EsmBlockStatement statement) {
    _writeIndented('{');
    _indent++;
    for (final child in statement.body) {
      _emitStatement(child);
    }
    _indent--;
    _writeIndented('}');
  }

  void _emitLabeledStatement(EsmLabeledStatement statement) {
    final body = statement.statement;
    if (body is EsmBlockStatement) {
      _writeIndented('${statement.label}: {');
      _indent++;
      for (final child in body.body) {
        _emitStatement(child);
      }
      _indent--;
      _writeIndented('}');
      return;
    }
    if (body is EsmWhileStatement) {
      _emitWhileStatement(body, label: statement.label);
      return;
    }
    _writeIndented('${statement.label}:');
    _indent++;
    _emitStatement(body);
    _indent--;
  }

  void _emitIfStatement(EsmIfStatement statement) {
    _writeIndented('if (${_emitExpression(statement.condition)}) {');
    _indent++;
    for (final child in statement.thenBody) {
      _emitStatement(child);
    }
    _indent--;
    final otherwiseBody = statement.otherwiseBody;
    if (otherwiseBody == null) {
      _writeIndented('}');
      return;
    }
    _writeIndented('} else {');
    _indent++;
    for (final child in otherwiseBody) {
      _emitStatement(child);
    }
    _indent--;
    _writeIndented('}');
  }

  void _emitWhileStatement(EsmWhileStatement statement, {String? label}) {
    final prefix = label == null ? '' : '$label: ';
    _writeIndented(
      '${prefix}while (${_emitExpression(statement.condition)}) {',
    );
    _indent++;
    for (final child in statement.body) {
      _emitStatement(child);
    }
    _indent--;
    _writeIndented('}');
  }

  void _emitDoStatement(EsmDoStatement statement) {
    _writeIndented('do {');
    _indent++;
    for (final child in statement.body) {
      _emitStatement(child);
    }
    _indent--;
    _writeIndented('} while (${_emitExpression(statement.condition)});');
  }

  void _emitSwitchStatement(EsmSwitchStatement statement) {
    _writeIndented('switch (${_emitExpression(statement.expression)}) {');
    _indent++;
    for (final switchCase in statement.cases) {
      _emitSwitchCase(switchCase);
    }
    _indent--;
    _writeIndented('}');
  }

  void _emitSwitchCase(EsmSwitchCase switchCase) {
    for (final expression in switchCase.expressions) {
      _writeIndented('case ${_emitExpression(expression)}:');
    }
    if (switchCase.isDefault) {
      _writeIndented('default:');
    }
    _indent++;
    for (final child in switchCase.body) {
      _emitStatement(child);
    }
    _indent--;
  }

  void _emitTryStatement(EsmTryStatement statement) {
    _writeIndented('try {');
    _indent++;
    for (final child in statement.body) {
      _emitStatement(child);
    }
    _indent--;
    final catchBody = statement.catchBody;
    final finallyBody = statement.finallyBody;
    if (catchBody != null) {
      final catchParameter = statement.catchParameter;
      _writeIndented(
        catchParameter == null
            ? '} catch {'
            : '} catch (${_emitBindingPattern(catchParameter)}) {',
      );
      _indent++;
      for (final child in catchBody) {
        _emitStatement(child);
      }
      _indent--;
    }
    if (finallyBody != null) {
      _writeIndented('} finally {');
      _indent++;
      for (final child in finallyBody) {
        _emitStatement(child);
      }
      _indent--;
    }
    _writeIndented('}');
  }

  void _emitForStatement(EsmForStatement statement) {
    final initializer = _emitForInitializer(statement.initializers);
    final condition = statement.condition == null
        ? ''
        : _emitExpression(statement.condition!);
    final updates = statement.updates.map(_emitExpression).join(', ');
    _writeIndented('for ($initializer; $condition; $updates) {');
    _indent++;
    for (final child in statement.body) {
      _emitStatement(child);
    }
    _indent--;
    _writeIndented('}');
  }

  String _emitForInitializer(List<EsmVariableDeclaration> initializers) {
    if (initializers.isEmpty) {
      return '';
    }
    final mutable = initializers.first.mutable;
    final keyword = mutable ? 'let' : 'const';
    return '$keyword ${initializers.map(_emitForInitializerBinding).join(', ')}';
  }

  String _emitForInitializerBinding(EsmVariableDeclaration initializer) {
    final value = initializer.initializer;
    final binding = _emitBinding(initializer.binding);
    return value == null ? binding : '$binding = ${_emitExpression(value)}';
  }
}
