import 'package:kernel/kernel.dart' as k;

import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCollectionStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
}) {
  final arguments = expression.arguments;
  final positional = arguments.positional;
  switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
    case DartSdkStaticInvocationSymbol.collectionNonNulls
        when positional.length == 1 && arguments.named.isEmpty:
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: arrayFrom(lower(positional.single)),
          property: 'filter',
        ),
        arguments: const [
          EsmArrowFunctionIr(
            parameters: [EsmIdentifierParameterIr(name: 'value')],
            body: EsmBinaryIr(
              left: EsmIdentifierIr('value'),
              operator: EsmBinaryOperatorIr.looseNotEquals,
              right: EsmNullLiteralIr(),
            ),
          ),
        ],
      );
    case DartSdkStaticInvocationSymbol.collectionIndexed
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.record);
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: arrayFrom(lower(positional.single)),
          property: 'map',
        ),
        arguments: const [
          EsmArrowFunctionIr(
            parameters: [
              EsmIdentifierParameterIr(name: 'value'),
              EsmIdentifierParameterIr(name: 'index'),
            ],
            body: EsmCallIr(
              callee: EsmIdentifierIr('__dartRecord'),
              arguments: [
                EsmArrayLiteralIr([
                  EsmIdentifierIr('index'),
                  EsmIdentifierIr('value'),
                ]),
                EsmObjectLiteralIr([]),
              ],
            ),
          ),
        ],
      );
    case DartSdkStaticInvocationSymbol.collectionFirstOrNull
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartIterableFirstOrNull'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.collectionLastOrNull
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartIterableLastOrNull'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.collectionSingleOrNull
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartIterableSingleOrNull'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.collectionElementAtOrNull
        when positional.length == 2 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartIterableElementAtOrNull'),
        arguments: [for (final argument in positional) lower(argument)],
      );
    case DartSdkStaticInvocationSymbol.collectionListBaseToString
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.stringify);
      return _dartCollectionToString(
        '[',
        _joinMappedIterable(
          arrayFrom,
          lower(positional.single),
          _dartStringifyValue(),
        ),
        ']',
      );
    case DartSdkStaticInvocationSymbol.collectionSetBaseToString
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.stringify);
      return _dartCollectionToString(
        '{',
        _joinMappedIterable(
          arrayFrom,
          lower(positional.single),
          _dartStringifyValue(),
        ),
        '}',
      );
    case DartSdkStaticInvocationSymbol.collectionMapBaseToString
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.stringify);
      return _dartCollectionToString(
        '{',
        _join(
          EsmCallIr(
            callee: const EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('Array'),
              property: 'from',
            ),
            arguments: [
              lower(positional.single),
              const EsmArrowFunctionIr(
                parameters: [
                  EsmArrayPatternParameterIr(
                    elements: [
                      EsmIdentifierParameterIr(name: 'key'),
                      EsmIdentifierParameterIr(name: 'value'),
                    ],
                  ),
                ],
                body: EsmStringConcatenationIr([
                  EsmCallIr(
                    callee: EsmIdentifierIr('__dartStr'),
                    arguments: [EsmIdentifierIr('key')],
                  ),
                  EsmStringLiteralIr(': '),
                  EsmCallIr(
                    callee: EsmIdentifierIr('__dartStr'),
                    arguments: [EsmIdentifierIr('value')],
                  ),
                ]),
              ),
            ],
          ),
        ),
        '}',
      );
    default:
      return null;
  }
}

