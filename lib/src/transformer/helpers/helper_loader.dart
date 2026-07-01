import '../../ast/esm_ast.dart';
import 'runtime_helpers.dart';

final class HelperLoaderReturn {
  HelperLoaderReturn({
    required this.module,
    required Iterable<EsmRuntimeHelper> helpers,
  }) : helpers = List.unmodifiable(helpers);

  final EsmModule module;
  final List<EsmRuntimeHelper> helpers;
}

final class HelperLoader {
  const HelperLoader({this.runtimeHelpers = const EsmRuntimeHelperRegistry()});

  final EsmRuntimeHelperRegistry runtimeHelpers;

  HelperLoaderReturn load({
    required EsmModule module,
    required Iterable<EsmRuntimeHelper> helpers,
  }) {
    final helperUseSet = EsmRuntimeHelperUseSet();
    for (final helper in helpers) {
      helperUseSet.require(helper);
    }
    final linkedHelpers = helperUseSet.toList();
    return HelperLoaderReturn(
      module: EsmModule(
        items: [
          for (final helper in linkedHelpers)
            runtimeHelpers.declaration(helper),
          ...module.items,
        ],
      ),
      helpers: linkedHelpers,
    );
  }
}
