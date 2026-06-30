import 'package:kernel/kernel.dart' as k;

import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkStaticInvocationEmitter {
  DartSdkStaticInvocationEmitter({
    required this.helpers,
    required this.emitNamedArgument,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String Function(k.NamedExpression argument) emitNamedArgument;

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
      case null:
        return null;
    }
    return null;
  }
}
