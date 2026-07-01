import '../stage.dart';
import '../ir/esm_ir.dart';
import '../lowering/kernel_to_esm_ir.dart';

final class EsmIrBuildResult {
  const EsmIrBuildResult({required this.lowering, required this.module});

  final LoweringResult lowering;
  final EsmModuleIr module;

  get runtimeHelpers => lowering.runtimeHelpers;
}

final class EsmIrBuilderStage
    implements Dart2EsmCompilerStage<LoweringResult, EsmIrBuildResult> {
  const EsmIrBuilderStage();

  @override
  Dart2EsmCompilerStageId get stageId => Dart2EsmCompilerStageId.esmIrBuilder;

  @override
  EsmIrBuildResult run(LoweringResult input, Dart2EsmStageContext context) {
    return build(input);
  }

  EsmIrBuildResult build(LoweringResult lowering) {
    return EsmIrBuildResult(
      lowering: lowering,
      module: EsmModuleIr(items: lowering.items),
    );
  }
}
