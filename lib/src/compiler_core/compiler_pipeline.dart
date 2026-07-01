import 'package:kernel/kernel.dart' as k;

import 'codegen/esm_codegen.dart';
import 'compiler_stage.dart';
import 'frontend/kernel_frontend.dart';
import 'ir_builder/esm_ir_builder.dart';
import 'ir/esm_ir.dart';
import 'lowering/kernel_to_esm_ir.dart';
import 'runtime/runtime_helpers.dart';
import 'runtime/runtime_linker.dart';
import 'semantic/semantic_world.dart';
import 'transform/module_normalizer.dart';

final class Dart2EsmPipelineOptions {
  const Dart2EsmPipelineOptions({required this.runMain});

  final bool runMain;
}

final class Dart2EsmPipelineResult {
  Dart2EsmPipelineResult({
    required this.code,
    required this.diagnostics,
    required this.kernel,
    required Iterable<Dart2EsmCompilerStageId> completedStages,
    this.semantic,
    this.lowering,
    this.irBuild,
    this.normalization,
    this.runtime,
    this.codegen,
  }) : completedStages = List.unmodifiable(completedStages);

  final String code;
  final List<String> diagnostics;
  final KernelFrontendResult kernel;
  final List<Dart2EsmCompilerStageId> completedStages;
  final SemanticWorldResult? semantic;
  final LoweringResult? lowering;
  final EsmIrBuildResult? irBuild;
  final NormalizationResult? normalization;
  final RuntimeLinkResult? runtime;
  final CodegenStageResult? codegen;
}

final class Dart2EsmCompilerPipeline {
  const Dart2EsmCompilerPipeline({
    required this.options,
    this.kernelFrontend = const KernelFrontendStage(),
    this.semanticWorld = const SemanticWorldStage(
      generatedGlobalNames: EsmRuntimeHelperRegistry.generatedGlobalNames,
    ),
    this.lowering = const KernelToEsmIrLoweringStage(),
    this.irBuilder = const EsmIrBuilderStage(),
    this.normalizer = const ModuleNormalizerStage(),
    this.runtimeLinker = const RuntimeLinkerStage(),
    this.codegen = const EsmCodegenStage(),
  });

  final Dart2EsmPipelineOptions options;
  final Dart2EsmCompilerStage<k.Component, KernelFrontendResult> kernelFrontend;
  final Dart2EsmCompilerStage<KernelFrontendResult, SemanticWorldResult>
  semanticWorld;
  final Dart2EsmCompilerStage<SemanticWorldResult, LoweringResult> lowering;
  final Dart2EsmCompilerStage<LoweringResult, EsmIrBuildResult> irBuilder;
  final Dart2EsmCompilerStage<EsmIrBuildResult, NormalizationResult> normalizer;
  final Dart2EsmCompilerStage<NormalizationResult, RuntimeLinkResult>
  runtimeLinker;
  final Dart2EsmCompilerStage<EsmModuleIr, CodegenStageResult> codegen;

  Dart2EsmPipelineResult compile(k.Component component) {
    final context = Dart2EsmStageContext(runMain: options.runMain);
    final completedStages = <Dart2EsmCompilerStageId>[];
    final kernel = kernelFrontend.run(component, context);
    completedStages.add(kernelFrontend.stageId);
    final semantic = semanticWorld.run(kernel, context);
    completedStages.add(semanticWorld.stageId);
    final lowered = lowering.run(semantic, context);
    completedStages.add(lowering.stageId);
    final irBuild = irBuilder.run(lowered, context);
    completedStages.add(irBuilder.stageId);
    final normalized = normalizer.run(irBuild, context);
    completedStages.add(normalizer.stageId);
    final linked = runtimeLinker.run(normalized, context);
    completedStages.add(runtimeLinker.stageId);
    final codegenResult = codegen.run(linked.module, context);
    completedStages.add(codegen.stageId);
    return Dart2EsmPipelineResult(
      code: codegenResult.code,
      diagnostics: codegenResult.diagnostics,
      kernel: kernel,
      completedStages: completedStages,
      semantic: semantic,
      lowering: lowered,
      irBuild: irBuild,
      normalization: normalized,
      runtime: linked,
      codegen: codegenResult,
    );
  }
}
