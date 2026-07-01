import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../foundation/kernel/kernel_references.dart';
import '../foundation/kernel/sdk_symbols.dart';
import '../foundation/names/js_names.dart';
import '../semantic/analysis/sdk_classification.dart';
import '../ast/esm_ast.dart';
import '../foundation/diagnostics/unsupported_compiler_feature.dart';
import '../transformer/helpers/runtime_helpers.dart';
import '../semantic/semantic.dart';
import '../semantic/semantic_builder.dart';
import 'intrinsics/sdk_intrinsics.dart';
import 'lowering_context.dart';

part 'class_lowering.dart';
part 'extension_type_lowering.dart';
part 'member_lowering.dart';
part 'statement_lowering.dart';
part 'expression_lowering.dart';
part 'constant_lowering.dart';
part 'static_access_lowering.dart';
part 'invocation_lowering.dart';
part 'core_invocation_lowering.dart';
part 'collection_invocation_lowering.dart';
part 'text_invocation_lowering.dart';
part 'convert_invocation_lowering.dart';
part 'number_invocation_lowering.dart';
part 'member_access_lowering.dart';
part 'member_set_lowering.dart';
part 'constructor_lowering.dart';
part 'tearoff_lowering.dart';
part 'type_lowering.dart';
part 'static_lowering.dart';
part 'lowering_support.dart';

final class LowererReturn {
  LowererReturn({
    required this.semantic,
    required Iterable<EsmModuleItem> items,
    required Iterable<EsmRuntimeHelper> runtimeHelpers,
  }) : module = EsmModule(items: List.unmodifiable(items)),
       runtimeHelpers = List.unmodifiable(runtimeHelpers);

  final SemanticBuilderReturn semantic;
  final EsmModule module;
  final List<EsmRuntimeHelper> runtimeHelpers;
}

final class Lowerer {
  const Lowerer({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
    this.sdkIntrinsics = const DartSdkIntrinsicRegistry(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;
  final DartSdkIntrinsicRegistry sdkIntrinsics;

  LowererReturn lower(
    SemanticBuilderReturn semanticReturn, {
    required bool runMain,
  }) {
    final context = DartLoweringContext(
      semantic: semanticReturn.semantic,
      runtimeHelpers: runtimeHelpers,
    );
    final semantic = context.semantic;
    final helpers = context.helpers;
    final items = <EsmModuleItem>[
      for (final klass in semantic.classes)
        ..._lowerClassItems(semantic, helpers, klass),
      for (final extensionType in semantic.extensionTypes)
        ..._lowerExtensionTypeItems(semantic, helpers, extensionType),
      for (final field in semantic.fields)
        ..._lowerFieldItems(semantic, helpers, field),
      for (final procedure in semantic.procedures)
        _lowerProcedure(semantic, helpers, procedure),
      if (runMain)
        EsmExpressionStatement(
          EsmCall(
            callee: EsmIdentifier(
              semantic.symbolForRequired(semantic.main).name,
            ),
            arguments: const [],
          ),
        ),
    ];
    return LowererReturn(
      semantic: semanticReturn,
      items: items,
      runtimeHelpers: context.runtimeHelperUses,
    );
  }
}
