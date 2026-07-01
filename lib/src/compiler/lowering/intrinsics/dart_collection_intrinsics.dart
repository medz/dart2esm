import 'package:kernel/kernel.dart' as k;

import '../../../foundation/kernel/kernel_references.dart';
import '../../../foundation/kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCollectionStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
  required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
}) {
  final coreCollection = _lowerDartCoreCollectionStaticInvocation(
    expression: expression,
    helpers: helpers,
    runtimeHelpers: runtimeHelpers,
    lower: lower,
    lowerNamedArgument: lowerNamedArgument,
    arrayFrom: arrayFrom,
  );
  if (coreCollection != null) {
    return coreCollection;
  }
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

EsmExpressionIr? _lowerDartCoreCollectionStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
  required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
}) {
  final arguments = expression.arguments;
  final target = kernelReferencePath(expression.targetReference);
  final positional = arguments.positional;
  final listCopyFactory = switch (target) {
    'dart:core::List::@factories::of' ||
    'dart:core::List::@factories::from' => true,
    _ => false,
  };
  if (listCopyFactory &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(arguments, {'growable'})) {
    helpers.require(EsmRuntimeHelper.listFactory);
    final growable = lowerNamedArgument(arguments, 'growable');
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
      arguments: [lower(positional.single), if (growable != null) growable],
    );
  }
  if (target == 'dart:core::List::@factories::unmodifiable' &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.listFactory);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartUnmodifiableList'),
      arguments: [lower(positional.single)],
    );
  }
  final listFilledFactory = switch (target) {
    'dart:core::List::@factories::filled' ||
    'dart:core::_List::@factories::filled' ||
    'dart:core::_GrowableList::@factories::filled' => true,
    _ => false,
  };
  if (listFilledFactory &&
      positional.length == 2 &&
      _hasOnlyNamedArguments(arguments, {'growable'})) {
    helpers.require(EsmRuntimeHelper.listFactory);
    final growable =
        lowerNamedArgument(arguments, 'growable') ??
        EsmBooleanLiteralIr(_isCoreGrowableListFactory(target));
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartListFilled'),
      arguments: [for (final argument in positional) lower(argument), growable],
    );
  }
  final listEmptyFactory = switch (target) {
    'dart:core::List::@factories::empty' ||
    'dart:core::_List::@factories::empty' ||
    'dart:core::_GrowableList::@factories::' ||
    'dart:core::_GrowableList::@factories::empty' => true,
    _ => false,
  };
  if (listEmptyFactory &&
      positional.isEmpty &&
      _hasOnlyNamedArguments(arguments, {'growable'})) {
    helpers.require(EsmRuntimeHelper.listFactory);
    final growable =
        lowerNamedArgument(arguments, 'growable') ??
        EsmBooleanLiteralIr(_isCoreGrowableListFactory(target));
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
      arguments: [const EsmArrayLiteralIr([]), growable],
    );
  }
  if ((target == 'dart:core::_GrowableList::@factories::' ||
          target == 'dart:core::_List::@factories::') &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: EsmCallIr(
          callee: const EsmIdentifierIr('Array'),
          arguments: [lower(positional.single)],
        ),
        property: 'fill',
      ),
      arguments: const [EsmNullLiteralIr()],
    );
  }
  if (_isCoreCollectionCastFrom(target) &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    return lower(positional.single);
  }
  if (_isDartCollectionQueueFactory(target) && arguments.named.isEmpty) {
    if (positional.isEmpty) {
      return const EsmArrayLiteralIr([]);
    }
    if (positional.length == 1) {
      return arrayFrom(lower(positional.single));
    }
  }
  if (target == 'dart:core::List::@methods::copyRange' &&
      positional.length >= 3 &&
      positional.length <= 5 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.listRangeOps);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listRangeOps),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  if (target == 'dart:core::List::@methods::writeIterable' &&
      positional.length == 3 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.listRangeOps);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartListWriteIterable'),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  final listGenerateFactory = switch (target) {
    'dart:core::List::@factories::generate' ||
    'dart:core::_GrowableList::@factories::generate' ||
    'dart:core::Iterable::@factories::generate' => true,
    _ => false,
  };
  if (listGenerateFactory &&
      positional.length >= 1 &&
      positional.length <= 2 &&
      _hasOnlyNamedArguments(arguments, {'growable'})) {
    helpers.require(EsmRuntimeHelper.listFactory);
    final generator = positional.length == 1
        ? const EsmArrowFunctionIr(
            parameters: [EsmIdentifierParameterIr(name: 'index')],
            body: EsmIdentifierIr('index'),
          )
        : lower(positional[1]);
    final growable =
        lowerNamedArgument(arguments, 'growable') ??
        EsmBooleanLiteralIr(_isCoreGrowableListFactory(target));
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartListGenerate'),
      arguments: [lower(positional.first), generator, growable],
    );
  }
  if (_isSplayTreeSetEmptyFactory(target) &&
      positional.length <= 2 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.splayTree);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartSplayTreeSet'),
      arguments: [
        _lowerOptionalPositionalArgument(positional, 0, lower),
        _lowerOptionalPositionalArgument(positional, 1, lower),
      ],
    );
  }
  if (_isSplayTreeSetCopyFactory(target) &&
      positional.isNotEmpty &&
      positional.length <= 3 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.splayTree);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartSplayTreeSetFrom'),
      arguments: [
        lower(positional.first),
        _lowerOptionalPositionalArgument(positional, 1, lower),
        _lowerOptionalPositionalArgument(positional, 2, lower),
      ],
    );
  }
  if (_isCoreSetFactory(target) &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.setAddAll);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartSetFrom'),
      arguments: [lower(positional.single)],
    );
  }
  if (_isCoreSetIdentityFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    return EsmNewIr(callee: const EsmIdentifierIr('Set'), arguments: const []);
  }
  if (_isCoreSetEmptyFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.setAddAll);
    return const EsmCallIr(
      callee: EsmIdentifierIr('__dartSetFrom'),
      arguments: [EsmArrayLiteralIr([])],
    );
  }
  if (_isCoreMapFromIterableFactory(target) &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(arguments, {'key', 'value'})) {
    helpers.require(EsmRuntimeHelper.mapFactories);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapFactories),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(arguments, 'key') ?? const EsmNullLiteralIr(),
        lowerNamedArgument(arguments, 'value') ?? const EsmNullLiteralIr(),
      ],
    );
  }
  if (_isCoreMapFromIterablesFactory(target) &&
      positional.length == 2 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.mapFactories);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartMapFromIterables'),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  if (_isSplayTreeMapEmptyFactory(target) &&
      positional.length <= 2 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.splayTree);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartSplayTreeMap'),
      arguments: [
        _lowerOptionalPositionalArgument(positional, 0, lower),
        _lowerOptionalPositionalArgument(positional, 1, lower),
      ],
    );
  }
  if (_isSplayTreeMapCopyFactory(target) &&
      positional.isNotEmpty &&
      positional.length <= 3 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.splayTree);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartSplayTreeMapFromEntries'),
      arguments: [
        lower(positional.first),
        _lowerOptionalPositionalArgument(positional, 1, lower),
        _lowerOptionalPositionalArgument(positional, 2, lower),
      ],
    );
  }
  if (_isCoreMapFactory(target) &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.mapGet);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartMapFromEntries'),
      arguments: [lower(positional.single)],
    );
  }
  if (_isCoreMapIdentityFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    return EsmNewIr(callee: const EsmIdentifierIr('Map'), arguments: const []);
  }
  if (_isCustomHashMapFactory(target) &&
      positional.isEmpty &&
      _hasOnlyNamedArguments(arguments, {'equals', 'hashCode', 'isValidKey'})) {
    helpers.require(EsmRuntimeHelper.customHashMap);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartCustomHashMap'),
      arguments: [
        lowerNamedArgument(arguments, 'equals') ?? const EsmNullLiteralIr(),
        lowerNamedArgument(arguments, 'hashCode') ?? const EsmNullLiteralIr(),
        lowerNamedArgument(arguments, 'isValidKey') ?? const EsmNullLiteralIr(),
      ],
    );
  }
  if (_isCoreMapEmptyFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.mapGet);
    return const EsmCallIr(
      callee: EsmIdentifierIr('__dartMapFromEntries'),
      arguments: [EsmArrayLiteralIr([])],
    );
  }
  return null;
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

