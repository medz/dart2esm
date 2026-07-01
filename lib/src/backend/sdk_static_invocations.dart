import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkStaticInvocationEmitter {
  DartSdkStaticInvocationEmitter({
    required this.helpers,
    required this.emitNamedArgument,
    required this.namedArgument,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String Function(k.NamedExpression argument) emitNamedArgument;
  final String? Function(k.Arguments arguments, String name) namedArgument;

  String? emit(
    k.StaticInvocation expression,
    List<String> positionalArgs,
    String args,
  ) {
    switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
      case DartSdkStaticInvocationSymbol.coreEnumName:
        if (positionalArgs.length == 1) {
          return '${positionalArgs.single}.name';
        }
      case DartSdkStaticInvocationSymbol.coreEnumByName:
        if (positionalArgs.length == 2) {
          helpers.add('__dartEnumByName');
          return '__dartEnumByName(${positionalArgs[0]}, ${positionalArgs[1]})';
        }
      case DartSdkStaticInvocationSymbol.coreEnumAsNameMap:
        if (positionalArgs.length == 1) {
          helpers.add('__dartEnumAsNameMap');
          return '__dartEnumAsNameMap(${positionalArgs.single})';
        }
      case DartSdkStaticInvocationSymbol.coreDateTimeCopyWith:
        if (positionalArgs.length == 1) {
          helpers.add('__dartDateTime');
          final options = expression.arguments.named.isEmpty
              ? '{}'
              : '{ ${expression.arguments.named.map(emitNamedArgument).join(', ')} }';
          return '__dartDateTimeCopyWith(${positionalArgs.single}, $options)';
        }
      case DartSdkStaticInvocationSymbol.corePrint:
        helpers.add('__dartPrint');
        helpers.add('__dartStr');
        return '__dartPrint($args)';
      case DartSdkStaticInvocationSymbol.coreIdentical:
        if (positionalArgs.length == 2) {
          return 'Object.is(${positionalArgs[0]}, ${positionalArgs[1]})';
        }
      case DartSdkStaticInvocationSymbol.coreIdentityHashCode:
        if (positionalArgs.length == 1) {
          helpers.add('__dartObjectHash');
          return '__dartHashValue(${positionalArgs.single})';
        }
      case DartSdkStaticInvocationSymbol.coreFunctionApply:
        if (positionalArgs.length >= 2 && positionalArgs.length <= 3) {
          helpers.add('__dartFunctionApply');
          final namedArguments = positionalArgs.length == 3
              ? positionalArgs[2]
              : 'null';
          return '__dartFunctionApply(${positionalArgs[0]}, ${positionalArgs[1]}, $namedArguments)';
        }
      case DartSdkStaticInvocationSymbol.coreIterableToFullString:
      case DartSdkStaticInvocationSymbol.coreIterableToShortString:
        if (positionalArgs.isNotEmpty && positionalArgs.length <= 3) {
          helpers.add('__dartStr');
          final leftDelimiter = positionalArgs.length >= 2
              ? positionalArgs[1]
              : '"("';
          final rightDelimiter = positionalArgs.length >= 3
              ? positionalArgs[2]
              : '")"';
          return '($leftDelimiter + Array.from(${positionalArgs[0]}, (value) => __dartStr(value)).join(", ") + $rightDelimiter)';
        }
      case DartSdkStaticInvocationSymbol.collectionNonNulls:
        if (positionalArgs.length == 1) {
          return 'Array.from(${positionalArgs.single}).filter((value) => value != null)';
        }
      case DartSdkStaticInvocationSymbol.collectionIndexed:
        if (positionalArgs.length == 1) {
          helpers.add('__dartRecord');
          return 'Array.from(${positionalArgs.single}, (value, index) => __dartRecord([index, value], {}))';
        }
      case DartSdkStaticInvocationSymbol.collectionFirstOrNull:
        if (positionalArgs.length == 1) {
          helpers.add('__dartIterableFirstOrNull');
          return '__dartIterableFirstOrNull(${positionalArgs.single})';
        }
      case DartSdkStaticInvocationSymbol.collectionLastOrNull:
        if (positionalArgs.length == 1) {
          helpers.add('__dartIterableLastOrNull');
          return '__dartIterableLastOrNull(${positionalArgs.single})';
        }
      case DartSdkStaticInvocationSymbol.collectionSingleOrNull:
        if (positionalArgs.length == 1) {
          helpers.add('__dartIterableSingleOrNull');
          return '__dartIterableSingleOrNull(${positionalArgs.single})';
        }
      case DartSdkStaticInvocationSymbol.collectionElementAtOrNull:
        if (positionalArgs.length == 2) {
          helpers.add('__dartIterableElementAtOrNull');
          return '__dartIterableElementAtOrNull(${positionalArgs[0]}, ${positionalArgs[1]})';
        }
      case DartSdkStaticInvocationSymbol.internalCheckNotNullable:
        if (positionalArgs.length == 2) {
          helpers.add('__dartNullCheck');
          return '__dartNullCheck(${positionalArgs[0]})';
        }
      case DartSdkStaticInvocationSymbol.internalBytesBuilder:
        if (positionalArgs.isEmpty) {
          helpers.add('__dartBytesBuilder');
          final copy = namedArgument(expression.arguments, 'copy') ?? 'true';
          return '__dartBytesBuilder($copy)';
        }
      case DartSdkStaticInvocationSymbol.internalSort:
        if (positionalArgs.length == 2) {
          helpers.add('__dartListSort');
          return '__dartListSort(${positionalArgs[0]}, ${positionalArgs[1]})';
        }
      case DartSdkStaticInvocationSymbol.internalSortRange:
        if (positionalArgs.length == 4) {
          helpers.add('__dartCoreError');
          helpers.add('__dartListSortRange');
          return '__dartListSortRange(${positionalArgs[0]}, ${positionalArgs[1]}, ${positionalArgs[2]}, ${positionalArgs[3]})';
        }
      case DartSdkStaticInvocationSymbol.internalFollowedByFirstEfficient:
        if (positionalArgs.length == 2) {
          return 'Array.from(${positionalArgs[0]}).concat(Array.from(${positionalArgs[1]}))';
        }
      case DartSdkStaticInvocationSymbol.iterableElementErrorNoElement:
        return _emitIterableElementError(positionalArgs, 'No element');
      case DartSdkStaticInvocationSymbol.iterableElementErrorTooMany:
        return _emitIterableElementError(positionalArgs, 'Too many elements');
      case DartSdkStaticInvocationSymbol.iterableElementErrorTooFew:
        return _emitIterableElementError(positionalArgs, 'Too few elements');
      case DartSdkStaticInvocationSymbol.collectionListBaseToString:
        if (positionalArgs.length == 1) {
          helpers.add('__dartStr');
          return '("[" + Array.from(${positionalArgs.single}, (value) => __dartStr(value)).join(", ") + "]")';
        }
      case DartSdkStaticInvocationSymbol.collectionSetBaseToString:
        if (positionalArgs.length == 1) {
          helpers.add('__dartStr');
          return '("{" + Array.from(${positionalArgs.single}, (value) => __dartStr(value)).join(", ") + "}")';
        }
      case DartSdkStaticInvocationSymbol.collectionMapBaseToString:
        if (positionalArgs.length == 1) {
          helpers.add('__dartStr');
          return '("{" + Array.from(${positionalArgs.single}, ([key, value]) => __dartStr(key) + ": " + __dartStr(value)).join(", ") + "}")';
        }
      case null:
        return null;
    }
    return null;
  }

  String? _emitIterableElementError(
    List<String> positionalArgs,
    String message,
  ) {
    if (positionalArgs.isNotEmpty) {
      return null;
    }
    helpers.add('__dartCoreError');
    return '__dartCoreError("StateError", ${jsonEncode(message)})';
  }
}
