import '../runtime/runtime_helpers.dart';
import '../semantic/semantic_world.dart';

final class DartLoweringContext {
  DartLoweringContext({required this.world, required this.runtimeHelpers})
    : helpers = EsmRuntimeHelperUseSet();

  final EsmSemanticWorld world;
  final EsmRuntimeHelperRegistry runtimeHelpers;
  final EsmRuntimeHelperUseSet helpers;

  List<EsmRuntimeHelper> get runtimeHelperUses => helpers.toList();
}
