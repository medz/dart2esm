import '../ir/esm_ir.dart';
import '../transformer/module_transformer.dart';
import 'runtime_helpers.dart';

final class RuntimeLinkResult {
  RuntimeLinkResult({
    required this.transform,
    required this.module,
    required Iterable<EsmRuntimeHelper> linkedHelpers,
  }) : linkedHelpers = List.unmodifiable(linkedHelpers);

  final TransformResult transform;
  final EsmModuleIr module;
  final List<EsmRuntimeHelper> linkedHelpers;
}

final class RuntimeLinker {
  const RuntimeLinker({this.runtimeHelpers = const EsmRuntimeHelperRegistry()});

  final EsmRuntimeHelperRegistry runtimeHelpers;

  RuntimeLinkResult link(TransformResult transform) {
    final helperUseSet = EsmRuntimeHelperUseSet();
    for (final helper in transform.runtimeHelpers) {
      helperUseSet.require(helper);
    }
    final helpers = helperUseSet.toList();
    return RuntimeLinkResult(
      transform: transform,
      module: EsmModuleIr(
        items: [
          for (final helper in helpers) runtimeHelpers.declaration(helper),
          ...transform.module.items,
        ],
      ),
      linkedHelpers: helpers,
    );
  }
}
