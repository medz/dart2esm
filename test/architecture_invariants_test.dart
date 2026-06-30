import 'dart:io';

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
    final normalizer = _read(
      'lib/src/compiler_core/transform/module_normalizer.dart',
    );

    expect(pipeline, contains('final class Dart2EsmPipelineResult'));
    expect(pipeline, contains('final KernelFrontendResult kernel'));
    expect(pipeline, contains('final SemanticWorldResult? semantic'));
    expect(pipeline, contains('final LoweringResult? lowering'));
    expect(pipeline, contains('final NormalizationResult? normalization'));
    expect(pipeline, contains('final RuntimeLinkResult? runtime'));
    expect(pipeline, contains('final CodegenStageResult? codegen'));
    expect(normalizer, contains('invalidatesSemanticWorld'));
    expect(pipeline, isNot(contains('File(')));
    expect(pipeline, isNot(contains('Directory(')));
    expect(pipeline, isNot(contains('Process.run')));
    expect(pipeline, isNot(contains('writeAsStringSync')));
  });

  test('codegen only consumes prepared ESM IR', () {
    final codegen = _read('lib/src/compiler_core/codegen/esm_codegen.dart');

    expect(codegen, contains('CodegenStageResult emit(RuntimeLinkResult'));
    expect(codegen, contains('EsmModuleIr'));
    expect(codegen, isNot(contains("package:kernel/kernel.dart")));
    expect(codegen, isNot(contains('runtime/runtime_helpers.dart')));
    expect(codegen, isNot(contains('esmRuntimeHelperSource')));
    expect(codegen, isNot(contains('buildEsmProgramModel')));
    expect(codegen, isNot(contains('emitEsm(')));
    expect(codegen, isNot(contains('emitEsmModel(')));
    expect(codegen, isNot(contains('backend/esm_backend.dart')));
  });

  test('runtime helpers are owned by compiler core, not legacy backend', () {
    final runtime = _read('lib/src/compiler_core/runtime/runtime_helpers.dart');
    final linker = _read('lib/src/compiler_core/runtime/runtime_linker.dart');
    final coreFiles = _dartFiles('lib/src/compiler_core');

    expect(runtime, contains('enum EsmRuntimeHelper'));
    expect(runtime, contains('__dartPrint'));
    expect(linker, contains('final class RuntimeLinkerStage'));
    expect(linker, contains('esmRuntimeHelperSource'));
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
