import 'package:kernel/kernel.dart' as k;

import '../world/reachability.dart';
import 'program_roots.dart';

final class EsmProgramModel {
  const EsmProgramModel({
    required this.component,
    required this.main,
    required this.roots,
    required this.world,
    required this.orderedLibraries,
  });

  final k.Component component;
  final k.Procedure main;
  final EsmProgramRoots roots;
  final EsmProgramPlan world;
  final List<k.Library> orderedLibraries;

  Set<String> exportNamesFor(k.Library library) =>
      roots.exportNamesFor(library);
}

EsmProgramModel buildEsmProgramModel(k.Component component) {
  final main = component.mainMethod;
  if (main == null) {
    throw StateError(
      'Cannot build an ESM program model without a main method.',
    );
  }
  final roots = computeEsmProgramRoots(main);
  final world = computeEsmProgramPlan(
    component,
    main: main,
    exportNamesByLibrary: roots.exportNamesByLibrary,
    isEmittableTopLevelProcedure: isEmittableTopLevelProcedure,
  );
  return EsmProgramModel(
    component: component,
    main: main,
    roots: roots,
    world: world,
    orderedLibraries: orderLibrariesByDependencies(world.libraries),
  );
}
