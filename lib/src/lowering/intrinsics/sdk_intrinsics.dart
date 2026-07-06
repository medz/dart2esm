import 'package:kernel/kernel.dart' as k;

import '../../ast/esm_ast.dart';
import '../../foundation/kernel/kernel_references.dart';
import '../../foundation/kernel/sdk_symbols.dart';
import '../../transformer/helpers/runtime_helpers.dart';
import 'dart_async_intrinsics.dart';
import 'dart_collection_intrinsics.dart';
import 'dart_convert_intrinsics.dart';
import 'dart_core_enum_intrinsics.dart';
import 'dart_core_error_intrinsics.dart';
import 'dart_core_iterable_intrinsics.dart';
import 'dart_core_number_intrinsics.dart';
import 'dart_core_runtime_intrinsics.dart';
import 'dart_core_text_intrinsics.dart';
import 'dart_core_time_intrinsics.dart';
import 'dart_core_uri_intrinsics.dart';
import 'dart_developer_intrinsics.dart';
import 'dart_internal_intrinsics.dart';
import 'dart_io_intrinsics.dart';
import 'dart_math_intrinsics.dart';
import 'dart_typed_data_intrinsics.dart';

final class DartSdkIntrinsicRegistry {
  const DartSdkIntrinsicRegistry();

  EsmExpression? lowerInstanceConstant(
    k.InstanceConstant constant,
    EsmRuntimeHelperUseSet helpers,
  ) {
    final typedData = lowerDartTypedDataInstanceConstant(constant);
    if (typedData != null) {
      return typedData;
    }
    final io = lowerDartIoInstanceConstant(constant);
    if (io != null) {
      helpers.require(EsmRuntimeHelper.io);
      return io;
    }
    return null;
  }

  EsmExpression? lowerStaticTearOffConstant({required k.Reference reference}) {
    return lowerDartMathStaticTearOffConstant(reference: reference);
  }

