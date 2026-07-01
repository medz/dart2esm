part of 'kernel_to_esm_ast.dart';

extension _StatementLowering on Lowerer {
  List<EsmStatement> _lowerStatementList(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Statement statement, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    EsmExpression thisExpression = const EsmThis(),
    String? rethrowName,
  }) {
    return switch (statement) {
      k.Block() => [
        for (final child in statement.statements)
          ..._lowerStatementList(
            semantic,
            helpers,
            locals,
            labels,
            child,
            continueSwitchTargets: continueSwitchTargets,
            thisExpression: thisExpression,
            rethrowName: rethrowName,
          ),
      ],
      k.LabeledStatement() => [
        _lowerLabeledStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.BreakStatement() => [_lowerBreakStatement(labels, statement)],
      k.ContinueSwitchStatement() => _lowerContinueSwitchStatement(
        continueSwitchTargets,
        statement,
      ),
      k.VariableDeclaration() => [
        _lowerVariableDeclaration(
          semantic,
          helpers,
          locals,
          statement,
          thisExpression: thisExpression,
        ),
      ],
      k.FunctionDeclaration() => [
        _lowerFunctionDeclaration(semantic, helpers, locals, statement),
      ],
      k.EmptyStatement() => const [],
      k.AssertStatement() => const [],
      k.ExpressionStatement(expression: k.Throw()) => [
        _lowerThrowStatement(
          semantic,
          helpers,
          locals,
          statement.expression as k.Throw,
          thisExpression: thisExpression,
        ),
      ],
      k.ExpressionStatement(expression: k.Rethrow()) => [
        _lowerRethrowStatement(statement.expression as k.Rethrow, rethrowName),
      ],
      k.ExpressionStatement() => [
        EsmExpressionStatement(
          _lowerExpression(
            semantic,
            helpers,
            locals,
            statement.expression,
            thisExpression: thisExpression,
          ),
        ),
      ],
      k.IfStatement() => [
        _lowerIfStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.WhileStatement() => [
        _lowerWhileStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.DoStatement() => [
        _lowerDoStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.SwitchStatement() => [
        _lowerSwitchStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.ForStatement() => [
        _lowerForStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.TryCatch() => [
        _lowerTryCatch(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          rethrowName,
          continueSwitchTargets: continueSwitchTargets,
        ),
      ],
      k.TryFinally() => [
        _lowerTryFinally(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          rethrowName,
          continueSwitchTargets: continueSwitchTargets,
        ),
      ],
      k.ReturnStatement() => [
        EsmReturnStatement(
          statement.expression == null
              ? null
              : _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  statement.expression!,
                  thisExpression: thisExpression,
                ),
        ),
      ],
      _ => throw UnsupportedCompilerFeature(statement, 'statement lowering'),
    };
  }

  EsmLabeledStatement _lowerLabeledStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.LabeledStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    final label = _freshIn(labels.values.toSet(), 'label');
    labels[statement] = label;
    final body = _lowerStatementList(
      semantic,
      helpers,
      locals,
      labels,
      statement.body,
      continueSwitchTargets: continueSwitchTargets,
      thisExpression: thisExpression,
      rethrowName: rethrowName,
    );
    return EsmLabeledStatement(
      label: label,
      statement: body.length == 1 && body.single is EsmBlockStatement
          ? body.single
          : EsmBlockStatement(body),
    );
  }

  EsmBreakStatement _lowerBreakStatement(
    Map<k.LabeledStatement, String> labels,
    k.BreakStatement statement,
  ) {
    final label = labels[statement.target];
    if (label == null) {
      throw UnsupportedCompilerFeature(statement, 'unbound break target');
    }
    return EsmBreakStatement(label);
  }

  EsmIfStatement _lowerIfStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.IfStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    final otherwise = statement.otherwise;
    return EsmIfStatement(
      condition: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
      thenBody: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.then,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      otherwiseBody: otherwise == null
          ? null
          : _lowerStatementList(
              semantic,
              helpers,
              locals,
              labels,
              otherwise,
              continueSwitchTargets: continueSwitchTargets,
              thisExpression: thisExpression,
              rethrowName: rethrowName,
            ),
    );
  }

  EsmWhileStatement _lowerWhileStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.WhileStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmWhileStatement(
      condition: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  EsmDoStatement _lowerDoStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.DoStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmDoStatement(
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      condition: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmStatement _lowerSwitchStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.SwitchStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    if (_switchCanContinueToCase(statement)) {
      return _lowerContinuableSwitchStatement(
        semantic,
        helpers,
        locals,
        labels,
        continueSwitchTargets,
        statement,
        thisExpression,
        rethrowName: rethrowName,
      );
    }
    return EsmSwitchStatement(
      expression: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.expression,
        thisExpression: thisExpression,
      ),
      cases: [
        for (final switchCase in statement.cases)
          _lowerSwitchCase(
            semantic,
            helpers,
            locals,
            labels,
            continueSwitchTargets,
            switchCase,
            thisExpression,
            rethrowName: rethrowName,
          ),
      ],
    );
  }

  EsmSwitchCase _lowerSwitchCase(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchCase switchCase,
    EsmExpression thisExpression, {
    String? rethrowName,
  }) {
    return EsmSwitchCase(
      expressions: [
        for (final expression in switchCase.expressions)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression,
            thisExpression: thisExpression,
          ),
      ],
      isDefault: switchCase.isDefault,
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        switchCase.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  EsmBlockStatement _lowerContinuableSwitchStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchStatement statement,
    EsmExpression thisExpression, {
    String? rethrowName,
  }) {
    final usedNames = {
      ...semantic.globalBindingNames,
      ...locals.values,
      ...labels.values,
      for (final target in continueSwitchTargets.values) ...[
        target.stateName,
        target.loopLabel,
      ],
    };
    final valueName = _freshIn(usedNames, r'$switchValue');
    final targetName = _freshIn(usedNames, r'$switchTarget');
    final loopLabel = _freshIn(usedNames, r'$switchLoop');
    final targets = {
      for (var index = 0; index < statement.cases.length; index++)
        statement.cases[index]: _ContinueSwitchTarget(
          stateName: targetName,
          loopLabel: loopLabel,
          caseIndex: index,
        ),
    };
    final nestedTargets = {...continueSwitchTargets, ...targets};
    return EsmBlockStatement([
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(valueName),
        initializer: _lowerExpression(
          semantic,
          helpers,
          locals,
          statement.expression,
          thisExpression: thisExpression,
        ),
        mutable: false,
      ),
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(targetName),
        initializer: const EsmNumberLiteral(-1),
        mutable: true,
      ),
      EsmSwitchStatement(
        expression: EsmIdentifier(valueName),
        cases: [
          for (var index = 0; index < statement.cases.length; index++)
            _lowerContinuableSwitchDispatchCase(
              semantic,
              helpers,
              locals,
              statement.cases[index],
              index,
              targetName,
              thisExpression,
            ),
        ],
      ),
      EsmLabeledStatement(
        label: loopLabel,
        statement: EsmWhileStatement(
          condition: EsmBinary(
            left: EsmIdentifier(targetName),
            operator: EsmBinaryOperator.strictNotEquals,
            right: const EsmNumberLiteral(-1),
          ),
          body: [
            EsmSwitchStatement(
              expression: EsmIdentifier(targetName),
              cases: [
                for (var index = 0; index < statement.cases.length; index++)
                  _lowerContinuableSwitchBodyCase(
                    semantic,
                    helpers,
                    locals,
                    labels,
                    nestedTargets,
                    statement.cases[index],
                    index,
                    targetName,
                    thisExpression,
                    rethrowName: rethrowName,
                  ),
              ],
            ),
          ],
        ),
      ),
    ]);
  }

  EsmSwitchCase _lowerContinuableSwitchDispatchCase(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SwitchCase switchCase,
    int caseIndex,
    String targetName,
    EsmExpression thisExpression,
  ) {
    return EsmSwitchCase(
      expressions: [
        for (final expression in switchCase.expressions)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression,
            thisExpression: thisExpression,
          ),
      ],
      isDefault: switchCase.isDefault,
      body: [
        EsmExpressionStatement(
          EsmAssignment(
            target: EsmIdentifier(targetName),
            value: EsmNumberLiteral(caseIndex),
          ),
        ),
        const EsmBreakStatement(null),
      ],
    );
  }

  EsmSwitchCase _lowerContinuableSwitchBodyCase(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchCase switchCase,
    int caseIndex,
    String targetName,
    EsmExpression thisExpression, {
    String? rethrowName,
  }) {
    final body = _lowerStatementList(
      semantic,
      helpers,
      locals,
      labels,
      switchCase.body,
      continueSwitchTargets: continueSwitchTargets,
      thisExpression: thisExpression,
      rethrowName: rethrowName,
    );
    return EsmSwitchCase(
      expressions: [EsmNumberLiteral(caseIndex)],
      isDefault: false,
      body: [
        EsmExpressionStatement(
          EsmAssignment(
            target: EsmIdentifier(targetName),
            value: const EsmNumberLiteral(-1),
          ),
        ),
        ...body,
        if (!_endsAbruptly(body)) const EsmBreakStatement(null),
      ],
    );
  }

  List<EsmStatement> _lowerContinueSwitchStatement(
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.ContinueSwitchStatement statement,
  ) {
    final target = continueSwitchTargets[statement.target];
    if (target == null) {
      throw UnsupportedCompilerFeature(statement, 'continue switch statement');
    }
    return [
      EsmExpressionStatement(
        EsmAssignment(
          target: EsmIdentifier(target.stateName),
          value: EsmNumberLiteral(target.caseIndex),
        ),
      ),
      EsmContinueStatement(target.loopLabel),
    ];
  }

  bool _endsAbruptly(List<EsmStatement> statements) {
    if (statements.isEmpty) {
      return false;
    }
    return switch (statements.last) {
      EsmBreakStatement() ||
      EsmContinueStatement() ||
      EsmReturnStatement() ||
      EsmThrowStatement() => true,
      EsmBlockStatement(:final body) => _endsAbruptly(body),
      EsmIfStatement(:final thenBody, :final otherwiseBody) =>
        otherwiseBody != null &&
            _endsAbruptly(thenBody) &&
            _endsAbruptly(otherwiseBody),
      _ => false,
    };
  }

  EsmForStatement _lowerForStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.ForStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmForStatement(
      initializers: [
        for (final initializer in statement.variableInitializations)
          _lowerForInitializer(
            semantic,
            helpers,
            locals,
            initializer,
            thisExpression,
          ),
      ],
      condition: statement.condition == null
          ? null
          : _lowerExpression(
              semantic,
              helpers,
              locals,
              statement.condition!,
              thisExpression: thisExpression,
            ),
      updates: [
        for (final update in statement.updates)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            update,
            thisExpression: thisExpression,
          ),
      ],
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  EsmThrowStatement _lowerThrowStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Throw expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return EsmThrowStatement(
      _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.expression,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmThrowStatement _lowerRethrowStatement(
    k.Rethrow expression,
    String? rethrowName,
  ) {
    if (rethrowName == null) {
      throw UnsupportedCompilerFeature(expression, 'rethrow lowering');
    }
    return EsmThrowStatement(EsmIdentifier(rethrowName));
  }

  EsmTryStatement _lowerTryCatch(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.TryCatch statement,
    EsmExpression thisExpression,
    String? rethrowName, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    final errorName = _freshLocalName(semantic, locals.values, r'$error');
    return EsmTryStatement(
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      catchParameter: EsmIdentifierParameter(name: errorName),
      catchBody: _lowerCatchChain(
        semantic,
        helpers,
        locals,
        labels,
        statement.catches,
        errorName,
        thisExpression,
        continueSwitchTargets: continueSwitchTargets,
      ),
      finallyBody: null,
    );
  }

  EsmTryStatement _lowerTryFinally(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.TryFinally statement,
    EsmExpression thisExpression,
    String? rethrowName, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    return EsmTryStatement(
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      catchParameter: null,
      catchBody: null,
      finallyBody: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.finalizer,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  List<EsmStatement> _lowerCatchChain(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    List<k.Catch> catches,
    String errorName,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    var otherwise = <EsmStatement>[EsmThrowStatement(EsmIdentifier(errorName))];
    for (final catchClause in catches.reversed) {
      final body = _lowerCatchBody(
        semantic,
        helpers,
        locals,
        labels,
        catchClause,
        errorName,
        thisExpression,
        continueSwitchTargets: continueSwitchTargets,
      );
      if (_isTopType(catchClause.guard.unalias)) {
        otherwise = body;
        continue;
      }
      otherwise = [
        EsmIfStatement(
          condition: _lowerTypeTest(
            semantic,
            helpers,
            catchClause.guard,
            EsmIdentifier(errorName),
          ),
          thenBody: body,
          otherwiseBody: otherwise,
        ),
      ];
    }
    return otherwise;
  }

  List<EsmStatement> _lowerCatchBody(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Catch catchClause,
    String errorName,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    final catchLocals = Map<k.VariableDeclaration, String>.of(locals);
    final statements = <EsmStatement>[];
    final error = EsmIdentifier(errorName);
    final exception = catchClause.exception;
    if (exception != null) {
      final name = _freshLocalName(
        semantic,
        catchLocals.values,
        exception.name ?? 'e',
        reservedNames: [errorName],
      );
      catchLocals[exception] = name;
      statements.add(
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(name),
          initializer: error,
          mutable: exception.isAssignable,
        ),
      );
    }
    final stackTrace = catchClause.stackTrace;
    if (stackTrace != null) {
      final name = _freshLocalName(
        semantic,
        catchLocals.values,
        stackTrace.name ?? 'stack',
        reservedNames: [errorName],
      );
      catchLocals[stackTrace] = name;
      statements.add(
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(name),
          initializer: EsmNullishCoalesce(
            left: EsmOptionalPropertyAccess(receiver: error, property: 'stack'),
            right: const EsmStringLiteral('<javascript stack unavailable>'),
          ),
          mutable: stackTrace.isAssignable,
        ),
      );
    }
    statements.addAll(
      _lowerStatementList(
        semantic,
        helpers,
        catchLocals,
        labels,
        catchClause.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: errorName,
      ),
    );
    return statements;
  }

  EsmVariableDeclaration _lowerForInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableInitializationBase initializer,
    EsmExpression thisExpression,
  ) {
    if (initializer is! k.VariableDeclaration) {
      throw UnsupportedCompilerFeature(initializer, 'for initializer lowering');
    }
    return _lowerVariableDeclaration(
      semantic,
      helpers,
      locals,
      initializer,
      thisExpression: thisExpression,
    );
  }

  EsmVariableDeclaration _lowerVariableDeclaration(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableDeclaration statement, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final name = _freshLocalName(
      semantic,
      locals.values,
      statement.name ?? 'v',
    );
    locals[statement] = name;
    final initializer = statement.initializer;
    if (statement.isLate) {
      helpers.require(EsmRuntimeHelper.lazyField);
      return EsmVariableDeclaration(
        binding: EsmIdentifierBinding(name),
        initializer: EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.lazyField),
          arguments: [
            EsmStringLiteral(statement.name ?? name),
            initializer == null
                ? const EsmNullLiteral()
                : EsmArrowFunction(
                    parameters: const [],
                    body: _lowerExpression(
                      semantic,
                      helpers,
                      locals,
                      initializer,
                      thisExpression: thisExpression,
                    ),
                  ),
            _lateWritableArgument(statement.isFinal, statement.isAssignable),
          ],
        ),
        mutable: false,
      );
    }
    return EsmVariableDeclaration(
      binding: EsmIdentifierBinding(name),
      initializer: initializer == null
          ? const EsmNullLiteral()
          : _lowerExpression(
              semantic,
              helpers,
              locals,
              initializer,
              thisExpression: thisExpression,
            ),
      mutable: statement.isAssignable || initializer == null,
    );
  }

  EsmVariableDeclaration _lowerFunctionDeclaration(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.FunctionDeclaration statement,
  ) {
    final name = _freshLocalName(
      semantic,
      locals.values,
      statement.variable.name ?? 'f',
    );
    locals[statement.variable] = name;
    return EsmVariableDeclaration(
      binding: EsmIdentifierBinding(name),
      initializer: _lowerFunctionNodeExpression(
        semantic,
        helpers,
        locals,
        statement.function,
      ),
      mutable: false,
    );
  }
}
