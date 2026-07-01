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
}
