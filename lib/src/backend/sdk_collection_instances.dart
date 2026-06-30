import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkCollectionInstanceEmitter {
  DartSdkCollectionInstanceEmitter({
    required this.helpers,
    required this.hasOnlyNamedArguments,
    required this.namedArgument,
    required this.emitMaybeFixedList,
    required this.emitTypeTest,
  });

  final EsmRuntimeHelperUseSet helpers;
  final bool Function(k.Arguments arguments, Set<String> names)
  hasOnlyNamedArguments;
  final String? Function(k.Arguments arguments, String name) namedArgument;
  final String Function(
    String value,
    String? growable, {
    required bool defaultGrowable,
  })
  emitMaybeFixedList;
  final String Function(String operand, k.DartType type, Object node)
  emitTypeTest;

  String? emitInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
    Object node, {
    required String? receiverCollectionKind,
  }) {
    final isAsyncStreamInvocation = isDartAsyncStreamMember(target, name);
    final isCollectionInvocation =
        isDartCoreCollectionMember(target, name) ||
        (receiverCollectionKind != null && !isAsyncStreamInvocation);
    final isSetInvocation =
        isDartCoreSetMember(target, name) || receiverCollectionKind == 'Set';
    final isMapInvocation =
        isDartCoreMapMember(target, name) || receiverCollectionKind == 'Map';
    final isListInvocation =
        isDartCoreListMember(target, name) || receiverCollectionKind == 'List';

    return _emitIterableInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
          node,
          isCollectionInvocation: isCollectionInvocation,
          isSetInvocation: isSetInvocation,
          isMapInvocation: isMapInvocation,
        ) ??
        _emitQueueInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitListInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          isListInvocation,
          arguments,
        ) ??
        _emitSetInvocation(
          name,
          receiver,
          positionalArgs,
          isSetInvocation,
          arguments.named.isEmpty,
        ) ??
        _emitMapInvocation(
          name,
          receiver,
          positionalArgs,
          arguments,
          node,
          isMapInvocation,
        );
  }

  String? emitGet(
    k.Reference target,
    String name,
    String receiver, {
    required String? receiverCollectionKind,
  }) {
    return _emitQueueGet(target, name, receiver) ??
        _emitIterableGet(target, name, receiver, receiverCollectionKind);
  }

  String? _emitIterableInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
    Object node, {
    required bool isCollectionInvocation,
    required bool isSetInvocation,
    required bool isMapInvocation,
  }) {
    if (arguments.named.isEmpty &&
        name == 'contains' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      if (isSetInvocation) {
        helpers.add('__dartIterableContains');
        helpers.add('__dartEquals');
        return '__dartIterableContains($receiver, ${positionalArgs.single})';
      }
      helpers.add('__dartIterableContains');
      return '__dartIterableContains($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'join' &&
        positionalArgs.length <= 1 &&
        isCollectionInvocation) {
      helpers.add('__dartIterableJoin');
      helpers.add('__dartStr');
      final separator = positionalArgs.isEmpty ? '""' : positionalArgs.single;
      return '__dartIterableJoin($receiver, $separator)';
    }
    if (arguments.named.isEmpty &&
        name == 'where' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).filter(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'whereType' &&
        positionalArgs.isEmpty &&
        arguments.types.length == 1 &&
        isCollectionInvocation) {
      final typeTest = emitTypeTest('value', arguments.types.single, node);
      return 'Array.from($receiver).filter((value) => $typeTest)';
    }
    if (arguments.named.isEmpty &&
        name == 'cast' &&
        positionalArgs.isEmpty &&
        arguments.types.length == 1 &&
        isCollectionInvocation) {
      helpers.add('__dartAs');
      final type = arguments.types.single;
      final typeTest = emitTypeTest('value', type, node);
      if (isSetInvocation) {
        return 'new Set(Array.from($receiver, (value) => __dartAs(value, (value) => $typeTest, ${jsonEncode(type.toString())})))';
      }
      return 'Array.from($receiver, (value) => __dartAs(value, (value) => $typeTest, ${jsonEncode(type.toString())}))';
    }
    if (arguments.named.isEmpty &&
        name == 'map' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation &&
        !isMapInvocation) {
      return 'Array.from($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'expand' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).flatMap((value) => Array.from((${positionalArgs.single})(value)))';
    }
    if (arguments.named.isEmpty &&
        name == 'followedBy' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return '[...Array.from($receiver), ...Array.from(${positionalArgs.single})]';
    }
    if (hasOnlyNamedArguments(arguments, {'growable'}) &&
        name == 'toList' &&
        positionalArgs.isEmpty &&
        isCollectionInvocation) {
      return emitMaybeFixedList(
        'Array.from($receiver)',
        namedArgument(arguments, 'growable'),
        defaultGrowable: true,
      );
    }
    if (arguments.named.isEmpty &&
        name == 'toSet' &&
        positionalArgs.isEmpty &&
        isCollectionInvocation) {
      helpers.add('__dartSetFrom');
      helpers.add('__dartSetAdd');
      helpers.add('__dartIterableContains');
      helpers.add('__dartEquals');
      return '__dartSetFrom($receiver)';
    }
    if (arguments.named.isEmpty &&
        name == 'fold' &&
        positionalArgs.length == 2 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).reduce((previous, value) => (${positionalArgs[1]})(previous, value), ${positionalArgs[0]})';
    }
    if ((name == 'firstWhere' ||
            name == 'lastWhere' ||
            name == 'singleWhere') &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      final helper = switch (name) {
        'firstWhere' => '__dartIterableFirstWhere',
        'lastWhere' => '__dartIterableLastWhere',
        'singleWhere' => '__dartIterableSingleWhere',
        _ => throw StateError('unreachable'),
      };
      helpers.add('__dartIterableWhereElement');
      final orElse = namedArgument(arguments, 'orElse');
      return '$helper($receiver, ${positionalArgs.single}, ${orElse ?? 'null'})';
    }
    if (arguments.named.isEmpty &&
        name == 'reduce' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).reduce((previous, value) => (${positionalArgs.single})(previous, value))';
    }
    if (arguments.named.isEmpty &&
        name == 'forEach' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapForEach');
      return '__dartMapForEach($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'forEach' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return '(Array.from($receiver).forEach(${positionalArgs.single}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'take' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).slice(0, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'takeWhile' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      helpers.add('__dartIterableTakeWhile');
      return '__dartIterableTakeWhile($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'skip' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).slice(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'skipWhile' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      helpers.add('__dartIterableSkipWhile');
      return '__dartIterableSkipWhile($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'elementAt' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver)[${positionalArgs.single}]';
    }
    if (arguments.named.isEmpty &&
        name == 'any' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).some(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'every' &&
        positionalArgs.length == 1 &&
        isCollectionInvocation) {
      return 'Array.from($receiver).every(${positionalArgs.single})';
    }
    return null;
  }

  String? _emitQueueInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        name == 'add' &&
        positionalArgs.length == 1 &&
        isDartCollectionQueueMember(target, name)) {
      return '($receiver.push(${positionalArgs.single}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'addLast' &&
        positionalArgs.length == 1 &&
        isDartCollectionQueueMember(target, name)) {
      return '($receiver.push(${positionalArgs.single}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'addFirst' &&
        positionalArgs.length == 1 &&
        isDartCollectionQueueMember(target, name)) {
      return '($receiver.unshift(${positionalArgs.single}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'removeFirst' &&
        positionalArgs.isEmpty &&
        isDartCollectionQueueMember(target, name)) {
      return '$receiver.shift()';
    }
    if (arguments.named.isEmpty &&
        name == 'removeLast' &&
        positionalArgs.isEmpty &&
        isDartCollectionQueueMember(target, name)) {
      return '$receiver.pop()';
    }
    if (arguments.named.isEmpty &&
        name == 'addAll' &&
        positionalArgs.length == 1 &&
        isDartCollectionQueueMember(target, name)) {
      return '($receiver.push(...Array.from(${positionalArgs.single})), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'remove' &&
        positionalArgs.length == 1 &&
        isDartCollectionQueueMember(target, name)) {
      helpers.add('__dartListRemove');
      helpers.add('__dartEquals');
      return '__dartListRemove($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'clear' &&
        positionalArgs.isEmpty &&
        isDartCollectionQueueMember(target, name)) {
      return '($receiver.length = 0, null)';
    }
    if (arguments.named.isEmpty &&
        name == 'removeWhere' &&
        positionalArgs.length == 1 &&
        isDartCollectionQueueMember(target, name)) {
      helpers.add('__dartListWhereMutate');
      return '__dartListRemoveWhere($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'retainWhere' &&
        positionalArgs.length == 1 &&
        isDartCollectionQueueMember(target, name)) {
      helpers.add('__dartListWhereMutate');
      return '__dartListRetainWhere($receiver, ${positionalArgs.single})';
    }
    return null;
  }

  String? _emitListInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    bool isListInvocation,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        name == 'add' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'List', 'add')) {
      return '($receiver.push(${positionalArgs.single}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'addAll' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'List', 'addAll')) {
      return '($receiver.push(...Array.from(${positionalArgs.single})), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'sort' &&
        positionalArgs.length <= 1 &&
        isListInvocation) {
      helpers.add('__dartListSort');
      final compare = positionalArgs.isEmpty ? 'null' : positionalArgs.single;
      return '__dartListSort($receiver, $compare)';
    }
    if (arguments.named.isEmpty &&
        name == 'shuffle' &&
        positionalArgs.length <= 1 &&
        isListInvocation) {
      helpers.add('__dartListShuffle');
      final random = positionalArgs.isEmpty ? 'null' : positionalArgs.single;
      return '__dartListShuffle($receiver, $random)';
    }
    if (arguments.named.isEmpty &&
        name == 'removeAt' &&
        positionalArgs.length == 1 &&
        isListInvocation) {
      return '$receiver.splice(${positionalArgs.single}, 1)[0]';
    }
    if (arguments.named.isEmpty &&
        name == 'indexWhere' &&
        positionalArgs.length >= 1 &&
        positionalArgs.length <= 2 &&
        isListInvocation) {
      final start = positionalArgs.length == 2 ? positionalArgs[1] : '0';
      return '$receiver.findIndex((value, index) => index >= $start && (${positionalArgs[0]})(value))';
    }
    if (arguments.named.isEmpty &&
        name == 'lastIndexWhere' &&
        positionalArgs.length >= 1 &&
        positionalArgs.length <= 2 &&
        isListInvocation) {
      helpers.add('__dartListLastIndexWhere');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : 'null';
      return '__dartListLastIndexWhere($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'indexOf' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isListInvocation) {
      helpers.add('__dartListIndexOf');
      helpers.add('__dartEquals');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : '0';
      return '__dartListIndexOf($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'lastIndexOf' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isListInvocation) {
      helpers.add('__dartListLastIndexOf');
      helpers.add('__dartEquals');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : 'null';
      return '__dartListLastIndexOf($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'remove' &&
        positionalArgs.length == 1 &&
        isListInvocation) {
      helpers.add('__dartListRemove');
      helpers.add('__dartEquals');
      return '__dartListRemove($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'removeLast' &&
        positionalArgs.isEmpty &&
        isListInvocation &&
        isDartCoreListMember(target, name)) {
      return '$receiver.pop()';
    }
    if (arguments.named.isEmpty &&
        name == 'insert' &&
        positionalArgs.length == 2 &&
        isListInvocation) {
      return '($receiver.splice(${positionalArgs[0]}, 0, ${positionalArgs[1]}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'insertAll' &&
        positionalArgs.length == 2 &&
        isListInvocation) {
      return '($receiver.splice(${positionalArgs[0]}, 0, ...Array.from(${positionalArgs[1]})), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'setAll' &&
        positionalArgs.length == 2 &&
        isListInvocation) {
      helpers.add('__dartListSetAll');
      return '__dartListSetAll($receiver, ${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (arguments.named.isEmpty &&
        name == 'setRange' &&
        positionalArgs.length >= 3 &&
        positionalArgs.length <= 4 &&
        isListInvocation) {
      helpers.add('__dartListSetRange');
      final skipCount = positionalArgs.length == 4 ? positionalArgs[3] : '0';
      return '__dartListSetRange($receiver, ${positionalArgs[0]}, ${positionalArgs[1]}, ${positionalArgs[2]}, $skipCount)';
    }
    if (arguments.named.isEmpty &&
        name == 'sublist' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isListInvocation) {
      if (positionalArgs.length == 1) {
        return '$receiver.slice(${positionalArgs.single})';
      }
      return '$receiver.slice(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (arguments.named.isEmpty &&
        name == 'getRange' &&
        positionalArgs.length == 2 &&
        isListInvocation) {
      return '$receiver.slice(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (arguments.named.isEmpty &&
        name == 'clear' &&
        positionalArgs.isEmpty &&
        isListInvocation) {
      return '($receiver.length = 0, null)';
    }
    if (arguments.named.isEmpty &&
        name == 'fillRange' &&
        positionalArgs.length >= 2 &&
        positionalArgs.length <= 3 &&
        isListInvocation) {
      final fillValue = positionalArgs.length == 3 ? positionalArgs[2] : 'null';
      return '($receiver.fill($fillValue, ${positionalArgs[0]}, ${positionalArgs[1]}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'replaceRange' &&
        positionalArgs.length == 3 &&
        isListInvocation) {
      return '($receiver.splice(${positionalArgs[0]}, ${positionalArgs[1]} - ${positionalArgs[0]}, ...Array.from(${positionalArgs[2]})), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'removeRange' &&
        positionalArgs.length == 2 &&
        isListInvocation) {
      return '($receiver.splice(${positionalArgs[0]}, ${positionalArgs[1]} - ${positionalArgs[0]}), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'removeWhere' &&
        positionalArgs.length == 1 &&
        isListInvocation) {
      helpers.add('__dartListWhereMutate');
      return '__dartListRemoveWhere($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'retainWhere' &&
        positionalArgs.length == 1 &&
        isListInvocation) {
      helpers.add('__dartListWhereMutate');
      return '__dartListRetainWhere($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'asMap' &&
        positionalArgs.isEmpty &&
        isListInvocation) {
      helpers.add('__dartListAsMap');
      return '__dartListAsMap($receiver)';
    }
    return null;
  }

  String? _emitSetInvocation(
    String name,
    String receiver,
    List<String> positionalArgs,
    bool isSetInvocation,
    bool namedArgumentsEmpty,
  ) {
    if (!namedArgumentsEmpty) {
      return null;
    }
    if (name == 'add' && positionalArgs.length == 1 && isSetInvocation) {
      helpers.add('__dartSetAdd');
      helpers.add('__dartIterableContains');
      helpers.add('__dartEquals');
      return '__dartSetAdd($receiver, ${positionalArgs.single})';
    }
    if (name == 'addAll' && positionalArgs.length == 1 && isSetInvocation) {
      helpers.add('__dartSetAddAll');
      helpers.add('__dartSetAdd');
      helpers.add('__dartIterableContains');
      helpers.add('__dartEquals');
      return '__dartSetAddAll($receiver, ${positionalArgs.single})';
    }
    if ((name == 'removeWhere' || name == 'retainWhere') &&
        positionalArgs.length == 1 &&
        isSetInvocation) {
      helpers.add('__dartSetWhereMutate');
      final helper = name == 'removeWhere'
          ? '__dartSetRemoveWhere'
          : '__dartSetRetainWhere';
      return '$helper($receiver, ${positionalArgs.single})';
    }
    if ((name == 'difference' || name == 'intersection' || name == 'union') &&
        positionalArgs.length == 1 &&
        isSetInvocation) {
      final helper = switch (name) {
        'difference' => '__dartSetDifference',
        'intersection' => '__dartSetIntersection',
        'union' => '__dartSetUnion',
        _ => throw StateError('unreachable'),
      };
      helpers.add('__dartSetAlgebra');
      helpers.add('__dartSetAdd');
      helpers.add('__dartIterableContains');
      helpers.add('__dartEquals');
      return '$helper($receiver, ${positionalArgs.single})';
    }
    if (name == 'remove' && positionalArgs.length == 1 && isSetInvocation) {
      helpers.add('__dartSetRemove');
      helpers.add('__dartEquals');
      return '__dartSetRemove($receiver, ${positionalArgs.single})';
    }
    if (name == 'lookup' && positionalArgs.length == 1 && isSetInvocation) {
      helpers.add('__dartSetLookup');
      helpers.add('__dartEquals');
      return '__dartSetLookup($receiver, ${positionalArgs.single})';
    }
    if (name == 'containsAll' &&
        positionalArgs.length == 1 &&
        isSetInvocation) {
      helpers.add('__dartSetContainsAll');
      helpers.add('__dartIterableContains');
      helpers.add('__dartEquals');
      return '__dartSetContainsAll($receiver, ${positionalArgs.single})';
    }
    if (name == 'removeAll' && positionalArgs.length == 1 && isSetInvocation) {
      helpers.add('__dartSetRemoveAll');
      helpers.add('__dartEquals');
      return '__dartSetRemoveAll($receiver, ${positionalArgs.single})';
    }
    if (name == 'retainAll' && positionalArgs.length == 1 && isSetInvocation) {
      helpers.add('__dartSetRetainAll');
      helpers.add('__dartEquals');
      return '__dartSetRetainAll($receiver, ${positionalArgs.single})';
    }
    return null;
  }

  String? _emitMapInvocation(
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
    Object node,
    bool isMapInvocation,
  ) {
    if (arguments.named.isEmpty &&
        name == 'addAll' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapAddAll');
      helpers.add('__dartMapSet');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      return '__dartMapAddAll($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'cast' &&
        positionalArgs.isEmpty &&
        arguments.types.length == 2 &&
        isMapInvocation) {
      helpers.add('__dartAs');
      final keyType = arguments.types[0];
      final valueType = arguments.types[1];
      final keyTest = emitTypeTest('key', keyType, node);
      final valueTest = emitTypeTest('value', valueType, node);
      return 'new Map(Array.from($receiver, ([key, value]) => [__dartAs(key, (key) => $keyTest, ${jsonEncode(keyType.toString())}), __dartAs(value, (value) => $valueTest, ${jsonEncode(valueType.toString())})]))';
    }
    if (arguments.named.isEmpty &&
        name == 'addEntries' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapAddEntries');
      helpers.add('__dartMapSet');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      return '__dartMapAddEntries($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'map' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapMap');
      helpers.add('__dartMapSet');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      return '__dartMapMap($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'remove' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapRemove');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      return '__dartMapRemove($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'clear' &&
        positionalArgs.isEmpty &&
        isMapInvocation) {
      return '($receiver.clear(), null)';
    }
    if (arguments.named.isEmpty &&
        name == 'removeWhere' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapRemoveWhere');
      return '__dartMapRemoveWhere($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'containsKey' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapContainsKey');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      return '__dartMapContainsKey($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'containsValue' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapContainsValue');
      helpers.add('__dartEquals');
      return '__dartMapContainsValue($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'putIfAbsent' &&
        positionalArgs.length == 2 &&
        isMapInvocation) {
      helpers.add('__dartMapPutIfAbsent');
      helpers.add('__dartMapSet');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      return '__dartMapPutIfAbsent($receiver, ${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (name == 'update' && positionalArgs.length == 2 && isMapInvocation) {
      helpers.add('__dartMapUpdate');
      helpers.add('__dartMapSet');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      final ifAbsent = namedArgument(arguments, 'ifAbsent');
      return '__dartMapUpdate($receiver, ${positionalArgs[0]}, ${positionalArgs[1]}, ${ifAbsent ?? 'null'})';
    }
    if (arguments.named.isEmpty &&
        name == 'updateAll' &&
        positionalArgs.length == 1 &&
        isMapInvocation) {
      helpers.add('__dartMapUpdateAll');
      return '__dartMapUpdateAll($receiver, ${positionalArgs.single})';
    }
    return null;
  }

  String? _emitQueueGet(k.Reference target, String name, String receiver) {
    if (name == 'length' && isDartCollectionQueueMember(target, name)) {
      return '$receiver.length';
    }
    if (name == 'isEmpty' && isDartCollectionQueueMember(target, name)) {
      return '$receiver.length === 0';
    }
    if (name == 'isNotEmpty' && isDartCollectionQueueMember(target, name)) {
      return '$receiver.length !== 0';
    }
    if (name == 'first' && isDartCollectionQueueMember(target, name)) {
      return '$receiver[0]';
    }
    if (name == 'last' && isDartCollectionQueueMember(target, name)) {
      return '$receiver[$receiver.length - 1]';
    }
    return null;
  }

  String? _emitIterableGet(
    k.Reference target,
    String name,
    String receiver,
    String? receiverCollectionKind,
  ) {
    if (name == 'nonNulls' && isDartCoreCollectionMember(target, name)) {
      return 'Array.from($receiver).filter((value) => value != null)';
    }
    if (name == 'indexed' && isDartCoreCollectionMember(target, name)) {
      helpers.add('__dartRecord');
      return 'Array.from($receiver, (value, index) => __dartRecord([index, value], {}))';
    }
    if (name == 'isEmpty' && isDartCoreCollectionMember(target, name)) {
      if (isDartCoreMapMember(target, name) ||
          isDartCoreSetMember(target, name) ||
          receiverCollectionKind == 'Map' ||
          receiverCollectionKind == 'Set') {
        return '$receiver.size === 0';
      }
      if (isDartCoreListMember(target, name) ||
          receiverCollectionKind == 'List') {
        return '$receiver.length === 0';
      }
      helpers.add('__dartIterableIsEmpty');
      return '__dartIterableIsEmpty($receiver)';
    }
    if (name == 'isNotEmpty' && isDartCoreCollectionMember(target, name)) {
      if (isDartCoreMapMember(target, name) ||
          isDartCoreSetMember(target, name) ||
          receiverCollectionKind == 'Map' ||
          receiverCollectionKind == 'Set') {
        return '$receiver.size !== 0';
      }
      if (isDartCoreListMember(target, name) ||
          receiverCollectionKind == 'List') {
        return '$receiver.length !== 0';
      }
      helpers.add('__dartIterableIsEmpty');
      return '!__dartIterableIsEmpty($receiver)';
    }
    if (name == 'isEmpty' && receiverCollectionKind == 'List') {
      return '$receiver.length === 0';
    }
    if (name == 'isNotEmpty' && receiverCollectionKind == 'List') {
      return '$receiver.length !== 0';
    }
    if (name == 'first' && isDartCoreCollectionMember(target, name)) {
      if (isDartCoreListMember(target, name) ||
          receiverCollectionKind == 'List') {
        helpers.add('__dartIndexGet');
        return '__dartIndexGet($receiver, 0)';
      }
      helpers.add('__dartIterableFirst');
      return '__dartIterableFirst($receiver)';
    }
    if (name == 'first' && receiverCollectionKind == 'List') {
      helpers.add('__dartIndexGet');
      return '__dartIndexGet($receiver, 0)';
    }
    if (name == 'last' && isDartCoreCollectionMember(target, name)) {
      if (isDartCoreListMember(target, name) ||
          receiverCollectionKind == 'List') {
        helpers.add('__dartIndexGet');
        return '__dartIndexGet($receiver, $receiver.length - 1)';
      }
      helpers.add('__dartIterableLast');
      return '__dartIterableLast($receiver)';
    }
    if (name == 'last' && receiverCollectionKind == 'List') {
      helpers.add('__dartIndexGet');
      return '__dartIndexGet($receiver, $receiver.length - 1)';
    }
    if (name == 'single' && isDartCoreCollectionMember(target, name)) {
      helpers.add('__dartIterableSingle');
      return '__dartIterableSingle($receiver)';
    }
    if (name == 'single' && receiverCollectionKind == 'List') {
      helpers.add('__dartIterableSingle');
      return '__dartIterableSingle($receiver)';
    }
    if (name == 'firstOrNull') {
      helpers.add('__dartIterableFirstOrNull');
      return '__dartIterableFirstOrNull($receiver)';
    }
    if (name == 'lastOrNull') {
      helpers.add('__dartIterableLastOrNull');
      return '__dartIterableLastOrNull($receiver)';
    }
    if (name == 'singleOrNull') {
      helpers.add('__dartIterableSingleOrNull');
      return '__dartIterableSingleOrNull($receiver)';
    }
    if (name == 'reversed' && isDartCoreCollectionMember(target, name)) {
      return 'Array.from($receiver).reverse()';
    }
    if (name == 'length' && isDartCoreCollectionMember(target, name)) {
      if (isDartCoreSetMember(target, name) ||
          isDartCoreMapMember(target, name) ||
          receiverCollectionKind == 'Set' ||
          receiverCollectionKind == 'Map') {
        return '$receiver.size';
      }
      if (isDartCoreListMember(target, name) ||
          receiverCollectionKind == 'List') {
        return '$receiver.length';
      }
      helpers.add('__dartIterableLength');
      return '__dartIterableLength($receiver)';
    }
    if (name == 'length' && receiverCollectionKind == 'List') {
      return '$receiver.length';
    }
    if (name == 'keys' &&
        (isDartCoreMapMember(target, name) ||
            receiverCollectionKind == 'Map')) {
      return 'Array.from($receiver.keys())';
    }
    if (name == 'values' &&
        (isDartCoreMapMember(target, name) ||
            receiverCollectionKind == 'Map')) {
      return 'Array.from($receiver.values())';
    }
    if (name == 'entries' &&
        (isDartCoreMapMember(target, name) ||
            receiverCollectionKind == 'Map')) {
      return 'Array.from($receiver, ([key, value]) => ({ key, value }))';
    }
    return null;
  }
}
