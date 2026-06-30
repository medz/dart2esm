import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import 'runtime_helpers.dart';

final class DartSdkJsInteropInvocationEmitter {
  DartSdkJsInteropInvocationEmitter({
    required this.helpers,
    required this.emitTypeTest,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String Function(String operand, k.DartType type, Object node)
  emitTypeTest;

  String? emitStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (path.startsWith('dart:js_interop::@methods::')) {
      final member = path.split('::').last;
      final jsInteropInvocation = _emitModernJsInteropInvocation(
        member,
        expression,
        positionalArgs,
      );
      if (jsInteropInvocation != null) {
        return jsInteropInvocation;
      }
    }
    if (path.startsWith('dart:js_interop_unsafe::@methods::')) {
      final member = path.split('::').last;
      final unsafeInvocation = _emitModernJsInteropUnsafeInvocation(
        member,
        positionalArgs,
      );
      if (unsafeInvocation != null) {
        return unsafeInvocation;
      }
    }
    if (path.startsWith('dart:_js_helper::') ||
        path.startsWith('dart:js_util::')) {
      return _emitJsUtilInvocation(path.split('::').last, positionalArgs);
    }
    return null;
  }

  String? emitInstanceGet(k.Reference target, String name, String receiver) {
    final path = kernelReferencePath(target);
    if (path.startsWith('dart:js_interop::JSSymbol::@getters::')) {
      return switch (name) {
        'description' => '($receiver.description ?? null)',
        'key' => '(Symbol.keyFor($receiver) ?? null)',
        _ => null,
      };
    }
    if ((path.startsWith('dart:js_interop::JSIterableProtocol::@getters::') ||
            path.startsWith('dart:js_interop::JSIterable::@getters::')) &&
        name == 'iterator') {
      return '$receiver[Symbol.iterator]()';
    }
    if (path.startsWith('dart:js_interop::JSIteratorResult::@getters::')) {
      return switch (name) {
        'isDone' => '($receiver.done === true)',
        'value' => '($receiver.value ?? null)',
        '_done' => '($receiver.done ?? null)',
        '_value' => '($receiver.value ?? null)',
        _ => null,
      };
    }
    return null;
  }

  String? _emitJsUtilInvocation(String name, List<String> positionalArgs) {
    if ((name == 'getProperty' || name == '_getPropertyTrustType') &&
        positionalArgs.length == 2) {
      return '${positionalArgs[0]}[${positionalArgs[1]}]';
    }
    if (name == 'newObject' && positionalArgs.isEmpty) {
      return '({})';
    }
    if ((name == 'setProperty' || name == '_setPropertyUnchecked') &&
        positionalArgs.length == 3) {
      return '(${positionalArgs[0]}[${positionalArgs[1]}] = ${positionalArgs[2]})';
    }
    if (name == 'hasProperty' && positionalArgs.length == 2) {
      return '(${positionalArgs[1]} in ${positionalArgs[0]})';
    }
    if (name == 'instanceof' && positionalArgs.length == 2) {
      return '${positionalArgs[0]} instanceof ${positionalArgs[1]}';
    }
    if (name == 'instanceOfString' && positionalArgs.length == 2) {
      helpers.add('__dartJsInstanceOfString');
      return '__dartJsInstanceOfString(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if ((name == 'callMethod' || name == '_callMethodTrustType') &&
        positionalArgs.length == 3) {
      return '${positionalArgs[0]}[${positionalArgs[1]}](...Array.from(${positionalArgs[2]}))';
    }
    if (name == 'callConstructor' && positionalArgs.length == 2) {
      return 'new ${positionalArgs[0]}(...Array.from(${positionalArgs[1]} ?? []))';
    }
    if (name == 'jsify' && positionalArgs.length == 1) {
      helpers.add('__dartJsify');
      return '__dartJsify(${positionalArgs.single})';
    }
    if (name == 'dartify' && positionalArgs.length == 1) {
      helpers.add('__dartJsDartify');
      return '__dartJsDartify(${positionalArgs.single})';
    }
    if (name == 'promiseToFuture' && positionalArgs.length == 1) {
      return 'Promise.resolve(${positionalArgs.single})';
    }
    if (name == 'objectGetPrototypeOf' && positionalArgs.length == 1) {
      return 'Object.getPrototypeOf(${positionalArgs.single})';
    }
    if (name == 'objectKeys' && positionalArgs.length == 1) {
      return 'Object.keys(${positionalArgs.single})';
    }
    if (name == 'isJavaScriptArray' && positionalArgs.length == 1) {
      return 'Array.isArray(${positionalArgs.single})';
    }
    if (name == 'isJavaScriptSimpleObject' && positionalArgs.length == 1) {
      final value = positionalArgs.single;
      return '($value != null && typeof $value === "object" && (Object.getPrototypeOf($value) === Object.prototype || Object.getPrototypeOf($value) === null))';
    }
    if (name == 'typeofEquals' && positionalArgs.length == 2) {
      return 'typeof ${positionalArgs[0]} === ${positionalArgs[1]}';
    }
    final binaryOperator = switch (name) {
      'add' => '+',
      'subtract' => '-',
      'multiply' => '*',
      'divide' => '/',
      'exponentiate' => '**',
      'modulo' => '%',
      'equal' => '==',
      'strictEqual' => '===',
      'notEqual' => '!=',
      'strictNotEqual' => '!==',
      'greaterThan' => '>',
      'greaterThanOrEqual' => '>=',
      'lessThan' => '<',
      'lessThanOrEqual' => '<=',
      'or' => '||',
      'and' => '&&',
      _ => null,
    };
    if (binaryOperator != null && positionalArgs.length == 2) {
      return '(${positionalArgs[0]} $binaryOperator ${positionalArgs[1]})';
    }
    if (name == 'not' && positionalArgs.length == 1) {
      return '(!${positionalArgs.single})';
    }
    if (name == 'isTruthy' && positionalArgs.length == 1) {
      return '(!!${positionalArgs.single})';
    }
    if (name == 'delete' && positionalArgs.length == 2) {
      return '(delete ${positionalArgs[0]}[${positionalArgs[1]}])';
    }
    if (name == 'unsignedRightShift' && positionalArgs.length == 2) {
      return '(${positionalArgs[0]} >>> ${positionalArgs[1]})';
    }
    if (name == '_jsFunctionToDart' && positionalArgs.length == 1) {
      helpers.add('__dartIsJsExportedFunction');
      helpers.add('__dartJsExportedFunctionToDart');
      return '__dartJsExportedFunctionToDart(${positionalArgs.single})';
    }
    if (RegExp(r'^_functionToJS(?:[0-5]|N)$').hasMatch(name) &&
        positionalArgs.isNotEmpty) {
      helpers.add('__dartJsExportFunction');
      return '__dartJsExportFunction(${positionalArgs.first})';
    }
    if (RegExp(r'^_functionToJSCaptureThis(?:[0-5]|N)$').hasMatch(name) &&
        positionalArgs.isNotEmpty) {
      helpers.add('__dartJsExportCaptureThis');
      return '__dartJsExportCaptureThis(${positionalArgs.first})';
    }
    if ((name.startsWith('_callMethodUnchecked') ||
            name.startsWith('_callMethodUncheckedTrustType')) &&
        positionalArgs.length >= 2) {
      return '${positionalArgs[0]}[${positionalArgs[1]}](${positionalArgs.skip(2).join(', ')})';
    }
    if (name.startsWith('_callConstructorUnchecked') &&
        positionalArgs.length >= 1) {
      return 'new ${positionalArgs[0]}(${positionalArgs.skip(1).join(', ')})';
    }
    return null;
  }

  String? _emitModernJsInteropInvocation(
    String member,
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    if (member == 'JSObject|constructor#' && positionalArgs.isEmpty) {
      return '({})';
    }
    if (member == 'JSArray|constructor#' && positionalArgs.isEmpty) {
      return '[]';
    }
    if (member == 'JSArray|constructor#withLength' &&
        positionalArgs.length == 1) {
      return 'new Array(${positionalArgs.single})';
    }
    if (member == 'JSSymbol|constructor#' && positionalArgs.length <= 1) {
      final description = positionalArgs.isEmpty ? '' : positionalArgs.single;
      return 'Symbol($description)';
    }
    if (member == 'JSPromise|constructor#' && positionalArgs.length == 1) {
      return 'new Promise(${positionalArgs.single})';
    }
    if (member == 'JSSymbol|forKey' && positionalArgs.length == 1) {
      return 'Symbol.for(${positionalArgs.single})';
    }
    if (member == '_isJSBoxedDartObject' && positionalArgs.length == 1) {
      helpers.add('__dartIsJsBox');
      return '__dartIsJsBox(${positionalArgs.single})';
    }
    if (member == '_isNullableJSBoxedDartObject' &&
        positionalArgs.length == 1) {
      helpers.add('__dartIsJsBox');
      final value = positionalArgs.single;
      return '($value == null || __dartIsJsBox($value))';
    }
    if (member == '_isJSExportedDartFunction' && positionalArgs.length == 1) {
      helpers.add('__dartIsJsExportedFunction');
      return '__dartIsJsExportedFunction(${positionalArgs.single})';
    }
    if (member == '_isNullableJSExportedDartFunction' &&
        positionalArgs.length == 1) {
      helpers.add('__dartIsJsExportedFunction');
      final value = positionalArgs.single;
      return '($value == null || __dartIsJsExportedFunction($value))';
    }
    if (member == 'JSSymbol|get#_keyFor' && positionalArgs.length == 1) {
      return '(Symbol.keyFor(${positionalArgs.single}) ?? null)';
    }
    if (member == 'JSIteratorResult|constructor#value' &&
        positionalArgs.length == 1) {
      return '({ value: ${positionalArgs.single}, done: false })';
    }
    if (member == 'JSIteratorResult|constructor#done' &&
        positionalArgs.length <= 1) {
      final value = positionalArgs.isEmpty
          ? ''
          : ' value: ${positionalArgs.single},';
      return '({$value done: true })';
    }
    if (member == 'importModule' && positionalArgs.length == 1) {
      return 'import(${positionalArgs.single})';
    }
    if (positionalArgs.isEmpty) {
      return null;
    }
    final receiver = positionalArgs.first;
    if (member == 'IterableToJSIterable|get#toJSIterable' &&
        positionalArgs.length == 1) {
      helpers.add('__dartIterator');
      helpers.add('__dartJsIterableFromDartIterable');
      return '__dartJsIterableFromDartIterable($receiver)';
    }
    if (member == 'JSIterableToIterable|get#toDartIterable' &&
        positionalArgs.length == 1) {
      return 'Array.from($receiver)';
    }
    if (member == 'IteratorToJSIterator|get#toJSIterator' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsIteratorFromDartIterator');
      return '__dartJsIteratorFromDartIterator($receiver)';
    }
    if (member == 'JSIteratorToIterator|get#toDartIterator' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsIteratorToDartIterator');
      return '__dartJsIteratorToDartIterator($receiver)';
    }
    if ((member == 'JSIterableProtocol|get#iterator' ||
            member == 'JSIterable|get#iterator') &&
        positionalArgs.length == 1) {
      return '$receiver[Symbol.iterator]()';
    }
    if ((member == 'JSIteratorProtocol|next' ||
            member == 'JSIteratorProtocol|_returnValue' ||
            member == 'JSIteratorProtocol|_throwError' ||
            member == 'JSIterator|drop' ||
            member == 'JSIterator|take') &&
        positionalArgs.isNotEmpty) {
      final method = switch (member) {
        'JSIteratorProtocol|_returnValue' => 'return',
        'JSIteratorProtocol|_throwError' => 'throw',
        'JSIterator|drop' => 'drop',
        'JSIterator|take' => 'take',
        _ => 'next',
      };
      return '$receiver[${jsonEncode(method)}](${positionalArgs.skip(1).join(', ')})';
    }
    if ((member == 'JSIteratorResult|get#isDone' ||
            member == 'JSIteratorResult|get#_done') &&
        positionalArgs.length == 1) {
      return member.endsWith('isDone')
          ? '($receiver.done === true)'
          : '($receiver.done ?? null)';
    }
    if ((member == 'JSIteratorResult|get#value' ||
            member == 'JSIteratorResult|get#_value') &&
        positionalArgs.length == 1) {
      return '($receiver.value ?? null)';
    }
    if (member == 'JSSymbol|get#description' && positionalArgs.length == 1) {
      return '($receiver.description ?? null)';
    }
    if (member == 'JSSymbol|get#key' && positionalArgs.length == 1) {
      return '(Symbol.keyFor($receiver) ?? null)';
    }
    if (member == 'ObjectToJSBoxedDartObject|get#toJSBox' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsBox');
      return '__dartJsBox($receiver)';
    }
    if (member == 'JSBoxedDartObjectToObject|get#toDart' &&
        positionalArgs.length == 1) {
      helpers.add('__dartIsJsBox');
      helpers.add('__dartJsUnbox');
      return '__dartJsUnbox($receiver)';
    }
    if ((member == 'ObjectToExternalDartReference|get#toExternalReference' ||
            member == 'ExternalDartReferenceToObject|get#toDartObject') &&
        positionalArgs.length == 1) {
      return receiver;
    }
    if ((member == 'JSPromiseToFuture|get#toDart' ||
            member == 'FutureOfJSAnyToJSPromise|get#toJS' ||
            member == 'FutureOfVoidToJSPromise|get#toJS') &&
        positionalArgs.length == 1) {
      return 'Promise.resolve($receiver)';
    }
    if (_isJsIdentityConversion(member) && positionalArgs.length == 1) {
      return receiver;
    }
    if (member == 'JSNumberToNumber|get#toDartInt' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsNumberToDartInt');
      return '__dartJsNumberToDartInt($receiver)';
    }
    if (member == 'NullableUndefineableJSAnyExtension|get#isUndefined' &&
        positionalArgs.length == 1) {
      return '$receiver === undefined';
    }
    if (member == 'NullableUndefineableJSAnyExtension|get#isNull' &&
        positionalArgs.length == 1) {
      return '$receiver === null';
    }
    if (member == 'JSAnyUtilityExtension|typeofEquals' &&
        positionalArgs.length == 2) {
      return 'typeof $receiver === ${positionalArgs[1]}';
    }
    if (member == 'JSAnyUtilityExtension|instanceof' &&
        positionalArgs.length == 2) {
      return '$receiver instanceof ${positionalArgs[1]}';
    }
    if (member == 'JSAnyUtilityExtension|instanceOfString' &&
        positionalArgs.length == 2) {
      helpers.add('__dartJsInstanceOfString');
      return '__dartJsInstanceOfString($receiver, ${positionalArgs[1]})';
    }
    if (member == 'JSAnyUtilityExtension|dartify' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsDartify');
      return '__dartJsDartify($receiver)';
    }
    if (member == 'NullableObjectUtilExtension|jsify' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsify');
      return '__dartJsify($receiver)';
    }
    if (member == 'NullableObjectUtilExtension|isA' &&
        positionalArgs.length == 1 &&
        expression.arguments.types.length == 1) {
      return emitTypeTest(
        receiver,
        expression.arguments.types.single,
        expression,
      );
    }
    if (member == 'JSFunctionUtilExtension|callAsFunction') {
      return '${receiver}.call(${positionalArgs.skip(1).join(', ')})';
    }
    if (member == 'JSExportedDartFunctionToFunction|get#toDart' &&
        positionalArgs.length == 1) {
      helpers.add('__dartIsJsExportedFunction');
      helpers.add('__dartJsExportedFunctionToDart');
      return '__dartJsExportedFunctionToDart($receiver)';
    }
    if (member == 'FunctionToJSExportedDartFunction|get#toJS' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsExportFunction');
      return '__dartJsExportFunction($receiver)';
    }
    if (member == 'FunctionToJSExportedDartFunction|get#toJSCaptureThis' &&
        positionalArgs.length == 1) {
      helpers.add('__dartJsExportCaptureThis');
      return '__dartJsExportCaptureThis($receiver)';
    }
    return null;
  }

  bool _isJsIdentityConversion(String member) {
    return switch (member) {
      'StringToJSString|get#toJS' ||
      'JSStringToString|get#toDart' ||
      'DoubleToJSNumber|get#toJS' ||
      'NumToJSExtension|get#toJS' ||
      'JSNumberToNumber|get#toDartDouble' ||
      'BoolToJSBoolean|get#toJS' ||
      'JSBooleanToBool|get#toDart' ||
      'ListToJSArray|get#toJS' ||
      'ListToJSArray|get#toJSProxyOrRef' ||
      'JSArrayToList|get#toDart' ||
      'JSArrayBufferToByteBuffer|get#toDart' ||
      'ByteBufferToJSArrayBuffer|get#toJS' ||
      'JSDataViewToByteData|get#toDart' ||
      'ByteDataToJSDataView|get#toJS' ||
      'JSInt8ArrayToInt8List|get#toDart' ||
      'Int8ListToJSInt8Array|get#toJS' ||
      'JSUint8ArrayToUint8List|get#toDart' ||
      'Uint8ListToJSUint8Array|get#toJS' ||
      'JSUint8ClampedArrayToUint8ClampedList|get#toDart' ||
      'Uint8ClampedListToJSUint8ClampedArray|get#toJS' ||
      'JSInt16ArrayToInt16List|get#toDart' ||
      'Int16ListToJSInt16Array|get#toJS' ||
      'JSUint16ArrayToUint16List|get#toDart' ||
      'Uint16ListToJSUint16Array|get#toJS' ||
      'JSInt32ArrayToInt32List|get#toDart' ||
      'Int32ListToJSInt32Array|get#toJS' ||
      'JSUint32ArrayToUint32List|get#toDart' ||
      'Uint32ListToJSUint32Array|get#toJS' ||
      'JSFloat32ArrayToFloat32List|get#toDart' ||
      'Float32ListToJSFloat32Array|get#toJS' ||
      'JSFloat64ArrayToFloat64List|get#toDart' ||
      'Float64ListToJSFloat64Array|get#toJS' => true,
      _ => false,
    };
  }

  String? _emitModernJsInteropUnsafeInvocation(
    String member,
    List<String> positionalArgs,
  ) {
    if (positionalArgs.isEmpty) {
      return null;
    }
    final receiver = positionalArgs.first;
    if (member == 'JSObjectUnsafeUtilExtension|has' &&
        positionalArgs.length == 2) {
      return '(${positionalArgs[1]} in $receiver)';
    }
    if (member == 'JSObjectUnsafeUtilExtension|[]' &&
        positionalArgs.length == 2) {
      return '$receiver[${positionalArgs[1]}]';
    }
    if (member == 'JSObjectUnsafeUtilExtension|[]=' &&
        positionalArgs.length == 3) {
      return '($receiver[${positionalArgs[1]}] = ${positionalArgs[2]})';
    }
    if (member == 'JSObjectUnsafeUtilExtension|hasProperty' &&
        positionalArgs.length == 2) {
      return '(${positionalArgs[1]} in $receiver)';
    }
    if (member == 'JSObjectUnsafeUtilExtension|getProperty' &&
        positionalArgs.length == 2) {
      return '$receiver[${positionalArgs[1]}]';
    }
    if (member == 'JSObjectUnsafeUtilExtension|setProperty' &&
        positionalArgs.length == 3) {
      return '($receiver[${positionalArgs[1]}] = ${positionalArgs[2]})';
    }
    if (member == 'JSObjectUnsafeUtilExtension|delete' &&
        positionalArgs.length == 2) {
      return '(delete $receiver[${positionalArgs[1]}])';
    }
    if ((member == 'JSObjectUnsafeUtilExtension|callMethod' ||
            member == 'JSObjectUnsafeUtilExtension|_callMethod') &&
        positionalArgs.length >= 2) {
      helpers.add('__dartJsCallMethodOptional');
      return '__dartJsCallMethodOptional($receiver, ${positionalArgs[1]}, [${positionalArgs.skip(2).join(', ')}])';
    }
    if ((member == 'JSObjectUnsafeUtilExtension|callMethodVarArgs' ||
            member == 'JSObjectUnsafeUtilExtension|_callMethodVarArgs') &&
        positionalArgs.length >= 2 &&
        positionalArgs.length <= 3) {
      final args = positionalArgs.length == 3 ? positionalArgs[2] : 'null';
      return '$receiver[${positionalArgs[1]}](...Array.from($args ?? []))';
    }
    if (member == 'JSFunctionUnsafeUtilExtension|_callAsConstructor' &&
        positionalArgs.length >= 1) {
      helpers.add('__dartJsConstructOptional');
      return '__dartJsConstructOptional($receiver, [${positionalArgs.skip(1).join(', ')}])';
    }
    if (member == 'JSFunctionUnsafeUtilExtension|callAsConstructor' &&
        positionalArgs.length >= 1) {
      helpers.add('__dartJsConstructOptional');
      return '__dartJsConstructOptional($receiver, [${positionalArgs.skip(1).join(', ')}])';
    }
    if ((member == 'JSFunctionUnsafeUtilExtension|callAsConstructorVarArgs' ||
            member ==
                'JSFunctionUnsafeUtilExtension|_callAsConstructorVarArgs') &&
        positionalArgs.length <= 2) {
      final args = positionalArgs.length == 2 ? positionalArgs[1] : 'null';
      return 'new $receiver(...Array.from($args ?? []))';
    }
    return null;
  }
}
