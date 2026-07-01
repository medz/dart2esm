import '../../ast/esm_ast.dart';
import '../transform_pass.dart';

final class HelperLoadingPass implements TransformPass {
  const HelperLoadingPass();

  @override
  TransformPassReturn apply(EsmModule module, TransformContext context) {
    final loaded = context.helperLoader.load(
      module: module,
      helpers: context.lowering.runtimeHelpers,
    );
    return TransformPassReturn(
      module: loaded.module,
      linkedHelpers: loaded.helpers,
    );
  }
}
