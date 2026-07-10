import '../ast/esm_ast.dart';
import '../lowering/kernel_to_esm_ast.dart';
import '../options.dart';
import 'helpers/helper_loader.dart';
import 'helpers/runtime_helpers.dart';

final class TransformContext {
  const TransformContext({
    required this.lowering,
    required this.helperLoader,
    required this.profile,
  });

  final LowererReturn lowering;
  final HelperLoader helperLoader;
  final Dart2EsmCompilerProfile profile;
}

final class TransformPassReturn {
  const TransformPassReturn({
    required this.module,
    this.linkedHelpers = const [],
  });

  final EsmModule module;
  final List<EsmRuntimeHelper> linkedHelpers;
}

abstract interface class TransformPass {
  TransformPassReturn apply(EsmModule module, TransformContext context);
}
