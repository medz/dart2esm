const reservedJsBindingNames = {
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
};

bool isJsIdentifierName(String value) {
  if (value.isEmpty) {
    return false;
  }
  final first = value.codeUnitAt(0);
  if (!isJsIdentifierStart(first)) {
    return false;
  }
  for (var i = 1; i < value.length; i++) {
    if (!isJsIdentifierPart(value.codeUnitAt(i))) {
      return false;
    }
  }
  return true;
}

bool isJsBindingIdentifier(String value) {
  return isJsIdentifierName(value) && !reservedJsBindingNames.contains(value);
}

bool isJsIdentifierStart(int codeUnit) {
  return codeUnit == 36 ||
      codeUnit == 95 ||
      codeUnit >= 65 && codeUnit <= 90 ||
      codeUnit >= 97 && codeUnit <= 122;
}

bool isJsIdentifierPart(int codeUnit) {
  return isJsIdentifierStart(codeUnit) || codeUnit >= 48 && codeUnit <= 57;
}

String sanitizeJsIdentifier(String value) {
  final buffer = StringBuffer();
  for (var i = 0; i < value.length; i++) {
    final code = value.codeUnitAt(i);
    if (i == 0 && code >= 48 && code <= 57) {
      buffer.write('_');
    }
    buffer.write(isJsIdentifierPart(code) ? value[i] : '_');
  }
  final sanitized = buffer.toString();
  return sanitized.isEmpty ? 'v' : sanitized;
}

final class JsNameAllocator {
  JsNameAllocator({Iterable<String> generatedGlobalNames = const []})
    : _generatedGlobalNames = Set.unmodifiable(generatedGlobalNames);

  final Set<String> _generatedGlobalNames;
  final _globalNames = <String>{};
  final _localScopes = <Set<String>>[];

  T withFunctionScope<T>(T Function() body) {
    _localScopes.add({..._globalNames, ..._generatedGlobalNames});
    try {
      return body();
    } finally {
      _localScopes.removeLast();
    }
  }

  String freshGlobal(String original) {
    return _freshNameIn(_globalNames, original, avoidActiveLocalScopes: true);
  }

  String freshLocal(String original) {
    if (_localScopes.isEmpty) {
      return freshGlobal(original);
    }
    return _freshNameIn(_localScopes.last, original);
  }

  String freshIn(Set<String> usedNames, String original) {
    return _freshNameIn(usedNames, original);
  }

  void reserveLocal(String name) {
    if (_localScopes.isNotEmpty) {
      _localScopes.last.add(name);
    }
  }

  String _freshNameIn(
    Set<String> usedNames,
    String original, {
    bool avoidActiveLocalScopes = false,
  }) {
    final sanitized = sanitizeJsIdentifier(original);
    var candidate = sanitized;
    var suffix = 0;
    while (reservedJsBindingNames.contains(candidate) ||
        _generatedGlobalNames.contains(candidate) ||
        usedNames.contains(candidate) ||
        avoidActiveLocalScopes &&
            _localScopes.any((scope) => scope.contains(candidate))) {
      suffix++;
      candidate = '${sanitized}_$suffix';
    }
    usedNames.add(candidate);
    return candidate;
  }
}
