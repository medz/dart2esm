import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  test('CLI compiler enters the compiler pipeline', () {
    final compiler = _read('lib/src/compiler.dart');

    expect(
      compiler,
      contains(
        "import 'package:dart2esm/src/pipeline/compiler_pipeline.dart';",
      ),
    );
    expect(compiler, contains('Dart2EsmCompilerPipeline('));
    expect(compiler, isNot(contains('emitEsm(component')));
  });

  test('pipeline has explicit stage result boundaries and no file IO', () {
    final pipeline = _read('lib/src/pipeline/compiler_pipeline.dart');

    expect(pipeline, contains('final class KernelFrontendResult'));
    expect(pipeline, contains('final class SemanticAnalysisResult'));
    expect(pipeline, contains('final class CodegenStageResult'));
    expect(pipeline, contains('final class KernelFrontendStage'));
    expect(pipeline, contains('final class SemanticAnalysisStage'));
    expect(pipeline, contains('final class EsmCodegenStage'));
    expect(pipeline, isNot(contains('File(')));
    expect(pipeline, isNot(contains('Directory(')));
    expect(pipeline, isNot(contains('Process.run')));
    expect(pipeline, isNot(contains('writeAsStringSync')));
  });

  test('transitional backend codegen consumes a prepared program model', () {
    final backend = _read('lib/src/backend/esm_backend.dart');
    final pipeline = _read('lib/src/pipeline/compiler_pipeline.dart');
    final codegenStage = _slice(
      pipeline,
      'final class EsmCodegenStage',
      'final class Dart2EsmCompilerPipeline',
    );

    expect(backend, contains('EsmBackendResult emitEsmModel('));
    expect(backend, contains('EsmProgramModel model'));
    expect(codegenStage, contains('emitEsmModel(semantic.model'));
    expect(codegenStage, isNot(contains('buildEsmProgramModel(')));
  });
}

String _read(String relativePath) {
  return File(p.join(Directory.current.path, relativePath)).readAsStringSync();
}

String _slice(String source, String start, String end) {
  final startIndex = source.indexOf(start);
  final endIndex = source.indexOf(end, startIndex);
  return source.substring(startIndex, endIndex);
}
