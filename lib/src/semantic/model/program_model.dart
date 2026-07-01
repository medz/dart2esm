import 'package:kernel/kernel.dart' as k;

import 'esm_module_plan.dart';
import '../analysis/reachability.dart';
import 'program_roots.dart';

final class EsmProgramModel {
  const EsmProgramModel({
    required this.component,
    required this.main,
    required this.roots,
    required this.semantic,
    required this.orderedLibraries,
    required this.module,
  });

  final k.Component component;
  final k.Procedure main;
  final EsmProgramRoots roots;
  final EsmProgramPlan semantic;
  final List<k.Library> orderedLibraries;
  final EsmModulePlan module;
}

EsmProgramModel buildEsmProgramModel(k.Component component) {
  final main = component.mainMethod;
  if (main == null) {
    throw StateError(
      'Cannot build an ESM semantic model without a main method.',
    );
  }
  final roots = computeEsmProgramRoots(main);
  final semantic = computeEsmProgramPlan(
    component,
    main: main,
    exportNamesByLibrary: roots.exportNamesByLibrary,
    isEmittableTopLevelProcedure: isEmittableTopLevelProcedure,
  );
  final orderedLibraries = orderLibrariesByDependencies(semantic.libraries);
  return EsmProgramModel(
    component: component,
    main: main,
    roots: roots,
    semantic: semantic,
    orderedLibraries: orderedLibraries,
    module: buildEsmModulePlan(
      orderedLibraries: orderedLibraries,
      program: semantic,
      exportNamesByLibrary: roots.exportNamesByLibrary,
    ),
  );
}
