import '../ast/esm_ast.dart';
import '../transformer/module_transformer.dart';
import 'runtime_helpers.dart';

final class RuntimeLinkerReturn {
  RuntimeLinkerReturn({
    required this.transform,
    required this.module,
    required Iterable<EsmRuntimeHelper> linkedHelpers,
  }) : linkedHelpers = List.unmodifiable(linkedHelpers);

  final TransformerReturn transform;
  final EsmModule module;
  final List<EsmRuntimeHelper> linkedHelpers;
}

final class RuntimeLinker {
  const RuntimeLinker({this.runtimeHelpers = const EsmRuntimeHelperRegistry()});

  final EsmRuntimeHelperRegistry runtimeHelpers;

  RuntimeLinkerReturn link(TransformerReturn transform) {
    final helperUseSet = EsmRuntimeHelperUseSet();
    for (final helper in transform.runtimeHelpers) {
      helperUseSet.require(helper);
    }
    final helpers = helperUseSet.toList();
    return RuntimeLinkerReturn(
      transform: transform,
      module: EsmModule(
        items: [
          for (final helper in helpers) runtimeHelpers.declaration(helper),
          ...transform.module.items,
        ],
      ),
      linkedHelpers: helpers,
    );
  }
}
