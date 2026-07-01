import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpression? lowerDartMathStaticTearOffConstant({
  required k.Reference reference,
}) {
  final symbol = dartMathStaticInvocationSymbol(reference);
  final method = symbol == null ? null : _jsMathStaticFunctionName(symbol);
  if (method == null || symbol == null) {
    return null;
  }
  final parameterNames = switch (_jsMathStaticFunctionArity(symbol)) {
    1 => const ['value'],
    2 => const ['left', 'right'],
    _ => null,
  };
  if (parameterNames == null) {
    return null;
  }
  return EsmArrowFunction(
    parameters: [
      for (final parameter in parameterNames)
        EsmIdentifierParameter(name: parameter),
    ],
    body: EsmCall(
      callee: EsmPropertyAccess(
        receiver: const EsmIdentifier('Math'),
        property: method,
      ),
      arguments: [
        for (final parameter in parameterNames) EsmIdentifier(parameter),
      ],
    ),
  );
}

EsmExpression? lowerDartMathStaticGet(k.StaticGet expression) {
  final property = switch (dartMathStaticGetSymbol(
    expression.targetReference,
  )) {
    DartMathStaticGetSymbol.pi => 'PI',
    DartMathStaticGetSymbol.e => 'E',
    DartMathStaticGetSymbol.ln2 => 'LN2',
    DartMathStaticGetSymbol.ln10 => 'LN10',
    DartMathStaticGetSymbol.log2e => 'LOG2E',
    DartMathStaticGetSymbol.log10e => 'LOG10E',
    DartMathStaticGetSymbol.sqrt1_2 => 'SQRT1_2',
    DartMathStaticGetSymbol.sqrt2 => 'SQRT2',
    null => null,
  };
  return property == null
      ? null
      : EsmPropertyAccess(
          receiver: const EsmIdentifier('Math'),
          property: property,
        );
}

EsmExpression? lowerDartMathStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  if (expression.arguments.named.isNotEmpty) {
    return null;
  }
  final symbol = dartMathStaticInvocationSymbol(expression.targetReference);
  if (symbol == null) {
    return null;
  }
  final positional = expression.arguments.positional;
  switch (symbol) {
    case DartMathStaticInvocationSymbol.random:
    case DartMathStaticInvocationSymbol.randomSecure:
      if (positional.length > 1) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.mathRandom);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mathRandom),
        arguments: [
          positional.isEmpty
              ? const EsmNullLiteral()
              : lower(positional.single),
          EsmBooleanLiteral(
            symbol == DartMathStaticInvocationSymbol.randomSecure,
          ),
        ],
      );
    case DartMathStaticInvocationSymbol.rectangleFromPoints:
      if (positional.length != 2) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.mathRectangle);
      return EsmCall(
        callee: const EsmIdentifier('__dartRectangleFromPoints'),
        arguments: [for (final argument in positional) lower(argument)],
      );
    case DartMathStaticInvocationSymbol.min:
    case DartMathStaticInvocationSymbol.max:
    case DartMathStaticInvocationSymbol.pow:
    case DartMathStaticInvocationSymbol.atan2:
      if (positional.length != 2) {
        return null;
      }
    case DartMathStaticInvocationSymbol.sqrt:
    case DartMathStaticInvocationSymbol.sin:
    case DartMathStaticInvocationSymbol.cos:
    case DartMathStaticInvocationSymbol.tan:
    case DartMathStaticInvocationSymbol.asin:
    case DartMathStaticInvocationSymbol.acos:
    case DartMathStaticInvocationSymbol.atan:
    case DartMathStaticInvocationSymbol.exp:
    case DartMathStaticInvocationSymbol.log:
      if (positional.length != 1) {
        return null;
      }
  }
  return EsmCall(
    callee: EsmPropertyAccess(
      receiver: const EsmIdentifier('Math'),
      property: _jsMathStaticFunctionName(symbol)!,
    ),
    arguments: [for (final argument in positional) lower(argument)],
  );
}

String? _jsMathStaticFunctionName(DartMathStaticInvocationSymbol symbol) {
  return switch (symbol) {
    DartMathStaticInvocationSymbol.min => 'min',
    DartMathStaticInvocationSymbol.max => 'max',
    DartMathStaticInvocationSymbol.pow => 'pow',
    DartMathStaticInvocationSymbol.sqrt => 'sqrt',
    DartMathStaticInvocationSymbol.sin => 'sin',
    DartMathStaticInvocationSymbol.cos => 'cos',
    DartMathStaticInvocationSymbol.tan => 'tan',
    DartMathStaticInvocationSymbol.asin => 'asin',
    DartMathStaticInvocationSymbol.acos => 'acos',
    DartMathStaticInvocationSymbol.atan => 'atan',
    DartMathStaticInvocationSymbol.atan2 => 'atan2',
    DartMathStaticInvocationSymbol.exp => 'exp',
    DartMathStaticInvocationSymbol.log => 'log',
    DartMathStaticInvocationSymbol.random ||
    DartMathStaticInvocationSymbol.randomSecure ||
    DartMathStaticInvocationSymbol.rectangleFromPoints => null,
  };
}

int? _jsMathStaticFunctionArity(DartMathStaticInvocationSymbol symbol) {
  return switch (symbol) {
    DartMathStaticInvocationSymbol.min ||
    DartMathStaticInvocationSymbol.max ||
    DartMathStaticInvocationSymbol.pow ||
    DartMathStaticInvocationSymbol.atan2 => 2,
    DartMathStaticInvocationSymbol.sqrt ||
    DartMathStaticInvocationSymbol.sin ||
    DartMathStaticInvocationSymbol.cos ||
    DartMathStaticInvocationSymbol.tan ||
    DartMathStaticInvocationSymbol.asin ||
    DartMathStaticInvocationSymbol.acos ||
    DartMathStaticInvocationSymbol.atan ||
    DartMathStaticInvocationSymbol.exp ||
    DartMathStaticInvocationSymbol.log => 1,
    DartMathStaticInvocationSymbol.random ||
    DartMathStaticInvocationSymbol.randomSecure ||
    DartMathStaticInvocationSymbol.rectangleFromPoints => null,
  };
}