  EsmExpression? lowerInstanceInvocation({
    required k.Reference reference,
    required String name,
    required k.Arguments arguments,
    required EsmRuntimeHelperUseSet helpers,
    required EsmRuntimeHelperRegistry runtimeHelpers,
    required EsmExpression Function() lowerReceiver,
    required EsmExpression Function(k.Expression argument) lower,
    required EsmExpression? Function(k.Arguments arguments, String name)
    lowerNamedArgument,
    required EsmExpression Function(EsmExpression value) arrayFrom,
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
    final io = lowerDartIoInstanceInvocation(
      reference: reference,
      name: name,
      arguments: arguments,
      helpers: helpers,
      lowerReceiver: lowerReceiver,
      lower: lower,
    );
    if (io != null) {
      return io;
    }
    final sdkObject = _lowerSmallSdkInstanceInvocation(
      reference: reference,
      name: name,
      arguments: arguments,
      helpers: helpers,
      lowerReceiver: lowerReceiver,
      lower: lower,
      lowerNamedArgument: lowerNamedArgument,
    );
    if (sdkObject != null) {
      return sdkObject;
    }
    final legacyJs = lowerLegacyJsInstanceInvocation(
      reference: reference,
      name: name,
      arguments: arguments,
      lowerReceiver: lowerReceiver,
      lower: lower,
      arrayFrom: arrayFrom,
    );
    if (legacyJs != null) {
      return legacyJs;
    }
    final async = lowerDartAsyncInstanceInvocation(
      reference: reference,
      name: name,
      arguments: arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: lowerReceiver,
      lower: lower,
      lowerNamedArgument: lowerNamedArgument,
    );
    if (async != null) {
      return async;
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

  EsmExpression? lowerInstanceGet({
    required k.Reference reference,
    required String name,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpression Function() lowerReceiver,
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
        _lowerSmallSdkInstanceGet(
          reference: reference,
          name: name,
          helpers: helpers,
          lowerReceiver: lowerReceiver,
        ) ??
        lowerLegacyJsInstanceGet(
          reference: reference,
          name: name,
          lowerReceiver: lowerReceiver,
        ) ??
        lowerDartAsyncInstanceGet(
          reference: reference,
          name: name,
          helpers: helpers,
          lowerReceiver: lowerReceiver,
        ) ??
        lowerDartIoInstanceGet(
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

  EsmExpression? lowerStaticGet({
    required k.StaticGet expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmRuntimeHelperRegistry runtimeHelpers,
  }) {
    return _lowerSmallSdkStaticGet(expression: expression, helpers: helpers) ??
        lowerDartConvertStaticGet(expression: expression, helpers: helpers) ??
        lowerJsInteropStaticGet(expression) ??
        lowerDartAsyncStaticGet(expression: expression, helpers: helpers) ??
        lowerDartIoStaticGet(expression: expression, helpers: helpers) ??
        lowerDartMathStaticGet(expression) ??
        lowerDartCoreUriStaticGet(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
        ) ??
        lowerDartDeveloperStaticGet(expression);
  }

  EsmExpression? lowerJsInteropStaticGet(k.StaticGet expression) {
    final symbolGetterName = jsSymbolStaticGetterName(
      expression.targetReference,
    );
    if (symbolGetterName != null) {
      return EsmPropertyAccess(
        receiver: const EsmIdentifier('Symbol'),
        property: symbolGetterName,
      );
    }
    return switch (jsInteropStaticGetSymbol(expression.targetReference)) {
      JsInteropStaticGetSymbol.globalThis => const EsmIdentifier('globalThis'),
      JsInteropStaticGetSymbol.objectPrototype => const EsmPropertyAccess(
        receiver: EsmIdentifier('Object'),
        property: 'prototype',
      ),
      null => null,
    };
  }

  EsmExpression? _lowerSmallSdkStaticGet({
    required k.StaticGet expression,
    required EsmRuntimeHelperUseSet helpers,
  }) {
    final path = kernelReferencePath(expression.targetReference);
    if (path == 'dart:ffi::@getters::nullptr') {
      helpers.require(EsmRuntimeHelper.ffi);
      return const EsmCall(
        callee: EsmIdentifier('__dartPointer'),
        arguments: [EsmNumberLiteral(0)],
      );
    }
    if (path == 'dart:html::@getters::document') {
      return const EsmPropertyAccess(
        receiver: EsmIdentifier('globalThis'),
        property: 'document',
      );
    }
    if (path == 'dart:html::@getters::window') {
      return const EsmPropertyAccess(
        receiver: EsmIdentifier('globalThis'),
        property: 'window',
      );
    }
    if (path == 'dart:indexed_db::IdbFactory::@getters::supported') {
      return const EsmBinary(
        left: EsmUnary(
          operator: EsmUnaryOperator.typeOf,
          operand: EsmNullishCoalesce(
            left: EsmPropertyAccess(
              receiver: EsmIdentifier('globalThis'),
              property: 'indexedDB',
            ),
            right: EsmOptionalPropertyAccess(
              receiver: EsmPropertyAccess(
                receiver: EsmIdentifier('globalThis'),
                property: 'window',
              ),
              property: 'indexedDB',
            ),
          ),
        ),
        operator: EsmBinaryOperator.strictNotEquals,
        right: EsmStringLiteral('undefined'),
      );
    }
    if (path == 'dart:web_audio::AudioContext::@getters::supported') {
      return const EsmBinary(
        left: EsmUnary(
          operator: EsmUnaryOperator.typeOf,
          operand: EsmNullishCoalesce(
            left: EsmPropertyAccess(
              receiver: EsmIdentifier('globalThis'),
              property: 'AudioContext',
            ),
            right: EsmOptionalPropertyAccess(
              receiver: EsmPropertyAccess(
                receiver: EsmIdentifier('globalThis'),
                property: 'window',
              ),
              property: 'AudioContext',
            ),
          ),
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: EsmStringLiteral('function'),
      );
    }
    if (path == 'dart:web_gl::RenderingContext::@getters::supported') {
      return const EsmBinary(
        left: EsmUnary(
          operator: EsmUnaryOperator.typeOf,
          operand: EsmNullishCoalesce(
            left: EsmPropertyAccess(
              receiver: EsmIdentifier('globalThis'),
              property: 'WebGLRenderingContext',
            ),
            right: EsmOptionalPropertyAccess(
              receiver: EsmPropertyAccess(
                receiver: EsmIdentifier('globalThis'),
                property: 'window',
              ),
              property: 'WebGLRenderingContext',
            ),
          ),
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: EsmStringLiteral('function'),
      );
    }
    return null;
  }

  EsmExpression? lowerConstructorInvocation({
    required k.ConstructorInvocation expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpression Function(k.Expression argument) lower,
    required EsmExpression? Function(k.Arguments arguments, String name)
    lowerNamedArgument,
  }) {
    return lowerDartAsyncConstructorInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
        ) ??
        lowerDartIoConstructorInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
        ) ??
        _lowerSmallSdkConstructorInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
        ) ??
        lowerDartConvertConstructorInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
        );
  }

  EsmExpression? lowerStaticInvocation({
    required k.StaticInvocation expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmRuntimeHelperRegistry runtimeHelpers,
    required EsmExpression Function(k.Expression argument) lower,
    required EsmExpression? Function(k.Arguments arguments, String name)
    lowerNamedArgument,
    required EsmExpression Function(EsmExpression value) arrayFrom,
  }) {
    return lowerLegacyJsFactoryInvocation(
          expression: expression,
          lower: lower,
          arrayFrom: arrayFrom,
        ) ??
        lowerDartAsyncStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
          arrayFrom: arrayFrom,
        ) ??
        lowerDartDeveloperStaticInvocation(
          expression: expression,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
        ) ??
        lowerDartConvertStaticInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
        ) ??
        lowerDartIoStaticInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
          arrayFrom: arrayFrom,
        ) ??
        lowerDartCoreEnumStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
        ) ??
        lowerDartMathStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
        ) ??
        lowerDartCoreRuntimeStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
          arrayFrom: arrayFrom,
        ) ??
        lowerDartCoreErrorStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
        ) ??
        lowerDartCoreTimeStaticInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
        ) ??
        lowerDartCoreNumberStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
        ) ??
        lowerDartInternalStaticInvocation(
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
          runtimeHelpers: runtimeHelpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
          arrayFrom: arrayFrom,
        ) ??
        lowerTypedDataStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
        ) ??
        _lowerSmallSdkStaticInvocation(
          expression: expression,
          helpers: helpers,
          lower: lower,
        ) ??
        lowerDartCoreUriStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
        ) ??
        lowerDartCoreTextStaticInvocation(
          expression: expression,
          helpers: helpers,
          runtimeHelpers: runtimeHelpers,
          lower: lower,
          lowerNamedArgument: lowerNamedArgument,
        );
  }

  EsmExpression? _lowerSmallSdkConstructorInvocation({
    required k.ConstructorInvocation expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpression Function(k.Expression argument) lower,
  }) {
    final path = kernelReferencePath(expression.targetReference);
    final positional = expression.arguments.positional;
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    if (path == 'dart:core::Stopwatch::@constructors::' && positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.stopwatch);
      return const EsmCall(
        callee: EsmIdentifier('__dartStopwatch'),
        arguments: [],
      );
    }
    if (path == 'dart:isolate::ReceivePort::@constructors::' &&
        positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.isolate);
      return EsmCall(
        callee: const EsmIdentifier('__dartReceivePort'),
        arguments: positional.isEmpty ? const [] : [lower(positional.single)],
      );
    }
    if (path == 'dart:isolate::RawReceivePort::@constructors::' &&
        positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.isolate);
      return EsmCall(
        callee: const EsmIdentifier('__dartRawReceivePort'),
        arguments: [for (final argument in positional) lower(argument)],
      );
    }
    return null;
  }

  EsmExpression? _lowerSmallSdkStaticInvocation({
    required k.StaticInvocation expression,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpression Function(k.Expression argument) lower,
  }) {
    final path = kernelReferencePath(expression.targetReference);
    final positional = expression.arguments.positional;
    if (expression.arguments.named.isNotEmpty &&
        path != 'dart:isolate::Isolate::@methods::spawn') {
      return null;
    }
    if (path == 'dart:concurrent::Mutex::@factories::' && positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.concurrent);
      return const EsmCall(callee: EsmIdentifier('__dartMutex'), arguments: []);
    }
    if (path == 'dart:ffi::Pointer::@factories::fromAddress' &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.ffi);
      return EsmCall(
        callee: const EsmIdentifier('__dartPointer'),
        arguments: [lower(positional.single)],
      );
    }
    if (path == 'dart:ffi::@methods::sizeOf' &&
        positional.isEmpty &&
        expression.arguments.types.length == 1) {
      helpers.require(EsmRuntimeHelper.ffi);
      return EsmCall(
        callee: const EsmIdentifier('__dartSizeOf'),
        arguments: [
          EsmStringLiteral(_ffiTypeName(expression.arguments.types.single)),
        ],
      );
    }
    if (path == 'dart:isolate::ReceivePort::@factories::' &&
        positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.isolate);
      return EsmCall(
        callee: const EsmIdentifier('__dartReceivePort'),
        arguments: [for (final argument in positional) lower(argument)],
      );
    }
    if (path == 'dart:isolate::RawReceivePort::@factories::' &&
        positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.isolate);
      return EsmCall(
        callee: const EsmIdentifier('__dartRawReceivePort'),
        arguments: [for (final argument in positional) lower(argument)],
      );
    }
    if (path == 'dart:isolate::Isolate::@methods::spawn' &&
        positional.length >= 2) {
      helpers.require(EsmRuntimeHelper.isolate);
      return EsmCall(
        callee: const EsmIdentifier('__dartSpawnIsolate'),
        arguments: [lower(positional[0]), lower(positional[1])],
      );
    }
    final jsInterop = _lowerJsInteropStaticInvocation(
      path: path,
      positional: positional,
      helpers: helpers,
      lower: lower,
    );
    if (jsInterop != null) return jsInterop;
    return null;
  }

  EsmExpression? _lowerJsInteropStaticInvocation({
    required String path,
    required List<k.Expression> positional,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpression Function(k.Expression argument) lower,
  }) {
    if (path.startsWith('dart:js_interop::@methods::') ||
        path.startsWith('dart:js_interop_unsafe::@methods::')) {
      if (path.contains('createJSInteropWrapper') && positional.length == 1) {
        helpers.require(EsmRuntimeHelper.jsInterop);
        return EsmCall(
          callee: const EsmIdentifier('__dartCreateJSInteropWrapper'),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSObject|constructor#') && positional.isEmpty) {
        return const EsmObjectLiteral([]);
      }
      if (path.contains('JSSymbol|constructor#') && positional.length == 1) {
        return EsmCall(
          callee: const EsmIdentifier('Symbol'),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSSymbol|forKey') && positional.length == 1) {
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Symbol'),
            property: 'for',
          ),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSSymbol|get#description') && positional.length == 1) {
        return EsmPropertyAccess(
          receiver: lower(positional.single),
          property: 'description',
        );
      }
      if (path.contains('JSSymbol|get#key') && positional.length == 1) {
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Symbol'),
            property: 'keyFor',
          ),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSPromise|constructor#') && positional.length == 1) {
        return EsmNew(
          callee: const EsmIdentifier('Promise'),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSArrayBuffer|constructor#') &&
          positional.length == 1) {
        return EsmNew(
          callee: const EsmIdentifier('ArrayBuffer'),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSDataView|constructor#') && positional.length == 1) {
        return EsmNew(
          callee: const EsmIdentifier('DataView'),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSUint8Array|constructor#') &&
          positional.length == 1) {
        return EsmNew(
          callee: const EsmIdentifier('Uint8Array'),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSUint8Array|withLength') && positional.length == 1) {
        return EsmNew(
          callee: const EsmIdentifier('Uint8Array'),
          arguments: [lower(positional.single)],
        );
      }
      if (path.contains('JSIterable|get#iterator') && positional.length == 1) {
        return EsmCall(
          callee: EsmComputedPropertyAccess(
            receiver: lower(positional.single),
            property: const EsmPropertyAccess(
              receiver: EsmIdentifier('Symbol'),
              property: 'iterator',
            ),
          ),
          arguments: const [],
        );
      }
      if (path.contains('JSIterator|next') && positional.length == 1) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: lower(positional.single),
            property: 'next',
          ),
          arguments: const [],
        );
      }
      if (path.contains('JSIteratorResult|get#value') &&
          positional.length == 1) {
        return EsmPropertyAccess(
          receiver: lower(positional.single),
          property: 'value',
        );
      }
      if ((path.contains('JSIteratorResult|get#done') ||
              path.contains('JSIteratorResult|get#isDone')) &&
          positional.length == 1) {
        return EsmPropertyAccess(
          receiver: lower(positional.single),
          property: 'done',
        );
      }
      if (path.contains('JSIteratorResult|constructor#value') &&
          positional.length == 1) {
        return EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'value',
            value: lower(positional.single),
          ),
          EsmObjectLiteralProperty.static(
            key: 'done',
            value: const EsmBooleanLiteral(false),
          ),
        ]);
      }
      if (path.contains('JSIteratorResult|constructor#done') &&
          positional.isEmpty) {
        return EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'done',
            value: const EsmBooleanLiteral(true),
          ),
        ]);
      }
      if (path.contains('_isJSBoxedDartObject') && positional.length == 1) {
        return EsmBinary(
          left: EsmOptionalPropertyAccess(
            receiver: lower(positional.single),
            property: '__dartType',
          ),
          operator: EsmBinaryOperator.strictEquals,
          right: const EsmStringLiteral('JSBoxedDartObject'),
        );
      }
      if (path.contains('_isJSExportedDartFunction') &&
          positional.length == 1) {
        return EsmBinary(
          left: EsmUnary(
            operator: EsmUnaryOperator.typeOf,
            operand: lower(positional.single),
          ),
          operator: EsmBinaryOperator.strictEquals,
          right: const EsmStringLiteral('function'),
        );
      }
      if (path.contains('|getProperty') && positional.length == 2) {
        return EsmComputedPropertyAccess(
          receiver: lower(positional[0]),
          property: lower(positional[1]),
        );
      }
      if (path.contains('|[]=') && positional.length == 3) {
        return EsmAssignment(
          target: EsmComputedPropertyAccess(
            receiver: lower(positional[0]),
            property: lower(positional[1]),
          ),
          value: lower(positional[2]),
        );
      }
      if (path.contains('|[]') && positional.length == 2) {
        return EsmComputedPropertyAccess(
          receiver: lower(positional[0]),
          property: lower(positional[1]),
        );
      }
      if (path.contains('|setProperty') && positional.length == 3) {
        return EsmAssignment(
          target: EsmComputedPropertyAccess(
            receiver: lower(positional[0]),
            property: lower(positional[1]),
          ),
          value: lower(positional[2]),
        );
      }
      if (path.contains('|hasProperty') && positional.length == 2) {
        return EsmBinary(
          left: lower(positional[1]),
          operator: EsmBinaryOperator.inOperator,
          right: lower(positional[0]),
        );
      }
      if (path.contains('|has') && positional.length == 2) {
        return EsmBinary(
          left: lower(positional[1]),
          operator: EsmBinaryOperator.inOperator,
          right: lower(positional[0]),
        );
      }
      if (path.contains('|delete') && positional.length == 2) {
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Reflect'),
            property: 'deleteProperty',
          ),
          arguments: [lower(positional[0]), lower(positional[1])],
        );
      }
      if (path.contains('|callMethod') && positional.length >= 2) {
        return EsmCall(
          callee: EsmComputedPropertyAccess(
            receiver: lower(positional[0]),
            property: lower(positional[1]),
          ),
          arguments: [
            for (final argument in positional.skip(2)) lower(argument),
          ],
        );
      }
      if (positional.length == 1) {
        if (path.contains('toDartInt')) {
          return EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Math'),
              property: 'trunc',
            ),
            arguments: [lower(positional.single)],
          );
        }
        if (path.contains('toDartDouble')) {
          return EsmCall(
            callee: const EsmIdentifier('Number'),
            arguments: [lower(positional.single)],
          );
        }
        if (path.contains('toJSIterator')) {
          helpers.require(EsmRuntimeHelper.jsInterop);
          return EsmCall(
            callee: const EsmIdentifier('__dartToJSIterator'),
            arguments: [lower(positional.single)],
          );
        }
        if (path.contains('toDartIterator')) {
          helpers.require(EsmRuntimeHelper.jsInterop);
          return EsmCall(
            callee: const EsmIdentifier('__dartToDartIterator'),
            arguments: [lower(positional.single)],
          );
        }
        if (path.contains('toJSBox')) {
          helpers.require(EsmRuntimeHelper.jsInterop);
          return EsmCall(
            callee: const EsmIdentifier('__dartJSBox'),
            arguments: [lower(positional.single)],
          );
        }
        if (path.contains('toExternalReference')) {
          helpers.require(EsmRuntimeHelper.jsInterop);
          return EsmCall(
            callee: const EsmIdentifier('__dartJSExternalReference'),
            arguments: [lower(positional.single)],
          );
        }
        if (path.contains('BoxedDartObject') && path.contains('get#toDart')) {
          return EsmPropertyAccess(
            receiver: lower(positional.single),
            property: 'toDart',
          );
        }
        if (path.contains('ExternalDartReference|get#toDartObject') ||
            path.contains('toDartObject')) {
          return EsmPropertyAccess(
            receiver: lower(positional.single),
            property: 'toDartObject',
          );
        }
        if (path.contains('toDart') || path.contains('toJS')) {
          return lower(positional.single);
        }
        if (path.contains('isUndefined')) {
          return EsmBinary(
            left: lower(positional.single),
            operator: EsmBinaryOperator.strictEquals,
            right: const EsmIdentifier('undefined'),
          );
        }
        if (path.contains('isNull')) {
          return EsmBinary(
            left: lower(positional.single),
            operator: EsmBinaryOperator.strictEquals,
            right: const EsmNullLiteral(),
          );
        }
        if (path.contains('jsify')) {
          helpers.require(EsmRuntimeHelper.jsInterop);
          return EsmCall(
            callee: const EsmIdentifier('__dartJsify'),
            arguments: [lower(positional.single)],
          );
        }
        if (path.contains('dartify')) {
          helpers.require(EsmRuntimeHelper.jsInterop);
          return EsmCall(
            callee: const EsmIdentifier('__dartDartify'),
            arguments: [lower(positional.single)],
          );
        }
      }
      if (path.contains('typeofEquals') && positional.length == 2) {
        return EsmBinary(
          left: EsmUnary(
            operator: EsmUnaryOperator.typeOf,
            operand: lower(positional[0]),
          ),
          operator: EsmBinaryOperator.strictEquals,
          right: lower(positional[1]),
        );
      }
      if (path.contains('instanceof') && positional.length == 2) {
        return EsmBinary(
          left: lower(positional[0]),
          operator: EsmBinaryOperator.instanceOf,
          right: lower(positional[1]),
        );
      }
      if (path.contains('instanceOfString') && positional.length == 2) {
        return EsmBinary(
          left: lower(positional[0]),
          operator: EsmBinaryOperator.instanceOf,
          right: EsmComputedPropertyAccess(
            receiver: const EsmIdentifier('globalThis'),
            property: lower(positional[1]),
          ),
        );
      }
      if (path.contains('callAsConstructor') && positional.isNotEmpty) {
        return EsmNew(
          callee: lower(positional[0]),
          arguments: [
            for (final argument in positional.skip(1)) lower(argument),
          ],
        );
      }
      if (path.contains('callAsFunction') && positional.length >= 2) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: lower(positional[0]),
            property: 'call',
          ),
          arguments: [
            for (final argument in positional.skip(1)) lower(argument),
          ],
        );
      }
    }
    if (path.startsWith('dart:js_util::@methods::')) {
      return _lowerJsUtilStaticInvocation(path, positional, helpers, lower);
    }
    if (path == 'dart:js_interop::@methods::importModule' &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.jsInterop);
      return EsmCall(
        callee: const EsmIdentifier('__dartImportModule'),
        arguments: [lower(positional.single)],
      );
    }
    if (path.contains('createJSInteropWrapper') && positional.length == 1) {
      helpers.require(EsmRuntimeHelper.jsInterop);
      return EsmCall(
        callee: const EsmIdentifier('__dartCreateJSInteropWrapper'),
        arguments: [lower(positional.single)],
      );
    }
    return null;
  }

  EsmExpression? _lowerJsUtilStaticInvocation(
    String path,
    List<k.Expression> positional,
    EsmRuntimeHelperUseSet helpers,
    EsmExpression Function(k.Expression argument) lower,
  ) {
    switch (path) {
      case 'dart:js_util::@methods::newObject':
        return const EsmObjectLiteral([]);
      case 'dart:js_util::@methods::getProperty' when positional.length == 2:
        return EsmComputedPropertyAccess(
          receiver: lower(positional[0]),
          property: lower(positional[1]),
        );
      case 'dart:js_util::@methods::setProperty' when positional.length == 3:
        return EsmAssignment(
          target: EsmComputedPropertyAccess(
            receiver: lower(positional[0]),
            property: lower(positional[1]),
          ),
          value: lower(positional[2]),
        );
      case 'dart:js_util::@methods::hasProperty' when positional.length == 2:
        return EsmBinary(
          left: lower(positional[1]),
          operator: EsmBinaryOperator.inOperator,
          right: lower(positional[0]),
        );
      case 'dart:js_util::@methods::callMethod' when positional.length == 3:
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: EsmComputedPropertyAccess(
              receiver: lower(positional[0]),
              property: lower(positional[1]),
            ),
            property: 'apply',
          ),
          arguments: [lower(positional[0]), lower(positional[2])],
        );
      case 'dart:js_util::@methods::promiseToFuture'
          when positional.length == 1:
        return lower(positional.single);
      case 'dart:js_util::@methods::jsify' when positional.length == 1:
        helpers.require(EsmRuntimeHelper.jsInterop);
        return EsmCall(
          callee: const EsmIdentifier('__dartJsify'),
          arguments: [lower(positional.single)],
        );
      case 'dart:js_util::@methods::dartify' when positional.length == 1:
        helpers.require(EsmRuntimeHelper.jsInterop);
        return EsmCall(
          callee: const EsmIdentifier('__dartDartify'),
          arguments: [lower(positional.single)],
        );
      case 'dart:js_util::@methods::objectGetPrototypeOf'
          when positional.length == 1:
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'getPrototypeOf',
          ),
          arguments: [lower(positional.single)],
        );
      case 'dart:js_util::@methods::objectKeys' when positional.length == 1:
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'keys',
          ),
          arguments: [lower(positional.single)],
        );
    }
    if (path.contains('dart:js_util::_callMethod') && positional.length >= 2) {
      return EsmCall(
        callee: EsmComputedPropertyAccess(
          receiver: lower(positional[0]),
          property: lower(positional[1]),
        ),
        arguments: [for (final argument in positional.skip(2)) lower(argument)],
      );
    }
    if (path.contains('dart:js_util::_callConstructor') &&
        positional.isNotEmpty) {
      return EsmNew(
        callee: lower(positional[0]),
        arguments: [for (final argument in positional.skip(1)) lower(argument)],
      );
    }
    if (path.contains('dart:js_util::_functionToJS') &&
        positional.length == 1) {
      return lower(positional.single);
    }
    if (path.contains('dart:js_util::_functionToJSCaptureThis') &&
        positional.length == 2) {
      helpers.require(EsmRuntimeHelper.jsInterop);
      return EsmCall(
        callee: const EsmIdentifier('__dartFunctionToJSCaptureThis'),
        arguments: [lower(positional[0]), lower(positional[1])],
      );
    }
    if (path.contains('dart:js_util::_jsFunctionToDart') &&
        positional.length == 1) {
      return lower(positional.single);
    }
    if (path.contains('dart:js_util::_getProperty') && positional.length == 2) {
      return EsmComputedPropertyAccess(
        receiver: lower(positional[0]),
        property: lower(positional[1]),
      );
    }
    if (path.contains('dart:js_util::_setProperty') && positional.length == 3) {
      return EsmAssignment(
        target: EsmComputedPropertyAccess(
          receiver: lower(positional[0]),
          property: lower(positional[1]),
        ),
        value: lower(positional[2]),
      );
    }
    if (positional.length == 2) {
      final left = lower(positional[0]);
      final right = lower(positional[1]);
      return switch (path) {
        'dart:js_util::@methods::delete' => EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Reflect'),
            property: 'deleteProperty',
          ),
          arguments: [left, right],
        ),
        'dart:js_util::@methods::add' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.add,
          right: right,
        ),
        'dart:js_util::@methods::subtract' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.subtract,
          right: right,
        ),
        'dart:js_util::@methods::multiply' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.multiply,
          right: right,
        ),
        'dart:js_util::@methods::divide' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.divide,
          right: right,
        ),
        'dart:js_util::@methods::exponentiate' => EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Math'),
            property: 'pow',
          ),
          arguments: [left, right],
        ),
        'dart:js_util::@methods::modulo' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.remainder,
          right: right,
        ),
        'dart:js_util::@methods::equal' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.looseEquals,
          right: right,
        ),
        'dart:js_util::@methods::strictEqual' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.strictEquals,
          right: right,
        ),
        'dart:js_util::@methods::notEqual' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.looseNotEquals,
          right: right,
        ),
        'dart:js_util::@methods::strictNotEqual' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.strictNotEquals,
          right: right,
        ),
        'dart:js_util::@methods::greaterThan' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.greaterThan,
          right: right,
        ),
        'dart:js_util::@methods::greaterThanOrEqual' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.greaterThanOrEqual,
          right: right,
        ),
        'dart:js_util::@methods::lessThan' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.lessThan,
          right: right,
        ),
        'dart:js_util::@methods::lessThanOrEqual' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.lessThanOrEqual,
          right: right,
        ),
        'dart:js_util::@methods::or' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.logicalOr,
          right: right,
        ),
        'dart:js_util::@methods::and' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.logicalAnd,
          right: right,
        ),
        'dart:js_util::@methods::unsignedRightShift' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.unsignedRightShift,
          right: right,
        ),
        'dart:js_util::@methods::typeofEquals' => EsmBinary(
          left: EsmUnary(operator: EsmUnaryOperator.typeOf, operand: left),
          operator: EsmBinaryOperator.strictEquals,
          right: right,
        ),
        'dart:js_util::@methods::instanceof' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.instanceOf,
          right: right,
        ),
        'dart:js_util::@methods::instanceOfString' => EsmBinary(
          left: left,
          operator: EsmBinaryOperator.instanceOf,
          right: EsmComputedPropertyAccess(
            receiver: const EsmIdentifier('globalThis'),
            property: right,
          ),
        ),
        _ => null,
      };
    }
    if (positional.length == 1) {
      final value = lower(positional.single);
      return switch (path) {
        'dart:js_util::@methods::typeofEquals' => null,
        'dart:js_util::@methods::isTruthy' => EsmCall(
          callee: const EsmIdentifier('Boolean'),
          arguments: [value],
        ),
        'dart:js_util::@methods::not' => EsmUnary(
          operator: EsmUnaryOperator.logicalNot,
          operand: value,
        ),
        'dart:js_util::@methods::isJavaScriptArray' => EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Array'),
            property: 'isArray',
          ),
          arguments: [value],
        ),
        'dart:js_util::@methods::isJavaScriptSimpleObject' => EsmBinary(
          left: EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Object'),
              property: 'getPrototypeOf',
            ),
            arguments: [value],
          ),
          operator: EsmBinaryOperator.strictEquals,
          right: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'prototype',
          ),
        ),
        _ => null,
      };
    }
    if (path == 'dart:js_util::@methods::typeofEquals' &&
        positional.length == 2) {
      return EsmBinary(
        left: EsmUnary(
          operator: EsmUnaryOperator.typeOf,
          operand: lower(positional[0]),
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: lower(positional[1]),
      );
    }
    return null;
  }

  EsmExpression? _lowerSmallSdkInstanceInvocation({
    required k.Reference reference,
    required String name,
    required k.Arguments arguments,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpression Function() lowerReceiver,
    required EsmExpression Function(k.Expression argument) lower,
    required EsmExpression? Function(k.Arguments arguments, String name)
    lowerNamedArgument,
  }) {
    final positional = arguments.positional;
    final target = kernelReferencePath(reference);
    if (target.startsWith('dart:concurrent::Mutex::') &&
        name == 'runLocked' &&
        positional.length == 1 &&
        arguments.named.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: lowerReceiver(),
          property: 'runLocked',
        ),
        arguments: [lower(positional.single)],
      );
    }
    if (target.startsWith('dart:ffi::Pointer::') &&
        name == 'cast' &&
        positional.isEmpty &&
        arguments.named.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: 'cast'),
        arguments: const [],
      );
    }
    if (target.startsWith('dart:isolate::SendPort::') &&
        name == 'send' &&
        positional.length == 1 &&
        arguments.named.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: 'send'),
        arguments: [lower(positional.single)],
      );
    }
    if (target.startsWith('dart:isolate::ReceivePort::') &&
        name == 'listen' &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.isolate);
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: lowerReceiver(),
          property: 'listen',
        ),
        arguments: [
          lower(positional.single),
          EsmObjectLiteral([
            if (lowerNamedArgument(arguments, 'onError') case final onError?)
              EsmObjectLiteralProperty.static(key: 'onError', value: onError),
            if (lowerNamedArgument(arguments, 'onDone') case final onDone?)
              EsmObjectLiteralProperty.static(key: 'onDone', value: onDone),
            EsmObjectLiteralProperty.static(
              key: 'cancelOnError',
              value:
                  lowerNamedArgument(arguments, 'cancelOnError') ??
                  const EsmBooleanLiteral(false),
            ),
          ]),
        ],
      );
    }
    if ((target.startsWith('dart:isolate::ReceivePort::') ||
            target.startsWith('dart:isolate::RawReceivePort::')) &&
        name == 'close' &&
        positional.isEmpty &&
        arguments.named.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: 'close'),
        arguments: const [],
      );
    }
    if (target.startsWith('dart:core::Stopwatch::') &&
        (name == 'start' || name == 'stop' || name == 'reset') &&
        positional.isEmpty &&
        arguments.named.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: name),
        arguments: const [],
      );
    }
    return null;
  }

  EsmExpression? _lowerSmallSdkInstanceGet({
    required k.Reference reference,
    required String name,
    required EsmRuntimeHelperUseSet helpers,
    required EsmExpression Function() lowerReceiver,
  }) {
    final target = kernelReferencePath(reference);
    if (target.startsWith('dart:ffi::Pointer::') && name == 'address') {
      return EsmPropertyAccess(receiver: lowerReceiver(), property: 'address');
    }
    if ((target.startsWith('dart:isolate::ReceivePort::') ||
            target.startsWith('dart:isolate::RawReceivePort::')) &&
        name == 'sendPort') {
      helpers.require(EsmRuntimeHelper.isolate);
      return EsmPropertyAccess(receiver: lowerReceiver(), property: 'sendPort');
    }
    if (target.startsWith('dart:core::Stopwatch::') &&
        (name == 'isRunning' ||
            name == 'elapsedMicroseconds' ||
            name == 'elapsedMilliseconds')) {
      return EsmPropertyAccess(receiver: lowerReceiver(), property: name);
    }
    if (target.contains('BoxedDartObject') && name == 'toDart') {
      return EsmPropertyAccess(receiver: lowerReceiver(), property: 'toDart');
    }
    if (target.contains('ExternalDartReference') && name == 'toDartObject') {
      return EsmPropertyAccess(
        receiver: lowerReceiver(),
        property: 'toDartObject',
      );
    }
    return null;
  }

  String _ffiTypeName(k.DartType type) {
    return switch (type) {
      k.InterfaceType(:final classNode) => classNode.name,
      _ => type.toString(),
    };
  }

  EsmExpression? lowerLegacyJsFactoryInvocation({
    required k.StaticInvocation expression,
    required EsmExpression Function(k.Expression argument) lower,
    required EsmExpression Function(EsmExpression value) arrayFrom,
  }) {
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final positional = expression.arguments.positional;
    switch (legacyJsFactorySymbol(expression.targetReference)) {
      case LegacyJsFactorySymbol.jsObject
          when positional.length == 1 || positional.length == 2:
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Reflect'),
            property: 'construct',
          ),
          arguments: [
            lower(positional[0]),
            positional.length == 2
                ? arrayFrom(lower(positional[1]))
                : const EsmArrayLiteral([]),
          ],
        );
      case LegacyJsFactorySymbol.jsObjectFromBrowserObject
          when positional.length == 1:
      case LegacyJsFactorySymbol.jsObjectJsify when positional.length == 1:
        return lower(positional.single);
      case LegacyJsFactorySymbol.jsArray when positional.isEmpty:
        return const EsmArrayLiteral([]);
      case LegacyJsFactorySymbol.jsArrayFrom when positional.length == 1:
        return arrayFrom(lower(positional.single));
      case LegacyJsFactorySymbol.jsFunctionWithThis when positional.length == 1:
        return EsmFunctionExpression(
          parameters: const [],
          body: [
            EsmReturnStatement(
              EsmCall(
                callee: lower(positional.single),
                arguments: [
                  const EsmThis(),
                  const EsmCall(
                    callee: EsmPropertyAccess(
                      receiver: EsmIdentifier('Array'),
                      property: 'from',
                    ),
                    arguments: [EsmIdentifier('arguments')],
                  ),
                ],
              ),
            ),
          ],
        );
      case null:
      default:
        return null;
    }
  }

  EsmExpression? lowerLegacyJsInstanceInvocation({
    required k.Reference reference,
    required String name,
    required k.Arguments arguments,
    required EsmExpression Function() lowerReceiver,
    required EsmExpression Function(k.Expression argument) lower,
    required EsmExpression Function(EsmExpression value) arrayFrom,
  }) {
    if (arguments.named.isNotEmpty || arguments.types.isNotEmpty) {
      return null;
    }
    final positional = arguments.positional;
    final isJsObject = isDartSdkLibraryClassMember(
      reference,
      'dart:js',
      'JsObject',
      name,
    );
    final isJsArray = isDartSdkLibraryClassMember(
      reference,
      'dart:js',
      'JsArray',
      name,
    );
    if (!isJsObject && !isJsArray) {
      return null;
    }
    final receiver = lowerReceiver();
    if (name == '[]' && positional.length == 1) {
      return EsmComputedPropertyAccess(
        receiver: receiver,
        property: lower(positional.single),
      );
    }
    if (name == '[]=' && positional.length == 2) {
      return EsmAssignment(
        target: EsmComputedPropertyAccess(
          receiver: receiver,
          property: lower(positional[0]),
        ),
        value: lower(positional[1]),
      );
    }
    if (name == 'callMethod' &&
        positional.length >= 1 &&
        positional.length <= 2) {
      final method = EsmComputedPropertyAccess(
        receiver: receiver,
        property: lower(positional[0]),
      );
      return EsmCall(
        callee: EsmPropertyAccess(receiver: method, property: 'apply'),
        arguments: [
          receiver,
          positional.length == 2
              ? arrayFrom(lower(positional[1]))
              : const EsmArrayLiteral([]),
        ],
      );
    }
    if (name == 'hasProperty' && positional.length == 1) {
      return EsmBinary(
        left: lower(positional.single),
        operator: EsmBinaryOperator.inOperator,
        right: receiver,
      );
    }
    if (isJsArray && name == 'add' && positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'push'),
        arguments: [lower(positional.single)],
      );
    }
    return null;
  }

  EsmExpression? lowerLegacyJsInstanceGet({
    required k.Reference reference,
    required String name,
    required EsmExpression Function() lowerReceiver,
  }) {
    final isJsArray = isDartSdkLibraryClassMember(
      reference,
      'dart:js',
      'JsArray',
      name,
    );
    if (isJsArray && name == 'length') {
      return EsmPropertyAccess(receiver: lowerReceiver(), property: 'length');
    }
    return null;
  }
}
