import 'package:kernel/kernel.dart' as k;

import 'codegen/esm_codegen.dart';
import 'compiler_stage.dart';
import 'frontend/kernel_frontend.dart';
import 'ir/esm_ir.dart';
import 'legacy_oracle.dart';
import 'lowering/kernel_to_esm_ir.dart';
import 'new_compiler_unsupported.dart';
import 'runtime/runtime_helpers.dart';
import 'runtime/runtime_linker.dart';
import 'semantic/semantic_world.dart';
import 'transform/module_normalizer.dart';

enum Dart2EsmCompilerPath { newCore, legacyOracle }

final class Dart2EsmPipelineOptions {
  const Dart2EsmPipelineOptions({
    required this.runMain,
    this.allowLegacyOracle = true,
  });

  final bool runMain;
  final bool allowLegacyOracle;
}

final class Dart2EsmPipelineResult {
  Dart2EsmPipelineResult({
    required this.code,
    required this.diagnostics,
    required this.path,
    required this.kernel,
    required Iterable<Dart2EsmCompilerStageId> completedStages,
    this.semantic,
    this.lowering,
    this.normalization,
    this.runtime,
    this.codegen,
    this.legacyOracle,
  }) : completedStages = List.unmodifiable(completedStages);

  final String code;
  final List<String> diagnostics;
  final Dart2EsmCompilerPath path;
  final KernelFrontendResult kernel;
  final List<Dart2EsmCompilerStageId> completedStages;
  final SemanticWorldResult? semantic;
  final LoweringResult? lowering;
  final NormalizationResult? normalization;
  final RuntimeLinkResult? runtime;
  final CodegenStageResult? codegen;
  final LegacyOracleResult? legacyOracle;

  bool get usedLegacyOracle => path == Dart2EsmCompilerPath.legacyOracle;
}

final class Dart2EsmCompilerPipeline {
  const Dart2EsmCompilerPipeline({
    required this.options,
    this.kernelFrontend = const KernelFrontendStage(),
    this.semanticWorld = const SemanticWorldStage(
      generatedGlobalNames: EsmRuntimeHelperRegistry.generatedGlobalNames,
    ),
    this.lowering = const KernelToEsmIrLoweringStage(),
    this.normalizer = const ModuleNormalizerStage(),
    this.runtimeLinker = const RuntimeLinkerStage(),
    this.codegen = const EsmCodegenStage(),
    this.legacyOracle = const LegacyBackendOracle(),
  });

  final Dart2EsmPipelineOptions options;
  final Dart2EsmCompilerStage<k.Component, KernelFrontendResult> kernelFrontend;
  final Dart2EsmCompilerStage<KernelFrontendResult, SemanticWorldResult>
  semanticWorld;
  final Dart2EsmCompilerStage<SemanticWorldResult, LoweringResult> lowering;
  final Dart2EsmCompilerStage<LoweringResult, NormalizationResult> normalizer;
  final Dart2EsmCompilerStage<NormalizationResult, RuntimeLinkResult>
  runtimeLinker;
  final Dart2EsmCompilerStage<EsmModuleIr, CodegenStageResult> codegen;
  final LegacyBackendOracle legacyOracle;

  Dart2EsmPipelineResult compile(k.Component component) {
    final context = Dart2EsmStageContext(runMain: options.runMain);
    final completedStages = <Dart2EsmCompilerStageId>[];
    final kernel = kernelFrontend.run(component, context);
    completedStages.add(kernelFrontend.stageId);
    try {
      final semantic = semanticWorld.run(kernel, context);
      completedStages.add(semanticWorld.stageId);
      final lowered = lowering.run(semantic, context);
      completedStages.add(lowering.stageId);
      final normalized = normalizer.run(lowered, context);
      completedStages.add(normalizer.stageId);
      final linked = runtimeLinker.run(normalized, context);
      completedStages.add(runtimeLinker.stageId);
      final codegenResult = codegen.run(linked.module, context);
      completedStages.add(codegen.stageId);
      return Dart2EsmPipelineResult(
        code: codegenResult.code,
        diagnostics: codegenResult.diagnostics,
        path: Dart2EsmCompilerPath.newCore,
        kernel: kernel,
        completedStages: completedStages,
        semantic: semantic,
        lowering: lowered,
        normalization: normalized,
        runtime: linked,
        codegen: codegenResult,
      );
    } on NewCompilerUnsupported catch (error) {
      if (!options.allowLegacyOracle) {
        rethrow;
      }
      final legacy = legacyOracle.compile(
        component,
        runMain: options.runMain,
        reason: error.toString(),
      );
      return Dart2EsmPipelineResult(
        code: legacy.code,
        diagnostics: legacy.diagnostics,
        path: Dart2EsmCompilerPath.legacyOracle,
        kernel: kernel,
        completedStages: completedStages,
        legacyOracle: legacy,
      );
    }
  }
}
