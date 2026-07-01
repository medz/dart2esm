part of 'kernel_to_esm_ast.dart';

extension _ConstructorLowering on Lowerer {
  EsmExpression _lowerConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final sdkConstructor = _lowerSdkConstructorInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (sdkConstructor != null) {
      return sdkConstructor;
    }
    final targetPath = kernelReferencePath(expression.targetReference);
    final target = expression.targetReference.node;
    if (target is! k.Constructor) {
      throw UnsupportedCompilerFeature(
        expression,
        'constructor invocation $targetPath '
        '(positional ${expression.arguments.positional.length}, '
        'named ${expression.arguments.named.length}, '
        'types ${expression.arguments.types.length})',
      );
    }
    final constructor = semantic.constructorSymbolFor(target);
    final klass = semantic.classSymbolFor(target.enclosingClass);
    if (klass == null) {
      throw UnsupportedCompilerFeature(
        expression,
        'constructor invocation class symbol missing $targetPath',
      );
    }
    if (constructor == null) {
      if (!_isSyntheticDefaultConstructor(target) ||
          expression.arguments.positional.isNotEmpty ||
          expression.arguments.named.isNotEmpty) {
        throw UnsupportedCompilerFeature(
          expression,
          'constructor invocation symbol missing '
          '${kernelReferencePath(expression.targetReference)}',
        );
      }
      return EsmNew(callee: EsmIdentifier(klass.name), arguments: const []);
    }
    if (constructor.name.isNotEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: constructor.name,
        ),
        arguments: _lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'constructor invocation arguments',
        ),
      );
    }
    return EsmNew(
      callee: EsmIdentifier(klass.name),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'constructor invocation arguments',
      ),
    );
  }

  EsmExpression? _lowerSdkConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final coreTimeConstructor = _lowerCoreTimeConstructorInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreTimeConstructor != null) {
      return coreTimeConstructor;
    }
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final convertConstructor = sdkIntrinsics.lowerConstructorInvocation(
      expression: expression,
      helpers: helpers,
      lower: (argument) => _lowerExpression(
        semantic,
        helpers,
        locals,
        argument,
        thisExpression: thisExpression,
      ),
    );
    if (convertConstructor != null) {
      return convertConstructor;
    }
    final mathConstructor = _lowerMathConstructorInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (mathConstructor != null) {
      return mathConstructor;
    }
    final coreErrorName = dartCoreErrorConstructorName(
      expression.targetReference,
    );
    if (coreErrorName != null) {
      return _lowerCoreErrorCreation(
        semantic,
        helpers,
        locals,
        coreErrorName,
        expression.arguments.positional,
        thisExpression: thisExpression,
      );
    }
    if (isDartListIteratorConstructorReference(expression.targetReference) &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterator);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.iterator),
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
    if (isDartCollectionQueueConstructorReference(expression.targetReference) &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length <= 1) {
      return const EsmArrayLiteral([]);
    }
    final target = kernelReferencePath(expression.targetReference);
    final positional = expression.arguments.positional;
    if (target == 'dart:core::Object::@constructors::' && positional.isEmpty) {
      return const EsmObjectLiteral([]);
    }
    if (isDartMappedIterableConstructorPath(target) && positional.length == 2) {
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
            positional.first,
            thisExpression: thisExpression,
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
    if (isDartWhereIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
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
            positional[1],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartWhereTypeIterableConstructorPath(target) &&
        positional.length == 1 &&
        expression.arguments.types.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
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
    if (isDartExpandIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
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
                    positional[1],
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
    if (isDartTakeIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
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
            positional[1],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartSkipIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
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
            positional[1],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartSubListIterableConstructorPath(target) &&
        positional.length == 3) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
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
            positional[1],
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional[2],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartListMapViewConstructorPath(target) && positional.length == 1) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListAsMap'),
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
    if (isDartReversedListIterableConstructorPath(target) &&
        positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
          ),
          property: 'reverse',
        ),
        arguments: const [],
      );
    }
    if (isDartMapBaseValueIterableConstructorPath(target) &&
        positional.length == 1) {
      return _arrayFrom(
        helpers,
        EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
            property: 'values',
          ),
          arguments: const [],
        ),
      );
    }
    final iterableWindowHelper = switch (target) {
      _ when isDartTakeWhileIterableConstructorPath(target) =>
        '__dartIterableTakeWhile',
      _ when isDartSkipWhileIterableConstructorPath(target) =>
        '__dartIterableSkipWhile',
      _ => null,
    };
    if (iterableWindowHelper != null && positional.length == 2) {
      helpers.require(EsmRuntimeHelper.iterableWindow);
      return EsmCall(
        callee: EsmIdentifier(iterableWindowHelper),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
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
    if (target.startsWith(
          'dart:collection::UnmodifiableListView::@constructors::',
        ) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.unmodifiableViews);
      return EsmCall(
        callee: const EsmIdentifier('__dartUnmodifiableListView'),
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
    if (target.startsWith(
          'dart:collection::UnmodifiableMapView::@constructors::',
        ) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.unmodifiableViews);
      return EsmCall(
        callee: const EsmIdentifier('__dartUnmodifiableMapView'),
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
    if (isDartCoreWeakReferenceConstructorReference(
          expression.targetReference,
        ) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.weakReference);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.weakReference,
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
    if (isDartCoreFinalizerConstructorReference(expression.targetReference) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.finalizer);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.finalizer),
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
    if (isDartCoreExpandoConstructorReference(expression.targetReference) &&
        positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.expando);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.expando),
        arguments: [
          if (positional.isEmpty)
            const EsmNullLiteral()
          else
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
    if (target == 'dart:collection::SplayTreeSet::@constructors::' &&
        positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCall(
        callee: const EsmIdentifier('__dartSplayTreeSet'),
        arguments: [
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (target == 'dart:collection::SplayTreeMap::@constructors::' &&
        positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCall(
        callee: const EsmIdentifier('__dartSplayTreeMap'),
        arguments: [
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isCoreStringBufferConstructor(target) && positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.stringBuffer);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.stringBuffer,
        ),
        arguments: [
          if (positional.isEmpty)
            const EsmStringLiteral('')
          else
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
    if (_isCoreRunesConstructor(target) && positional.length == 1) {
      return _stringRunes(
        _lowerExpression(
          semantic,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    if (target == 'dart:_compact_hash::_Set::@constructors::' &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return const EsmCall(
        callee: EsmIdentifier('__dartSetFrom'),
        arguments: [EsmArrayLiteral([])],
      );
    }
    if (target == 'dart:_internal::EmptyIterable::@constructors::' &&
        expression.arguments.positional.isEmpty) {
      return const EsmArrayLiteral([]);
    }
    if (target.startsWith('dart:core::MapEntry::@constructors::') &&
        expression.arguments.positional.length == 2) {
      return EsmArrayLiteral([
        for (final argument in expression.arguments.positional)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
      ]);
    }
    if ((target.startsWith('dart:core::Symbol::') ||
            target.startsWith('dart:_internal::Symbol::')) &&
        expression.arguments.positional.length == 1) {
      final argument = expression.arguments.positional.single;
      if (argument is k.StringLiteral) {
        return _lowerSymbolLiteral(helpers, argument.value);
      }
      helpers.require(EsmRuntimeHelper.symbol);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.symbol),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
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

  EsmExpression? _lowerCoreTimeConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = kernelReferencePath(expression.targetReference);
    final positional = expression.arguments.positional;
    if (target.startsWith('dart:core::Duration::@constructors::') &&
        positional.isEmpty &&
        expression.arguments.types.isEmpty &&
        _hasOnlyNamedArguments(expression.arguments, {
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'microseconds',
        })) {
      helpers.require(EsmRuntimeHelper.duration);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.duration),
        arguments: [
          _lowerCoreDurationOptionsObject(
            semantic,
            helpers,
            locals,
            expression.arguments,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (!target.startsWith('dart:core::DateTime::@constructors::') ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    helpers.require(EsmRuntimeHelper.dateTime);
    if ((target == 'dart:core::DateTime::@constructors::' ||
            target == 'dart:core::DateTime::@constructors::utc') &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 8) {
      return EsmCall(
        callee: const EsmIdentifier('__dartDateTimeFromParts'),
        arguments: [
          EsmBooleanLiteral(
            target == 'dart:core::DateTime::@constructors::utc',
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
    if ((target == 'dart:core::DateTime::@constructors::now' ||
            target == 'dart:core::DateTime::@constructors::timestamp') &&
        expression.arguments.named.isEmpty &&
        positional.isEmpty) {
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dateTime),
        arguments: [
          const EsmCall(
            callee: EsmPropertyAccess(
              receiver: EsmIdentifier('Date'),
              property: 'now',
            ),
            arguments: [],
          ),
          EsmBooleanLiteral(
            target == 'dart:core::DateTime::@constructors::timestamp',
          ),
        ],
      );
    }
    if ((target ==
                'dart:core::DateTime::@constructors::fromMillisecondsSinceEpoch' ||
            target ==
                'dart:core::DateTime::@constructors::fromMicrosecondsSinceEpoch') &&
        positional.length == 1 &&
        _hasOnlyNamedArguments(expression.arguments, {'isUtc'})) {
      final isUtc =
          _lowerNamedArgument(
            semantic,
            helpers,
            locals,
            expression.arguments,
            'isUtc',
            thisExpression: thisExpression,
          ) ??
          const EsmBooleanLiteral(false);
      return EsmCall(
        callee: target.endsWith('fromMicrosecondsSinceEpoch')
            ? const EsmIdentifier('__dartDateTimeFromMicros')
            : helpers.reference(runtimeHelpers, EsmRuntimeHelper.dateTime),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
          isUtc,
        ],
      );
    }
    return null;
  }

  EsmObjectLiteral _lowerCoreDurationOptionsObject(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return EsmObjectLiteral([
      for (final name in const [
        'days',
        'hours',
        'minutes',
        'seconds',
        'milliseconds',
        'microseconds',
      ])
        EsmObjectLiteralProperty.static(
          key: name,
          value:
              _lowerNamedArgument(
                semantic,
                helpers,
                locals,
                arguments,
                name,
                thisExpression: thisExpression,
              ) ??
              const EsmNumberLiteral(0),
        ),
    ]);
  }

  EsmExpression? _lowerMathConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    if (isDartMathPointConstructorReference(expression.targetReference) &&
        positional.length == 2) {
      helpers.require(EsmRuntimeHelper.mathPoint);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mathPoint),
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
    if (isDartMathRectangleConstructorReference(expression.targetReference) &&
        positional.length == 4) {
      helpers.require(EsmRuntimeHelper.mathRectangle);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mathRectangle,
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

  EsmExpression _lowerCoreErrorCreation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    String typeName,
    List<k.Expression> positionalArguments, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.coreError);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
      arguments: [
        EsmStringLiteral(typeName),
        positionalArguments.isEmpty
            ? const EsmNullLiteral()
            : _lowerExpression(
                semantic,
                helpers,
                locals,
                positionalArguments.first,
                thisExpression: thisExpression,
              ),
      ],
    );
  }

  bool _isSyntheticDefaultConstructor(k.Constructor constructor) {
    return constructor.isSynthetic && constructor.name.text.isEmpty;
  }
}
