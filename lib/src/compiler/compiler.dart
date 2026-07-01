import 'package:kernel/kernel.dart' as k;

import 'codegen/esm_codegen.dart';
import 'component.dart';
import 'parser/kernel_parser.dart';
import 'module_builder/module_builder.dart';
import 'lowering/kernel_to_esm_ir.dart';
import 'runtime/runtime_helpers.dart';
import 'runtime/runtime_linker.dart';
import 'semantic/semantic_world.dart';
import 'transformer/module_transformer.dart';

final class CompilerOptions {
  const CompilerOptions({required this.runMain});

  final bool runMain;
}

final class CompilerResult {
  CompilerResult({
    required this.code,
    required this.diagnostics,
    required this.kernel,
    required Iterable<CompilerComponentId> completedComponents,
    this.semantic,
    this.lowering,
    this.moduleBuild,
    this.transform,
    this.runtime,
    this.codegen,
  }) : completedComponents = List.unmodifiable(completedComponents);

  final String code;
  final List<String> diagnostics;
  final KernelParseResult kernel;
  final List<CompilerComponentId> completedComponents;
  final SemanticResult? semantic;
  final LoweringResult? lowering;
  final ModuleBuildResult? moduleBuild;
  final TransformResult? transform;
  final RuntimeLinkResult? runtime;
  final CodegenResult? codegen;
}

final class Compiler {
  const Compiler({
    required this.options,
    this.parser = const KernelParser(),
    this.semantic = const SemanticBuilder(
      generatedGlobalNames: EsmRuntimeHelperRegistry.generatedGlobalNames,
    ),
    this.lowering = const Lowerer(),
    this.moduleBuilder = const ModuleBuilder(),
    this.transformer = const Transformer(),
    this.runtime = const RuntimeLinker(),
    this.codegen = const Codegen(),
  });

  final CompilerOptions options;
  final KernelParser parser;
  final SemanticBuilder semantic;
  final Lowerer lowering;
  final ModuleBuilder moduleBuilder;
  final Transformer transformer;
  final RuntimeLinker runtime;
  final Codegen codegen;

  CompilerResult compile(k.Component component) {
    final completedComponents = <CompilerComponentId>[];
    final kernel = parser.parse(component);
    completedComponents.add(CompilerComponentId.parser);
    final semanticResult = semantic.build(kernel);
    completedComponents.add(CompilerComponentId.semantic);
    final lowered = lowering.lower(semanticResult, runMain: options.runMain);
    completedComponents.add(CompilerComponentId.lowerer);
    final built = moduleBuilder.build(lowered);
    completedComponents.add(CompilerComponentId.moduleBuilder);
    final transformed = transformer.transform(built);
    completedComponents.add(CompilerComponentId.transformer);
    final linked = runtime.link(transformed);
    completedComponents.add(CompilerComponentId.runtime);
    final codegenResult = codegen.generate(linked.module);
    completedComponents.add(CompilerComponentId.codegen);
    return CompilerResult(
      code: codegenResult.code,
      diagnostics: codegenResult.diagnostics,
      kernel: kernel,
      completedComponents: completedComponents,
      semantic: semanticResult,
      lowering: lowered,
      moduleBuild: built,
      transform: transformed,
      runtime: linked,
      codegen: codegenResult,
    );
  }
}
