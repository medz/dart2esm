import 'package:kernel/kernel.dart' as k;

import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';
import 'dart_collection_intrinsics.dart';
import 'dart_convert_intrinsics.dart';
import 'dart_core_iterable_intrinsics.dart';
import 'dart_core_uri_intrinsics.dart';
import 'dart_internal_intrinsics.dart';
import 'dart_typed_data_intrinsics.dart';

final class DartSdkIntrinsicRegistry {
  const DartSdkIntrinsicRegistry();

  EsmExpressionIr? lowerInstanceConstant(k.InstanceConstant constant) {
    return lowerDartTypedDataInstanceConstant(constant);
  }

  EsmExpressionIr? lowerInstanceInvocation({
    required k.Reference reference,
    required String name,
    required k.Arguments arguments,
    required EsmRuntimeHelperUseSet helpers,
    required EsmRuntimeHelperRegistry runtimeHelpers,
    required EsmExpressionIr Function() lowerReceiver,
    required EsmExpressionIr Function(k.Expression argument) lower,
    required EsmExpressionIr? Function(k.Arguments arguments, String name)
    lowerNamedArgument,
    required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
  }) {
    final collectionQueue = lowerDartCollectionQueueInstanceInvocation(
      reference: reference,
      name: name,
      arguments: arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: lowerReceiver,
      lower: lower,
      lowerNamedArgument: lowerNamedArgument,
      arrayFrom: arrayFrom,
    );
    if (collectionQueue != null) {
      return collectionQueue;
    }
    final typedData = lowerTypedDataInstanceInvocation(
      reference: reference,
      name: name,
      arguments: arguments,
      helpers: helpers,
      lowerReceiver: lowerReceiver,
      lower: lower,
    );
    if (typedData != null) {
      return typedData;
    }
    return lowerDartCoreUriInstanceInvocation(
      reference: reference,
      name: name,
      arguments: arguments,
      helpers: helpers,
      lowerReceiver: lowerReceiver,
      lower: lower,
      lowerNamedArgument: lowerNamedArgument,
    );
  }

  EsmExpressionIr? lowerInstanceGet({
    required k.Reference reference,
    required String name,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpressionIr Function() lowerReceiver,
  }) {
    return lowerDartCollectionQueueInstanceGet(
          reference: reference,
          name: name,
          lowerReceiver: lowerReceiver,
        ) ??
        lowerTypedDataInstanceGet(
          reference: reference,
          name: name,
          lowerReceiver: lowerReceiver,
        ) ??
        lowerDartCoreUriInstanceGet(
          reference: reference,
          name: name,
          helpers: helpers,
          lowerReceiver: lowerReceiver,
        );
  }

  EsmExpressionIr? lowerStaticGet({
    required k.StaticGet expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmRuntimeHelperRegistry runtimeHelpers,
  }) {
    return lowerDartCoreUriStaticGet(
      expression: expression,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
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

  EsmExpressionIr? lowerStaticInvocation({
    required k.StaticInvocation expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmRuntimeHelperRegistry runtimeHelpers,
    required EsmExpressionIr Function(k.Expression argument) lower,
    required EsmExpressionIr? Function(k.Arguments arguments, String name)
    lowerNamedArgument,
    required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
  }) {
    return lowerDartInternalStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
          arrayFrom: arrayFrom,
        ) ??
        lowerDartCoreIterableStaticInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
          arrayFrom: arrayFrom,
        ) ??
        lowerDartCollectionStaticInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
          arrayFrom: arrayFrom,
        ) ??
        lowerTypedDataStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
        ) ??
        lowerDartCoreUriStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
        );
  }
}
