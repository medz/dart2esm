import '../options.dart';
import '../transformer/helpers/runtime_helpers.dart';
import '../semantic/semantic.dart';

final class DartLoweringContext {
  DartLoweringContext({
    required this.semantic,
    required this.runtimeHelpers,
    this.platform = Dart2EsmPlatform.node,
  }) : helpers = EsmRuntimeHelperUseSet(platform: platform);

  final Semantic semantic;
  final EsmRuntimeHelperRegistry runtimeHelpers;
  final Dart2EsmPlatform platform;
  final EsmRuntimeHelperUseSet helpers;

  List<EsmRuntimeHelper> get runtimeHelperUses => helpers.toList();
}
