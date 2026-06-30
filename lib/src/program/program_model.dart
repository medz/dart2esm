import 'package:kernel/kernel.dart' as k;

import '../module/esm_module_plan.dart';
import '../world/reachability.dart';
import 'program_roots.dart';

final class EsmProgramModel {
  const EsmProgramModel({
    required this.component,
    required this.main,
    required this.roots,
    required this.world,
    required this.orderedLibraries,
    required this.module,
  });

  final k.Component component;
  final k.Procedure main;
  final EsmProgramRoots roots;
  final EsmProgramPlan world;
  final List<k.Library> orderedLibraries;
  final EsmModulePlan module;
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
  final orderedLibraries = orderLibrariesByDependencies(world.libraries);
  return EsmProgramModel(
    component: component,
    main: main,
    roots: roots,
    world: world,
    orderedLibraries: orderedLibraries,
    module: buildEsmModulePlan(
      orderedLibraries: orderedLibraries,
      world: world,
      exportNamesByLibrary: roots.exportNamesByLibrary,
    ),
  );
}
