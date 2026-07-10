import 'package:dart2esm/src/third_party/kernel/kernel.dart' as k;

import 'codegen/esm_codegen.dart';
import 'kernel/kernel_program.dart';
import 'lowering/kernel_to_esm_ast.dart';
import 'options.dart';
import 'transformer/helpers/runtime_helpers.dart';
import 'semantic/semantic_builder.dart';
import 'transformer/module_transformer.dart';

final class CompilerOptions {
  const CompilerOptions({
    this.runMain = true,
    this.profile = Dart2EsmCompilerProfile.nodeDebug,
  });

  final bool runMain;
  final Dart2EsmCompilerProfile profile;
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
  final KernelProgram kernel;
  final SemanticBuilderReturn semantic;
  final LowererReturn lowering;
  final TransformerReturn transform;
  final CodegenReturn codegen;
}

final class Compiler {
  Compiler({
    required this.options,
    this.kernelAdapter = const KernelAdapter(),
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
  final KernelAdapter kernelAdapter;
  final SemanticBuilder semantic;
  final Lowerer lowering;
  final Transformer transformer;
  final Codegen codegen;

  CompilerReturn compile(k.Component component) {
    if (options.profile.platform == Dart2EsmPlatform.auto) {
      throw ArgumentError.value(
        options.profile.platform,
        'profile.platform',
        'Compiler core requires a concrete host platform',
      );
    }
    final kernel = kernelAdapter.read(component);
    final semanticResult = semantic.build(
      kernel,
      treeShakeMembers: options.profile.isRelease,
    );
    final lowered = lowering.lower(
      semanticResult,
      runMain: options.runMain,
      platform: options.profile.platform,
    );
    final transformed = transformer.transform(
      lowered,
      profile: options.profile,
    );
    final codegenResult = codegen.generate(
      transformed.module,
      minify: options.profile.isRelease,
    );
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
