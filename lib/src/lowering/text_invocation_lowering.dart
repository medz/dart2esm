part of 'kernel_to_esm_ast.dart';

extension _TextInvocationLowering on Lowerer {
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
}
