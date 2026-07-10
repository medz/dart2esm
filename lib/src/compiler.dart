import 'package:kernel/kernel.dart' as k;

import 'codegen/esm_codegen.dart';
import 'parser/kernel_parser.dart';
import 'lowering/kernel_to_esm_ast.dart';
import 'options.dart';
import 'transformer/helpers/runtime_helpers.dart';
import 'semantic/semantic_builder.dart';
import 'transformer/module_transformer.dart';

final class CompilerOptions {
  const CompilerOptions({
    this.runMain = true,
    this.platform = Dart2EsmPlatform.auto,
  });

  final bool runMain;
  final Dart2EsmPlatform platform;
}

final class CompilerReturn {
  CompilerReturn({
    required this.code,
    required this.kernel,
    required this.semantic,
    required this.lowering,
    required this.transform,
    required this.codegen,
  });

  final String code;
  final ParserReturn kernel;
  final SemanticBuilderReturn semantic;
  final LowererReturn lowering;
  final TransformerReturn transform;
  final CodegenReturn codegen;
}

final class Compiler {
  Compiler({
    required this.options,
    this.parser = const KernelParser(),
    SemanticBuilder? semantic,
    this.lowering = const Lowerer(),
    this.transformer = const Transformer(),
    this.codegen = const Codegen(),
  }) : semantic =
           semantic ??
           SemanticBuilder(
             generatedGlobalNames:
                 EsmRuntimeHelperRegistry.generatedGlobalNames,
           );

  final CompilerOptions options;
  final KernelParser parser;
  final SemanticBuilder semantic;
  final Lowerer lowering;
  final Transformer transformer;
  final Codegen codegen;

  CompilerReturn compile(k.Component component) {
    final kernel = parser.parse(component);
    final semanticResult = semantic.build(kernel);
    final lowered = lowering.lower(
      semanticResult,
      runMain: options.runMain,
      platform: options.platform,
    );
    final transformed = transformer.transform(lowered);
    final codegenResult = codegen.generate(transformed.module);
    return CompilerReturn(
      code: codegenResult.code,
      kernel: kernel,
      semantic: semanticResult,
      lowering: lowered,
      transform: transformed,
      codegen: codegenResult,
    );
  }
}
