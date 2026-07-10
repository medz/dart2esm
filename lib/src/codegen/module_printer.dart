part of 'esm_codegen.dart';

extension _ModulePrinter on _EsmPrinter {
  bool _needsBlankLineBetween(EsmModuleItem current, EsmModuleItem next) {
    if (_isRawImport(current) && _isRawImport(next)) return false;
    return current is EsmRawModuleItem ||
        current is EsmClass ||
        current is EsmFunction;
  }

  bool _isRawImport(EsmModuleItem item) {
    return item is EsmRawModuleItem &&
        item.source.trimLeft().startsWith('import ');
  }

  void _emitModuleItem(EsmModuleItem item) {
    switch (item) {
      case EsmRawModuleItem():
        _writeIndented(
          compact ? _compactRawSource(item.source) : item.source.trimRight(),
        );
      case EsmClass():
        _emitClass(item);
      case EsmFunction():
        _emitFunction(item);
      case EsmStatement():
        _emitStatement(item);
    }
  }

  String _compactRawSource(String source) {
    return source
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .join('\n');
  }

  void _emitClass(EsmClass klass) {
    final exportPrefix = klass.export ? 'export ' : '';
    final superclass = klass.superclass == null
        ? ''
        : ' extends ${_emitExpression(klass.superclass!)}';
    _writeIndented('${exportPrefix}class ${klass.name}$superclass$_bodyOpen');
    _indent++;
    final constructor = klass.constructor;
    if (constructor != null) {
      _writeIndented(
        'constructor(${constructor.parameters.map(_emitParameter).join(_comma)})$_bodyOpen',
      );
      _indent++;
      for (final statement in constructor.body) {
        _emitStatement(statement);
      }
      _indent--;
      _writeIndented('}');
    }
    for (final method in klass.methods) {
      _emitClassMethod(method);
    }
    _indent--;
    _writeIndented('}');
  }

  void _emitClassMethod(EsmClassMethod method) {
    final staticPrefix = method.isStatic ? 'static ' : '';
    final asyncPrefix = method.isAsync ? 'async ' : '';
    final generatorMarker = method.isGenerator ? '*' : '';
    final prefix = switch (method.kind) {
      EsmClassMethodKind.method => '',
      EsmClassMethodKind.getter => 'get ',
      EsmClassMethodKind.setter => 'set ',
    };
    _writeIndented(
      '$staticPrefix$asyncPrefix$prefix$generatorMarker${_emitPropertyKey(method.key)}(${method.parameters.map(_emitParameter).join(_comma)})$_bodyOpen',
    );
    _indent++;
    for (final statement in method.body) {
      _emitStatement(statement);
    }
    _indent--;
    _writeIndented('}');
  }

  void _emitFunction(EsmFunction function) {
    final exportPrefix = function.export ? 'export ' : '';
    final asyncPrefix = function.isAsync ? 'async ' : '';
    final generatorMarker = function.isGenerator ? '*' : '';
    _writeIndented(
      '${exportPrefix}${asyncPrefix}function$generatorMarker ${function.name}(${function.parameters.map(_emitParameter).join(_comma)})$_bodyOpen',
    );
    _indent++;
    for (final statement in function.body) {
      _emitStatement(statement);
    }
    _indent--;
    _writeIndented('}');
  }
}
