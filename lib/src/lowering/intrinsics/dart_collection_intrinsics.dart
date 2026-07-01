import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpression? lowerDartCollectionStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
  required EsmExpression Function(EsmExpression value) arrayFrom,
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
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: arrayFrom(lower(positional.single)),
          property: 'filter',
        ),
        arguments: const [
          EsmArrowFunction(
            parameters: [EsmIdentifierParameter(name: 'value')],
            body: EsmBinary(
              left: EsmIdentifier('value'),
              operator: EsmBinaryOperator.looseNotEquals,
              right: EsmNullLiteral(),
            ),
          ),
        ],
      );
    case DartSdkStaticInvocationSymbol.collectionIndexed
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.record);
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: arrayFrom(lower(positional.single)),
          property: 'map',
        ),
        arguments: const [
          EsmArrowFunction(
            parameters: [
              EsmIdentifierParameter(name: 'value'),
              EsmIdentifierParameter(name: 'index'),
            ],
            body: EsmCall(
              callee: EsmIdentifier('__dartRecord'),
              arguments: [
                EsmArrayLiteral([
                  EsmIdentifier('index'),
                  EsmIdentifier('value'),
                ]),
                EsmObjectLiteral([]),
              ],
            ),
          ),
        ],
      );
    case DartSdkStaticInvocationSymbol.collectionFirstOrNull
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCall(
        callee: const EsmIdentifier('__dartIterableFirstOrNull'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.collectionLastOrNull
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCall(
        callee: const EsmIdentifier('__dartIterableLastOrNull'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.collectionSingleOrNull
        when positional.length == 1 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCall(
        callee: const EsmIdentifier('__dartIterableSingleOrNull'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.collectionElementAtOrNull
        when positional.length == 2 && arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCall(
        callee: const EsmIdentifier('__dartIterableElementAtOrNull'),
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
          EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Array'),
              property: 'from',
            ),
            arguments: [
              lower(positional.single),
              const EsmArrowFunction(
                parameters: [
                  EsmArrayPatternParameter(
                    elements: [
                      EsmIdentifierParameter(name: 'key'),
                      EsmIdentifierParameter(name: 'value'),
                    ],
                  ),
                ],
                body: EsmStringConcatenation([
                  EsmCall(
                    callee: EsmIdentifier('__dartStr'),
                    arguments: [EsmIdentifier('key')],
                  ),
                  EsmStringLiteral(': '),
                  EsmCall(
                    callee: EsmIdentifier('__dartStr'),
                    arguments: [EsmIdentifier('value')],
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

EsmExpression? _lowerDartCoreCollectionStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
  required EsmExpression Function(EsmExpression value) arrayFrom,
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
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
      arguments: [lower(positional.single), if (growable != null) growable],
    );
  }
  if (target == 'dart:core::List::@factories::unmodifiable' &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.listFactory);
    return EsmCall(
      callee: const EsmIdentifier('__dartUnmodifiableList'),
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
        EsmBooleanLiteral(_isCoreGrowableListFactory(target));
    return EsmCall(
      callee: const EsmIdentifier('__dartListFilled'),
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
        EsmBooleanLiteral(_isCoreGrowableListFactory(target));
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
      arguments: [const EsmArrayLiteral([]), growable],
    );
  }
  if ((target == 'dart:core::_GrowableList::@factories::' ||
          target == 'dart:core::_List::@factories::') &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: EsmCall(
          callee: const EsmIdentifier('Array'),
          arguments: [lower(positional.single)],
        ),
        property: 'fill',
      ),
      arguments: const [EsmNullLiteral()],
    );
  }
  if (_isCoreCollectionCastFrom(target) &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    return lower(positional.single);
  }
  if (_isDartCollectionQueueFactory(target) && arguments.named.isEmpty) {
    if (positional.isEmpty) {
      return const EsmArrayLiteral([]);
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
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listRangeOps),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  if (target == 'dart:core::List::@methods::writeIterable' &&
      positional.length == 3 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.listRangeOps);
    return EsmCall(
      callee: const EsmIdentifier('__dartListWriteIterable'),
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
        ? const EsmArrowFunction(
            parameters: [EsmIdentifierParameter(name: 'index')],
            body: EsmIdentifier('index'),
          )
        : lower(positional[1]);
    final growable =
        lowerNamedArgument(arguments, 'growable') ??
        EsmBooleanLiteral(_isCoreGrowableListFactory(target));
    return EsmCall(
      callee: const EsmIdentifier('__dartListGenerate'),
      arguments: [lower(positional.first), generator, growable],
    );
  }
  if (_isSplayTreeSetEmptyFactory(target) &&
      positional.length <= 2 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.splayTree);
    return EsmCall(
      callee: const EsmIdentifier('__dartSplayTreeSet'),
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
    return EsmCall(
      callee: const EsmIdentifier('__dartSplayTreeSetFrom'),
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
    return EsmCall(
      callee: const EsmIdentifier('__dartSetFrom'),
      arguments: [lower(positional.single)],
    );
  }
  if (_isCoreSetIdentityFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    return EsmNew(callee: const EsmIdentifier('Set'), arguments: const []);
  }
  if (_isCoreSetEmptyFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.setAddAll);
    return const EsmCall(
      callee: EsmIdentifier('__dartSetFrom'),
      arguments: [EsmArrayLiteral([])],
    );
  }
  if (_isCoreMapFromIterableFactory(target) &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(arguments, {'key', 'value'})) {
    helpers.require(EsmRuntimeHelper.mapFactories);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapFactories),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(arguments, 'key') ?? const EsmNullLiteral(),
        lowerNamedArgument(arguments, 'value') ?? const EsmNullLiteral(),
      ],
    );
  }
  if (_isCoreMapFromIterablesFactory(target) &&
      positional.length == 2 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.mapFactories);
    return EsmCall(
      callee: const EsmIdentifier('__dartMapFromIterables'),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  if (_isSplayTreeMapEmptyFactory(target) &&
      positional.length <= 2 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.splayTree);
    return EsmCall(
      callee: const EsmIdentifier('__dartSplayTreeMap'),
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
    return EsmCall(
      callee: const EsmIdentifier('__dartSplayTreeMapFromEntries'),
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
    return EsmCall(
      callee: const EsmIdentifier('__dartMapFromEntries'),
      arguments: [lower(positional.single)],
    );
  }
  if (_isCoreMapIdentityFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    return EsmNew(callee: const EsmIdentifier('Map'), arguments: const []);
  }
  if (_isCustomHashMapFactory(target) &&
      positional.isEmpty &&
      _hasOnlyNamedArguments(arguments, {'equals', 'hashCode', 'isValidKey'})) {
    helpers.require(EsmRuntimeHelper.customHashMap);
    return EsmCall(
      callee: const EsmIdentifier('__dartCustomHashMap'),
      arguments: [
        lowerNamedArgument(arguments, 'equals') ?? const EsmNullLiteral(),
        lowerNamedArgument(arguments, 'hashCode') ?? const EsmNullLiteral(),
        lowerNamedArgument(arguments, 'isValidKey') ?? const EsmNullLiteral(),
      ],
    );
  }
  if (_isCoreMapEmptyFactory(target) &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.mapGet);
    return const EsmCall(
      callee: EsmIdentifier('__dartMapFromEntries'),
      arguments: [EsmArrayLiteral([])],
    );
  }
  return null;
}

EsmExpression? lowerDartCollectionQueueInstanceInvocation({
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
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAdd),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if (name == 'addFirst' && arguments.named.isEmpty && positional.length == 1) {
    return EsmCall(
      callee: EsmPropertyAccess(receiver: receiver, property: 'unshift'),
      arguments: [lower(positional.single)],
    );
  }
  if (name == 'addAll' && arguments.named.isEmpty && positional.length == 1) {
    helpers.require(EsmRuntimeHelper.listAddAll);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAddAll),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if (name == 'removeFirst' && arguments.named.isEmpty && positional.isEmpty) {
    return EsmCall(
      callee: EsmPropertyAccess(receiver: receiver, property: 'shift'),
      arguments: const [],
    );
  }
  if (name == 'removeLast' && arguments.named.isEmpty && positional.isEmpty) {
    return EsmCall(
      callee: EsmPropertyAccess(receiver: receiver, property: 'pop'),
      arguments: const [],
    );
  }
  if (name == 'remove' && arguments.named.isEmpty && positional.length == 1) {
    helpers.require(EsmRuntimeHelper.listMutation);
    return EsmCall(
      callee: const EsmIdentifier('__dartListRemove'),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if ((name == 'removeWhere' || name == 'retainWhere') &&
      arguments.named.isEmpty &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.listMutation);
    return EsmCall(
      callee: EsmIdentifier(
        name == 'removeWhere'
            ? '__dartListRemoveWhere'
            : '__dartListRetainWhere',
      ),
      arguments: [receiver, lower(positional.single)],
    );
  }
  if (name == 'clear' && arguments.named.isEmpty && positional.isEmpty) {
    return EsmAssignment(
      target: EsmPropertyAccess(receiver: receiver, property: 'length'),
      value: const EsmNumberLiteral(0),
    );
  }
  if (name == 'toList' &&
      positional.isEmpty &&
      _hasOnlyNamedArguments(arguments, {'growable'})) {
    helpers.require(EsmRuntimeHelper.listFactory);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
      arguments: [
        receiver,
        lowerNamedArgument(arguments, 'growable') ??
            const EsmBooleanLiteral(true),
      ],
    );
  }
  if (name == 'join' && arguments.named.isEmpty && positional.length <= 1) {
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: arrayFrom(receiver),
        property: 'join',
      ),
      arguments: [
        positional.isEmpty
            ? const EsmStringLiteral('')
            : lower(positional.single),
      ],
    );
  }
  if ((name == 'any' || name == 'every') &&
      arguments.named.isEmpty &&
      positional.length == 1) {
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: arrayFrom(receiver),
        property: name == 'any' ? 'some' : 'every',
      ),
      arguments: [lower(positional.single)],
    );
  }
  if (name == 'elementAt' &&
      arguments.named.isEmpty &&
      positional.length == 1) {
    return EsmComputedPropertyAccess(
      receiver: arrayFrom(receiver),
      property: lower(positional.single),
    );
  }
  return null;
}

EsmExpression? lowerDartCollectionQueueInstanceGet({
  required k.Reference reference,
  required String name,
  required EsmExpression Function() lowerReceiver,
}) {
  if (!isDartCollectionQueueMember(reference, name)) {
    return null;
  }
  final receiver = lowerReceiver();
  return switch (name) {
    'length' => EsmPropertyAccess(receiver: receiver, property: 'length'),
    'isEmpty' => EsmBinary(
      left: EsmPropertyAccess(receiver: receiver, property: 'length'),
      operator: EsmBinaryOperator.strictEquals,
      right: const EsmNumberLiteral(0),
    ),
    'isNotEmpty' => EsmBinary(
      left: EsmPropertyAccess(receiver: receiver, property: 'length'),
      operator: EsmBinaryOperator.greaterThan,
      right: const EsmNumberLiteral(0),
    ),
    'first' => EsmComputedPropertyAccess(
      receiver: receiver,
      property: const EsmNumberLiteral(0),
    ),
    'last' => EsmCall(
      callee: EsmPropertyAccess(receiver: receiver, property: 'at'),
      arguments: const [EsmNumberLiteral(-1)],
    ),
    _ => null,
  };
}

EsmExpression _lowerOptionalPositionalArgument(
  List<k.Expression> positional,
  int index,
  EsmExpression Function(k.Expression argument) lower,
) {
  if (index >= positional.length) {
    return const EsmNullLiteral();
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

EsmArrowFunction _dartStringifyValue() {
  return const EsmArrowFunction(
    parameters: [EsmIdentifierParameter(name: 'value')],
    body: EsmCall(
      callee: EsmIdentifier('__dartStr'),
      arguments: [EsmIdentifier('value')],
    ),
  );
}

EsmStringConcatenation _dartCollectionToString(
  String open,
  EsmExpression body,
  String close,
) {
  return EsmStringConcatenation([
    EsmStringLiteral(open),
    body,
    EsmStringLiteral(close),
  ]);
}

EsmCall _joinMappedIterable(
  EsmExpression Function(EsmExpression value) arrayFrom,
  EsmExpression iterable,
  EsmExpression callback,
) {
  return _join(
    EsmCall(
      callee: EsmPropertyAccess(receiver: arrayFrom(iterable), property: 'map'),
      arguments: [callback],
    ),
  );
}

EsmCall _join(EsmExpression iterable) {
  return EsmCall(
    callee: EsmPropertyAccess(receiver: iterable, property: 'join'),
    arguments: const [EsmStringLiteral(', ')],
  );
}
