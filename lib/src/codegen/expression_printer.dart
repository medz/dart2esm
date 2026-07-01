part of 'esm_codegen.dart';

extension _ExpressionPrinter on _EsmPrinter {
  String _emitExpression(EsmExpression expression) {
    return switch (expression) {
      EsmIdentifier() => expression.name,
      EsmImportMeta() => 'import.meta',
      EsmStringLiteral() => jsonEncode(expression.value),
      EsmStringConcatenation() => _emitStringConcatenation(expression),
      EsmAssignment() =>
        '${_emitExpression(expression.target)} = ${_emitExpression(expression.value)}',
      EsmBinary() => _emitBinaryExpression(expression),
      EsmUnary() => _emitUnaryExpression(expression),
      EsmConditional() =>
        '(${_emitExpression(expression.condition)} ? ${_emitExpression(expression.thenExpression)} : ${_emitExpression(expression.otherwiseExpression)})',
      EsmNullishCoalesce() =>
        '(${_emitNullishOperand(expression.left)} ?? ${_emitNullishOperand(expression.right)})',
      EsmParenthesized() => '(${_emitExpression(expression.expression)})',
      EsmNumberLiteral() => _emitNumber(expression.value),
      EsmBooleanLiteral() => expression.value ? 'true' : 'false',
      EsmNullLiteral() => 'null',
      EsmArrayLiteral() =>
        '[${expression.elements.map(_emitExpression).join(', ')}]',
      EsmObjectLiteral() =>
        '{ ${expression.properties.map(_emitObjectLiteralProperty).join(', ')} }',
      EsmArrowFunction() =>
        '(${expression.parameters.map(_emitParameter).join(', ')}) => ${_emitExpression(expression.body)}',
      EsmFunctionExpression() => _emitFunctionExpression(expression),
      EsmArrowBlockFunction() => _emitArrowBlockFunction(expression),
      EsmCall() =>
        '${_emitCallCallee(expression.callee)}(${expression.arguments.map(_emitExpression).join(', ')})',
      EsmNew() =>
        'new ${_emitExpression(expression.callee)}(${expression.arguments.map(_emitExpression).join(', ')})',
      EsmPropertyAccess() =>
        '${_emitExpression(expression.receiver)}.${expression.property}',
      EsmComputedPropertyAccess() =>
        '${_emitExpression(expression.receiver)}[${_emitExpression(expression.property)}]',
      EsmOptionalPropertyAccess() =>
        '${_emitExpression(expression.receiver)}?.${expression.property}',
      EsmOptionalMethodCall() =>
        '${_emitExpression(expression.receiver)}?.${expression.property}(${expression.arguments.map(_emitExpression).join(', ')})',
      EsmThis() => 'this',
      EsmNewTarget() => 'new.target',
      EsmSuper() => 'super',
    };
  }

  String _emitBinaryExpression(EsmBinary expression) {
    final left = _emitBinaryOperand(
      expression.left,
      expression.operator,
      isRight: false,
    );
    final right = _emitBinaryOperand(
      expression.right,
      expression.operator,
      isRight: true,
    );
    return '$left ${_emitBinaryOperator(expression.operator)} $right';
  }

  String _emitBinaryOperand(
    EsmExpression operand,
    EsmBinaryOperator parentOperator, {
    required bool isRight,
  }) {
    final text = _emitExpression(operand);
    if (operand case EsmBinary(:final operator)) {
      final operandPrecedence = _binaryPrecedence(operator);
      final parentPrecedence = _binaryPrecedence(parentOperator);
      if (operandPrecedence < parentPrecedence ||
          (isRight &&
              operandPrecedence == parentPrecedence &&
              !_canFlattenRightBinary(parentOperator, operator))) {
        return '($text)';
      }
    }
    return text;
  }

  String _emitBinaryOperator(EsmBinaryOperator operator) {
    return switch (operator) {
      EsmBinaryOperator.multiply => '*',
      EsmBinaryOperator.divide => '/',
      EsmBinaryOperator.remainder => '%',
      EsmBinaryOperator.add => '+',
      EsmBinaryOperator.subtract => '-',
      EsmBinaryOperator.leftShift => '<<',
      EsmBinaryOperator.signedRightShift => '>>',
      EsmBinaryOperator.unsignedRightShift => '>>>',
      EsmBinaryOperator.lessThan => '<',
      EsmBinaryOperator.lessThanOrEqual => '<=',
      EsmBinaryOperator.greaterThan => '>',
      EsmBinaryOperator.greaterThanOrEqual => '>=',
      EsmBinaryOperator.instanceOf => 'instanceof',
      EsmBinaryOperator.inOperator => 'in',
      EsmBinaryOperator.looseEquals => '==',
      EsmBinaryOperator.looseNotEquals => '!=',
      EsmBinaryOperator.strictEquals => '===',
      EsmBinaryOperator.strictNotEquals => '!==',
      EsmBinaryOperator.bitAnd => '&',
      EsmBinaryOperator.bitXor => '^',
      EsmBinaryOperator.bitOr => '|',
      EsmBinaryOperator.logicalAnd => '&&',
      EsmBinaryOperator.logicalOr => '||',
    };
  }

