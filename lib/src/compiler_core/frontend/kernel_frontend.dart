import 'package:kernel/kernel.dart' as k;

import '../../diagnostics/unsupported_kernel_node.dart';

final class KernelFrontendResult {
  const KernelFrontendResult({required this.component, required this.main});

  final k.Component component;
  final k.Procedure main;
}

final class KernelFrontendStage {
  const KernelFrontendStage();

  KernelFrontendResult accept(k.Component component) {
    final main = component.mainMethod;
    if (main == null) {
      throw UnsupportedKernelNode(component, 'component without main method');
    }
    return KernelFrontendResult(component: component, main: main);
  }
}
