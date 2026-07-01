import 'package:kernel/kernel.dart' as k;

import '../../foundation/diagnostics/unsupported_kernel_node.dart';

final class KernelParseResult {
  const KernelParseResult({required this.component, required this.main});

  final k.Component component;
  final k.Procedure main;
}

final class KernelParser {
  const KernelParser();

  KernelParseResult parse(k.Component component) {
    final main = component.mainMethod;
    if (main == null) {
      throw UnsupportedKernelNode(component, 'component without main method');
    }
    return KernelParseResult(component: component, main: main);
  }
}
