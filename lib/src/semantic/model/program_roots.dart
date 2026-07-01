import 'package:kernel/kernel.dart' as k;

typedef EmittableTopLevelProcedurePredicate =
    bool Function(k.Procedure procedure);

final class EsmProgramRoots {
  const EsmProgramRoots({
    required this.entryLibrary,
    required this.exportNamesByLibrary,
  });

  final k.Library entryLibrary;
  final Map<k.Library, Set<String>> exportNamesByLibrary;

  Set<String> exportNamesFor(k.Library library) {
    return exportNamesByLibrary[library] ?? const <String>{};
  }
}

EsmProgramRoots computeEsmProgramRoots(k.Procedure main) {
  final mainLibrary = main.enclosingLibrary;
  final localExports = _localExports(mainLibrary);
  final mainExportNames = _libraryDeclarationNames(mainLibrary).toSet();
  final exportNamesByLibrary = <k.Library, Set<String>>{
    mainLibrary: mainExportNames,
    ...localExports,
  };
  return EsmProgramRoots(
    entryLibrary: mainLibrary,
    exportNamesByLibrary: _unmodifiableExportMap(exportNamesByLibrary),
  );
}

List<k.Library> orderLibrariesByDependencies(Set<k.Library> libraries) {
  final pending = libraries.toList()..sort(_compareLibraries);
  final emitted = <k.Library>{};
  final visiting = <k.Library>{};
  final result = <k.Library>[];

  void visit(k.Library library) {
    if (emitted.contains(library)) {
      return;
    }
    if (!visiting.add(library)) {
      return;
    }
    final dependencies = <k.Library>{};
    for (final dependency in library.dependencies) {
      final target = dependencyTargetLibrary(dependency);
      if (target != null && libraries.contains(target)) {
        dependencies.add(target);
      }
    }
    final sortedDependencies = dependencies.toList()..sort(_compareLibraries);
    for (final dependency in sortedDependencies) {
      visit(dependency);
    }
    visiting.remove(library);
    emitted.add(library);
    result.add(library);
  }

  for (final library in pending) {
    visit(library);
  }
  return result;
}

k.Library? dependencyTargetLibrary(k.LibraryDependency dependency) {
  final node = dependency.importedLibraryReference.node;
  return node is k.Library ? node : null;
}

bool isEmittableTopLevelProcedure(k.Procedure procedure) {
  return !procedure.isExternal &&
      !procedure.isExtensionTypeMember &&
      (procedure.kind == k.ProcedureKind.Method ||
          procedure.kind == k.ProcedureKind.Getter ||
          procedure.kind == k.ProcedureKind.Setter);
}

Map<k.Library, Set<String>> _unmodifiableExportMap(
  Map<k.Library, Set<String>> exportNamesByLibrary,
) {
  return Map.unmodifiable({
    for (final entry in exportNamesByLibrary.entries)
      entry.key: Set.unmodifiable(entry.value),
  });
}

int _compareLibraries(k.Library left, k.Library right) {
  return _librarySortKey(left).compareTo(_librarySortKey(right));
}

String _librarySortKey(k.Library library) {
  return library.fileUri.toString();
}

Map<k.Library, Set<String>> _localExports(k.Library mainLibrary) {
  final exports = <k.Library, Set<String>>{};
  for (final dependency in mainLibrary.dependencies) {
    if (!dependency.isExport) {
      continue;
    }
    final target = dependencyTargetLibrary(dependency);
    if (target == null || target.importUri.scheme == 'dart') {
      continue;
    }
    final scope = _exportScope(target, <k.Library>{});
    for (final entry in scope.entries) {
      final names = _applyExportCombinators(
        entry.value,
        dependency.combinators,
      );
      if (names.isEmpty) {
        continue;
      }
      exports.putIfAbsent(entry.key, () => <String>{}).addAll(names);
    }
  }
  return exports;
}

Map<k.Library, Set<String>> _exportScope(
  k.Library library,
  Set<k.Library> visiting,
) {
  if (library.importUri.scheme == 'dart' || !visiting.add(library)) {
    return const <k.Library, Set<String>>{};
  }

  final scope = <k.Library, Set<String>>{
    library: _libraryDeclarationNames(library).toSet(),
  };
  for (final dependency in library.dependencies) {
    if (!dependency.isExport) {
      continue;
    }
    final target = dependencyTargetLibrary(dependency);
    if (target == null) {
      continue;
    }
    final targetScope = _exportScope(target, visiting);
    for (final entry in targetScope.entries) {
      final names = _applyExportCombinators(
        entry.value,
        dependency.combinators,
      );
      if (names.isEmpty) {
        continue;
      }
      scope.putIfAbsent(entry.key, () => <String>{}).addAll(names);
    }
  }
  visiting.remove(library);
  return scope;
}

Set<String> _applyExportCombinators(
  Iterable<String> names,
  List<k.Combinator> combinators,
) {
  var visible = names.toSet();
  for (final combinator in combinators) {
    if (combinator.isShow) {
      visible = visible.intersection(combinator.names.toSet());
    } else {
      visible.removeAll(combinator.names);
    }
  }
  return visible;
}

Iterable<String> _libraryDeclarationNames(k.Library library) sync* {
  for (final klass in library.classes) {
    if (_isPublicDeclarationName(klass.name)) {
      yield klass.name;
    }
  }
  for (final extensionType in library.extensionTypeDeclarations) {
    if (_isPublicDeclarationName(extensionType.name)) {
      yield extensionType.name;
    }
  }
  for (final field in library.fields) {
    if (!field.isExtensionTypeMember &&
        _isPublicDeclarationName(field.name.text)) {
      yield field.name.text;
    }
  }
  for (final procedure in library.procedures) {
    if (isEmittableTopLevelProcedure(procedure) &&
        procedure.kind != k.ProcedureKind.Setter &&
        _isPublicDeclarationName(procedure.name.text)) {
      yield procedure.name.text;
    }
  }
}

bool _isPublicDeclarationName(String name) {
  return !name.startsWith('_');
}
