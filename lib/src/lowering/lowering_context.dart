import '../runtime/runtime_helpers.dart';
import '../semantic/semantic_world.dart';

final class DartLoweringContext {
  DartLoweringContext({required this.semantic, required this.runtimeHelpers})
    : helpers = EsmRuntimeHelperUseSet();

  final Semantic semantic;
  final EsmRuntimeHelperRegistry runtimeHelpers;
  final EsmRuntimeHelperUseSet helpers;

  List<EsmRuntimeHelper> get runtimeHelperUses => helpers.toList();
}
