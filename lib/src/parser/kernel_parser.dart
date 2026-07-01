import 'package:kernel/kernel.dart' as k;

import '../foundation/diagnostics/unsupported_kernel_node.dart';

final class ParserReturn {
  const ParserReturn({required this.component, required this.main});

  final k.Component component;
  final k.Procedure main;
}

final class KernelParser {
  const KernelParser();

  ParserReturn parse(k.Component component) {
    final main = component.mainMethod;
    if (main == null) {
      throw UnsupportedKernelNode(component, 'component without main method');
    }
    return ParserReturn(component: component, main: main);
  }
}