EsmExpressionIr _lowerOptionalPositionalArgument(
  List<k.Expression> positional,
  int index,
  EsmExpressionIr Function(k.Expression argument) lower,
) {
  if (index >= positional.length) {
    return const EsmNullLiteralIr();
  }
  return lower(positional[index]);
}

bool _isCoreGrowableListFactory(String target) {
  return target.startsWith('dart:core::_GrowableList::@factories::');
}

bool _isCoreSetFactory(String target) {
  return target == 'dart:core::Set::@factories::of' ||
      target == 'dart:core::Set::@factories::from' ||
      target == 'dart:core::Set::@factories::unmodifiable' ||
      target == 'dart:collection::LinkedHashSet::@factories::of' ||
      target == 'dart:collection::LinkedHashSet::@factories::from';
}

bool _isSplayTreeSetEmptyFactory(String target) {
  return target == 'dart:collection::SplayTreeSet::@factories::';
}

bool _isSplayTreeSetCopyFactory(String target) {
  return target == 'dart:collection::SplayTreeSet::@factories::of' ||
      target == 'dart:collection::SplayTreeSet::@factories::from';
}

bool _isCoreSetIdentityFactory(String target) {
  return target == 'dart:core::Set::@factories::identity' ||
      target == 'dart:collection::LinkedHashSet::@factories::identity';
}

