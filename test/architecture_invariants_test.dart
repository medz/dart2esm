import 'dart:io';

import 'package:dart2esm/src/compiler_core/compiler_stage.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  test('CLI compiler enters the new compiler core', () {
    final compiler = _read('lib/src/compiler.dart');

    expect(
      compiler,
      contains(
        "import 'package:dart2esm/src/compiler_core/compiler_pipeline.dart';",
      ),
    );
    expect(compiler, contains('Dart2EsmCompilerPipeline('));
    expect(compiler, isNot(contains("src/pipeline/compiler_pipeline.dart")));
    expect(Directory('lib/src/pipeline').existsSync(), isFalse);
  });

  test('compiler core has explicit Oxc-style stage result boundaries', () {
    final pipeline = _read('lib/src/compiler_core/compiler_pipeline.dart');
    final stages = _read('lib/src/compiler_core/compiler_stage.dart');
    final normalizer = _read(
      'lib/src/compiler_core/transform/module_normalizer.dart',
    );

    expect(stages, contains('enum Dart2EsmCompilerStageId'));
    expect(stages, contains('enum Dart2EsmStageCapability'));
    expect(stages, contains('final class Dart2EsmStageContract'));
    expect(stages, contains('dart2EsmCompilerStageContracts'));
    expect(stages, contains('dart2EsmCompilerStageOrder'));
    expect(stages, contains('abstract interface class Dart2EsmCompilerStage'));
    expect(stages, contains('final class Dart2EsmStageContext'));
    expect(pipeline, contains('final class Dart2EsmPipelineResult'));
    expect(pipeline, contains('final KernelFrontendResult kernel'));
    expect(pipeline, contains('final List<Dart2EsmCompilerStageId>'));
    expect(pipeline, contains('final SemanticWorldResult? semantic'));
    expect(pipeline, contains('final LoweringResult? lowering'));
    expect(pipeline, contains('final EsmIrBuildResult? irBuild'));
    expect(pipeline, contains('final NormalizationResult? normalization'));
    expect(pipeline, contains('final RuntimeLinkResult? runtime'));
    expect(pipeline, contains('final CodegenStageResult? codegen'));
    expect(normalizer, contains('invalidatesSemanticWorld'));
    expect(pipeline, isNot(contains('File(')));
    expect(pipeline, isNot(contains('Directory(')));
    expect(pipeline, isNot(contains('Process.run')));
    expect(pipeline, isNot(contains('writeAsStringSync')));
  });

  test('compiler core stage contracts own source capabilities', () {
    final compilerCoreRoot = p.join(
      Directory.current.path,
      'lib/src/compiler_core',
    );
    final contractsByOwnerDirectory = {
      for (final contract in dart2EsmCompilerStageContracts)
        contract.ownerDirectory: contract,
    };

    expect(contractsByOwnerDirectory.keys, hasLength(7));
    for (final contract in dart2EsmCompilerStageContracts) {
      final owner = Directory(
        p.join(compilerCoreRoot, contract.ownerDirectory),
      );
      expect(owner.existsSync(), isTrue, reason: contract.ownerDirectory);
      expect(
        owner
            .listSync(recursive: true)
            .whereType<File>()
            .where((file) => file.path.endsWith('.dart')),
        isNotEmpty,
        reason: contract.ownerDirectory,
      );
    }

    for (final file in _dartFiles('lib/src/compiler_core')) {
      final relative = p.relative(file.path, from: compilerCoreRoot);
      final ownerDirectory = p.split(relative).first;
      final contract = contractsByOwnerDirectory[ownerDirectory];
      if (contract == null) {
        continue;
      }
      final source = file.readAsStringSync();

      if (!contract.allowsKernelAccess) {
        expect(
          source,
          isNot(contains("package:kernel/kernel.dart")),
          reason: '${contract.stageId} must not read Kernel in ${file.path}',
        );
      }
      if (!contract.allowsRuntimeHelperReference &&
          !contract.allowsRuntimeHelperDeclaration) {
        expect(
          source,
          isNot(contains('runtime_helpers.dart')),
          reason:
              '${contract.stageId} must not discover runtime helpers in ${file.path}',
        );
        expect(
          source,
          isNot(contains('EsmRuntimeHelper')),
          reason:
              '${contract.stageId} must not depend on runtime helpers in ${file.path}',
        );
      }
      if (!contract.isCodePrinter) {
        expect(
          source,
          isNot(contains('CodegenStageResult')),
          reason: '${contract.stageId} must not print ESM in ${file.path}',
        );
        expect(
          source,
          isNot(contains('_EsmIrPrinter')),
          reason: '${contract.stageId} must not print ESM in ${file.path}',
        );
      }
      expect(
        source,
        isNot(contains('backend/esm_backend.dart')),
        reason:
            '${contract.stageId} must not call legacy backend in ${file.path}',
      );
    }
  });

  test('codegen only consumes prepared ESM IR', () {
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');

    expect(codegen, contains('CodegenStageResult emit(EsmModuleIr'));
    expect(codegen, contains('EsmModuleIr'));
    expect(codegen, isNot(contains("package:kernel/kernel.dart")));
    expect(codegen, isNot(contains('runtime/runtime_helpers.dart')));
    expect(codegen, isNot(contains('runtime/runtime_linker.dart')));
    expect(codegen, isNot(contains('RuntimeLinkResult')));
    expect(codegen, isNot(contains('esmRuntimeHelperSource')));
    expect(codegen, isNot(contains('buildEsmProgramModel')));
    expect(codegen, isNot(contains('emitEsm(')));
    expect(codegen, isNot(contains('emitEsmModel(')));
    expect(codegen, isNot(contains('backend/esm_backend.dart')));
  });

  test('ESM module construction and normalization have separate ownership', () {
    final lowering = _read(
      'lib/src/compiler_core/lowering/kernel_to_esm_ir.dart',
    );
    final irBuilder = _read(
      'lib/src/compiler_core/ir_builder/esm_ir_builder.dart',
    );
    final normalizer = _read(
      'lib/src/compiler_core/transform/module_normalizer.dart',
    );

    expect(irBuilder, contains('final class EsmIrBuildResult'));
    expect(irBuilder, contains('final class EsmIrBuilderStage'));
    expect(irBuilder, contains('EsmModuleIr(items: lowering.items)'));
    expect(
      irBuilder,
      contains('get runtimeHelpers => lowering.runtimeHelpers'),
    );
    expect(lowering, contains('final List<EsmModuleItemIr> items'));
    expect(lowering, isNot(contains('EsmModuleIr(items:')));
    expect(normalizer, contains('final EsmIrBuildResult irBuild'));
    expect(normalizer, contains('EsmModuleIr(items: normalized.items)'));
    expect(normalizer, contains('changed: normalized.changed'));
    expect(
      normalizer,
      contains('get runtimeHelpers => irBuild.runtimeHelpers'),
    );
    expect(normalizer, isNot(contains('LoweringResult')));
  });

  test('SDK intrinsic lowering is routed through a registry', () {
    final lowering = _read(
      'lib/src/compiler_core/lowering/kernel_to_esm_ir.dart',
    );
    final registry = _read(
      'lib/src/compiler_core/lowering/intrinsics/sdk_intrinsics.dart',
    );
    final typedData = _read(
      'lib/src/compiler_core/lowering/intrinsics/dart_typed_data_intrinsics.dart',
    );
    final collection = _read(
      'lib/src/compiler_core/lowering/intrinsics/dart_collection_intrinsics.dart',
    );
    final coreIterable = _read(
      'lib/src/compiler_core/lowering/intrinsics/dart_core_iterable_intrinsics.dart',
    );
    final internal = _read(
      'lib/src/compiler_core/lowering/intrinsics/dart_internal_intrinsics.dart',
    );
    final convert = _read(
      'lib/src/compiler_core/lowering/intrinsics/dart_convert_intrinsics.dart',
    );
    final typedDataInvocation = _sliceBetween(
      lowering,
      '  EsmExpressionIr? _lowerTypedDataInstanceInvocation(',
      '  EsmExpressionIr? _lowerCoreUriInstanceInvocation(',
    );

    expect(registry, contains('final class DartSdkIntrinsicRegistry'));
    expect(registry, contains('lowerInstanceConstant'));
    expect(registry, contains('lowerInstanceInvocation'));
    expect(registry, contains('lowerInstanceGet'));
    expect(registry, contains('lowerConstructorInvocation'));
    expect(registry, contains('lowerStaticInvocation'));
    expect(lowering, contains('final DartSdkIntrinsicRegistry sdkIntrinsics'));
    expect(lowering, contains('sdkIntrinsics.lowerInstanceConstant'));
    expect(lowering, contains('sdkIntrinsics.lowerInstanceInvocation'));
    expect(lowering, contains('sdkIntrinsics.lowerInstanceGet'));
    expect(lowering, contains('sdkIntrinsics.lowerConstructorInvocation'));
    expect(lowering, contains('sdkIntrinsics.lowerStaticInvocation'));
    expect(lowering, isNot(contains('_lowerByteDataInstanceInvocation')));
    expect(lowering, isNot(contains('_lowerDartConvertConstructorInvocation')));
    expect(lowering, isNot(contains('_lowerDartTypedDataInstanceConstant')));
    expect(
      lowering,
      isNot(contains('_lowerDartCollectionQueueInstanceInvocation')),
    );
    expect(lowering, isNot(contains('_lowerSdkCollectionStaticInvocation')));
    expect(lowering, isNot(contains('_lowerDartCollectionQueueInstanceGet')));
    expect(lowering, isNot(contains('_lowerTypedDataInstanceGet')));
    expect(lowering, isNot(contains('_lowerTypedDataStaticInvocation')));
    expect(lowering, isNot(contains('_lowerTypedDataSublistView')));
    expect(
      lowering,
      isNot(contains('_typedDataByteBufferViewConstructorName')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.collectionNonNulls')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.collectionIndexed')),
    );
    expect(
      lowering,
      isNot(
        contains('DartSdkStaticInvocationSymbol.collectionListBaseToString'),
      ),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.internalCheckNotNullable')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.coreIterableToFullString')),
    );
    expect(lowering, isNot(contains('_lowerCoreErrorLiteral')));
    expect(lowering, isNot(contains('_dartDelimitedCollectionToString')));
    expect(lowering, isNot(contains('dart:convert::_Byte')));
    expect(lowering, isNot(contains('dart:typed_data::Endian')));
    expect(lowering, isNot(contains('dart:typed_data::ByteData')));
    expect(lowering, isNot(contains('dart:typed_data::ByteBuffer')));
    expect(typedDataInvocation, isNot(contains('__dartListSetAll')));
    expect(typedDataInvocation, isNot(contains('__dartListSetRange')));
    expect(typedDataInvocation, isNot(contains('__dartListFillRange')));
    expect(typedDataInvocation, isNot(contains('__dartListAsMap')));
    expect(typedDataInvocation, isNot(contains("name == 'sublist'")));
    expect(typedDataInvocation, isNot(contains("name == 'getRange'")));
    expect(typedDataInvocation, isNot(contains("name == 'setRange'")));
    expect(typedDataInvocation, isNot(contains("name == 'fillRange'")));
    expect(typedData, contains('dart:typed_data::Endian'));
    expect(typedData, contains('lowerByteDataInstanceInvocation'));
    expect(typedData, contains('lowerByteBufferInstanceInvocation'));
    expect(typedData, contains('lowerTypedDataInstanceInvocation'));
    expect(typedData, contains('_lowerTypedDataListInstanceInvocation'));
    expect(typedData, contains('lowerTypedDataInstanceGet'));
    expect(typedData, contains('lowerTypedDataStaticInvocation'));
    expect(typedData, contains("'ByteBuffer'"));
    expect(typedData, contains('__dartListSetAll'));
    expect(typedData, contains('__dartListSetRange'));
    expect(typedData, contains('__dartListFillRange'));
    expect(typedData, contains('__dartListAsMap'));
    expect(collection, contains('lowerDartCollectionQueueInstanceInvocation'));
    expect(collection, contains('lowerDartCollectionQueueInstanceGet'));
    expect(collection, contains('lowerDartCollectionStaticInvocation'));
    expect(
      collection,
      contains('DartSdkStaticInvocationSymbol.collectionNonNulls'),
    );
    expect(
      collection,
      contains('DartSdkStaticInvocationSymbol.collectionListBaseToString'),
    );
    expect(coreIterable, contains('lowerDartCoreIterableStaticInvocation'));
    expect(
      coreIterable,
      contains('DartSdkStaticInvocationSymbol.coreIterableToFullString'),
    );
    expect(internal, contains('lowerDartInternalStaticInvocation'));
    expect(
      internal,
      contains('DartSdkStaticInvocationSymbol.internalCheckNotNullable'),
    );
    expect(
      internal,
      contains('DartSdkStaticInvocationSymbol.iterableElementErrorTooMany'),
    );
    expect(convert, contains('dart:convert::_ByteAdapterSink'));
    expect(convert, contains('dart:convert::_ByteCallbackSink'));
  });

  test('ESM IR is independent from runtime helper registry', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');

    expect(ir, isNot(contains('runtime_helpers.dart')));
    expect(ir, isNot(contains('EsmRuntimeHelper')));
    expect(ir, isNot(contains('runtimeHelpers')));
  });

  test('ESM arrow function parameters use structured binding IR', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');

    expect(ir, contains('final class EsmArrayPatternParameterIr'));
    expect(ir, contains('final List<EsmParameterIr> elements;'));
    expect(ir, isNot(contains('final List<String> bindings;')));
    expect(ir, contains('final List<EsmParameterIr> parameters;'));
    expect(ir, isNot(contains('final List<String> parameters;')));
    expect(codegen, contains('EsmArrayPatternParameterIr()'));
    expect(codegen, contains('parameter.elements.map(_emitBindingPattern)'));
    expect(codegen, contains('String _emitBindingPattern(EsmParameterIr'));
    expect(codegen, contains('expression.parameters.map(_emitParameter)'));
    expect(codegen, isNot(contains('expression.parameters.join')));
  });

  test('ESM class superclass uses expression IR', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');

    expect(ir, contains('final EsmExpressionIr? superclass;'));
    expect(ir, isNot(contains('final String? superclass;')));
    expect(codegen, contains('extends \${_emitExpression(klass.superclass!)}'));
    expect(codegen, isNot(contains('extends \${klass.superclass}')));
  });

  test('ESM catch parameter uses binding IR', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');
    final lowering = _read(
      'lib/src/compiler_core/lowering/kernel_to_esm_ir.dart',
    );

    expect(ir, contains('final EsmParameterIr? catchParameter;'));
    expect(ir, isNot(contains('final String? catchParameter;')));
    expect(codegen, contains('_emitBindingPattern(catchParameter)'));
    expect(codegen, isNot(contains('catch (\${statement.catchParameter})')));
    expect(lowering, contains('catchParameter: EsmIdentifierParameterIr'));
  });

  test('ESM variable declarations use binding IR', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');
    final lowering = _read(
      'lib/src/compiler_core/lowering/kernel_to_esm_ir.dart',
    );

    expect(ir, contains('sealed class EsmBindingIr'));
    expect(ir, contains('final class EsmIdentifierBindingIr'));
    expect(ir, contains('final class EsmObjectBindingPatternIr'));
    expect(ir, contains('final class EsmArrayBindingPatternIr'));
    expect(ir, contains('final EsmBindingIr binding;'));
    expect(
      ir,
      isNot(
        contains('final String name;\n  final EsmExpressionIr? initializer;'),
      ),
    );
    expect(codegen, contains('_emitBinding(statement.binding)'));
    expect(codegen, contains('_emitBinding(initializer.binding)'));
    expect(codegen, isNot(contains('statement.name')));
    expect(codegen, isNot(contains('initializer.name')));
    expect(lowering, contains('binding: EsmIdentifierBindingIr'));
  });

  test('ESM operators use syntax enum IR', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');
    final operatorLiteral = RegExp(r'''operator:\s*['"]''');

    expect(ir, contains('enum EsmBinaryOperatorIr'));
    expect(ir, contains('enum EsmUnaryOperatorIr'));
    expect(ir, contains('final EsmBinaryOperatorIr operator;'));
    expect(ir, contains('final EsmUnaryOperatorIr operator;'));
    expect(ir, isNot(contains('final String operator;')));
    expect(codegen, contains('_emitBinaryOperator(EsmBinaryOperatorIr'));
    expect(codegen, contains('_binaryPrecedence(EsmBinaryOperatorIr'));
    expect(codegen, contains('_emitUnaryExpression(EsmUnaryIr'));
    expect(codegen, isNot(contains('_binaryPrecedence(String')));
    for (final file in _dartFiles('lib/src/compiler_core')) {
      expect(
        operatorLiteral.firstMatch(file.readAsStringSync()),
        isNull,
        reason: '${file.path} must model operators with enum IR',
      );
    }
  });

  test('ESM object literal properties use property key IR', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');
    final lowering = _read(
      'lib/src/compiler_core/lowering/kernel_to_esm_ir.dart',
    );

    expect(ir, contains('sealed class EsmPropertyKeyIr'));
    expect(ir, contains('final class EsmStaticPropertyKeyIr'));
    expect(ir, contains('final class EsmComputedPropertyKeyIr'));
    expect(ir, contains('final EsmPropertyKeyIr key;'));
    expect(
      ir,
      isNot(contains('final String name;\n  final EsmExpressionIr value;')),
    );
    expect(codegen, contains('_emitPropertyKey(property.key)'));
    expect(codegen, isNot(contains('_emitObjectPropertyName(property.name)')));
    expect(lowering, contains('EsmObjectLiteralPropertyIr.static'));
    expect(lowering, isNot(contains('EsmObjectLiteralPropertyIr(name:')));
  });

  test('ESM class methods use property key IR', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');
    final lowering = _read(
      'lib/src/compiler_core/lowering/kernel_to_esm_ir.dart',
    );
    final normalizer = _read(
      'lib/src/compiler_core/transform/module_normalizer.dart',
    );

    expect(
      ir,
      contains('final EsmPropertyKeyIr key;\n  final EsmClassMethodKindIr'),
    );
    expect(codegen, contains('_emitPropertyKey(method.key)'));
    expect(codegen, isNot(contains('_emitObjectPropertyName(method.name)')));
    expect(lowering, contains('key: EsmStaticPropertyKeyIr'));
    expect(lowering, isNot(contains('EsmClassMethodIr(\n      name:')));
    expect(normalizer, contains('key: method.key'));
    expect(normalizer, isNot(contains('EsmStaticPropertyKeyIr(method.name)')));
  });

  test('ESM identifier IR is not used for member expressions', () {
    final dottedIdentifierLiteral = RegExp(
      r'''EsmIdentifierIr\(\s*['"][^'"]+\.[^'"]*['"]''',
    );

    for (final file in _dartFiles('lib/src/compiler_core')) {
      final source = file.readAsStringSync();
      expect(
        dottedIdentifierLiteral.firstMatch(source),
        isNull,
        reason:
            '${file.path} must model member/meta access with structured ESM IR',
      );
    }
  });

  test('compiler core does not adapt third-party packages by API path', () {
    for (final file in _dartFiles('lib/src/compiler_core')) {
      final nonImportSource = file
          .readAsLinesSync()
          .where((line) => !line.trimLeft().startsWith('import '))
          .join('\n');
      expect(nonImportSource, isNot(contains("'package:")), reason: file.path);
      expect(nonImportSource, isNot(contains('"package:')), reason: file.path);
      expect(nonImportSource, isNot(contains('package_')), reason: file.path);
    }
  });

  test(
    'semantic world accepts name reservations without runtime dependency',
    () {
      final semantic = _read(
        'lib/src/compiler_core/semantic/semantic_world.dart',
      );
      final pipeline = _read('lib/src/compiler_core/compiler_pipeline.dart');

      expect(semantic, contains('generatedGlobalNames'));
      expect(semantic, isNot(contains('runtime_helpers.dart')));
      expect(semantic, isNot(contains('EsmRuntimeHelper')));
      expect(
        pipeline,
        contains('EsmRuntimeHelperRegistry.generatedGlobalNames'),
      );
    },
  );

  test('runtime helpers are owned by compiler core, not legacy backend', () {
    final runtime = _read('lib/src/compiler_core/runtime/runtime_helpers.dart');
    final linker = _read('lib/src/compiler_core/runtime/runtime_linker.dart');
    final lowering = _read(
      'lib/src/compiler_core/lowering/kernel_to_esm_ir.dart',
    );
    final loweringContext = _read(
      'lib/src/compiler_core/lowering/lowering_context.dart',
    );
    final coreFiles = _dartFiles('lib/src/compiler_core');

    expect(runtime, contains('enum EsmRuntimeHelper'));
    expect(runtime, contains('final class EsmRuntimeHelperRegistry'));
    expect(runtime, contains('bool require(EsmRuntimeHelper helper)'));
    expect(runtime, contains('EsmIdentifierIr reference('));
    expect(runtime, contains('__dartPrint'));
    expect(linker, contains('final class RuntimeLinkerStage'));
    expect(linker, contains('runtimeHelpers.declaration'));
    expect(linker, contains('normalized.runtimeHelpers'));
    expect(linker, isNot(contains('normalized.irBuild.lowering')));
    expect(loweringContext, contains('final class DartLoweringContext'));
    expect(loweringContext, contains('EsmRuntimeHelperUseSet'));
    expect(loweringContext, contains('runtimeHelperUses'));
    expect(lowering, contains('helpers.require('));
    expect(lowering, contains('helpers.reference(runtimeHelpers'));
    expect(lowering, isNot(contains('helpers.add(')));
    expect(lowering, isNot(contains('runtimeHelpers.reference')));
    expect(lowering, contains('DartLoweringContext('));
    expect(lowering, isNot(contains('EsmRuntimeHelperUseSet()')));
    expect(lowering, isNot(contains('esmRuntimeHelperName')));
    for (final file in coreFiles) {
      expect(
        file.readAsStringSync(),
        isNot(contains('backend/runtime_helpers.dart')),
        reason: file.path,
      );
    }
  });

  test('legacy backend is isolated behind an oracle boundary', () {
    final coreFiles = _dartFiles('lib/src/compiler_core');
    final legacyOracle = p.join(
      Directory.current.path,
      'lib/src/compiler_core/legacy_oracle.dart',
    );

    for (final file in coreFiles) {
      final source = file.readAsStringSync();
      if (file.path == legacyOracle) {
        expect(source, contains("../backend/esm_backend.dart"));
      } else {
        expect(
          source,
          isNot(contains('backend/esm_backend.dart')),
          reason: file.path,
        );
        expect(source, isNot(contains('emitEsm(')), reason: file.path);
        expect(source, isNot(contains('emitEsmModel(')), reason: file.path);
      }
    }
  });

  test('legacy oracle is never enabled by default', () {
    final cli = _read('lib/src/cli.dart');
    final compiler = _read('lib/src/compiler.dart');
    final pipeline = _read('lib/src/compiler_core/compiler_pipeline.dart');

    expect(compiler, contains('this.allowLegacyOracle = false'));
    expect(pipeline, contains('this.allowLegacyOracle = false'));
    expect(cli, contains("'legacy-oracle'"));
    expect(cli, contains("allowLegacyOracle: results['legacy-oracle']"));
    expect(cli, isNot(contains('allowLegacyOracle: true')));
  });
}

String _read(String relativePath) {
  return File(p.join(Directory.current.path, relativePath)).readAsStringSync();
}

List<File> _dartFiles(String relativeDirectory) {
  final directory = Directory(
    p.join(Directory.current.path, relativeDirectory),
  );
  return directory
      .listSync(recursive: true)
      .whereType<File>()
      .where((file) => file.path.endsWith('.dart'))
      .toList()
    ..sort((left, right) => left.path.compareTo(right.path));
}

String _sliceBetween(String source, String start, String end) {
  final startIndex = source.indexOf(start);
  expect(startIndex, isNonNegative, reason: start);
  final endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex, isNonNegative, reason: end);
  return source.substring(startIndex, endIndex);
}
