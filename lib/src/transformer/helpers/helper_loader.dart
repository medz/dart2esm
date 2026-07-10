import '../../ast/esm_ast.dart';
import 'runtime_helper_linker.dart';
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
  const HelperLoader({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
    this.linker = const RuntimeHelperLinker(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;
  final RuntimeHelperLinker linker;

  HelperLoaderReturn load({
    required EsmModule module,
    required Iterable<EsmRuntimeHelper> helpers,
  }) {
    final helperUseSet = EsmRuntimeHelperUseSet();
    for (final helper in helpers) {
      helperUseSet.require(helper);
    }
    final linkedHelpers = helperUseSet.toList();
    final declarations = linker.link(
      module: module,
      knownRuntimeNames: EsmRuntimeHelperRegistry.generatedGlobalNames,
      declarations: [
        for (final helper in linkedHelpers) runtimeHelpers.declaration(helper),
      ],
    );
    return HelperLoaderReturn(
      module: EsmModule(items: [...declarations, ...module.items]),
      helpers: linkedHelpers,
    );
  }
}
