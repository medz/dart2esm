import 'package:dart2esm/src/third_party/kernel/kernel.dart' as k;

import '../foundation/diagnostics/unsupported_kernel_node.dart';

final class KernelProgram {
  const KernelProgram({required this.component, required this.main});

  final k.Component component;
  final k.Procedure main;
}

final class KernelAdapter {
  const KernelAdapter();

  KernelProgram read(k.Component component) {
    final main = component.mainMethod;
    if (main == null) {
      throw UnsupportedKernelNode(component, 'component without main method');
    }
    return KernelProgram(component: component, main: main);
  }
}
