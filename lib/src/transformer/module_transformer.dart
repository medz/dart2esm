import '../ast/esm_ast.dart';
import '../lowering/kernel_to_esm_ast.dart';
import 'helpers/helper_loader.dart';
import 'helpers/runtime_helpers.dart';
import 'passes/helper_loading_pass.dart';
import 'passes/module_normalizer.dart';
import 'transform_pass.dart';

final class TransformerReturn {
  const TransformerReturn({
    required this.lowering,
    required this.module,
    required this.changed,
    required this.invalidatesSemantic,
    required this.linkedHelpers,
  });

  final LowererReturn lowering;
  final EsmModule module;
  final bool changed;
  final bool invalidatesSemantic;
  final List<EsmRuntimeHelper> linkedHelpers;

  get runtimeHelpers => lowering.runtimeHelpers;
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
    var changed = false;
    var invalidatesSemantic = false;
    var linkedHelpers = const <EsmRuntimeHelper>[];
    for (final pass in passes) {
      final result = pass.apply(module, context);
      module = result.module;
      changed = changed || result.changed;
      invalidatesSemantic = invalidatesSemantic || result.invalidatesSemantic;
      if (result.linkedHelpers.isNotEmpty) {
        linkedHelpers = result.linkedHelpers;
      }
    }
    return TransformerReturn(
      lowering: lowering,
      module: module,
      changed: changed,
      invalidatesSemantic: invalidatesSemantic,
      linkedHelpers: linkedHelpers,
    );
  }
}
