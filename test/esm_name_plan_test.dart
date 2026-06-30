import 'package:dart2esm/src/module/class_runtime_plan.dart';
import 'package:dart2esm/src/module/esm_module_plan.dart';
import 'package:dart2esm/src/module/extension_type_member_plan.dart';
import 'package:dart2esm/src/names/esm_name_plan.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('predeclares module-level binding names', () {
    final libraryUri = Uri.parse('package:sample/main.dart');
    final library = k.Library(libraryUri, fileUri: libraryUri);
    final field = _field('value');
    final procedure = _procedure('value');
    final klass = k.Class(name: 'Value', fileUri: libraryUri);
    library.addField(field);
    library.addProcedure(procedure);
    library.addClass(klass);

    final names = EsmNamePlan.forModule(
      _module(
        library,
        classes: [EsmClassPlan(node: klass, export: false)],
        fields: [EsmFieldPlan(node: field, export: false)],
        procedures: [EsmProcedurePlan(node: procedure, export: false)],
      ),
      generatedGlobalNames: const {'value'},
    );

    expect(names.hasField(field), isTrue);
    expect(names.hasProcedure(procedure), isTrue);
    expect(names.hasClass(klass), isTrue);
    expect(names.fieldName(field).value, 'value_1');
    expect(names.className(klass), 'Value');
    expect(names.procedureName(procedure), 'value_2');
  });

  test('allocates and reuses local variable names in function scopes', () {
    final names = EsmNamePlan(generatedGlobalNames: const {'taken'});
    final variable = k.VariableDeclaration('taken');

    names.withFunctionScope(() {
      expect(names.declaredVariableName(variable), isNull);
      names.declareVariable(variable);
      expect(names.declaredVariableName(variable), 'taken_1');
      expect(names.variableName(variable), 'taken_1');
    });
  });

  test('tracks constructor tear-off names requested during emission', () {
    final klass = k.Class(
      name: 'Thing',
      fileUri: Uri.parse('package:sample/main.dart'),
    );
    final constructor = k.Constructor(
      k.FunctionNode(k.Block([])),
      name: k.Name(''),
      fileUri: Uri.parse('package:sample/main.dart'),
    );
    klass.addConstructor(constructor);
    final names = EsmNamePlan();

    expect(names.constructorTearOffTargets, isEmpty);
    expect(names.constructorTearOffName(constructor), r'$Thing_new_tearoff');
    expect(names.constructorTearOffTargets, [same(constructor)]);
    expect(names.constructorTearOffNameFor(constructor), r'$Thing_new_tearoff');
  });

  test(
    'tracks extension constructor tear-off names requested during emission',
    () {
      final procedure = _procedure('');
      final names = EsmNamePlan();

      expect(names.extensionConstructorTearOffTargets, isEmpty);
      expect(
        names.extensionConstructorTearOffName(
          procedure,
          extensionTypeName: 'Boxed',
          constructorName: '',
        ),
        r'$Boxed__tearoff',
      );
      expect(names.extensionConstructorTearOffTargets, [same(procedure)]);
      expect(names.constructorTearOffNameFor(procedure), r'$Boxed__tearoff');
    },
  );
}

EsmModulePlan _module(
  k.Library library, {
  List<EsmClassPlan> classes = const [],
  List<EsmFieldPlan> fields = const [],
  List<EsmProcedurePlan> procedures = const [],
}) {
  return EsmModulePlan(
    classes: classes,
    libraries: [
      EsmLibraryPlan(
        library: library,
        exportNames: const {},
        classes: classes,
        fields: fields,
        procedures: procedures,
        extensionTypes: const [],
      ),
    ],
    classRuntime: const EsmClassRuntimePlan(
      classes: {},
      jsInterfaceSuperclasses: {},
      interfaceMarkersByClass: {},
      interfaceBaseClasses: {},
    ),
    extensionTypeMembers: EsmExtensionTypeMemberIndex.empty,
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
