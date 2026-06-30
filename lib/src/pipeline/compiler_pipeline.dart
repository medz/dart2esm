import 'package:kernel/kernel.dart' as k;

import '../backend/esm_backend.dart';
import '../diagnostics/unsupported_kernel_node.dart';
import '../program/program_model.dart';

final class Dart2EsmPipelineOptions {
  const Dart2EsmPipelineOptions({required this.runMain});

  final bool runMain;
}

final class Dart2EsmPipelineResult {
  const Dart2EsmPipelineResult({
    required this.code,
    required this.diagnostics,
    required this.kernel,
    required this.semantic,
    required this.codegen,
  });

  final String code;
  final List<String> diagnostics;
  final KernelFrontendResult kernel;
  final SemanticAnalysisResult semantic;
  final CodegenStageResult codegen;
}

final class KernelFrontendResult {
  const KernelFrontendResult({required this.component, required this.main});

  final k.Component component;
  final k.Procedure main;
}

final class SemanticAnalysisResult {
  const SemanticAnalysisResult({required this.kernel, required this.model});

  final KernelFrontendResult kernel;
  final EsmProgramModel model;
}

final class CodegenStageResult {
  const CodegenStageResult({required this.code, required this.diagnostics});

  final String code;
  final List<String> diagnostics;
}

final class KernelFrontendStage {
  const KernelFrontendStage();

  KernelFrontendResult accept(k.Component component) {
    final main = component.mainMethod;
    if (main == null) {
      throw UnsupportedKernelNode(component, 'component without main method');
    }
    return KernelFrontendResult(component: component, main: main);
  }
}

final class SemanticAnalysisStage {
  const SemanticAnalysisStage();

  SemanticAnalysisResult build(KernelFrontendResult kernel) {
    return SemanticAnalysisResult(
      kernel: kernel,
      model: buildEsmProgramModel(kernel.component),
    );
  }
}

final class EsmCodegenStage {
  const EsmCodegenStage();

  CodegenStageResult emit(
    SemanticAnalysisResult semantic, {
    required bool runMain,
  }) {
    final result = emitEsmModel(semantic.model, runMain: runMain);
    return CodegenStageResult(
      code: result.code,
      diagnostics: result.diagnostics,
    );
  }
}

final class Dart2EsmCompilerPipeline {
  const Dart2EsmCompilerPipeline({
    required this.options,
    this.kernelFrontend = const KernelFrontendStage(),
    this.semanticAnalysis = const SemanticAnalysisStage(),
    this.codegen = const EsmCodegenStage(),
  });

  final Dart2EsmPipelineOptions options;
  final KernelFrontendStage kernelFrontend;
  final SemanticAnalysisStage semanticAnalysis;
  final EsmCodegenStage codegen;

  Dart2EsmPipelineResult compile(k.Component component) {
    final kernel = kernelFrontend.accept(component);
    final semantic = semanticAnalysis.build(kernel);
    final codegenResult = codegen.emit(semantic, runMain: options.runMain);
    return Dart2EsmPipelineResult(
      code: codegenResult.code,
      diagnostics: codegenResult.diagnostics,
      kernel: kernel,
      semantic: semantic,
      codegen: codegenResult,
    );
  }
}
