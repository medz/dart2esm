part of 'kernel_to_esm_ast.dart';

extension _InvocationLowering on Lowerer {
  EsmExpression _lowerInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final operator = expression.name.text;
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.interfaceTargetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeInstanceInvocation(
        semantic,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final target = expression.interfaceTargetReference.node;
    if (target is k.Procedure) {
      final symbol = semantic.instanceProcedureSymbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.method) {
        final receiver = _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        );
        return EsmCall(
          callee: _memberAccess(receiver, symbol.name),
          arguments: _lowerArguments(
            semantic,
            helpers,
            locals,
            expression.arguments,
            thisExpression: thisExpression,
            contextNode: expression,
            context: 'instance invocation arguments',
          ),
        );
      }
    }
    final sdkIntrinsic = _lowerSdkInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    final binaryOperator = _binaryOperators[operator];
    if (binaryOperator == null ||
        expression.arguments.positional.length != 1 ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      final intrinsic = _lowerCoreInstanceInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
      if (intrinsic != null) {
        return intrinsic;
      }
      throw UnsupportedCompilerFeature(
        expression,
        'instance invocation lowering '
        '${kernelReferencePath(expression.interfaceTargetReference)}',
      );
    }
    final left = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final right = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.arguments.positional.single,
      thisExpression: thisExpression,
    );
    if (operator == '>>') {
      helpers.require(EsmRuntimeHelper.intShift);
      return EsmCall(
        callee: helpers.reference(
          const EsmRuntimeHelperRegistry(),
          EsmRuntimeHelper.intShift,
        ),
        arguments: [left, right],
      );
    }
    if (operator == '&') {
      if (_isMask32Literal(right)) {
        return EsmBinary(
          left: left,
          operator: EsmBinaryOperator.unsignedRightShift,
          right: const EsmNumberLiteral(0),
        );
      }
      if (_isMask32Literal(left)) {
        return EsmBinary(
          left: right,
          operator: EsmBinaryOperator.unsignedRightShift,
          right: const EsmNumberLiteral(0),
        );
      }
    }
    return EsmBinary(left: left, operator: binaryOperator, right: right);
  }

  bool _isMask32Literal(EsmExpression expression) {
    return expression is EsmNumberLiteral && expression.value == 0xffffffff;
  }

  EsmExpression? _lowerSdkInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final sdkIntrinsic = sdkIntrinsics.lowerInstanceInvocation(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
      arguments: expression.arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: () => _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      lower: (argument) => _lowerExpression(
        semantic,
        helpers,
        locals,
        argument,
        thisExpression: thisExpression,
      ),
      lowerNamedArgument: (arguments, argumentName) => _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        arguments,
        argumentName,
        thisExpression: thisExpression,
      ),
      arrayFrom: (value) => _arrayFrom(helpers, value),
    );
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    final coreTimeInvocation = _lowerCoreTimeInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreTimeInvocation != null) {
      return coreTimeInvocation;
    }
    final webInvocation = _lowerWebInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (webInvocation != null) {
      return webInvocation;
    }
    return _lowerMathInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
  }

  EsmExpression? _lowerCoreTimeInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.types.isNotEmpty) {
      return null;
    }
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final name = expression.name.text;
    final positional = expression.arguments.positional;
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    if (target.startsWith('dart:core::DateTime::@methods::') &&
        expression.arguments.named.isEmpty) {
      final expectedArity = switch (name) {
        'compareTo' ||
        'isBefore' ||
        'isAfter' ||
        'isAtSameMomentAs' ||
        'add' ||
        'subtract' ||
        'difference' => 1,
        'toUtc' || 'toLocal' || 'toIso8601String' || 'toString' => 0,
        _ => null,
      };
      if (expectedArity == null || positional.length != expectedArity) {
        return null;
      }
      return EsmCall(
        callee: _memberAccess(receiver, name),
        arguments: [
          for (final argument in positional)
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
    if (!target.startsWith('dart:core::Duration::@methods::') ||
        expression.arguments.named.isNotEmpty) {
      return null;
    }
    if ((name == 'abs' || name == 'toString') && positional.isEmpty) {
      return EsmCall(
        callee: _memberAccess(receiver, name),
        arguments: const [],
      );
    }
    if (name == 'compareTo' && positional.length == 1) {
      return EsmCall(
        callee: _memberAccess(receiver, name),
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
    if (positional.length != 1) {
      return null;
    }
    final right = _lowerExpression(
      semantic,
      helpers,
      locals,
      positional.single,
      thisExpression: thisExpression,
    );
    return switch (name) {
      '+' => _durationFromMicros(
        helpers,
        EsmBinary(
          left: EsmPropertyAccess(
            receiver: receiver,
            property: 'inMicroseconds',
          ),
          operator: EsmBinaryOperator.add,
          right: EsmPropertyAccess(receiver: right, property: 'inMicroseconds'),
        ),
      ),
      '-' => _durationFromMicros(
        helpers,
        EsmBinary(
          left: EsmPropertyAccess(
            receiver: receiver,
            property: 'inMicroseconds',
          ),
          operator: EsmBinaryOperator.subtract,
          right: EsmPropertyAccess(receiver: right, property: 'inMicroseconds'),
        ),
      ),
      '*' => _durationFromMicros(
        helpers,
        _mathRound(
          EsmBinary(
            left: EsmPropertyAccess(
              receiver: receiver,
              property: 'inMicroseconds',
            ),
            operator: EsmBinaryOperator.multiply,
            right: right,
          ),
        ),
      ),
      '~/' => _durationFromMicros(
        helpers,
        _mathTrunc(
          EsmBinary(
            left: EsmPropertyAccess(
              receiver: receiver,
              property: 'inMicroseconds',
            ),
            operator: EsmBinaryOperator.divide,
            right: right,
          ),
        ),
      ),
      '<' || '<=' || '>' || '>=' => EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'inMicroseconds'),
        operator: _binaryOperators[name]!,
        right: EsmPropertyAccess(receiver: right, property: 'inMicroseconds'),
      ),
      _ => null,
    };
  }

  EsmCall _durationFromMicros(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression microseconds,
  ) {
    helpers.require(EsmRuntimeHelper.duration);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.duration),
      arguments: [
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'microseconds',
            value: microseconds,
          ),
        ]),
      ],
    );
  }

  EsmExpression? _lowerWebInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final name = expression.name.text;
    final positional = expression.arguments.positional;
    final methodName = _sdkInstanceMethodName(
      expression.interfaceTargetReference,
      name,
    );
    if (methodName == null) {
      return null;
    }
    if (name == 'append' && positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: methodName,
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
    if (name == 'getAttribute' || name == 'setAttribute') {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: methodName,
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
        ],
      );
    }
    return null;
  }

  EsmExpression? _lowerMathInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final isPoint =
        target.startsWith('dart:math::Point::') ||
        target.startsWith('dart:math::_PointBase::');
    final isRectangle =
        target.startsWith('dart:math::Rectangle::') ||
        target.startsWith('dart:math::_RectangleBase::');
    final isRandom = target.startsWith('dart:math::Random::');
    if (!isPoint && !isRectangle && !isRandom) {
      return null;
    }
    final name = expression.name.text;
    final positional = expression.arguments.positional;
    final expectedArity = switch (name) {
      '+' || '-' || '*' || 'distanceTo' || 'squaredDistanceTo' => 1,
      'containsPoint' ||
      'containsRectangle' ||
      'intersects' ||
      'intersection' ||
      'boundingBox' => 1,
      'nextInt' => 1,
      'nextDouble' || 'nextBool' => 0,
      'toString' => 0,
      _ => null,
    };
    if (expectedArity == null || positional.length != expectedArity) {
      return null;
    }
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    return EsmCall(
      callee: _memberAccess(receiver, name),
      arguments: [
        for (final argument in positional)
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

  EsmExpression _lowerDynamicInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(expression, 'expression lowering');
    }
    final isCall = expression.name.text == 'call';
    final helper = isCall
        ? EsmRuntimeHelper.dynamicCall
        : EsmRuntimeHelper.dynamicInvoke;
    helpers.require(helper);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, helper),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        if (!isCall) EsmStringLiteral(expression.name.text),
        EsmArrayLiteral([
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ]),
        if (expression.arguments.named.isEmpty)
          const EsmNullLiteral()
        else
          EsmObjectLiteral([
            for (final argument in expression.arguments.named)
              EsmObjectLiteralProperty.static(
                key: argument.name,
                value: _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  argument.value,
                  thisExpression: thisExpression,
                ),
              ),
          ]),
      ],
    );
  }

  EsmExpression _lowerExtensionTypeInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final kind = member.descriptor.kind;
    if (kind != k.ExtensionTypeMemberKind.Method &&
        kind != k.ExtensionTypeMemberKind.Operator) {
      throw UnsupportedCompilerFeature(
        expression,
        'extension type instance invocation',
      );
    }
    return EsmCall(
      callee: EsmIdentifier(member.backingName),
      arguments: [
        _lowerExtensionTypeInstanceReceiver(
          semantic,
          helpers,
          locals,
          member,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        ..._lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'extension type instance invocation arguments',
        ),
      ],
    );
  }

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

  EsmExpression? _lowerMixinCollectionInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    String memberName, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final isListMixin = target.contains('ListMixin::@methods::$memberName');
    final isIterableMixin = target.contains(
      'IterableMixin::@methods::$memberName',
    );
    if (!isListMixin && !isIterableMixin) {
      return null;
    }
    final positional = expression.arguments.positional;
    if (memberName == 'join' && positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.iterableJoin);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.iterableJoin,
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          if (positional case [final separator])
            _lowerExpression(
              semantic,
              helpers,
              locals,
              separator,
              thisExpression: thisExpression,
            )
          else
            const EsmStringLiteral(''),
        ],
      );
    }
    if (memberName == 'insert' && positional.length == 2) {
      if (!isListMixin) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.listMixin);
      return EsmCall(
        callee: const EsmIdentifier('__dartListMixinInsert'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in positional)
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
    return null;
  }

  EsmExpression? _lowerTypedDataInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final name = expression.name.text;
    if (!isDartTypedDataMember(expression.interfaceTargetReference, name)) {
      return null;
    }
    EsmExpression lower(k.Expression argument) => _lowerExpression(
      semantic,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );

    final sdkIntrinsic = sdkIntrinsics.lowerInstanceInvocation(
      reference: expression.interfaceTargetReference,
      name: name,
      arguments: expression.arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: () => _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      lower: lower,
      lowerNamedArgument: (arguments, argumentName) => _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        arguments,
        argumentName,
        thisExpression: thisExpression,
      ),
      arrayFrom: (value) => _arrayFrom(helpers, value),
    );
    return sdkIntrinsic;
  }

  EsmExpression? _lowerCoreStringInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.types.isNotEmpty || !_isCoreStringTarget(target)) {
      return null;
    }
    final positional = expression.arguments.positional;
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final noArgMethod = switch (target) {
      'dart:core::String::@methods::trim' => 'trim',
      'dart:core::String::@methods::trimLeft' => 'trimStart',
      'dart:core::String::@methods::trimRight' => 'trimEnd',
      'dart:core::String::@methods::toUpperCase' => 'toUpperCase',
      'dart:core::String::@methods::toLowerCase' => 'toLowerCase',
      _ => null,
    };
    if (noArgMethod != null && positional.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: noArgMethod),
        arguments: const [],
      );
    }
    final directMethod = switch (target) {
      'dart:core::String::@methods::codeUnitAt' => 'charCodeAt',
      'dart:core::String::@methods::substring' => 'substring',
      'dart:core::String::@methods::endsWith' => 'endsWith',
      _ => null,
    };
    if (directMethod != null &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: directMethod),
        arguments: [
          for (final argument in positional)
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
    final directPatternMethod = switch (target) {
      'dart:core::String::@methods::startsWith' => 'startsWith',
      'dart:core::String::@methods::indexOf' => 'indexOf',
      'dart:core::String::@methods::split' => 'split',
      'dart:core::String::@methods::replaceAll' => 'replaceAll',
      _ => null,
    };
    if (directPatternMethod != null &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        _isStringLiteralArgument(expression.arguments, 0)) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: receiver,
          property: directPatternMethod,
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
        ],
      );
    }
    final patternCall = _lowerCoreStringPatternInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      receiver,
      thisExpression: thisExpression,
    );
    if (patternCall != null) {
      return patternCall;
    }
    if (target == 'dart:core::String::@methods::contains' &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        _isStringLiteralArgument(expression.arguments, 0)) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'includes'),
        arguments: [
          for (final argument in positional)
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
    if ((target == 'dart:core::String::@methods::padLeft' ||
            target == 'dart:core::String::@methods::padRight') &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: receiver,
          property: target.endsWith('padLeft') ? 'padStart' : 'padEnd',
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          positional.length == 1
              ? const EsmStringLiteral(' ')
              : _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  positional[1],
                  thisExpression: thisExpression,
                ),
        ],
      );
    }
    if (target == 'dart:core::String::@methods::replaceFirst' &&
        expression.arguments.named.isEmpty &&
        positional.length >= 2 &&
        positional.length <= 3) {
      helpers.require(EsmRuntimeHelper.stringOps);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringOps),
        arguments: [
          receiver,
          for (final argument in positional)
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
    if (target == 'dart:core::String::@methods::replaceRange' &&
        expression.arguments.named.isEmpty &&
        positional.length == 3) {
      helpers.require(EsmRuntimeHelper.stringOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartStringReplaceRange'),
        arguments: [
          receiver,
          for (final argument in positional)
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
    return null;
  }

  EsmExpression? _lowerCoreStringPatternInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    EsmExpression receiver, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    EsmExpression lower(k.Expression argument) => _lowerExpression(
      semantic,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );

    EsmExpression callPatternHelper(
      String name,
      List<EsmExpression> arguments,
    ) {
      helpers.require(EsmRuntimeHelper.pattern);
      return EsmCall(callee: EsmIdentifier(name), arguments: arguments);
    }

    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::contains' &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringContains', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::startsWith' &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringStartsWith', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::indexOf' &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringIndexOf', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::lastIndexOf' &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return callPatternHelper('__dartStringLastIndexOf', [
        receiver,
        lower(positional[0]),
        positional.length == 2 ? lower(positional[1]) : const EsmNullLiteral(),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::split' &&
        positional.length == 1 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringSplit', [
        receiver,
        lower(positional.single),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::allMatches' &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return callPatternHelper('__dartPatternAllMatches', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::matchAsPrefix' &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return callPatternHelper('__dartPatternMatchAsPrefix', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceAll' &&
        positional.length == 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringReplaceAll', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceAllMapped' &&
        positional.length == 2) {
      return callPatternHelper('__dartStringReplaceAllMapped', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceFirst' &&
        positional.length >= 2 &&
        positional.length <= 3 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringReplaceFirstPattern', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
        positional.length == 3
            ? lower(positional[2])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceFirstMapped' &&
        positional.length >= 2 &&
        positional.length <= 3) {
      return callPatternHelper('__dartStringReplaceFirstMapped', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
        positional.length == 3
            ? lower(positional[2])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (target == 'dart:core::String::@methods::splitMapJoin' &&
        positional.length == 1 &&
        _hasOnlyNamedArguments(expression.arguments, {
          'onMatch',
          'onNonMatch',
        })) {
      return callPatternHelper('__dartStringSplitMapJoin', [
        receiver,
        lower(positional.single),
        _lowerNamedArgument(
              semantic,
              helpers,
              locals,
              expression.arguments,
              'onMatch',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteral(),
        _lowerNamedArgument(
              semantic,
              helpers,
              locals,
              expression.arguments,
              'onNonMatch',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteral(),
      ]);
    }
    return null;
  }

  EsmExpression? _lowerCoreStringBufferInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (!_isCoreStringBufferMember(target) ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final positional = expression.arguments.positional;
    final name = expression.name.text;
    final matchesShape = switch (name) {
      'write' || 'writeCharCode' => positional.length == 1,
      'writeAll' => positional.length >= 1 && positional.length <= 2,
      'writeln' => positional.length <= 1,
      'clear' || 'toString' => positional.isEmpty,
      _ => false,
    };
    if (!matchesShape) {
      return null;
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: name,
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
      ],
    );
  }

  EsmExpression? _lowerCorePatternInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty ||
        !target.startsWith('dart:core::Pattern::@methods::')) {
      return null;
    }
    final positional = expression.arguments.positional;
    final helperName = switch (expression.name.text) {
      'allMatches' when positional.isNotEmpty && positional.length <= 2 =>
        '__dartPatternAllMatches',
      'matchAsPrefix' when positional.isNotEmpty && positional.length <= 2 =>
        '__dartPatternMatchAsPrefix',
      _ => null,
    };
    if (helperName == null) {
      return null;
    }
    helpers.require(EsmRuntimeHelper.pattern);
    return EsmCall(
      callee: EsmIdentifier(helperName),
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
          positional[0],
          thisExpression: thisExpression,
        ),
        positional.length == 2
            ? _lowerExpression(
                semantic,
                helpers,
                locals,
                positional[1],
                thisExpression: thisExpression,
              )
            : const EsmNumberLiteral(0),
      ],
    );
  }

  EsmExpression? _lowerCoreRegExpInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty ||
        !_isCoreRegExpMember(target)) {
      return null;
    }
    final positional = expression.arguments.positional;
    final method = switch (expression.name.text) {
      'hasMatch' ||
      'firstMatch' ||
      'stringMatch' when positional.length == 1 => expression.name.text,
      'matchAsPrefix' || 'allMatches'
          when positional.isNotEmpty && positional.length <= 2 =>
        expression.name.text,
      'toString' when positional.isEmpty => expression.name.text,
      _ => null,
    };
    if (method == null) {
      return null;
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: method,
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
      ],
    );
  }

  EsmExpression? _lowerCoreMatchInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty ||
        !_isCoreMatchMember(target)) {
      return null;
    }
    final positional = expression.arguments.positional;
    final method = switch (expression.name.text) {
      'group' ||
      'groups' ||
      'namedGroup' when positional.length == 1 => expression.name.text,
      _ => null,
    };
    if (method == null) {
      return null;
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: method,
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

  EsmExpression? _lowerCoreCollectionInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    EsmExpression lower(k.Expression argument) => _lowerExpression(
      semantic,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );
    final queueInvocation = sdkIntrinsics.lowerInstanceInvocation(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
      arguments: expression.arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: () => lower(expression.receiver),
      lower: lower,
      lowerNamedArgument: (arguments, name) => _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        arguments,
        name,
        thisExpression: thisExpression,
      ),
      arrayFrom: (value) => _arrayFrom(helpers, value),
    );
    if (queueInvocation != null) {
      return queueInvocation;
    }
    final memberName = expression.name.text;
    final isListMember = isDartCoreListMember(
      expression.interfaceTargetReference,
      memberName,
    );
    if (target == 'dart:core::Iterable::@methods::toList' &&
        expression.arguments.positional.isEmpty &&
        _hasOnlyNamedArguments(expression.arguments, {'growable'})) {
      helpers.require(EsmRuntimeHelper.listFactory);
      final growable =
          _lowerNamedArgument(
            semantic,
            helpers,
            locals,
            expression.arguments,
            'growable',
            thisExpression: thisExpression,
          ) ??
          const EsmBooleanLiteral(true);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          growable,
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::toSet' ||
            target == 'dart:core::List::@methods::toSet') &&
        expression.arguments.positional.isEmpty &&
        expression.arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: const EsmIdentifier('__dartSetFrom'),
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
    if ((target == 'dart:core::Iterable::@methods::whereType' ||
            target == 'dart:core::List::@methods::whereType') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty &&
        expression.arguments.types.length == 1) {
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
          property: 'filter',
        ),
        arguments: [
          EsmArrowFunction(
            parameters: const [EsmIdentifierParameter(name: 'value')],
            body: _lowerTypeTest(
              semantic,
              helpers,
              expression.arguments.types.single,
              const EsmIdentifier('value'),
            ),
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::cast' ||
            target == 'dart:core::List::@methods::cast' ||
            target == 'dart:core::Set::@methods::cast' ||
            target == 'dart:_compact_hash::_Set::@methods::cast') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty &&
        expression.arguments.types.length == 1) {
      return _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
    }
    if ((target == 'dart:core::Iterable::@methods::map' ||
            target == 'dart:core::List::@methods::map') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Array'),
          property: 'from',
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
    if ((target == 'dart:core::Iterable::@methods::where' ||
            target == 'dart:core::List::@methods::where') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
          property: 'filter',
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
    if ((target == 'dart:core::Iterable::@methods::any' ||
            target == 'dart:core::List::@methods::any' ||
            target == 'dart:core::Iterable::@methods::every' ||
            target == 'dart:core::List::@methods::every' ||
            target == 'dart:_internal::ListIterable::@methods::any' ||
            target == 'dart:_internal::ListIterable::@methods::every') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      final method =
          target == 'dart:core::Iterable::@methods::any' ||
              target == 'dart:core::List::@methods::any' ||
              target == 'dart:_internal::ListIterable::@methods::any'
          ? 'some'
          : 'every';
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
          property: method,
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
    if ((target == 'dart:core::Iterable::@methods::firstWhere' ||
            target == 'dart:core::List::@methods::firstWhere' ||
            target == 'dart:core::Iterable::@methods::lastWhere' ||
            target == 'dart:core::List::@methods::lastWhere' ||
            target == 'dart:core::Iterable::@methods::singleWhere' ||
            target == 'dart:core::List::@methods::singleWhere') &&
        _hasOnlyNamedArguments(expression.arguments, {'orElse'}) &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterableSearch);
      final helperName = switch (target) {
        'dart:core::Iterable::@methods::firstWhere' ||
        'dart:core::List::@methods::firstWhere' => '__dartIterableFirstWhere',
        'dart:core::Iterable::@methods::lastWhere' ||
        'dart:core::List::@methods::lastWhere' => '__dartIterableLastWhere',
        'dart:core::Iterable::@methods::singleWhere' ||
        'dart:core::List::@methods::singleWhere' => '__dartIterableSingleWhere',
        _ => throw StateError('unreachable Iterable search target'),
      };
      final orElse = _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        expression.arguments,
        'orElse',
        thisExpression: thisExpression,
      );
      return EsmCall(
        callee: EsmIdentifier(helperName),
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
          if (orElse != null) orElse,
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::fold' ||
            target == 'dart:core::List::@methods::fold') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 2) {
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
          property: 'reduce',
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional[1],
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional[0],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::reduce' ||
            target == 'dart:core::List::@methods::reduce') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
          property: 'reduce',
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
    if ((target == 'dart:core::Iterable::@methods::forEach' ||
            target == 'dart:core::List::@methods::forEach') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
          property: 'forEach',
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
    if ((target == 'dart:core::Iterable::@methods::elementAt' ||
            target == 'dart:core::List::@methods::elementAt') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmComputedPropertyAccess(
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
        property: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.arguments.positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    if ((target == 'dart:core::List::@methods::indexOf' ||
            target == 'dart:core::List::@methods::lastIndexOf' ||
            target == 'dart:core::List::@methods::indexWhere' ||
            target == 'dart:core::List::@methods::lastIndexWhere') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isNotEmpty &&
        expression.arguments.positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.listSearch);
      final helperName = switch (target) {
        'dart:core::List::@methods::indexOf' => '__dartListIndexOf',
        'dart:core::List::@methods::lastIndexOf' => '__dartListLastIndexOf',
        'dart:core::List::@methods::indexWhere' => '__dartListIndexWhere',
        'dart:core::List::@methods::lastIndexWhere' =>
          '__dartListLastIndexWhere',
        _ => throw StateError('unreachable List search target'),
      };
      return EsmCall(
        callee: EsmIdentifier(helperName),
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
    if (target == 'dart:core::List::@methods::sort' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.compare);
      final compare = expression.arguments.positional.isEmpty
          ? helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare)
          : EsmArrowFunction(
              parameters: const [
                EsmIdentifierParameter(name: 'left'),
                EsmIdentifierParameter(name: 'right'),
              ],
              body: EsmCall(
                callee: helpers.reference(
                  runtimeHelpers,
                  EsmRuntimeHelper.compare,
                ),
                arguments: [
                  const EsmIdentifier('left'),
                  const EsmIdentifier('right'),
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    expression.arguments.positional.single,
                    thisExpression: thisExpression,
                  ),
                ],
              ),
            );
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'sort',
        ),
        arguments: [compare],
      );
    }
    if (target == 'dart:core::List::@methods::shuffle' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListShuffle'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          if (expression.arguments.positional.isEmpty)
            const EsmNullLiteral()
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
    if (target ==
            'dart:collection::ListBase::@methods::dart:collection::_closeGap' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 2) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListRemoveRange'),
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
    if (target ==
            'dart:collection::ListBase::@methods::dart:collection::_filter' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 2) {
      final retainMatching = expression.arguments.positional[1];
      if (retainMatching is k.BoolLiteral) {
        helpers.require(EsmRuntimeHelper.listMutation);
        return EsmCall(
          callee: EsmIdentifier(
            retainMatching.value
                ? '__dartListRetainWhere'
                : '__dartListRemoveWhere',
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
              expression.arguments.positional.first,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
    }
    final listMutationHelper = isListMember
        ? switch (memberName) {
            'removeAt' => '__dartListRemoveAt',
            'insert' => '__dartListInsert',
            'remove' => '__dartListRemove',
            'insertAll' => '__dartListInsertAll',
            'setAll' => '__dartListSetAll',
            'fillRange' => '__dartListFillRange',
            'replaceRange' => '__dartListReplaceRange',
            'removeRange' => '__dartListRemoveRange',
            'removeWhere' => '__dartListRemoveWhere',
            'retainWhere' => '__dartListRetainWhere',
            'setRange' => '__dartListSetRange',
            _ => null,
          }
        : null;
    if (listMutationHelper != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isNotEmpty) {
      helpers.require(
        listMutationHelper == '__dartListSetRange'
            ? EsmRuntimeHelper.listRangeOps
            : EsmRuntimeHelper.listMutation,
      );
      return EsmCall(
        callee: EsmIdentifier(listMutationHelper),
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
    if (target == 'dart:core::List::@methods::setRange' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length >= 3 &&
        expression.arguments.positional.length <= 4) {
      helpers.require(EsmRuntimeHelper.listRangeOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartListSetRange'),
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
    if (target == 'dart:core::List::@methods::removeLast' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListRemoveLast'),
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
    if (target == 'dart:core::List::@methods::asMap' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListAsMap'),
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
    if (isListMember &&
        memberName == 'sublist' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isNotEmpty &&
        expression.arguments.positional.length <= 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'slice',
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
    if (isListMember &&
        memberName == 'getRange' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 2) {
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
          property: 'slice',
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
    if ((target == 'dart:core::Iterable::@methods::take' ||
            target == 'dart:core::List::@methods::take') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
          property: 'slice',
        ),
        arguments: [
          const EsmNumberLiteral(0),
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
    if ((target == 'dart:core::Iterable::@methods::takeWhile' ||
            target == 'dart:core::List::@methods::takeWhile') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterableWindow);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.iterableWindow,
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
    if ((target == 'dart:core::Iterable::@methods::skipWhile' ||
            target == 'dart:core::List::@methods::skipWhile') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterableWindow);
      return EsmCall(
        callee: const EsmIdentifier('__dartIterableSkipWhile'),
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
    if ((target == 'dart:core::Iterable::@methods::followedBy' ||
            target == 'dart:core::List::@methods::followedBy') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
          property: 'concat',
        ),
        arguments: [
          _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.arguments.positional.single,
              thisExpression: thisExpression,
            ),
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::expand' ||
            target == 'dart:core::List::@methods::expand') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
          property: 'flatMap',
        ),
        arguments: [
          EsmArrowFunction(
            parameters: const [EsmIdentifierParameter(name: 'value')],
            body: _arrayFrom(
              helpers,
              EsmCall(
                callee: EsmParenthesized(
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    expression.arguments.positional.single,
                    thisExpression: thisExpression,
                  ),
                ),
                arguments: const [EsmIdentifier('value')],
              ),
            ),
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::skip' ||
            target == 'dart:core::List::@methods::skip') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
          property: 'slice',
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
    return null;
  }

  EsmExpression? _lowerSinkInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    String memberName, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final isSinkTarget =
        target.startsWith('dart:core::Sink::') ||
        (target.startsWith('dart:convert::') &&
            target.contains('Sink::@methods::'));
    if (!isSinkTarget) {
      return null;
    }
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final allowed = switch (memberName) {
      'add' || 'addSlice' || 'addCharCode' || 'close' => true,
      _ => false,
    };
    if (!allowed) {
      return null;
    }
    return EsmCall(
      callee: _memberAccess(
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        memberName,
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

  EsmExpression? _lowerDartConvertInterfaceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String memberName, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (!isDartConvertConverterMember(
      expression.interfaceTargetReference,
      memberName,
    )) {
      return null;
    }
    if (expression.arguments.types.isNotEmpty) {
      return null;
    }
    final allowed = switch (memberName) {
      'bind' ||
      'cast' ||
      'convert' ||
      'decode' ||
      'encode' ||
      'fuse' ||
      'startChunkedConversion' => true,
      _ => false,
    };
    if (!allowed) {
      return null;
    }
    return EsmCall(
      callee: _memberAccess(
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        memberName,
      ),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'dart:convert interface invocation arguments',
      ),
    );
  }

  EsmExpression? _lowerCoreNumberInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    if (expression.arguments.named.isEmpty && positional.isEmpty) {
      final receiver = _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
      final doubleResultMethod = switch (target) {
        'dart:core::num::@methods::roundToDouble' ||
        'dart:core::double::@methods::roundToDouble' => 'round',
        'dart:core::num::@methods::truncateToDouble' ||
        'dart:core::double::@methods::truncateToDouble' => 'trunc',
        'dart:core::num::@methods::floorToDouble' ||
        'dart:core::double::@methods::floorToDouble' => 'floor',
        'dart:core::num::@methods::ceilToDouble' ||
        'dart:core::double::@methods::ceilToDouble' => 'ceil',
        _ => null,
      };
      if (doubleResultMethod != null) {
        helpers.require(EsmRuntimeHelper.doubleValue);
        return EsmCall(
          callee: helpers.reference(
            runtimeHelpers,
            EsmRuntimeHelper.doubleValue,
          ),
          arguments: [
            EsmCall(
              callee: EsmPropertyAccess(
                receiver: const EsmIdentifier('Math'),
                property: doubleResultMethod,
              ),
              arguments: [receiver],
            ),
          ],
        );
      }
      final numberMethod = switch (target) {
        'dart:core::num::@methods::abs' ||
        'dart:core::int::@methods::abs' ||
        'dart:core::double::@methods::abs' => 'abs',
        'dart:core::num::@methods::floor' ||
        'dart:core::double::@methods::floor' => 'floor',
        'dart:core::num::@methods::ceil' ||
        'dart:core::double::@methods::ceil' => 'ceil',
        'dart:core::num::@methods::round' ||
        'dart:core::double::@methods::round' => 'round',
        'dart:core::num::@methods::truncate' ||
        'dart:core::double::@methods::truncate' ||
        'dart:core::num::@methods::toInt' ||
        'dart:core::double::@methods::toInt' => 'trunc',
        _ => null,
      };
      if (numberMethod != null) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: const EsmIdentifier('Math'),
            property: numberMethod,
          ),
          arguments: [receiver],
        );
      }
    }
    if (!_isCoreCompareToTarget(target) || positional.length != 1) {
      if ((target == 'dart:core::num::@methods::clamp' ||
              target == 'dart:core::int::@methods::clamp' ||
              target == 'dart:core::double::@methods::clamp') &&
          positional.length == 2 &&
          expression.arguments.named.isEmpty) {
        final receiver = _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        );
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Math'),
            property: 'min',
          ),
          arguments: [
            EsmCall(
              callee: const EsmPropertyAccess(
                receiver: EsmIdentifier('Math'),
                property: 'max',
              ),
              arguments: [
                receiver,
                _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  positional[0],
                  thisExpression: thisExpression,
                ),
              ],
            ),
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional[1],
              thisExpression: thisExpression,
            ),
          ],
        );
      }
      if ((target == 'dart:core::num::@methods::remainder' ||
              target == 'dart:core::int::@methods::remainder' ||
              target == 'dart:core::double::@methods::remainder') &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return EsmBinary(
          left: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          operator: EsmBinaryOperator.remainder,
          right: _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        );
      }
      if ((target == 'dart:core::num::@methods::~/' ||
              target == 'dart:core::int::@methods::~/' ||
              target == 'dart:core::double::@methods::~/') &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return _mathTrunc(
          EsmBinary(
            left: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            operator: EsmBinaryOperator.divide,
            right: _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
          ),
        );
      }
      if (target == 'dart:core::int::@methods::gcd' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        helpers.require(EsmRuntimeHelper.intGcd);
        return EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.intGcd),
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
              positional.single,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
      if (target == 'dart:core::int::@methods::modInverse' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        helpers.require(EsmRuntimeHelper.intModular);
        return EsmCall(
          callee: helpers.reference(
            runtimeHelpers,
            EsmRuntimeHelper.intModular,
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
              positional.single,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
      if (target == 'dart:core::int::@methods::modPow' &&
          positional.length == 2 &&
          expression.arguments.named.isEmpty) {
        helpers.require(EsmRuntimeHelper.intModular);
        return EsmCall(
          callee: const EsmIdentifier('__dartIntModPow'),
          arguments: [
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            for (final argument in positional)
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
      if (target == 'dart:core::int::@methods::toRadixString' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: EsmParenthesized(
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.receiver,
                thisExpression: thisExpression,
              ),
            ),
            property: 'toString',
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
      return null;
    }
    helpers.require(EsmRuntimeHelper.compare);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare),
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
          positional.single,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpression? _lowerBigIntInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final positional = expression.arguments.positional;
    if (target == 'dart:core::BigInt::@methods::toInt' && positional.isEmpty) {
      return EsmCall(
        callee: const EsmIdentifier('Number'),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::BigInt::@methods::toRadixString' &&
        positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'toString'),
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
    if (target == 'dart:core::BigInt::@methods::abs' && positional.isEmpty) {
      return EsmConditional(
        condition: EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.lessThan,
          right: _bigIntLiteral(0),
        ),
        thenExpression: EsmUnary(
          operator: EsmUnaryOperator.negate,
          operand: receiver,
        ),
        otherwiseExpression: receiver,
      );
    }
    if (target == 'dart:core::BigInt::@methods::remainder' &&
        positional.length == 1) {
      return EsmBinary(
        left: receiver,
        operator: EsmBinaryOperator.remainder,
        right: _lowerExpression(
          semantic,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    if (target == 'dart:core::BigInt::@methods::~/') {
      if (positional.length != 1) return null;
      return EsmBinary(
        left: receiver,
        operator: EsmBinaryOperator.divide,
        right: _lowerExpression(
          semantic,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    return null;
  }
}
