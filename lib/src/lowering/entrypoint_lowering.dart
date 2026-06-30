import 'package:kernel/kernel.dart' as k;

import 'semantic_ir.dart';

EsmEntrypointInvocation lowerKernelEntrypointInvocation(
  k.Procedure main, {
  required String Function(k.Procedure procedure) procedureName,
}) {
  return EsmEntrypointInvocation(
    targetName: procedureName(main),
    awaitCompletion: main.function.asyncMarker == k.AsyncMarker.Async,
  );
}
