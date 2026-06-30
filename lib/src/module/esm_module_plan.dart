import 'package:kernel/kernel.dart' as k;

import '../program/program_roots.dart';
import '../world/reachability.dart';

final class EsmModulePlan {
  const EsmModulePlan({required this.classes, required this.libraries});

  final List<EsmClassPlan> classes;
  final List<EsmLibraryPlan> libraries;
}

final class EsmLibraryPlan {
  const EsmLibraryPlan({
    required this.library,
    required this.exportNames,
    required this.fields,
    required this.procedures,
    required this.extensionTypes,
  });

  final k.Library library;
  final Set<String> exportNames;
  final List<EsmFieldPlan> fields;
  final List<EsmProcedurePlan> procedures;
  final List<EsmExtensionTypePlan> extensionTypes;
}

final class EsmClassPlan {
  const EsmClassPlan({required this.node, required this.export});

  final k.Class node;
  final bool export;
}

final class EsmExtensionTypePlan {
  const EsmExtensionTypePlan({required this.node, required this.export});

  final k.ExtensionTypeDeclaration node;
  final bool export;
}

final class EsmFieldPlan {
  const EsmFieldPlan({required this.node, required this.export});

  final k.Field node;
  final bool export;
}

final class EsmProcedurePlan {
  const EsmProcedurePlan({required this.node, required this.export});

  final k.Procedure node;
  final bool export;
}

EsmModulePlan buildEsmModulePlan({
  required List<k.Library> orderedLibraries,
  required EsmProgramPlan world,
  required Map<k.Library, Set<String>> exportNamesByLibrary,
}) {
  return EsmModulePlan(
    classes: _classesInGlobalEmitOrder(orderedLibraries, world.classes)
        .map((klass) {
          final exportNames =
              exportNamesByLibrary[klass.enclosingLibrary] ?? const <String>{};
          return EsmClassPlan(
            node: klass,
            export: _shouldExport(klass.name, exportNames),
          );
        })
        .toList(growable: false),
    libraries: [
      for (final library in orderedLibraries)
        _buildLibraryPlan(
          library,
          world,
          exportNamesByLibrary[library] ?? const <String>{},
        ),
    ],
  );
}

EsmLibraryPlan _buildLibraryPlan(
  k.Library library,
  EsmProgramPlan world,
  Set<String> exportNames,
) {
  return EsmLibraryPlan(
    library: library,
    exportNames: Set.unmodifiable(exportNames),
    fields: [
      for (final field in library.fields)
        if (!field.isExtensionTypeMember &&
            world.topLevelFields.contains(field))
          EsmFieldPlan(
            node: field,
            export: _shouldExport(field.name.text, exportNames),
          ),
    ],
    procedures: [
      for (final procedure in library.procedures)
        if (world.topLevelProcedures.contains(procedure) &&
            isEmittableTopLevelProcedure(procedure))
          EsmProcedurePlan(
            node: procedure,
            export: _shouldExport(procedure.name.text, exportNames),
          ),
    ],
    extensionTypes: [
      for (final extensionType in library.extensionTypeDeclarations)
        if (world.extensionTypes.contains(extensionType))
          EsmExtensionTypePlan(
            node: extensionType,
            export: _shouldExport(extensionType.name, exportNames),
          ),
    ],
  );
}

bool _shouldExport(String name, Set<String> exportNames) {
  return exportNames.contains(name);
}

List<k.Class> _classesInGlobalEmitOrder(
  List<k.Library> libraries,
  Set<k.Class> classes,
) {
  final emitted = <k.Class>{};
  final visiting = <k.Class>{};
  final result = <k.Class>[];

  void visit(k.Class klass) {
    if (emitted.contains(klass)) {
      return;
    }
    if (!visiting.add(klass)) {
      throw EsmModulePlanError(klass, 'cyclic class hierarchy');
    }
    void visitSupertype(k.Supertype? supertype) {
      final superclass = _localClassFromSupertype(supertype, classes);
      if (superclass != null) {
        visit(superclass);
      }
    }

    visitSupertype(klass.supertype);
    visitSupertype(klass.mixedInType);
    for (final supertype in klass.implementedTypes) {
      visitSupertype(supertype);
    }
    visiting.remove(klass);
    emitted.add(klass);
    result.add(klass);
  }

  for (final library in libraries) {
    for (final klass in library.classes) {
      if (classes.contains(klass)) {
        visit(klass);
      }
    }
  }
  return result;
}

k.Class? _localClassFromSupertype(
  k.Supertype? supertype,
  Set<k.Class> localClasses,
) {
  if (supertype == null || _isCoreClass(supertype.className, 'Object')) {
    return null;
  }
  if (_referencePath(supertype.className).startsWith('dart:')) {
    return null;
  }
  final klass = supertype.classNode;
  return localClasses.contains(klass) ? klass : null;
}

bool _isCoreClass(k.Reference reference, String name) {
  final node = reference.node;
  return node is k.Class &&
      node.name == name &&
      node.enclosingLibrary.importUri.toString() == 'dart:core';
}

String _referencePath(k.Reference reference) {
  return reference.canonicalName?.toStringInternal() ??
      reference.node?.toStringInternal() ??
      '<unbound>';
}

final class EsmModulePlanError implements Exception {
  const EsmModulePlanError(this.node, this.context);

  final Object node;
  final String context;

  @override
  String toString() => 'Cannot build ESM module plan for $context: $node';
}
