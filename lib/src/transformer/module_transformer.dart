import '../ast/esm_ast.dart';
import '../lowering/kernel_to_esm_ast.dart';
import 'helpers/helper_loader.dart';
import 'helpers/runtime_helpers.dart';
import 'passes/helper_loading_pass.dart';
import 'passes/module_normalizer.dart';
import 'transform_pass.dart';

final class TransformerReturn {
  const TransformerReturn({required this.module, required this.linkedHelpers});

  final EsmModule module;
  final List<EsmRuntimeHelper> linkedHelpers;
}

final class Transformer {
  const Transformer({
    this.helperLoader = const HelperLoader(),
    this.passes = const [ModuleNormalizer(), HelperLoadingPass()],
  });

  final HelperLoader helperLoader;
  final List<TransformPass> passes;

  TransformerReturn transform(LowererReturn lowering) {
    final context = TransformContext(
      lowering: lowering,
      helperLoader: helperLoader,
    );
    var module = lowering.module;
    var linkedHelpers = const <EsmRuntimeHelper>[];
    for (final pass in passes) {
      final result = pass.apply(module, context);
      module = result.module;
      if (result.linkedHelpers.isNotEmpty) {
        linkedHelpers = result.linkedHelpers;
      }
    }
    return TransformerReturn(module: module, linkedHelpers: linkedHelpers);
  }
}
