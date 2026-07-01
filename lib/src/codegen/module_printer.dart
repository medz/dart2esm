part of 'esm_codegen.dart';

extension _ModulePrinter on _EsmPrinter {
  bool _needsBlankLineAfter(EsmModuleItem item) {
    return item is EsmRawModuleItem || item is EsmClass || item is EsmFunction;
  }

  void _emitModuleItem(EsmModuleItem item) {
    switch (item) {
      case EsmRawModuleItem():
        _writeIndented(item.source.trimRight());
      case EsmClass():
        _emitClass(item);
      case EsmFunction():
        _emitFunction(item);
      case EsmStatement():
        _emitStatement(item);
    }
  }

  void _emitClass(EsmClass klass) {
    final exportPrefix = klass.export ? 'export ' : '';
    final superclass = klass.superclass == null
        ? ''
        : ' extends ${_emitExpression(klass.superclass!)}';
    _writeIndented('${exportPrefix}class ${klass.name}$superclass {');
    _indent++;
    final constructor = klass.constructor;
    if (constructor != null) {
      _writeIndented(
        'constructor(${constructor.parameters.map(_emitParameter).join(', ')}) {',
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
    final prefix = switch (method.kind) {
      EsmClassMethodKind.method => '',
      EsmClassMethodKind.getter => 'get ',
      EsmClassMethodKind.setter => 'set ',
    };
    _writeIndented(
      '$staticPrefix$prefix${_emitPropertyKey(method.key)}(${method.parameters.map(_emitParameter).join(', ')}) {',
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
    _writeIndented(
      '${exportPrefix}function ${function.name}(${function.parameters.map(_emitParameter).join(', ')}) {',
    );
    _indent++;
    for (final statement in function.body) {
      _emitStatement(statement);
    }
    _indent--;
    _writeIndented('}');
  }
}
