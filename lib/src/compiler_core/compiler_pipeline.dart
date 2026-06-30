import 'package:kernel/kernel.dart' as k;

import 'codegen/esm_codegen.dart';
import 'frontend/kernel_frontend.dart';
import 'legacy_oracle.dart';
import 'lowering/kernel_to_esm_ir.dart';
import 'new_compiler_unsupported.dart';
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
  const Dart2EsmPipelineResult({
    required this.code,
    required this.diagnostics,
    required this.path,
    required this.kernel,
    this.semantic,
    this.lowering,
    this.normalization,
    this.codegen,
    this.legacyOracle,
  });

  final String code;
  final List<String> diagnostics;
  final Dart2EsmCompilerPath path;
  final KernelFrontendResult kernel;
  final SemanticWorldResult? semantic;
  final LoweringResult? lowering;
  final NormalizationResult? normalization;
  final CodegenStageResult? codegen;
  final LegacyOracleResult? legacyOracle;

  bool get usedLegacyOracle => path == Dart2EsmCompilerPath.legacyOracle;
}

final class Dart2EsmCompilerPipeline {
  const Dart2EsmCompilerPipeline({
    required this.options,
    this.kernelFrontend = const KernelFrontendStage(),
    this.semanticWorld = const SemanticWorldStage(),
    this.lowering = const KernelToEsmIrLoweringStage(),
    this.normalizer = const ModuleNormalizerStage(),
    this.codegen = const EsmCodegenStage(),
    this.legacyOracle = const LegacyBackendOracle(),
  });

  final Dart2EsmPipelineOptions options;
  final KernelFrontendStage kernelFrontend;
  final SemanticWorldStage semanticWorld;
  final KernelToEsmIrLoweringStage lowering;
  final ModuleNormalizerStage normalizer;
  final EsmCodegenStage codegen;
  final LegacyBackendOracle legacyOracle;

  Dart2EsmPipelineResult compile(k.Component component) {
    final kernel = kernelFrontend.accept(component);
    try {
      final semantic = semanticWorld.build(kernel);
      final lowered = lowering.lower(semantic, runMain: options.runMain);
      final normalized = normalizer.normalize(lowered);
      final codegenResult = codegen.emit(normalized);
      return Dart2EsmPipelineResult(
        code: codegenResult.code,
        diagnostics: codegenResult.diagnostics,
        path: Dart2EsmCompilerPath.newCore,
        kernel: kernel,
        semantic: semantic,
        lowering: lowered,
        normalization: normalized,
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
        legacyOracle: legacy,
      );
    }
  }
}
