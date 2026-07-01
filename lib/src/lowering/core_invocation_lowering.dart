part of 'kernel_to_esm_ast.dart';

extension _CoreInvocationLowering on Lowerer {
  EsmExpression? _lowerCoreInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final memberName = expression.name.text;
    final isMapMember = isDartCoreMapMember(
      expression.interfaceTargetReference,
      memberName,
    );
    final isListMember = isDartCoreListMember(
      expression.interfaceTargetReference,
      memberName,
    );
    final sinkInvocation = _lowerSinkInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      memberName,
      thisExpression: thisExpression,
    );
    if (sinkInvocation != null) {
      return sinkInvocation;
    }
    final convertInvocation = _lowerDartConvertInterfaceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      memberName,
      thisExpression: thisExpression,
    );
    if (convertInvocation != null) {
      return convertInvocation;
    }
    final collectionInvocation = _lowerCoreCollectionInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (collectionInvocation != null) {
      return collectionInvocation;
    }
    final mixinCollectionInvocation = _lowerMixinCollectionInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      memberName,
      thisExpression: thisExpression,
    );
    if (mixinCollectionInvocation != null) {
      return mixinCollectionInvocation;
    }
    final typedDataInvocation = _lowerTypedDataInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (typedDataInvocation != null) {
      return typedDataInvocation;
    }
    final bigIntInvocation = _lowerBigIntInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (bigIntInvocation != null) {
      return bigIntInvocation;
    }
    final numberInvocation = _lowerCoreNumberInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (numberInvocation != null) {
      return numberInvocation;
    }
    final stringInvocation = _lowerCoreStringInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (stringInvocation != null) {
      return stringInvocation;
    }
    final stringBufferInvocation = _lowerCoreStringBufferInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (stringBufferInvocation != null) {
      return stringBufferInvocation;
    }
    final patternInvocation = _lowerCorePatternInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (patternInvocation != null) {
      return patternInvocation;
    }
    final regExpInvocation = _lowerCoreRegExpInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (regExpInvocation != null) {
      return regExpInvocation;
    }
    final matchInvocation = _lowerCoreMatchInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (matchInvocation != null) {
      return matchInvocation;
    }
    if (isDartCoreFinalizerMember(
          expression.interfaceTargetReference,
          memberName,
        ) &&
        expression.arguments.types.isEmpty) {
      final positional = expression.arguments.positional;
      if (memberName == 'attach' &&
          positional.length == 2 &&
          _hasOnlyNamedArguments(expression.arguments, {'detach'})) {
        final detach =
            _lowerNamedArgument(
              semantic,
              helpers,
              locals,
              expression.arguments,
              'detach',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteral();
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'attach',
          ),
          arguments: [
            for (final argument in positional)
              _lowerExpression(
                semantic,
                helpers,
                locals,
                argument,
                thisExpression: thisExpression,
              ),
            EsmObjectLiteral([
              EsmObjectLiteralProperty.static(key: 'detach', value: detach),
            ]),
          ],
        );
      }
      if (memberName == 'detach' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'detach',
          ),
          arguments: [
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
    }
    if (_isCoreExpandoMember(target) &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      if (memberName == '[]' && expression.arguments.positional.length == 1) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'get',
          ),
          arguments: [
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.arguments.positional.single,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
      if (memberName == '[]=' && expression.arguments.positional.length == 2) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'set',
          ),
          arguments: [
            for (final argument in expression.arguments.positional)
              _lowerExpression(
                semantic,
                helpers,
                locals,
                argument,
                thisExpression: thisExpression,
              ),
          ],
        );
      }
    }
    if (memberName == '[]' && expression.arguments.positional.length == 1) {
      final receiver = _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
      final property = _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.arguments.positional.single,
        thisExpression: thisExpression,
      );
      if (isMapMember) {
        helpers.require(EsmRuntimeHelper.mapGet);
        return EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapGet),
          arguments: [receiver, property],
        );
      }
      if (isListMember) {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCall(
          callee: const EsmIdentifier('__dartListLikeGet'),
          arguments: [receiver, property],
        );
      }
      return EsmComputedPropertyAccess(receiver: receiver, property: property);
    }
    if (memberName == '[]=' &&
        expression.arguments.positional.length == 2 &&
        isMapMember) {
      helpers.require(EsmRuntimeHelper.mapSet);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapSet),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ],
      );
    }
    if (memberName == '[]=' && expression.arguments.positional.length == 2) {
      if (isListMember) {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCall(
          callee: const EsmIdentifier('__dartListLikeSet'),
          arguments: [
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            for (final argument in expression.arguments.positional)
              _lowerExpression(
                semantic,
                helpers,
                locals,
                argument,
                thisExpression: thisExpression,
              ),
          ],
        );
      }
      return EsmAssignment(
        target: EsmComputedPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional[0],
            thisExpression: thisExpression,
          ),
        ),
        value: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.arguments.positional[1],
          thisExpression: thisExpression,
        ),
      );
    }
    if (isMapMember &&
        memberName == 'addAll' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapAddAll);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapAddAll),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isMapMember &&
        memberName == 'addEntries' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapAddEntries'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (((isMapMember && memberName == 'containsKey') ||
            target == 'dart:_compact_hash::_ConstMap::@methods::containsKey' ||
            target == 'dart:_compact_hash::_Map::@methods::containsKey') &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapContainsKey);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mapContainsKey,
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (((isMapMember && memberName == 'containsValue') ||
            target == 'dart:_compact_hash::_Map::@methods::containsValue') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapContainsValue'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isMapMember &&
        memberName == 'putIfAbsent' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 2) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapPutIfAbsent'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ],
      );
    }
    if (((isMapMember && memberName == 'update') ||
            target == 'dart:_compact_hash::_Map::@methods::update') &&
        _hasOnlyNamedArguments(expression.arguments, {'ifAbsent'}) &&
        expression.arguments.positional.length == 2) {
      helpers.require(EsmRuntimeHelper.mapOps);
      final ifAbsent = _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        expression.arguments,
        'ifAbsent',
        thisExpression: thisExpression,
      );
      return EsmCall(
        callee: const EsmIdentifier('__dartMapUpdate'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
          if (ifAbsent != null) ifAbsent,
        ],
      );
    }
    if (isMapMember &&
        memberName == 'forEach' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapForEach'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isMapMember &&
        memberName == 'map' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapMap'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (((isMapMember && memberName == 'cast') ||
            target == 'dart:_compact_hash::_Map::@methods::cast') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      return _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
    }
    final mapMutationHelper = switch ((target, memberName)) {
      (_, 'remove') when isMapMember => '__dartMapRemove',
      ('dart:_compact_hash::_Map::@methods::remove', _) => '__dartMapRemove',
      (_, 'updateAll') when isMapMember => '__dartMapUpdateAll',
      ('dart:_compact_hash::_Map::@methods::updateAll', _) =>
        '__dartMapUpdateAll',
      (_, 'removeWhere') when isMapMember => '__dartMapRemoveWhere',
      ('dart:_compact_hash::_Map::@methods::removeWhere', _) =>
        '__dartMapRemoveWhere',
      _ => null,
    };
    if (mapMutationHelper != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: EsmIdentifier(mapMutationHelper),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isListMember &&
        memberName == 'clear' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      return EsmAssignment(
        target: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'length',
        ),
        value: const EsmNumberLiteral(0),
      );
    }
    if (((isMapMember && memberName == 'clear') ||
            target == 'dart:_compact_hash::_Map::@methods::clear') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapClear'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    final isSetMember = isDartCoreSetMember(
      expression.interfaceTargetReference,
      expression.name.text,
    );
    if (isSetMember &&
        expression.name.text == 'add' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: const EsmIdentifier('__dartSetAdd'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isSetMember &&
        expression.name.text == 'contains' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: const EsmIdentifier('__dartSetContains'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    final setHelper = isSetMember
        ? switch (expression.name.text) {
            'remove' => '__dartSetRemove',
            'lookup' => '__dartSetLookup',
            'containsAll' => '__dartSetContainsAll',
            'removeAll' => '__dartSetRemoveAll',
            'retainAll' => '__dartSetRetainAll',
            'removeWhere' => '__dartSetRemoveWhere',
            'retainWhere' => '__dartSetRetainWhere',
            'union' => '__dartSetUnion',
            'intersection' => '__dartSetIntersection',
            'difference' => '__dartSetDifference',
            _ => null,
          }
        : null;
    if (setHelper != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setOps);
      return EsmCall(
        callee: EsmIdentifier(setHelper),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isSetMember &&
        expression.name.text == 'addAll' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.setAddAll),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isListMember &&
        memberName == 'add' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.listAdd);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAdd),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isListMember &&
        memberName == 'addAll' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.listAddAll);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAddAll),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartCoreCollectionMember(
          expression.interfaceTargetReference,
          'join',
        ) &&
        expression.arguments.positional.length <= 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'join',
        ),
        arguments: [
          if (expression.arguments.positional.isEmpty)
            const EsmStringLiteral('')
          else
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.arguments.positional.single,
              thisExpression: thisExpression,
            ),
        ],
      );
    }
    if (target == 'dart:core::Iterator::@methods::moveNext' &&
        expression.arguments.positional.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'moveNext',
        ),
        arguments: const [],
      );
    }
    if (target.startsWith('dart:') &&
        expression.name.text == 'contains' &&
        !target.contains('Set::') &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'includes',
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    final numberFormatMethod = switch (target) {
      'dart:core::num::@methods::toStringAsFixed' ||
      'dart:core::double::@methods::toStringAsFixed' => 'toFixed',
      'dart:core::num::@methods::toStringAsExponential' ||
      'dart:core::double::@methods::toStringAsExponential' => 'toExponential',
      'dart:core::num::@methods::toStringAsPrecision' ||
      'dart:core::double::@methods::toStringAsPrecision' => 'toPrecision',
      _ => null,
    };
    if (numberFormatMethod != null &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmCall(
            callee: const EsmIdentifier('Number'),
            arguments: [
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.receiver,
                thisExpression: thisExpression,
              ),
            ],
          ),
          property: numberFormatMethod,
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (expression.arguments.positional.isNotEmpty) {
      return null;
    }
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    if (target == 'dart:core::int::@methods::unary-') {
      return EsmUnary(operator: EsmUnaryOperator.negate, operand: receiver);
    }
    if (target == 'dart:core::num::@methods::unary-' ||
        target == 'dart:core::double::@methods::unary-') {
      return EsmUnary(operator: EsmUnaryOperator.negate, operand: receiver);
    }
    if (target == 'dart:core::BigInt::@methods::unary-') {
      return EsmUnary(operator: EsmUnaryOperator.negate, operand: receiver);
    }
    if (target == 'dart:core::int::@methods::~') {
      return EsmUnary(operator: EsmUnaryOperator.bitNot, operand: receiver);
    }
    if (target == 'dart:core::Object::@methods::toString') {
      helpers.require(EsmRuntimeHelper.safeToString);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.safeToString,
        ),
        arguments: [receiver],
      );
    }
    if (target.startsWith('dart:') && expression.name.text == 'toString') {
      return EsmCall(
        callee: const EsmIdentifier('String'),
        arguments: [receiver],
      );
    }
    return null;
  }
}
