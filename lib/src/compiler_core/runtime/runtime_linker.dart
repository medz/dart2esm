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

final class RuntimeLinkerStage {
  const RuntimeLinkerStage({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;

  RuntimeLinkResult link(NormalizationResult normalized) {
    final helpers = normalized.lowering.runtimeHelpers;
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
