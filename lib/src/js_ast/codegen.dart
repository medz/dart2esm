import 'dart:convert';

import 'ast.dart';

String generateJs(JsNode node) => _JsCodeGenerator().generate(node);

final class _JsCodeGenerator {
  final _buffer = StringBuffer();
  var _indent = 0;

  String generate(JsNode node) {
    switch (node) {
      case JsProgram():
        _emitProgram(node);
      case JsStatement():
        _emitStatement(node);
      case JsExpression():
        _buffer.write(_emitExpression(node));
      case JsObjectProperty():
        _buffer.write(_emitObjectProperty(node));
    }
    return _buffer.toString();
  }

  void _emitProgram(JsProgram program) {
    for (final statement in program.body) {
      _emitStatement(statement);
    }
  }

  void _emitStatement(JsStatement statement) {
    switch (statement) {
      case JsExpressionStatement():
        _writeIndented('${_emitExpression(statement.expression)};');
    }
  }

  String _emitExpression(JsExpression expression) {
    return switch (expression) {
      JsIdentifier() => expression.name,
      JsStringLiteral() => jsonEncode(expression.value),
      JsNumberLiteral() => _emitNumberLiteral(expression.value),
      JsBooleanLiteral() => expression.value ? 'true' : 'false',
      JsNullLiteral() => 'null',
      JsArrayExpression() =>
        '[${expression.elements.map(_emitExpression).join(', ')}]',
      JsObjectExpression() => _emitObjectExpression(expression),
      JsCallExpression() => _emitCallExpression(expression),
      JsAwaitExpression() => 'await ${_emitExpression(expression.expression)}',
    };
  }

  String _emitCallExpression(JsCallExpression expression) {
    return '${_emitExpression(expression.callee)}(${expression.arguments.map(_emitExpression).join(', ')})';
  }

  String _emitObjectExpression(JsObjectExpression expression) {
    if (expression.properties.isEmpty) {
      return '{}';
    }
    return '{ ${expression.properties.map(_emitObjectProperty).join(', ')} }';
  }

  String _emitObjectProperty(JsObjectProperty property) {
    final key = _isIdentifierName(property.key)
        ? property.key
        : jsonEncode(property.key);
    return '$key: ${_emitExpression(property.value)}';
  }

  String _emitNumberLiteral(num value) {
    if (value.isNaN) {
      return 'NaN';
    }
    if (value == double.infinity) {
      return 'Infinity';
    }
    if (value == double.negativeInfinity) {
      return '-Infinity';
    }
    return value.toString();
  }

  void _writeIndented(String line) {
    _buffer.write('  ' * _indent);
    _buffer.writeln(line);
  }
}

bool _isIdentifierName(String value) {
  if (value.isEmpty) {
    return false;
  }
  final first = value.codeUnitAt(0);
  if (!_isIdentifierStart(first)) {
    return false;
  }
  for (var i = 1; i < value.length; i++) {
    if (!_isIdentifierPart(value.codeUnitAt(i))) {
      return false;
    }
  }
  return true;
}

bool _isIdentifierStart(int codeUnit) {
  return codeUnit == 36 ||
      codeUnit == 95 ||
      codeUnit >= 65 && codeUnit <= 90 ||
      codeUnit >= 97 && codeUnit <= 122;
}

bool _isIdentifierPart(int codeUnit) {
  return _isIdentifierStart(codeUnit) || codeUnit >= 48 && codeUnit <= 57;
}
