import 'package:kernel/kernel.dart' as k;

import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';
import 'dart_convert_intrinsics.dart';
import 'dart_typed_data_intrinsics.dart';

final class DartSdkIntrinsicRegistry {
  const DartSdkIntrinsicRegistry();

  EsmExpressionIr? lowerInstanceConstant(k.InstanceConstant constant) {
    return lowerDartTypedDataInstanceConstant(constant);
  }

  EsmExpressionIr? lowerInstanceInvocation({
    required k.Reference reference,
    required String name,
    required EsmExpressionIr receiver,
    required List<k.Expression> positional,
    required EsmExpressionIr Function(k.Expression argument) lower,
  }) {
    return lowerByteDataInstanceInvocation(
      reference: reference,
      name: name,
      receiver: receiver,
      positional: positional,
      lower: lower,
    );
  }

  EsmExpressionIr? lowerConstructorInvocation({
    required k.ConstructorInvocation expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpressionIr Function(k.Expression argument) lower,
  }) {
    return lowerDartConvertConstructorInvocation(
      expression: expression,
      helpers: helpers,
      lower: lower,
    );
  }
}