  int _binaryPrecedence(EsmBinaryOperator operator) {
    return switch (operator) {
      EsmBinaryOperator.multiply ||
      EsmBinaryOperator.divide ||
      EsmBinaryOperator.remainder => 12,
      EsmBinaryOperator.add || EsmBinaryOperator.subtract => 11,
      EsmBinaryOperator.leftShift ||
      EsmBinaryOperator.signedRightShift ||
      EsmBinaryOperator.unsignedRightShift => 10,
      EsmBinaryOperator.lessThan ||
      EsmBinaryOperator.lessThanOrEqual ||
      EsmBinaryOperator.greaterThan ||
      EsmBinaryOperator.greaterThanOrEqual ||
      EsmBinaryOperator.instanceOf ||
      EsmBinaryOperator.inOperator => 9,
      EsmBinaryOperator.looseEquals ||
      EsmBinaryOperator.looseNotEquals ||
      EsmBinaryOperator.strictEquals ||
      EsmBinaryOperator.strictNotEquals => 8,
      EsmBinaryOperator.bitAnd => 7,
      EsmBinaryOperator.bitXor => 6,
      EsmBinaryOperator.bitOr => 5,
      EsmBinaryOperator.logicalAnd => 4,
      EsmBinaryOperator.logicalOr => 3,
    };
  }

  bool _canFlattenRightBinary(
    EsmBinaryOperator parentOperator,
    EsmBinaryOperator childOperator,
  ) {
    return parentOperator == childOperator &&
        (parentOperator == EsmBinaryOperator.multiply ||
            parentOperator == EsmBinaryOperator.logicalAnd ||
            parentOperator == EsmBinaryOperator.logicalOr ||
            parentOperator == EsmBinaryOperator.bitAnd ||
            parentOperator == EsmBinaryOperator.bitXor ||
            parentOperator == EsmBinaryOperator.bitOr);
  }

  String _emitUnaryExpression(EsmUnary expression) {
    final operand = _emitUnaryOperand(expression.operand);
    return switch (expression.operator) {
      EsmUnaryOperator.logicalNot => '!$operand',
      EsmUnaryOperator.negate => '-$operand',
      EsmUnaryOperator.bitNot => '~$operand',
      EsmUnaryOperator.typeOf => 'typeof $operand',
    };
  }

  String _emitCallCallee(EsmExpression expression) {
    return switch (expression) {
      EsmIdentifier() ||
      EsmImportMeta() ||
      EsmPropertyAccess() ||
      EsmComputedPropertyAccess() ||
      EsmOptionalPropertyAccess() ||
      EsmOptionalMethodCall() ||
      EsmCall() ||
      EsmNew() ||
      EsmThis() ||
      EsmSuper() ||
      EsmParenthesized() => _emitExpression(expression),
      _ => '(${_emitExpression(expression)})',
    };
  }

  String _emitUnaryOperand(EsmExpression expression) {
    return switch (expression) {
      EsmBinary() ||
      EsmAssignment() ||
      EsmConditional() => '(${_emitExpression(expression)})',
      _ => _emitExpression(expression),
    };
  }

  String _emitNullishOperand(EsmExpression expression) {
    return switch (expression) {
      EsmArrowFunction() ||
      EsmAssignment() ||
      EsmConditional() ||
      EsmNullishCoalesce() => '(${_emitExpression(expression)})',
      _ => _emitExpression(expression),
    };
  }

  String _emitObjectLiteralProperty(EsmObjectLiteralProperty property) {
    return '${_emitPropertyKey(property.key)}: ${_emitExpression(property.value)}';
  }

  String _emitPropertyKey(EsmPropertyKey key) {
    return switch (key) {
      EsmStaticPropertyKey() => _emitObjectPropertyName(key.value),
      EsmComputedPropertyKey() => '[${_emitExpression(key.expression)}]',
    };
  }

  String _emitFunctionExpression(EsmFunctionExpression expression) {
    final parameters = expression.parameters.map(_emitParameter).join(', ');
    if (expression.body.isEmpty) {
      return 'function($parameters) {}';
    }
    final bodyPrinter = _EsmPrinter().._indent = _indent + 1;
    for (final statement in expression.body) {
      bodyPrinter._emitStatement(statement);
    }
    final body = bodyPrinter._buffer.toString().trimRight();
    return 'function($parameters) {\n$body\n${'  ' * _indent}}';
  }

  String _emitArrowBlockFunction(EsmArrowBlockFunction expression) {
    final parameters = expression.parameters.map(_emitParameter).join(', ');
    if (expression.body.isEmpty) {
      return '($parameters) => {}';
    }
    final bodyPrinter = _EsmPrinter().._indent = _indent + 1;
    for (final statement in expression.body) {
      bodyPrinter._emitStatement(statement);
    }
    final body = bodyPrinter._buffer.toString().trimRight();
    return '($parameters) => {\n$body\n${'  ' * _indent}}';
  }

  String _emitObjectPropertyName(String name) {
    return RegExp(r'^[A-Za-z_$][\w$]*$').hasMatch(name)
        ? name
        : jsonEncode(name);
  }

  String _emitStringConcatenation(EsmStringConcatenation expression) {
    if (expression.expressions.isEmpty) {
      return '""';
    }
    final buffer = StringBuffer('`');
    for (final part in expression.expressions) {
      if (part case EsmStringLiteral()) {
        buffer.write(_escapeTemplateText(part.value));
      } else {
        buffer.write(r'${');
        buffer.write(_emitExpression(part));
        buffer.write('}');
      }
    }
    buffer.write('`');
    return buffer.toString();
  }
}
