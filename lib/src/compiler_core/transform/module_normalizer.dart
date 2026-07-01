import '../compiler_stage.dart';
import '../ir_builder/esm_ir_builder.dart';
import '../ir/esm_ir.dart';

final class NormalizationResult {
  const NormalizationResult({
    required this.irBuild,
    required this.module,
    required this.invalidatesSemanticWorld,
  });

  final EsmIrBuildResult irBuild;
  final EsmModuleIr module;
  final bool invalidatesSemanticWorld;
}

final class ModuleNormalizerStage
    implements Dart2EsmCompilerStage<EsmIrBuildResult, NormalizationResult> {
  const ModuleNormalizerStage();

  @override
  Dart2EsmCompilerStageId get stageId =>
      Dart2EsmCompilerStageId.moduleNormalizer;

  @override
  NormalizationResult run(
    EsmIrBuildResult input,
    Dart2EsmStageContext context,
  ) {
    return normalize(input);
  }

  NormalizationResult normalize(EsmIrBuildResult irBuild) {
    return NormalizationResult(
      irBuild: irBuild,
      module: irBuild.module,
      invalidatesSemanticWorld: false,
    );
  }
}