bool _isCoreSetEmptyFactory(String target) {
  return target == 'dart:collection::HashSet::@factories::' ||
      target == 'dart:collection::LinkedHashSet::@factories::';
}

bool _isCoreCollectionCastFrom(String target) {
  return target == 'dart:core::List::@methods::castFrom' ||
      target == 'dart:core::Set::@methods::castFrom' ||
      target == 'dart:core::Map::@methods::castFrom';
}

bool _isDartCollectionQueueFactory(String target) {
  return target.startsWith('dart:collection::Queue::@factories::') ||
      target.startsWith('dart:collection::ListQueue::@factories::') ||
      target.startsWith('dart:collection::DoubleLinkedQueue::@factories::');
}

bool _isCoreMapFactory(String target) {
  return target == 'dart:core::Map::@factories::of' ||
      target == 'dart:core::Map::@factories::from' ||
      target == 'dart:core::Map::@factories::fromEntries' ||
      target == 'dart:core::Map::@factories::unmodifiable' ||
      target == 'dart:collection::LinkedHashMap::@factories::of' ||
      target == 'dart:collection::LinkedHashMap::@factories::from';
}

bool _isSplayTreeMapEmptyFactory(String target) {
  return target == 'dart:collection::SplayTreeMap::@factories::';
}

bool _isSplayTreeMapCopyFactory(String target) {
  return target == 'dart:collection::SplayTreeMap::@factories::of' ||
      target == 'dart:collection::SplayTreeMap::@factories::from';
}

bool _isCoreMapFromIterableFactory(String target) {
  return target == 'dart:core::Map::@factories::fromIterable' ||
      target == 'dart:collection::LinkedHashMap::@factories::fromIterable';
}

bool _isCoreMapFromIterablesFactory(String target) {
  return target == 'dart:core::Map::@factories::fromIterables' ||
      target == 'dart:collection::LinkedHashMap::@factories::fromIterables';
}

bool _isCoreMapIdentityFactory(String target) {
  return target == 'dart:core::Map::@factories::identity' ||
      target == 'dart:collection::LinkedHashMap::@factories::identity';
}

bool _isCustomHashMapFactory(String target) {
  return target == 'dart:collection::HashMap::@factories::' ||
      target == 'dart:collection::LinkedHashMap::@factories::';
}

bool _isCoreMapEmptyFactory(String target) {
  return target == 'dart:collection::HashMap::@factories::' ||
      target == 'dart:collection::LinkedHashMap::@factories::';
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
