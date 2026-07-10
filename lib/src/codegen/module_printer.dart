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
    final output = StringBuffer();
    var index = 0;
    int? previousOutput;
    String? previousWord;
    while (index < source.length) {
      final codeUnit = source.codeUnitAt(index);
      if (_isRawWhitespace(codeUnit)) {
        var next = index + 1;
        while (next < source.length &&
            _isRawWhitespace(source.codeUnitAt(next))) {
          next++;
        }
        if (previousOutput != null &&
            next < source.length &&
            _rawTokensNeedSpace(previousOutput, source.codeUnitAt(next))) {
          output.write(' ');
          previousOutput = 0x20;
        }
        index = next;
        continue;
      }
      if (codeUnit == 0x22 || codeUnit == 0x27 || codeUnit == 0x60) {
        index = _copyRawQuoted(source, index, output, codeUnit);
        previousOutput = source.codeUnitAt(index - 1);
        previousWord = null;
        continue;
      }
      if (codeUnit == 0x2f && index + 1 < source.length) {
        final next = source.codeUnitAt(index + 1);
        if (next == 0x2f) {
          index += 2;
          while (index < source.length && source.codeUnitAt(index) != 0x0a) {
            index++;
          }
          continue;
        }
        if (next == 0x2a) {
          index += 2;
          while (index + 1 < source.length &&
              !(source.codeUnitAt(index) == 0x2a &&
                  source.codeUnitAt(index + 1) == 0x2f)) {
            index++;
          }
          index = index + 1 < source.length ? index + 2 : source.length;
          continue;
        }
        if (_rawCanStartRegex(previousOutput, previousWord)) {
          index = _copyRawRegex(source, index, output);
          previousOutput = source.codeUnitAt(index - 1);
          previousWord = null;
          continue;
        }
      }
      if (_isRawIdentifierPart(codeUnit)) {
        var next = index + 1;
        while (next < source.length &&
            _isRawIdentifierPart(source.codeUnitAt(next))) {
          next++;
        }
        previousWord = source.substring(index, next);
        output.write(previousWord);
        previousOutput = source.codeUnitAt(next - 1);
        index = next;
        continue;
      }
      output.writeCharCode(codeUnit);
      previousOutput = codeUnit;
      previousWord = null;
      index++;
    }
    return output.toString().trim();
  }

  int _copyRawQuoted(String source, int start, StringBuffer output, int quote) {
    var index = start;
    while (index < source.length) {
      final codeUnit = source.codeUnitAt(index);
      output.writeCharCode(codeUnit);
      index++;
      if (codeUnit == 0x5c && index < source.length) {
        output.writeCharCode(source.codeUnitAt(index));
        index++;
        continue;
      }
      if (index > start + 1 && codeUnit == quote) break;
    }
    return index;
  }

  int _copyRawRegex(String source, int start, StringBuffer output) {
    var index = start;
    var inCharacterClass = false;
    while (index < source.length) {
      final codeUnit = source.codeUnitAt(index);
      output.writeCharCode(codeUnit);
      index++;
      if (codeUnit == 0x5c && index < source.length) {
        output.writeCharCode(source.codeUnitAt(index));
        index++;
        continue;
      }
      if (codeUnit == 0x5b) {
        inCharacterClass = true;
      } else if (codeUnit == 0x5d) {
        inCharacterClass = false;
      } else if (index > start + 1 && codeUnit == 0x2f && !inCharacterClass) {
        while (index < source.length &&
            _isRawIdentifierPart(source.codeUnitAt(index))) {
          output.writeCharCode(source.codeUnitAt(index));
          index++;
        }
        break;
      }
    }
    return index;
  }

  bool _rawCanStartRegex(int? previous, String? previousWord) {
    if (previous == null ||
        previous == 0x28 ||
        previous == 0x5b ||
        previous == 0x7b ||
        previous == 0x3d ||
        previous == 0x2c ||
        previous == 0x3a ||
        previous == 0x3b ||
        previous == 0x21 ||
        previous == 0x3f ||
        previous == 0x26 ||
        previous == 0x7c ||
        previous == 0x2b ||
        previous == 0x2d ||
        previous == 0x2a ||
        previous == 0x25 ||
        previous == 0x5e ||
        previous == 0x7e ||
        previous == 0x3c ||
        previous == 0x3e) {
      return true;
    }

    return switch (previousWord) {
      'await' ||
      'case' ||
      'delete' ||
      'do' ||
      'else' ||
      'in' ||
      'instanceof' ||
      'of' ||
      'return' ||
      'throw' ||
      'typeof' ||
      'void' ||
      'yield' => true,
      _ => false,
    };
  }

  bool _rawTokensNeedSpace(int previous, int next) {
    return _isRawIdentifierPart(previous) && _isRawIdentifierPart(next) ||
        previous == 0x2b && next == 0x2b ||
        previous == 0x2d && next == 0x2d ||
        previous == 0x2f && (next == 0x2f || next == 0x2a) ||
        previous >= 0x30 && previous <= 0x39 && next == 0x2e;
  }

  bool _isRawIdentifierPart(int codeUnit) {
    return codeUnit == 0x24 ||
        codeUnit == 0x5f ||
        codeUnit >= 0x30 && codeUnit <= 0x39 ||
        codeUnit >= 0x41 && codeUnit <= 0x5a ||
        codeUnit >= 0x61 && codeUnit <= 0x7a;
  }

  bool _isRawWhitespace(int codeUnit) {
    return codeUnit == 0x20 ||
        codeUnit == 0x09 ||
        codeUnit == 0x0a ||
        codeUnit == 0x0d;
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
