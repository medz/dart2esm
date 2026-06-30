import 'package:dart2esm/src/js_ast/js_ast.dart';
import 'package:dart2esm/src/lowering/lowering.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('lowers Kernel main procedure into semantic entrypoint IR', () {
    final syncMain = _procedure('main', asyncMarker: k.AsyncMarker.Sync);
    final asyncMain = _procedure('asyncMain', asyncMarker: k.AsyncMarker.Async);

    expect(
      lowerKernelEntrypointInvocation(
        syncMain,
        procedureName: (procedure) => procedure.name.text,
      ),
      isA<EsmEntrypointInvocation>()
          .having((node) => node.targetName, 'targetName', 'main')
          .having((node) => node.awaitCompletion, 'awaitCompletion', isFalse),
    );
    expect(
      lowerKernelEntrypointInvocation(
        asyncMain,
        procedureName: (procedure) => procedure.name.text,
      ),
      isA<EsmEntrypointInvocation>()
          .having((node) => node.targetName, 'targetName', 'asyncMain')
          .having((node) => node.awaitCompletion, 'awaitCompletion', isTrue),
    );
  });

  test('lowers semantic entrypoint IR into JS calls', () {
    expect(
      generateJs(
        lowerSemanticStatementToJs(
          const EsmEntrypointInvocation(
            targetName: 'main',
            awaitCompletion: false,
          ),
        ),
      ),
      'main();\n',
    );
    expect(
      generateJs(
        lowerSemanticStatementToJs(
          const EsmEntrypointInvocation(
            targetName: 'main',
            awaitCompletion: true,
          ),
        ),
      ),
      'await main();\n',
    );
  });

  test('lowers semantic programs into JS programs', () {
    final program = lowerSemanticProgramToJs(
      const EsmSemanticProgram([
        EsmEntrypointInvocation(targetName: 'first', awaitCompletion: false),
        EsmEntrypointInvocation(targetName: 'second', awaitCompletion: true),
      ]),
    );

    expect(generateJs(program), 'first();\nawait second();\n');
  });
}

k.Procedure _procedure(String name, {required k.AsyncMarker asyncMarker}) {
  return k.Procedure(
    k.Name(name),
    k.ProcedureKind.Method,
    k.FunctionNode(k.Block([]), asyncMarker: asyncMarker),
    fileUri: Uri.parse('memory:main.dart'),
    isStatic: true,
  );
}
