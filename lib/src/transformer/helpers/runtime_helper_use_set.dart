part of 'runtime_helpers.dart';

final class EsmRuntimeHelperUseSet {
  EsmRuntimeHelperUseSet({
    required this.platform,
    this.registry = const EsmRuntimeHelperRegistry(),
  });

  final Dart2EsmPlatform platform;
  final EsmRuntimeHelperRegistry registry;
  final _helpers = <EsmRuntimeHelper>{};

  bool require(EsmRuntimeHelper helper) => add(helper);

  EsmIdentifier reference(
    EsmRuntimeHelperRegistry registry,
    EsmRuntimeHelper helper,
  ) {
    require(helper);
    return registry.reference(helper);
  }

  bool add(EsmRuntimeHelper helper) {
    if (_helpers.contains(helper)) return false;
    final contract = registry.contract(helper);
    if (!contract.supports(platform)) {
      throw UnsupportedCompilerFeature(
        helper,
        '${contract.unsupportedFeature ?? '${contract.name} runtime'} on ${platform.cliName} platform',
      );
    }
    _helpers.add(helper);
    for (final dependency in contract.dependencies) {
      add(dependency);
    }
    return true;
  }

  bool contains(EsmRuntimeHelper helper) => _helpers.contains(helper);

  List<EsmRuntimeHelper> toList() {
    return EsmRuntimeHelper.values
        .where(_helpers.contains)
        .toList(growable: false);
  }
}
