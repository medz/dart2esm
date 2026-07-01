import '../compiler_stage.dart';
import '../ir/esm_ir.dart';
import '../transform/module_normalizer.dart';
import 'runtime_helpers.dart';

final class RuntimeLinkResult {
  RuntimeLinkResult({
    required this.normalization,
    required this.module,
    required Iterable<EsmRuntimeHelper> linkedHelpers,
  }) : linkedHelpers = List.unmodifiable(linkedHelpers);

  final NormalizationResult normalization;
  final EsmModuleIr module;
  final List<EsmRuntimeHelper> linkedHelpers;
}

final class RuntimeLinkerStage
    implements Dart2EsmCompilerStage<NormalizationResult, RuntimeLinkResult> {
  const RuntimeLinkerStage({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;

  @override
  Dart2EsmCompilerStageId get stageId => Dart2EsmCompilerStageId.runtimeLinker;

  @override
  RuntimeLinkResult run(
    NormalizationResult input,
    Dart2EsmStageContext context,
  ) {
    return link(input);
  }

  RuntimeLinkResult link(NormalizationResult normalized) {
    final helperUseSet = EsmRuntimeHelperUseSet();
    for (final helper in normalized.runtimeHelpers) {
      helperUseSet.require(helper);
    }
    final helpers = helperUseSet.toList();
    return RuntimeLinkResult(
      normalization: normalized,
      module: EsmModuleIr(
        items: [
          for (final helper in helpers) runtimeHelpers.declaration(helper),
          ...normalized.module.items,
        ],
      ),
      linkedHelpers: helpers,
    );
  }
}
