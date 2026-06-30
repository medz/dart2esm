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
  const RuntimeLinkerStage();

  RuntimeLinkResult link(NormalizationResult normalized) {
    final helpers = normalized.module.runtimeHelpers;
    return RuntimeLinkResult(
      normalization: normalized,
      module: EsmModuleIr(
        items: [
          for (final helper in helpers)
            EsmRuntimeHelperDeclarationIr(
              name: esmRuntimeHelperName(helper),
              source: _normalizeHelperSource(helper),
            ),
          ...normalized.module.items,
        ],
        runtimeHelpers: const [],
      ),
      linkedHelpers: helpers,
    );
  }

  String _normalizeHelperSource(EsmRuntimeHelper helper) {
    return esmRuntimeHelperSource(helper).trim();
  }
}
