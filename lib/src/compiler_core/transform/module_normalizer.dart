import '../compiler_stage.dart';
import '../ir/esm_ir.dart';
import '../lowering/kernel_to_esm_ir.dart';

final class NormalizationResult {
  const NormalizationResult({
    required this.lowering,
    required this.module,
    required this.invalidatesSemanticWorld,
  });

  final LoweringResult lowering;
  final EsmModuleIr module;
  final bool invalidatesSemanticWorld;
}

final class ModuleNormalizerStage
    implements Dart2EsmCompilerStage<LoweringResult, NormalizationResult> {
  const ModuleNormalizerStage();

  @override
  Dart2EsmCompilerStageId get stageId =>
      Dart2EsmCompilerStageId.moduleNormalizer;

  @override
  NormalizationResult run(LoweringResult input, Dart2EsmStageContext context) {
    return normalize(input);
  }

  NormalizationResult normalize(LoweringResult lowering) {
    return NormalizationResult(
      lowering: lowering,
      module: lowering.module,
      invalidatesSemanticWorld: false,
    );
  }
}
