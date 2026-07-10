import 'package:dart2esm/src/ast/esm_ast.dart';
import 'package:dart2esm/src/codegen/esm_codegen.dart';
import 'package:dart2esm/src/foundation/diagnostics/unsupported_compiler_feature.dart';
import 'package:dart2esm/src/lowering/kernel_to_esm_ast.dart';
import 'package:dart2esm/src/options.dart';
import 'package:dart2esm/src/parser/kernel_parser.dart';
import 'package:dart2esm/src/semantic/semantic.dart';
import 'package:dart2esm/src/semantic/semantic_builder.dart';
import 'package:dart2esm/src/transformer/helpers/runtime_helpers.dart';
import 'package:dart2esm/src/transformer/helpers/helper_loader.dart';
import 'package:dart2esm/src/transformer/module_transformer.dart';
import 'package:dart2esm/src/transformer/transform_pass.dart';
import 'package:dart2esm/src/third_party/kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('transformer runs passes in order and merges pass results', () {
    const input = EsmModule(
      items: [EsmExpressionStatement(EsmStringLiteral('input'))],
    );
    final log = <String>[];
    final transformer = Transformer(
      passes: [
        _RecordingPass(
          name: 'first',
          log: log,
          append: const EsmExpressionStatement(EsmStringLiteral('first')),
        ),
        _RecordingPass(
          name: 'second',
          log: log,
          linkedHelpers: const [EsmRuntimeHelper.print],
        ),
      ],
    );

    final result = transformer.transform(
      _loweringForModule(input, runtimeHelpers: const [EsmRuntimeHelper.print]),
    );

    expect(log, ['first:1:1', 'second:2:1']);
    expect(result.linkedHelpers, [EsmRuntimeHelper.print]);
    expect(result.module.items, hasLength(2));
  });

  test('default transformer normalizes module AST and loads helpers', () {
    const input = EsmModule(
      items: [
        EsmFunction(
          name: 'main',
          export: true,
          parameters: [],
          body: [
            EsmBlockStatement([]),
            EsmExpressionStatement(
              EsmCall(
                callee: EsmIdentifier('__dartPrint'),
                arguments: [EsmStringLiteral('ok')],
              ),
            ),
          ],
        ),
      ],
    );

    final result = const Transformer().transform(
      _loweringForModule(input, runtimeHelpers: const [EsmRuntimeHelper.print]),
    );

    expect(result.linkedHelpers, [
      EsmRuntimeHelper.print,
      EsmRuntimeHelper.stringify,
    ]);
    expect(result.module.items, hasLength(3));
    expect((result.module.items.first as EsmFunction).name, '__dartPrint');
    final main = result.module.items.last as EsmFunction;
    expect(main.name, 'main');
    expect(main.body, hasLength(1));
    expect(main.body.single, isA<EsmExpressionStatement>());
  });

  test('helper linker emits only symbol-reachable declarations', () {
    const module = EsmModule(
      items: [
        EsmExpressionStatement(
          EsmCall(
            callee: EsmIdentifier('__dartMapRemove'),
            arguments: [EsmIdentifier('map'), EsmIdentifier('key')],
          ),
        ),
      ],
    );

    final linked = const HelperLoader().load(
      module: module,
      helpers: const [EsmRuntimeHelper.mapOps],
    );
    final code = const Codegen().generate(linked.module).code;

    expect(code, contains('function __dartMapRemove('));
    expect(code, contains('function __dartMapKey('));
    expect(code, isNot(contains('function __dartMapUpdate(')));
    expect(code, isNot(contains('function __dartMapClear(')));
  });

  test('helper linker rejects runtime symbols without a required group', () {
    const module = EsmModule(
      items: [EsmExpressionStatement(EsmIdentifier('__dartMapRemove'))],
    );

    expect(
      () => const HelperLoader().load(module: module, helpers: const []),
      throwsStateError,
    );
  });

  test('dart:io helpers enforce web and Node platform boundaries', () {
    final browser = EsmRuntimeHelperUseSet(platform: Dart2EsmPlatform.browser);
    expect(browser.add(EsmRuntimeHelper.ioWeb), isTrue);
    expect(
      () => browser.add(EsmRuntimeHelper.ioNode),
      throwsA(isA<UnsupportedCompilerFeature>()),
    );

    final node = EsmRuntimeHelperUseSet(platform: Dart2EsmPlatform.node);
    expect(node.add(EsmRuntimeHelper.ioWeb), isTrue);
    expect(node.add(EsmRuntimeHelper.ioNode), isTrue);

    final neutral = EsmRuntimeHelperUseSet(platform: Dart2EsmPlatform.neutral);
    expect(
      () => neutral.add(EsmRuntimeHelper.ioWeb),
      throwsA(isA<UnsupportedCompilerFeature>()),
    );
  });

  test('dart:isolate helpers enforce Worker platform boundaries', () {
    final browser = EsmRuntimeHelperUseSet(platform: Dart2EsmPlatform.browser);
    expect(browser.add(EsmRuntimeHelper.isolateWeb), isTrue);
    expect(
      () => browser.add(EsmRuntimeHelper.isolateNode),
      throwsA(isA<UnsupportedCompilerFeature>()),
    );

    final node = EsmRuntimeHelperUseSet(platform: Dart2EsmPlatform.node);
    expect(node.add(EsmRuntimeHelper.isolateNode), isTrue);

    final neutral = EsmRuntimeHelperUseSet(platform: Dart2EsmPlatform.neutral);
    expect(
      () => neutral.add(EsmRuntimeHelper.isolate),
      throwsA(isA<UnsupportedCompilerFeature>()),
    );
  });

  test('codegen groups static ESM imports before declarations', () {
    const module = EsmModule(
      items: [
        EsmRawModuleItem('import * as fs from "node:fs";\n'),
        EsmRawModuleItem('import * as path from "node:path";\n'),
        EsmFunction(name: 'main', export: true, parameters: [], body: []),
      ],
    );

    expect(const Codegen().generate(module).code, '''
// Generated by dart2esm.

import * as fs from "node:fs";
import * as path from "node:path";

export function main() {
}
''');
  });

  test(
    'codegen emits structured bindings property keys and catch bindings',
    () {
      final module = EsmModule(
        items: [
          const EsmClass(
            name: 'Derived',
            export: true,
            superclass: EsmCall(
              callee: EsmIdentifier('makeBase'),
              arguments: [EsmStringLiteral('kind')],
            ),
            constructor: null,
            methods: [
              EsmClassMethod(
                key: EsmComputedPropertyKey(EsmIdentifier('methodName')),
                kind: EsmClassMethodKind.method,
                isStatic: false,
                parameters: [
                  EsmObjectPatternParameter(
                    bindings: [
                      EsmObjectPatternBinding(
                        property: 'value',
                        name: 'value',
                        defaultValue: EsmNumberLiteral(1),
                      ),
                    ],
                  ),
                ],
                body: [EsmReturnStatement(EsmIdentifier('value'))],
              ),
            ],
          ),
          EsmFunction(
            name: 'main',
            export: true,
            parameters: [],
            body: [
              EsmVariableDeclaration(
                binding: EsmObjectBindingPattern(
                  bindings: [
                    EsmObjectPatternBinding(
                      property: 'source-value',
                      name: 'value',
                    ),
                  ],
                ),
                initializer: EsmIdentifier('source'),
                mutable: false,
              ),
              EsmVariableDeclaration(
                binding: EsmArrayBindingPattern(
                  elements: [EsmIdentifierBinding('first')],
                ),
                initializer: EsmIdentifier('items'),
                mutable: false,
              ),
              EsmTryStatement(
                body: [EsmThrowStatement(EsmIdentifier('error'))],
                catchParameter: EsmIdentifierParameter(name: 'caught'),
                catchBody: [EsmExpressionStatement(EsmIdentifier('caught'))],
                finallyBody: [EsmExpressionStatement(EsmStringLiteral('done'))],
              ),
              EsmExpressionStatement(
                EsmObjectLiteral([
                  EsmObjectLiteralProperty.static(
                    key: 'plain',
                    value: EsmIdentifier('value'),
                  ),
                  EsmObjectLiteralProperty.computed(
                    key: EsmIdentifier('dynamicKey'),
                    value: EsmIdentifier('first'),
                  ),
                ]),
              ),
            ],
          ),
        ],
      );

      expect(const Codegen().generate(module).code, '''
// Generated by dart2esm.

export class Derived extends makeBase("kind") {
  [methodName]({ value = 1 } = {}) {
    return value;
  }
}

export function main() {
  const { "source-value": value } = source;
  const [first] = items;
  try {
    throw error;
  } catch (caught) {
    caught;
  } finally {
    "done";
  }
  { plain: value, [dynamicKey]: first };
}
''');
    },
  );
}

