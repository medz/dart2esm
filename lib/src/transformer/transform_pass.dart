import '../ast/esm_ast.dart';
import '../lowering/kernel_to_esm_ast.dart';
import 'helpers/helper_loader.dart';
import 'helpers/runtime_helpers.dart';

final class TransformContext {
  const TransformContext({required this.lowering, required this.helperLoader});

  final LowererReturn lowering;
  final HelperLoader helperLoader;
}

final class TransformPassReturn {
  const TransformPassReturn({
    required this.module,
    this.changed = false,
    this.invalidatesSemantic = false,
    this.linkedHelpers = const [],
  });

  final EsmModule module;
  final bool changed;
  final bool invalidatesSemantic;
  final List<EsmRuntimeHelper> linkedHelpers;
}

abstract interface class TransformPass {
  TransformPassReturn apply(EsmModule module, TransformContext context);
}
