import '../../ast/esm_ast.dart';
import '../../ast/esm_references.dart';

final class RuntimeHelperLinker {
  const RuntimeHelperLinker();

  Set<String> declarationNames(Iterable<EsmModuleItem> declarations) {
    return {
      for (final item in declarations)
        for (final declaration in _split(item)) ...declaration.names,
    };
  }

  List<EsmModuleItem> link({
    required EsmModule module,
    required Iterable<EsmModuleItem> declarations,
    Set<String> knownRuntimeNames = const {},
  }) {
    final catalog = <String, _RuntimeDeclaration>{};
    final ordered = <_RuntimeDeclaration>[];
    for (final item in declarations) {
      for (final declaration in _split(item)) {
        ordered.add(declaration);
        for (final name in declaration.names) {
          final previous = catalog[name];
          if (previous != null && !identical(previous, declaration)) {
            throw StateError('Duplicate runtime helper declaration: $name');
          }
          catalog[name] = declaration;
        }
      }
    }

    final roots = collectEsmIdentifierReferences(module);
    final missingRoots = roots
        .where(knownRuntimeNames.contains)
        .where((name) => !catalog.containsKey(name))
        .toList(growable: false);
    if (missingRoots.isNotEmpty) {
      throw StateError(
        'Runtime helpers were referenced without being required: '
        '${missingRoots.join(', ')}',
      );
    }
    final pending = <String>[
      for (final name in roots)
        if (catalog.containsKey(name)) name,
    ];
    final included = <_RuntimeDeclaration>{};
    for (var index = 0; index < pending.length; index++) {
      final declaration = catalog[pending[index]];
      if (declaration == null || !included.add(declaration)) continue;
      for (final dependency in declaration.dependencies) {
        if (catalog.containsKey(dependency)) {
          pending.add(dependency);
        } else if (knownRuntimeNames.contains(dependency)) {
          throw StateError(
            'Runtime helper ${declaration.names.join(', ')} requires '
            '$dependency, but its helper group was not linked',
          );
        }
      }
    }
    final retained = [
      for (final declaration in ordered)
        if (included.contains(declaration)) declaration.item,
    ];
    return [
      for (final item in retained)
        if (_isImport(item)) item,
      for (final item in retained)
        if (!_isImport(item)) item,
    ];
  }

  Iterable<_RuntimeDeclaration> _split(EsmModuleItem item) sync* {
    switch (item) {
      case EsmRawModuleItem():
        final matches = _rawDeclarationPattern.allMatches(item.source).toList();
        if (matches.isEmpty) {
          throw StateError('Runtime helper source has no declaration');
        }
        final prefix = item.source.substring(0, matches.first.start).trim();
        if (prefix.isNotEmpty) {
          throw StateError(
            'Runtime helper source starts with non-declaration code',
          );
        }
        for (var index = 0; index < matches.length; index++) {
          final match = matches[index];
          final source = item.source
              .substring(
                match.start,
                index + 1 == matches.length
                    ? item.source.length
                    : matches[index + 1].start,
              )
              .trimRight();
          final names = {
            for (final name in [match.group(1), match.group(2)])
              if (name != null) name,
          };
          yield _RuntimeDeclaration(
            names: names,
            item: EsmRawModuleItem('$source\n'),
            dependencies: _rawReferences(source).difference(names),
          );
        }
      case EsmFunction():
        final names = {item.name};
        yield _RuntimeDeclaration(
          names: names,
          item: item,
          dependencies: collectEsmIdentifierReferences(
            EsmModule(items: [item]),
          ).difference(names),
        );
      default:
        throw StateError(
          'Unsupported runtime helper declaration: ${item.runtimeType}',
        );
    }
  }
}

bool _isImport(EsmModuleItem item) {
  return item is EsmRawModuleItem &&
      item.source.trimLeft().startsWith('import ');
}

final class _RuntimeDeclaration {
  const _RuntimeDeclaration({
    required this.names,
    required this.item,
    required this.dependencies,
  });

  final Set<String> names;
  final EsmModuleItem item;
  final Set<String> dependencies;
}

Set<String> _rawReferences(String source) {
  return {
    for (final match in _runtimeIdentifierPattern.allMatches(source))
      if (_isIdentifierReference(source, match)) match.group(0)!,
  };
}

bool _isIdentifierReference(String source, RegExpMatch match) {
  if (match.start > 0) {
    final previous = source[match.start - 1];
    if (previous == '.' || previous == '"' || previous == "'") return false;
  }
  var next = match.end;
  while (next < source.length && _isWhitespace(source.codeUnitAt(next))) {
    next++;
  }
  return next >= source.length || source[next] != ':';
}

bool _isWhitespace(int codeUnit) {
  return codeUnit == 0x20 ||
      codeUnit == 0x09 ||
      codeUnit == 0x0a ||
      codeUnit == 0x0d;
}

final _rawDeclarationPattern = RegExp(
  r'^(?:(?:async\s+)?function\*?\s+|(?:const|let|var|class)\s+)(__dart[A-Za-z0-9_$]*)\b|^import\s+\*\s+as\s+(__dart[A-Za-z0-9_$]*)\b',
  multiLine: true,
);

final _runtimeIdentifierPattern = RegExp(r'\b__dart[A-Za-z0-9_$]*\b');