final class _RecordingPass implements TransformPass {
  const _RecordingPass({
    required this.name,
    required this.log,
    this.append,
    this.linkedHelpers = const [],
  });

  final String name;
  final List<String> log;
  final EsmModuleItem? append;
  final List<EsmRuntimeHelper> linkedHelpers;

  @override
  TransformPassReturn apply(EsmModule module, TransformContext context) {
    log.add(
      '$name:${module.items.length}:${context.lowering.runtimeHelpers.length}',
    );
    final append = this.append;
    return TransformPassReturn(
      module: append == null
          ? module
          : EsmModule(items: [...module.items, append]),
      linkedHelpers: linkedHelpers,
    );
  }
}

LowererReturn _loweringForModule(
  EsmModule module, {
  Iterable<EsmRuntimeHelper> runtimeHelpers = const [],
}) {
  final libraryUri = Uri.parse('package:sample/main.dart');
  final library = k.Library(libraryUri, fileUri: libraryUri);
  final main = _procedure('main', body: k.EmptyStatement());
  library.addProcedure(main);
  final component = k.Component(libraries: [library]);
  component.setMainMethodAndMode(main.reference, true);
  final kernel = ParserReturn(component: component, main: main);
  final semantic = SemanticBuilderReturn(
    kernel: kernel,
    semantic: Semantic(
      component: component,
      main: main,
      classes: const [],
      extensionTypes: const [],
      fields: const [],
      procedures: [
        EsmProcedureSymbol(
          node: main,
          name: 'main',
          export: true,
          kind: EsmProcedureKind.method,
        ),
      ],
      constructorTearOffs: const [],
    ),
  );
  return LowererReturn(
    semantic: semantic,
    items: module.items,
    runtimeHelpers: runtimeHelpers,
  );
}

k.Procedure _procedure(String name, {required k.Statement body}) {
  return k.Procedure(
    k.Name(name),
    k.ProcedureKind.Method,
    k.FunctionNode(body),
    fileUri: Uri.parse('memory:$name.dart'),
    isStatic: true,
  );
}
