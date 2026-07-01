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

  test('ESM IR is independent from runtime helper registry', () {
    final ir = _read('lib/src/compiler_core/ir/esm_ir.dart');

    expect(ir, isNot(contains('runtime_helpers.dart')));
    expect(ir, isNot(contains('EsmRuntimeHelper')));
    expect(ir, isNot(contains('runtimeHelpers')));
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
