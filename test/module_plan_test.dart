import 'package:dart2esm/src/module/esm_module_plan.dart';
import 'package:dart2esm/src/world/reachability.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('plans reachable declarations and ESM exports per library', () {
    final libraryUri = Uri.parse('package:sample/main.dart');
    final library = k.Library(libraryUri, fileUri: libraryUri);
    final hiddenField = _field('hiddenField');
    final exportedField = _field('exportedField');
    final hiddenProcedure = _procedure('hiddenProcedure');
    final exportedProcedure = _procedure('exportedProcedure');
    library.addField(hiddenField);
    library.addField(exportedField);
    library.addProcedure(hiddenProcedure);
    library.addProcedure(exportedProcedure);

    final world = EsmProgramPlan(
      libraries: {library},
      classes: const {},
      extensionTypes: const {},
      topLevelFields: {hiddenField, exportedField},
      topLevelProcedures: {hiddenProcedure, exportedProcedure},
    );

    final plan = buildEsmModulePlan(
      orderedLibraries: [library],
      world: world,
      exportNamesByLibrary: {
        library: {'exportedField', 'exportedProcedure'},
      },
    );

    expect(plan.libraries, hasLength(1));
    final libraryPlan = plan.libraries.single;
    expect(libraryPlan.fields.map((field) => field.node), [
      hiddenField,
      exportedField,
    ]);
    expect(libraryPlan.fields.map((field) => field.export), [isFalse, isTrue]);
    expect(libraryPlan.procedures.map((procedure) => procedure.node), [
      hiddenProcedure,
      exportedProcedure,
    ]);
    expect(libraryPlan.procedures.map((procedure) => procedure.export), [
      isFalse,
      isTrue,
    ]);
  });

  test('orders classes before dependent classes', () {
    final libraryUri = Uri.parse('package:sample/main.dart');
    final library = k.Library(libraryUri, fileUri: libraryUri);
    final base = k.Class(name: 'Base', fileUri: libraryUri);
    final derived = k.Class(
      name: 'Derived',
      supertype: k.Supertype(base, const []),
      fileUri: libraryUri,
    );
    library.addClass(derived);
    library.addClass(base);

    final world = EsmProgramPlan(
      libraries: {library},
      classes: {derived, base},
      extensionTypes: const {},
      topLevelFields: const {},
      topLevelProcedures: const {},
    );

    final plan = buildEsmModulePlan(
      orderedLibraries: [library],
      world: world,
      exportNamesByLibrary: {
        library: {'Derived'},
      },
    );

    expect(plan.classes.map((klass) => klass.node), [base, derived]);
    expect(plan.classes.map((klass) => klass.export), [isFalse, isTrue]);
    expect(plan.libraries.single.classes.map((klass) => klass.node), [
      derived,
      base,
    ]);
    expect(plan.libraries.single.classes.map((klass) => klass.export), [
      isTrue,
      isFalse,
    ]);
  });

  test(
    'plans class runtime interface markers and mixin superclass fallback',
    () {
      final libraryUri = Uri.parse('package:sample/main.dart');
      final library = k.Library(libraryUri, fileUri: libraryUri);
      final inheritedInterface = k.Class(
        name: 'InheritedInterface',
        fileUri: libraryUri,
      );
      final interface = k.Class(
        name: 'Interface',
        implementedTypes: [k.Supertype(inheritedInterface, const [])],
        fileUri: libraryUri,
      );
      final implementer = k.Class(
        name: 'Implementer',
        implementedTypes: [k.Supertype(interface, const [])],
        fileUri: libraryUri,
      );
      final mixinBase = k.Class(name: 'MixinBase', fileUri: libraryUri);
      final mixinApplication = k.Class(
        name: 'MixinApplication',
        mixedInType: k.Supertype(mixinBase, const []),
        fileUri: libraryUri,
      );
      library.addClass(inheritedInterface);
      library.addClass(interface);
      library.addClass(implementer);
      library.addClass(mixinBase);
      library.addClass(mixinApplication);

      final world = EsmProgramPlan(
        libraries: {library},
        classes: {
          inheritedInterface,
          interface,
          implementer,
          mixinBase,
          mixinApplication,
        },
        extensionTypes: const {},
        topLevelFields: const {},
        topLevelProcedures: const {},
      );

      final plan = buildEsmModulePlan(
        orderedLibraries: [library],
        world: world,
        exportNamesByLibrary: const {},
      );

      expect(
        plan.classRuntime.interfaceMarkersFor(implementer),
        containsAll([interface, inheritedInterface]),
      );
      expect(plan.classRuntime.interfaceBaseClasses, contains(interface));
      expect(
        plan.classRuntime.interfaceBaseClasses,
        contains(inheritedInterface),
      );
      expect(
        plan.classRuntime.jsInterfaceSuperclassFor(mixinApplication),
        same(mixinBase),
      );
    },
  );
}

k.Field _field(String name) {
  return k.Field.immutable(
    k.Name(name),
    isStatic: true,
    fileUri: Uri.parse('memory:$name.dart'),
  );
}

k.Procedure _procedure(String name) {
  return k.Procedure(
    k.Name(name),
    k.ProcedureKind.Method,
    k.FunctionNode(k.Block([])),
    fileUri: Uri.parse('memory:$name.dart'),
    isStatic: true,
  );
}
