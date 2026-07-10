import '../../ast/esm_ast.dart';
import '../../options.dart';
import 'runtime_helper_linker.dart';
import 'runtime_helpers.dart';

final class HelperLoaderReturn {
  HelperLoaderReturn({
    required this.module,
    required Iterable<EsmRuntimeHelper> helpers,
    required this.runtimeDeclarationCount,
  }) : helpers = List.unmodifiable(helpers);

  final EsmModule module;
  final List<EsmRuntimeHelper> helpers;
  final int runtimeDeclarationCount;
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
    required Dart2EsmPlatform platform,
  }) {
    final helperUseSet = EsmRuntimeHelperUseSet(platform: platform);
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
      runtimeDeclarationCount: declarations
          .where((item) => !_isRuntimeImport(item))
          .length,
    );
  }
}

bool _isRuntimeImport(EsmModuleItem item) {
  return item is EsmRawModuleItem &&
      item.source.trimLeft().startsWith('import ');
}
