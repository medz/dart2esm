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

  EsmExpression _lowerConstantExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.ConstantExpression expression,
  ) {
    return _lowerConstant(semantic, helpers, expression.constant, expression);
  }

  EsmExpression _lowerConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    Object context,
  ) {
    if (constant is k.IntConstant) {
      return EsmNumberLiteral(constant.value);
    }
    if (constant is k.DoubleConstant) {
      return EsmNumberLiteral(constant.value);
    }
    if (constant is k.StringConstant) {
      return EsmStringLiteral(constant.value);
    }
    if (constant is k.BoolConstant) {
      return EsmBooleanLiteral(constant.value);
    }
    if (constant is k.NullConstant) {
      return const EsmNullLiteral();
    }
    if (constant is k.SymbolConstant) {
      return _lowerSymbolLiteral(
        helpers,
        constant.name,
        libraryReference: constant.libraryReference,
      );
    }
    if (constant is k.TypeLiteralConstant) {
      return _lowerTypeLiteral(helpers, constant.type);
    }
    if (constant is k.ListConstant) {
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'freeze',
          ),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.entries)
                _lowerConstant(semantic, helpers, entry, context),
            ]),
          ],
        ),
      );
    }
    if (constant is k.SetConstant) {
      helpers.require(EsmRuntimeHelper.constSet);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constSet),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.entries)
                _lowerConstant(semantic, helpers, entry, context),
            ]),
          ],
        ),
      );
    }
    if (constant is k.MapConstant) {
      helpers.require(EsmRuntimeHelper.constMap);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constMap),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.entries)
                EsmArrayLiteral([
                  _lowerConstant(semantic, helpers, entry.key, context),
                  _lowerConstant(semantic, helpers, entry.value, context),
                ]),
            ]),
          ],
        ),
      );
    }
    if (constant is k.RecordConstant) {
      helpers.require(EsmRuntimeHelper.record);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.record),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.positional)
                _lowerConstant(semantic, helpers, entry, context),
            ]),
            EsmObjectLiteral([
              for (final entry in constant.named.entries)
                EsmObjectLiteralProperty.static(
                  key: entry.key,
                  value: _lowerConstant(
                    semantic,
                    helpers,
                    entry.value,
                    context,
                  ),
                ),
            ]),
          ],
        ),
      );
    }
    if (constant is k.StaticTearOffConstant) {
      final extensionTypeMember = semantic
          .extensionTypeMemberSymbolForReference(constant.targetReference);
      if (extensionTypeMember != null) {
        return EsmIdentifier(extensionTypeMember.backingName);
      }
      final sdkTearOff = _lowerSdkStaticTearOffConstant(
        helpers,
        constant.targetReference,
      );
      if (sdkTearOff != null) {
        return sdkTearOff;
      }
      final target = constant.targetReference.node;
      if (target is k.Procedure) {
        final symbol = semantic.symbolFor(target);
        if (symbol != null && symbol.kind == EsmProcedureKind.method) {
          return EsmIdentifier(symbol.name);
        }
        final staticSymbol =
            semantic.staticProcedureSymbolFor(target) ??
            semantic.staticProcedureSymbolForReference(
              constant.targetReference,
            );
        final staticClass = staticSymbol == null
            ? null
            : semantic.classSymbolFor(staticSymbol.node.enclosingClass!);
        if (staticSymbol != null &&
            staticClass != null &&
            staticSymbol.kind == EsmProcedureKind.method) {
          return EsmPropertyAccess(
            receiver: EsmIdentifier(staticClass.name),
            property: staticSymbol.name,
          );
        }
      }
      throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering ${kernelReferencePath(constant.targetReference)}',
      );
    }
    if (constant is k.ConstructorTearOffConstant ||
        constant is k.RedirectingFactoryTearOffConstant) {
      return _lowerCanonicalConstant(
        helpers,
        constant,
        _lowerConstructorTearOffConstant(semantic, helpers, constant, context),
      );
    }
    if (constant is k.InstantiationConstant) {
      return _lowerConstant(
        semantic,
        helpers,
        constant.tearOffConstant,
        context,
      );
    }
    if (constant is k.TypedefTearOffConstant) {
      return _lowerConstant(
        semantic,
        helpers,
        constant.tearOffConstant,
        context,
      );
    }
    if (constant is k.InstanceConstant) {
      final sdkConstant = sdkIntrinsics.lowerInstanceConstant(constant);
      if (sdkConstant != null) {
        return sdkConstant;
      }
      final convertConstant = _lowerDartConvertInstanceConstant(
        helpers,
        constant,
      );
      if (convertConstant != null) {
        return _lowerCanonicalConstant(helpers, constant, convertConstant);
      }
      final instance = _lowerInstanceConstant(
        semantic,
        helpers,
        constant,
        context,
      );
      return _lowerCanonicalConstant(helpers, constant, instance);
    }
    throw UnsupportedCompilerFeature(
      context,
      'constant expression lowering ${constant.runtimeType}',
    );
  }

  EsmExpression? _lowerSdkStaticTearOffConstant(
    EsmRuntimeHelperUseSet helpers,
    k.Reference reference,
  ) {
    final target = kernelReferencePath(reference);
    if (target ==
        'dart:collection::ListBase::@methods::dart:collection::_compareAny') {
      helpers.require(EsmRuntimeHelper.compare);
      return EsmArrowFunction(
        parameters: const [
          EsmIdentifierParameter(name: 'left'),
          EsmIdentifierParameter(name: 'right'),
        ],
        body: EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare),
          arguments: const [EsmIdentifier('left'), EsmIdentifier('right')],
        ),
      );
    }

    return sdkIntrinsics.lowerStaticTearOffConstant(reference: reference);
  }

  EsmExpression? _lowerDartConvertInstanceConstant(
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
  ) {
    final classPath = kernelReferencePath(constant.classReference);
    final helperName = switch (classPath) {
      'dart:convert::Latin1Codec' => '__dartLatin1Codec',
      'dart:convert::Utf8Codec' => '__dartUtf8Codec',
      _ => null,
    };
    if (helperName == null) {
      return null;
    }
    helpers.require(EsmRuntimeHelper.encoding);
    bool? allowMalformed;
    for (final value in constant.fieldValues.values) {
      if (value is k.BoolConstant) {
        allowMalformed = value.value;
        break;
      }
    }
    return EsmCall(
      callee: EsmIdentifier(helperName),
      arguments: [EsmBooleanLiteral(allowMalformed ?? false)],
    );
  }

  EsmExpression _lowerSymbolLiteral(
    EsmRuntimeHelperUseSet helpers,
    String name, {
    k.Reference? libraryReference,
  }) {
    helpers.require(EsmRuntimeHelper.symbol);
    final key = libraryReference == null
        ? name
        : '${kernelReferencePath(libraryReference)}::$name';
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.symbol),
      arguments: [EsmStringLiteral(key), EsmStringLiteral(name)],
    );
  }

  EsmExpression _lowerTypeLiteral(
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
  ) {
    helpers.require(EsmRuntimeHelper.type);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.type),
      arguments: [EsmStringLiteral(_dartTypeName(type))],
    );
  }

  String _dartTypeName(k.DartType type) {
    return switch (type) {
      k.TypeParameterType() =>
        '${type.parameter.name ?? 'T'}${_nullabilitySuffix(type.declaredNullability)}',
      _ => type.toStringInternal(),
    };
  }

  String _nullabilitySuffix(k.Nullability nullability) {
    return switch (nullability) {
      k.Nullability.nullable => '?',
      k.Nullability.nonNullable || k.Nullability.undetermined => '',
    };
  }

  EsmExpression _lowerInstanceConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    final klass = constant.classReference.node;
    final mathConstant = _lowerDartMathInstanceConstant(
      semantic,
      helpers,
      constant,
      context,
    );
    if (mathConstant != null) {
      return mathConstant;
    }
    final coreConstant = _lowerDartCoreInstanceConstant(
      semantic,
      helpers,
      constant,
      context,
    );
    if (coreConstant != null) {
      return coreConstant;
    }
    final classPath = kernelReferencePath(constant.classReference);
    if (klass is! k.Class ||
        klass.enclosingLibrary.importUri.scheme == 'dart') {
      throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering $classPath',
      );
    }
    final symbol = semantic.classSymbolFor(klass);
    if (symbol == null) {
      throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering $classPath',
      );
    }
    final fields = <EsmObjectLiteralProperty>[];
    String? enumName;
    for (final entry in constant.fieldValues.entries) {
      final enumBackingName = klass.isEnum
          ? _enumBackingFieldName(entry.key)
          : null;
      if (enumBackingName != null) {
        final loweredValue = _lowerConstant(
          semantic,
          helpers,
          entry.value,
          context,
        );
        switch (enumBackingName) {
          case 'index':
            fields.add(
              EsmObjectLiteralProperty.static(
                key: 'index',
                value: loweredValue,
              ),
            );
          case '_name':
            enumName = entry.value is k.StringConstant
                ? (entry.value as k.StringConstant).value
                : null;
            fields.add(
              EsmObjectLiteralProperty.static(
                key: '__dartEnumName',
                value: loweredValue,
              ),
            );
            fields.add(
              EsmObjectLiteralProperty.static(key: 'name', value: loweredValue),
            );
          default:
            throw UnsupportedCompilerFeature(
              context,
              'constant expression lowering',
            );
        }
        continue;
      }
      final field = entry.key.node;
      if (field is! k.Field) {
        throw UnsupportedCompilerFeature(
          context,
          'constant expression lowering',
        );
      }
      final fieldSymbol = semantic.instanceFieldSymbolFor(field);
      if (fieldSymbol == null) {
        throw UnsupportedCompilerFeature(
          context,
          'constant expression lowering',
        );
      }
      fields.add(
        EsmObjectLiteralProperty.static(
          key: fieldSymbol.name,
          value: _lowerConstant(semantic, helpers, entry.value, context),
        ),
      );
    }
    if (klass.isEnum && enumName != null) {
      fields.add(
        EsmObjectLiteralProperty.static(
          key: 'toString',
          value: EsmFunctionExpression(
            parameters: const [],
            body: [
              EsmReturnStatement(EsmStringLiteral('${klass.name}.$enumName')),
            ],
          ),
        ),
      );
    }
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Object'),
        property: 'freeze',
      ),
      arguments: [
        EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'create',
          ),
          arguments: [
            EsmPropertyAccess(
              receiver: EsmIdentifier(symbol.name),
              property: 'prototype',
            ),
            EsmObjectLiteral([
              for (final field in fields)
                EsmObjectLiteralProperty(
                  key: field.key,
                  value: _constantPropertyDescriptor(field.value),
                ),
            ]),
          ],
        ),
      ],
    );
  }

  EsmObjectLiteral _constantPropertyDescriptor(EsmExpression value) {
    return EsmObjectLiteral([
      EsmObjectLiteralProperty.static(key: 'value', value: value),
      EsmObjectLiteralProperty.static(
        key: 'enumerable',
        value: const EsmBooleanLiteral(true),
      ),
    ]);
  }

  EsmExpression? _lowerDartCoreInstanceConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    if (_isDartCoreObjectConstant(constant)) {
      return const EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier('Object'),
          property: 'freeze',
        ),
        arguments: [EsmObjectLiteral([])],
      );
    }
    final errorTypeName = _dartCoreErrorConstantTypeName(constant);
    if (errorTypeName != null) {
      helpers.require(EsmRuntimeHelper.coreError);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
        arguments: [
          EsmStringLiteral(errorTypeName),
          _lowerOptionalConstantField(
                semantic,
                helpers,
                constant,
                'message',
                context,
              ) ??
              const EsmNullLiteral(),
        ],
      );
    }
    return null;
  }

  String? _dartCoreErrorConstantTypeName(k.InstanceConstant constant) {
    final path = kernelReferencePath(constant.classReference);
    if (!path.startsWith('dart:core::')) {
      return null;
    }
    final typeName = path.substring('dart:core::'.length);
    return dartCoreErrorTypeNames.contains(typeName) ? typeName : null;
  }

  bool _isDartCoreObjectConstant(k.InstanceConstant constant) {
    return kernelReferencePath(constant.classReference) ==
            'dart:core::Object' &&
        constant.fieldValues.isEmpty;
  }

  EsmExpression? _lowerDartMathInstanceConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    final classPath = kernelReferencePath(constant.classReference);
    if (classPath == 'dart:math::Point') {
      helpers.require(EsmRuntimeHelper.mathPoint);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mathPoint),
        arguments: [
          _lowerConstantField(semantic, helpers, constant, 'x', context),
          _lowerConstantField(semantic, helpers, constant, 'y', context),
        ],
      );
    }
    if (classPath == 'dart:math::Rectangle') {
      helpers.require(EsmRuntimeHelper.mathRectangle);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mathRectangle,
        ),
        arguments: [
          _lowerConstantField(semantic, helpers, constant, 'left', context),
          _lowerConstantField(semantic, helpers, constant, 'top', context),
          _lowerConstantField(semantic, helpers, constant, 'width', context),
          _lowerConstantField(semantic, helpers, constant, 'height', context),
        ],
      );
    }
    return null;
  }

  EsmExpression _lowerConstantField(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    String fieldName,
    Object context,
  ) {
    for (final entry in constant.fieldValues.entries) {
      final path = kernelReferencePath(entry.key);
      if (path.endsWith('::@fields::$fieldName') ||
          path.endsWith('::$fieldName')) {
        return _lowerConstant(semantic, helpers, entry.value, context);
      }
    }
    throw UnsupportedCompilerFeature(context, 'constant expression lowering');
  }

  EsmExpression? _lowerOptionalConstantField(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    String fieldName,
    Object context,
  ) {
    for (final entry in constant.fieldValues.entries) {
      final path = kernelReferencePath(entry.key);
      if (path.endsWith('::@fields::$fieldName') ||
          path.endsWith('::$fieldName')) {
        return _lowerConstant(semantic, helpers, entry.value, context);
      }
    }
    return null;
  }

  String? _enumBackingFieldName(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (!path.contains('::_Enum::')) {
      return null;
    }
    if (path.endsWith('::index') || path.endsWith('::@fields::index')) {
      return 'index';
    }
    if (path.endsWith('::_name') || path.endsWith('::@fields::_name')) {
      return '_name';
    }
    return null;
  }

  EsmExpression _lowerConstructorTearOffConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    Object context,
  ) {
    final target = switch (constant) {
      k.ConstructorTearOffConstant() => constant.target,
      k.RedirectingFactoryTearOffConstant() => constant.target,
      _ => throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering',
      ),
    };
    final function = target.function;
    if (function == null || function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(context, 'constant expression lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    return EsmFunctionExpression(
      parameters: parameters,
      body: [
        EsmReturnStatement(
          _lowerConstructorTearOffInvocation(
            semantic,
            target,
            function,
            locals,
          ),
        ),
      ],
    );
  }

  EsmExpression _lowerConstructorTearOffInvocation(
    Semantic semantic,
    k.Member target,
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals,
  ) {
    final arguments = _forwardingArguments(function, locals);
    if (target is k.Constructor) {
      final klass = semantic.classSymbolFor(target.enclosingClass);
      final constructor = semantic.constructorSymbolFor(target);
      if (klass == null || constructor == null) {
        throw UnsupportedCompilerFeature(target, 'constructor tear-off target');
      }
      if (constructor.name.isEmpty) {
        return EsmNew(callee: EsmIdentifier(klass.name), arguments: arguments);
      }
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: constructor.name,
        ),
        arguments: arguments,
      );
    }
    if (target is k.Procedure &&
        target.kind == k.ProcedureKind.Factory &&
        target.enclosingClass != null) {
      final klass = semantic.classSymbolFor(target.enclosingClass!);
      final procedure = semantic.staticProcedureSymbolFor(target);
      if (klass == null || procedure == null) {
        throw UnsupportedCompilerFeature(target, 'constructor tear-off target');
      }
      if (target.name.text.isEmpty) {
        return EsmNew(callee: EsmIdentifier(klass.name), arguments: arguments);
      }
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: procedure.name,
        ),
        arguments: arguments,
      );
    }
    throw UnsupportedCompilerFeature(target, 'constructor tear-off target');
  }

  List<EsmExpression> _forwardingArguments(
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals,
  ) {
    return [
      for (final parameter in function.positionalParameters)
        EsmIdentifier(locals[parameter]!),
      if (function.namedParameters.isNotEmpty)
        EsmObjectLiteral([
          for (final parameter in function.namedParameters)
            EsmObjectLiteralProperty.static(
              key: parameter.name ?? 'arg',
              value: EsmIdentifier(locals[parameter]!),
            ),
        ]),
    ];
  }

  EsmExpression _lowerCanonicalConstant(
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    EsmExpression value,
  ) {
    helpers.require(EsmRuntimeHelper.constValue);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constValue),
      arguments: [
        EsmStringLiteral(_constantKey(constant)),
        EsmArrowFunction(parameters: const [], body: value),
      ],
    );
  }

  String _constantKey(k.Constant constant) {
    return jsonEncode(_constantKeyParts(constant));
  }

  Object? _constantKeyParts(k.Constant constant) {
    return switch (constant) {
      k.NullConstant() => const ['null'],
      k.BoolConstant() => ['bool', constant.value],
      k.IntConstant() => ['int', constant.value.toString()],
      k.DoubleConstant() => ['double', _doubleConstantKey(constant.value)],
      k.StringConstant() => ['string', constant.value],
      k.SymbolConstant() => [
        'symbol',
        constant.name,
        if (constant.libraryReference case final library?)
          _referenceKey(library),
      ],
      k.ListConstant() => [
        'list',
        constant.typeArgument.toString(),
        for (final entry in constant.entries) _constantKeyParts(entry),
      ],
      k.SetConstant() => [
        'set',
        constant.typeArgument.toString(),
        for (final entry in constant.entries) _constantKeyParts(entry),
      ],
      k.MapConstant() => [
        'map',
        constant.keyType.toString(),
        constant.valueType.toString(),
        for (final entry in constant.entries)
          [_constantKeyParts(entry.key), _constantKeyParts(entry.value)],
      ],
      k.RecordConstant() => [
        'record',
        for (final value in constant.positional) _constantKeyParts(value),
        for (final entry in constant.named.entries)
          ['named', entry.key, _constantKeyParts(entry.value)],
      ],
      k.InstanceConstant() when _isDartCoreObjectConstant(constant) => [
        'instance',
        'dart:core::Object',
      ],
      k.StaticTearOffConstant() => [
        'staticTearOff',
        _referenceKey(constant.targetReference),
      ],
      _ => [constant.runtimeType.toString(), constant.toString()],
    };
  }

  String _doubleConstantKey(double value) {
    if (value.isNaN) {
      return 'nan';
    }
    if (value == double.infinity) {
      return 'infinity';
    }
    if (value == double.negativeInfinity) {
      return '-infinity';
    }
    if (value == 0 && value.isNegative) {
      return '-0.0';
    }
    return value.toString();
  }

  String _referenceKey(k.Reference reference) {
    final path = kernelReferencePath(reference);
    final node = reference.node;
    if (node is k.Class && node.enclosingLibrary.importUri.scheme != 'dart') {
      return 'class:${node.name}';
    }
    if (node is k.Member && node.enclosingLibrary.importUri.scheme != 'dart') {
      final owner = node.enclosingClass?.name ?? '';
      return owner.isEmpty ? node.name.text : '$owner.${node.name.text}';
    }
    return path;
  }

  EsmExpression _lowerStaticGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.StaticGet expression,
  ) {
    final runtimeStaticGet = _lowerRuntimeStaticGet(helpers, expression);
    if (runtimeStaticGet != null) {
      return runtimeStaticGet;
    }
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.targetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeStaticGet(extensionTypeMember);
    }
    final target = expression.targetReference.node;
    if (target is k.Field) {
      final symbol = semantic.fieldSymbolFor(target);
      if (symbol != null) {
        if (symbol.node.isLate) {
          return EsmCall(
            callee: EsmPropertyAccess(
              receiver: EsmIdentifier(symbol.backingName!),
              property: 'get',
            ),
            arguments: const [],
          );
        }
        return EsmIdentifier(symbol.name);
      }
      final staticSymbol = semantic.staticFieldSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = semantic.classSymbolFor(enclosingClass);
        if (staticSymbol != null && klass != null) {
          return EsmPropertyAccess(
            receiver: EsmIdentifier(klass.name),
            property: staticSymbol.name,
          );
        }
      }
    }
    final symbol =
        (target is k.Procedure ? semantic.symbolFor(target) : null) ??
        semantic.symbolForReference(expression.targetReference);
    if (symbol != null) {
      return switch (symbol.kind) {
        EsmProcedureKind.method => EsmIdentifier(symbol.name),
        EsmProcedureKind.getter => EsmCall(
          callee: EsmIdentifier(symbol.name),
          arguments: const [],
        ),
        EsmProcedureKind.setter => throw UnsupportedCompilerFeature(
          expression,
          'static setter get lowering',
        ),
      };
    }
    final staticSymbol =
        (target is k.Procedure
            ? semantic.staticProcedureSymbolFor(target)
            : null) ??
        semantic.staticProcedureSymbolForReference(expression.targetReference);
    final staticClass = staticSymbol == null
        ? null
        : semantic.classSymbolFor(staticSymbol.node.enclosingClass!);
    if (staticSymbol != null && staticClass != null) {
      return switch (staticSymbol.kind) {
        EsmProcedureKind.method => EsmPropertyAccess(
          receiver: EsmIdentifier(staticClass.name),
          property: staticSymbol.name,
        ),
        EsmProcedureKind.getter => EsmPropertyAccess(
          receiver: EsmIdentifier(staticClass.name),
          property: staticSymbol.name,
        ),
        EsmProcedureKind.setter => throw UnsupportedCompilerFeature(
          expression,
          'static setter get lowering',
        ),
      };
    }
    throw UnsupportedCompilerFeature(
      expression,
      'static get lowering ${kernelReferencePath(expression.targetReference)}',
    );
  }

  EsmExpression? _lowerRuntimeStaticGet(
    EsmRuntimeHelperUseSet helpers,
    k.StaticGet expression,
  ) {
    final sdkGet = sdkIntrinsics.lowerStaticGet(
      expression: expression,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
    );
    if (sdkGet != null) {
      return sdkGet;
    }
    final target = kernelReferencePath(expression.targetReference);
    final bigIntConstant = switch (target) {
      'dart:core::BigInt::@getters::zero' => 0,
      'dart:core::BigInt::@getters::one' => 1,
      'dart:core::BigInt::@getters::two' => 2,
      _ => null,
    };
    if (bigIntConstant != null) {
      return _bigIntLiteral(bigIntConstant);
    }
    if (target == 'dart:core::StackTrace::@getters::current') {
      return const EsmNullishCoalesce(
        left: EsmPropertyAccess(
          receiver: EsmNew(callee: EsmIdentifier('Error'), arguments: []),
          property: 'stack',
        ),
        right: EsmStringLiteral(''),
      );
    }
    return null;
  }

  EsmExpression _lowerExtensionTypeStaticGet(
    EsmExtensionTypeMemberSymbol member,
  ) {
    return switch (member.descriptor.kind) {
      k.ExtensionTypeMemberKind.Field => EsmIdentifier(member.backingName),
      k.ExtensionTypeMemberKind.Getter => EsmCall(
        callee: EsmIdentifier(member.backingName),
        arguments: const [],
      ),
      k.ExtensionTypeMemberKind.Constructor ||
      k.ExtensionTypeMemberKind.Factory ||
      k.ExtensionTypeMemberKind.RedirectingFactory ||
      k.ExtensionTypeMemberKind.Method ||
      k.ExtensionTypeMemberKind.Operator => EsmIdentifier(member.backingName),
      k.ExtensionTypeMemberKind.Setter => throw UnsupportedCompilerFeature(
        member.descriptor,
        'extension type setter get',
      ),
    };
  }

  EsmExpression _lowerStaticSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.targetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeStaticSet(
        semantic,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final target = expression.targetReference.node;
    if (target is k.Field) {
      final symbol = semantic.fieldSymbolFor(target);
      if (symbol != null) {
        final value = _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        );
        if (symbol.node.isLate) {
          return EsmCall(
            callee: EsmPropertyAccess(
              receiver: EsmIdentifier(symbol.backingName!),
              property: 'set',
            ),
            arguments: [value],
          );
        }
        if (!symbol.mutable) {
          throw UnsupportedCompilerFeature(expression, 'write to final field');
        }
        return EsmAssignment(target: EsmIdentifier(symbol.name), value: value);
      }
      final staticSymbol = semantic.staticFieldSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = semantic.classSymbolFor(enclosingClass);
        if (staticSymbol != null && klass != null) {
          if (!staticSymbol.mutable && !staticSymbol.node.isLate) {
            throw UnsupportedCompilerFeature(
              expression,
              'write to final field',
            );
          }
          return EsmAssignment(
            target: EsmPropertyAccess(
              receiver: EsmIdentifier(klass.name),
              property: staticSymbol.name,
            ),
            value: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.value,
              thisExpression: thisExpression,
            ),
          );
        }
      }
    }
    if (target is k.Procedure) {
      final symbol = semantic.symbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.setter) {
        return EsmCall(
          callee: EsmIdentifier(symbol.name),
          arguments: [
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
      final staticSymbol = semantic.staticProcedureSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = semantic.classSymbolFor(enclosingClass);
        if (staticSymbol != null &&
            klass != null &&
            staticSymbol.kind == EsmProcedureKind.setter) {
          return EsmAssignment(
            target: EsmPropertyAccess(
              receiver: EsmIdentifier(klass.name),
              property: staticSymbol.name,
            ),
            value: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.value,
              thisExpression: thisExpression,
            ),
          );
        }
      }
    }
    throw UnsupportedCompilerFeature(expression, 'static set lowering');
  }

  EsmExpression _lowerExtensionTypeStaticSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.StaticSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (member.descriptor.kind != k.ExtensionTypeMemberKind.Field ||
        !member.mutable) {
      throw UnsupportedCompilerFeature(expression, 'extension type static set');
    }
    return EsmAssignment(
      target: EsmIdentifier(member.backingName),
      value: _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.value,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmExpression _lowerVariableSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final name = locals[expression.variable];
    if (name == null) {
      throw UnsupportedCompilerFeature(expression, 'unbound variable set');
    }
    final value = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.value,
      thisExpression: thisExpression,
    );
    if (expression.variable.isLate) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(name),
          property: 'set',
        ),
        arguments: [value],
      );
    }
    return EsmAssignment(target: EsmIdentifier(name), value: value);
  }
}