EsmExpressionIr? lowerDartCollectionQueueInstanceInvocation({
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
  if (!isDartCollectionQueueMember(reference, name) ||
      arguments.types.isNotEmpty) {
    return null;
  }
  final receiver = lowerReceiver();
  final positional = arguments.positional;
  if ((name == 'add' || name == 'addLast') &&
      arguments.named.isEmpty &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.listAdd);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAdd),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if (name == 'addFirst' && arguments.named.isEmpty && positional.length == 1) {
    return EsmCallIr(
      callee: EsmPropertyAccessIr(receiver: receiver, property: 'unshift'),
      arguments: [lower(positional.single)],
    );
  }
  if (name == 'addAll' && arguments.named.isEmpty && positional.length == 1) {
    helpers.require(EsmRuntimeHelper.listAddAll);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAddAll),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if (name == 'removeFirst' && arguments.named.isEmpty && positional.isEmpty) {
    return EsmCallIr(
      callee: EsmPropertyAccessIr(receiver: receiver, property: 'shift'),
      arguments: const [],
    );
  }
  if (name == 'removeLast' && arguments.named.isEmpty && positional.isEmpty) {
    return EsmCallIr(
      callee: EsmPropertyAccessIr(receiver: receiver, property: 'pop'),
      arguments: const [],
    );
  }
  if (name == 'remove' && arguments.named.isEmpty && positional.length == 1) {
    helpers.require(EsmRuntimeHelper.listMutation);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartListRemove'),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if ((name == 'removeWhere' || name == 'retainWhere') &&
      arguments.named.isEmpty &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.listMutation);
    return EsmCallIr(
      callee: EsmIdentifierIr(
        name == 'removeWhere'
            ? '__dartListRemoveWhere'
            : '__dartListRetainWhere',
      ),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if (name == 'clear' && arguments.named.isEmpty && positional.isEmpty) {
    return EsmAssignmentIr(
      target: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
      value: const EsmNumberLiteralIr(0),
    );
  }
  if (name == 'toList' &&
      positional.isEmpty &&
      _hasOnlyNamedArguments(arguments, {'growable'})) {
    helpers.require(EsmRuntimeHelper.listFactory);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
      arguments: [
        receiver,
        lowerNamedArgument(arguments, 'growable') ??
            const EsmBooleanLiteralIr(true),
      ],
    );
  }
  if (name == 'join' && arguments.named.isEmpty && positional.length <= 1) {
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: arrayFrom(receiver),
        property: 'join',
      ),
      arguments: [
        positional.isEmpty
            ? const EsmStringLiteralIr('')
            : lower(positional.single),
      ],
    );
  }
  if ((name == 'any' || name == 'every') &&
      arguments.named.isEmpty &&
      positional.length == 1) {
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: arrayFrom(receiver),
        property: name == 'any' ? 'some' : 'every',
      ),
      arguments: [lower(positional.single)],
    );
  }
  if (name == 'elementAt' &&
      arguments.named.isEmpty &&
      positional.length == 1) {
    return EsmComputedPropertyAccessIr(
      receiver: arrayFrom(receiver),
      property: lower(positional.single),
    );
  }
  return null;
}

EsmExpressionIr? lowerDartCollectionQueueInstanceGet({
  required k.Reference reference,
  required String name,
  required EsmExpressionIr Function() lowerReceiver,
}) {
  if (!isDartCollectionQueueMember(reference, name)) {
    return null;
  }
  final receiver = lowerReceiver();
  return switch (name) {
    'length' => EsmPropertyAccessIr(receiver: receiver, property: 'length'),
    'isEmpty' => EsmBinaryIr(
      left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
      operator: EsmBinaryOperatorIr.strictEquals,
      right: const EsmNumberLiteralIr(0),
    ),
    'isNotEmpty' => EsmBinaryIr(
      left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
      operator: EsmBinaryOperatorIr.greaterThan,
      right: const EsmNumberLiteralIr(0),
    ),
    'first' => EsmComputedPropertyAccessIr(
      receiver: receiver,
      property: const EsmNumberLiteralIr(0),
    ),
    'last' => EsmCallIr(
      callee: EsmPropertyAccessIr(receiver: receiver, property: 'at'),
      arguments: const [EsmNumberLiteralIr(-1)],
    ),
    _ => null,
  };
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}

EsmArrowFunctionIr _dartStringifyValue() {
  return const EsmArrowFunctionIr(
    parameters: [EsmIdentifierParameterIr(name: 'value')],
    body: EsmCallIr(
      callee: EsmIdentifierIr('__dartStr'),
      arguments: [EsmIdentifierIr('value')],
    ),
  );
}

EsmStringConcatenationIr _dartCollectionToString(
  String open,
  EsmExpressionIr body,
  String close,
) {
  return EsmStringConcatenationIr([
    EsmStringLiteralIr(open),
    body,
    EsmStringLiteralIr(close),
  ]);
}

EsmCallIr _joinMappedIterable(
  EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
  EsmExpressionIr iterable,
  EsmExpressionIr callback,
) {
  return _join(
    EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: arrayFrom(iterable),
        property: 'map',
      ),
      arguments: [callback],
    ),
  );
}

EsmCallIr _join(EsmExpressionIr iterable) {
  return EsmCallIr(
    callee: EsmPropertyAccessIr(receiver: iterable, property: 'join'),
    arguments: const [EsmStringLiteralIr(', ')],
  );
}
