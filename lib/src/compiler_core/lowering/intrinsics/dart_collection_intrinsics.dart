import 'package:kernel/kernel.dart' as k;

import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

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
