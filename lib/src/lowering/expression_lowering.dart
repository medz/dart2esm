part of 'kernel_to_esm_ast.dart';

extension _ExpressionLowering on Lowerer {
  EsmExpression _lowerExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return switch (expression) {
      k.StaticInvocation() => _lowerStaticInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.StaticGet() => _lowerStaticGet(semantic, helpers, expression),
      k.StaticSet() => _lowerStaticSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.ConstantExpression() => _lowerConstantExpression(
        semantic,
        helpers,
        expression,
      ),
      k.VariableGet() => _lowerVariableGet(locals, expression),
      k.VariableSet() => _lowerVariableSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.FunctionInvocation() => EsmCall(
        callee: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        arguments: _lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'function invocation arguments',
        ),
      ),
      k.LocalFunctionInvocation() => _lowerLocalFunctionInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceInvocation() => _lowerInstanceInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceGet() => _lowerInstanceGet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceSet() => _lowerInstanceSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.SuperMethodInvocation() => _lowerSuperMethodInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.SuperPropertyGet() => _lowerSuperPropertyGet(
        semantic,
        helpers,
        locals,
        expression,
      ),
      k.SuperPropertySet() => _lowerSuperPropertySet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.ConstructorInvocation() => _lowerConstructorInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.IsExpression() => _lowerIsExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.AsExpression() => _lowerAsExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.NullCheck() => _lowerNullCheck(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.Not() => EsmUnary(
        operator: EsmUnaryOperator.logicalNot,
        operand: EsmParenthesized(
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.operand,
            thisExpression: thisExpression,
          ),
        ),
      ),
      k.LogicalExpression() => EsmParenthesized(
        EsmBinary(
          left: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.left,
            thisExpression: thisExpression,
          ),
          operator: expression.operatorEnum == k.LogicalExpressionOperator.AND
              ? EsmBinaryOperator.logicalAnd
              : EsmBinaryOperator.logicalOr,
          right: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.right,
            thisExpression: thisExpression,
          ),
        ),
      ),
      k.EqualsNull() => EsmBinary(
        left: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.expression,
          thisExpression: thisExpression,
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNullLiteral(),
      ),
      k.ConditionalExpression() => EsmConditional(
        condition: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.condition,
          thisExpression: thisExpression,
        ),
        thenExpression: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.then,
          thisExpression: thisExpression,
        ),
        otherwiseExpression: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.otherwise,
          thisExpression: thisExpression,
        ),
      ),
      k.ThisExpression() => thisExpression,
      k.StringLiteral() => EsmStringLiteral(expression.value),
      k.StringConcatenation() => _lowerStringConcatenation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.IntLiteral() => EsmNumberLiteral(expression.value),
      k.DoubleLiteral() => EsmNumberLiteral(expression.value),
      k.BoolLiteral() => EsmBooleanLiteral(expression.value),
      k.NullLiteral() => const EsmNullLiteral(),
      k.ListLiteral() => EsmArrayLiteral([
        for (final element in expression.expressions)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            element,
            thisExpression: thisExpression,
          ),
      ]),
      k.SetLiteral() => () {
        helpers.require(EsmRuntimeHelper.setAddAll);
        return EsmCall(
          callee: const EsmIdentifier('__dartSetFrom'),
          arguments: [
            EsmArrayLiteral([
              for (final element in expression.expressions)
                _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  element,
                  thisExpression: thisExpression,
                ),
            ]),
          ],
        );
      }(),
      k.MapLiteral() => () {
        helpers.require(EsmRuntimeHelper.mapFactories);
        return EsmCall(
          callee: const EsmIdentifier('__dartMapFromEntries'),
          arguments: [
            EsmArrayLiteral([
              for (final entry in expression.entries)
                EsmArrayLiteral([
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    entry.key,
                    thisExpression: thisExpression,
                  ),
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    entry.value,
                    thisExpression: thisExpression,
                  ),
                ]),
            ]),
          ],
        );
      }(),
      k.RecordLiteral() => _lowerRecordLiteral(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.RecordIndexGet() => EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: _recordPositionalKey(expression.index),
      ),
      k.RecordNameGet() => EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: expression.name,
      ),
      k.SymbolLiteral() => _lowerSymbolLiteral(helpers, expression.value),
      k.TypeLiteral() => _lowerTypeLiteral(helpers, expression.type),
      k.Throw() => EsmCall(
        callee: EsmParenthesized(
          EsmArrowBlockFunction(
            parameters: const [],
            body: [
              EsmThrowStatement(
                _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  expression.expression,
                  thisExpression: thisExpression,
                ),
              ),
            ],
          ),
        ),
        arguments: const [],
      ),
      k.EqualsCall() => _lowerEqualsCall(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicGet() => _lowerDynamicGet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicSet() => _lowerDynamicSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicInvocation() => _lowerDynamicInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceTearOff() => _lowerInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.FunctionExpression() => _lowerFunctionExpression(
        semantic,
        helpers,
        locals,
        expression,
      ),
      k.BlockExpression() => _lowerBlockExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.Let() => _lowerLetExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      _ => throw UnsupportedCompilerFeature(expression, 'expression lowering'),
    };
  }

  EsmExpression _lowerDynamicGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.dynamicGet);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dynamicGet),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        EsmStringLiteral(expression.name.text),
      ],
    );
  }

  EsmExpression _lowerDynamicSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.dynamicSet);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dynamicSet),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        EsmStringLiteral(expression.name.text),
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpression _lowerNullCheck(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.NullCheck expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.nullCheck);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.nullCheck),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.operand,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpression _lowerRecordLiteral(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.RecordLiteral expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.record);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.record),
      arguments: [
        EsmArrayLiteral([
          for (final field in expression.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              field,
              thisExpression: thisExpression,
            ),
        ]),
        EsmObjectLiteral([
          for (final field in expression.named)
            EsmObjectLiteralProperty.static(
              key: field.name,
              value: _lowerExpression(
                semantic,
                helpers,
                locals,
                field.value,
                thisExpression: thisExpression,
              ),
            ),
        ]),
      ],
    );
  }

  EsmExpression _lowerStringConcatenation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StringConcatenation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return EsmStringConcatenation([
      for (final part in expression.expressions)
        if (part is k.StringLiteral)
          EsmStringLiteral(part.value)
        else
          _lowerStringifiedExpression(
            semantic,
            helpers,
            locals,
            part,
            thisExpression: thisExpression,
          ),
    ]);
  }

  EsmExpression _lowerStringifiedExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.stringify);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringify),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  String _recordPositionalKey(int index) => '\$${index + 1}';

  EsmExpression _lowerLetExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.Let expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final optimized = _tryLowerLetExpressionInline(
      semantic,
      helpers,
      outerLocals,
      expression,
      thisExpression: thisExpression,
    );
    if (optimized != null) {
      return optimized;
    }
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    return EsmCall(
      callee: EsmParenthesized(
        EsmArrowBlockFunction(
          parameters: const [],
          body: [
            _lowerVariableDeclaration(
              semantic,
              helpers,
              locals,
              expression.variable,
              thisExpression: thisExpression,
            ),
            EsmReturnStatement(
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.body,
                thisExpression: thisExpression,
              ),
            ),
          ],
        ),
      ),
      arguments: const [],
    );
  }

  EsmExpression? _tryLowerLetExpressionInline(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Let expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final initializer = expression.variable.initializer;
    final body = expression.body;
    if (initializer == null || body is! k.ConditionalExpression) {
      return null;
    }
    if (!_isEqualsNullVariable(body.condition, expression.variable)) {
      return null;
    }
    if (_isVariableGet(body.otherwise, expression.variable)) {
      if (_referencesVariable(body.then, expression.variable)) {
        return null;
      }
      return EsmNullishCoalesce(
        left: _lowerExpression(
          semantic,
          helpers,
          locals,
          initializer,
          thisExpression: thisExpression,
        ),
        right: _lowerExpression(
          semantic,
          helpers,
          locals,
          body.then,
          thisExpression: thisExpression,
        ),
      );
    }
    if (body.then is k.NullLiteral) {
      return _tryLowerNullAwareLet(
        semantic,
        helpers,
        locals,
        expression.variable,
        initializer,
        body.otherwise,
        thisExpression: thisExpression,
      );
    }
    return null;
  }

  EsmExpression? _tryLowerNullAwareLet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableDeclaration variable,
    k.Expression initializer,
    k.Expression otherwise, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      initializer,
      thisExpression: thisExpression,
    );
    if (otherwise is k.InstanceGet &&
        _isVariableGet(otherwise.receiver, variable)) {
      final target = otherwise.interfaceTargetReference.node;
      if (target is k.Member) {
        return EsmOptionalPropertyAccess(
          receiver: receiver,
          property:
              _sdkInstanceGetterPropertyName(
                otherwise.interfaceTargetReference,
                otherwise.name.text,
              ) ??
              _instanceMemberName(semantic, target),
        );
      }
    }
    if (otherwise is k.InstanceInvocation &&
        _isVariableGet(otherwise.receiver, variable)) {
      if (_referencesVariable(otherwise.arguments, variable)) {
        return null;
      }
      final target = otherwise.interfaceTargetReference.node;
      if (target is k.Member) {
        return EsmOptionalMethodCall(
          receiver: receiver,
          property:
              _sdkInstanceMethodName(
                otherwise.interfaceTargetReference,
                otherwise.name.text,
              ) ??
              _instanceMemberName(semantic, target),
          arguments: _lowerArguments(
            semantic,
            helpers,
            locals,
            otherwise.arguments,
            thisExpression: thisExpression,
            contextNode: otherwise,
            context: 'null-aware invocation arguments',
          ),
        );
      }
    }
    return null;
  }

  bool _isEqualsNullVariable(
    k.Expression expression,
    k.VariableDeclaration variable,
  ) {
    return expression is k.EqualsNull &&
        _isVariableGet(expression.expression, variable);
  }

  bool _isVariableGet(k.Expression expression, k.VariableDeclaration variable) {
    return expression is k.VariableGet && expression.variable == variable;
  }

  bool _referencesVariable(k.TreeNode node, k.VariableDeclaration variable) {
    final visitor = _VariableReferenceVisitor(variable);
    node.accept(visitor);
    return visitor.found;
  }

  EsmExpression _lowerBlockExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.BlockExpression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    return EsmCall(
      callee: EsmParenthesized(
        EsmArrowBlockFunction(
          parameters: const [],
          body: [
            ..._lowerStatementList(
              semantic,
              helpers,
              locals,
              {},
              expression.body,
              thisExpression: thisExpression,
            ),
            EsmReturnStatement(
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.value,
                thisExpression: thisExpression,
              ),
            ),
          ],
        ),
      ),
      arguments: const [],
    );
  }

  EsmExpression _lowerFunctionExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.FunctionExpression expression,
  ) {
    return _lowerFunctionNodeExpression(
      semantic,
      helpers,
      outerLocals,
      expression.function,
    );
  }

  EsmExpression _lowerFunctionNodeExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.FunctionNode function,
  ) {
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(
        function,
        'function expression async marker',
      );
    }
    final body = function.body;
    if (body == null) {
      throw UnsupportedCompilerFeature(function, 'function expression body');
    }
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    final usedParameters = <String>{};
    return EsmArrowBlockFunction(
      parameters: _bindParameters(
        semantic,
        helpers,
        locals,
        usedParameters,
        function,
      ),
      body: _lowerStatementList(semantic, helpers, locals, {}, body),
    );
  }

  EsmExpression _lowerLocalFunctionInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.LocalFunctionInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final name = locals[expression.variable];
    if (name == null) {
      throw UnsupportedCompilerFeature(expression, 'unbound local function');
    }
    return EsmCall(
      callee: EsmIdentifier(name),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'local function invocation arguments',
      ),
    );
  }
}
