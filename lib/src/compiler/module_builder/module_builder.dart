import '../ir/esm_ir.dart';
import '../lowering/kernel_to_esm_ir.dart';

final class ModuleBuildResult {
  const ModuleBuildResult({required this.lowering, required this.module});

  final LoweringResult lowering;
  final EsmModuleIr module;

  get runtimeHelpers => lowering.runtimeHelpers;
}

final class ModuleBuilder {
  const ModuleBuilder();

  ModuleBuildResult build(LoweringResult lowering) {
    return ModuleBuildResult(
      lowering: lowering,
      module: EsmModuleIr(items: lowering.items),
    );
  }
}
