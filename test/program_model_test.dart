import 'package:dart2esm/src/program/program_model.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('builds roots world and ordered libraries before emission', () {
    final libraryUri = Uri.parse('package:sample/main.dart');
    final library = k.Library(libraryUri, fileUri: libraryUri);
    final main = _procedure('main');
    final exported = _procedure('exported');
    library.addProcedure(main);
    library.addProcedure(exported);
    final component = k.Component(libraries: [library]);
    component.setMainMethodAndMode(main.reference, true);

    final model = buildEsmProgramModel(component);

    expect(model.component, same(component));
    expect(model.main, same(main));
    expect(model.roots.entryLibrary, same(library));
    expect(model.exportNamesFor(library), containsAll(['main', 'exported']));
    expect(model.world.libraries, contains(library));
    expect(model.world.topLevelProcedures, containsAll([main, exported]));
    expect(model.orderedLibraries, [library]);
  });

  test('requires a component main method', () {
    final component = k.Component();

    expect(() => buildEsmProgramModel(component), throwsStateError);
  });
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
