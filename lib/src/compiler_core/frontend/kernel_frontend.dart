import 'package:kernel/kernel.dart' as k;

import '../../diagnostics/unsupported_kernel_node.dart';
import '../compiler_stage.dart';

final class KernelFrontendResult {
  const KernelFrontendResult({required this.component, required this.main});

  final k.Component component;
  final k.Procedure main;
}

final class KernelFrontendStage
    implements Dart2EsmCompilerStage<k.Component, KernelFrontendResult> {
  const KernelFrontendStage();

  @override
  Dart2EsmCompilerStageId get stageId => Dart2EsmCompilerStageId.kernelFrontend;

  @override
  KernelFrontendResult run(k.Component input, Dart2EsmStageContext context) {
    return accept(input);
  }

  KernelFrontendResult accept(k.Component component) {
    final main = component.mainMethod;
    if (main == null) {
      throw UnsupportedKernelNode(component, 'component without main method');
    }
    return KernelFrontendResult(component: component, main: main);
  }
}
