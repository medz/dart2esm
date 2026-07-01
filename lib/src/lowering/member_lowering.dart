part of 'kernel_to_esm_ast.dart';

extension _MemberLowering on Lowerer {
  List<EsmModuleItem> _lowerStaticFieldItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    EsmStaticFieldSymbol field,
  ) {
    helpers.require(EsmRuntimeHelper.lazyField);
    final initializer = field.node.initializer;
    return [
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(field.backingName),
        initializer: EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.lazyField),
          arguments: [
            EsmStringLiteral('${klass.node.name}.${field.node.name.text}'),
            EsmArrowFunction(
              parameters: const [],
              body: initializer == null
                  ? const EsmNullLiteral()
                  : _lowerExpression(
                      semantic,
                      helpers,
                      const <k.VariableDeclaration, String>{},
                      initializer,
                    ),
            ),
            _lateWritableArgument(field.node.isFinal, field.mutable),
          ],
        ),
        mutable: false,
      ),
      EsmExpressionStatement(
        EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'defineProperty',
          ),
          arguments: [
            EsmIdentifier(klass.name),
            EsmStringLiteral(field.name),
            EsmObjectLiteral([
              EsmObjectLiteralProperty.static(
                key: 'get',
                value: EsmFunctionExpression(
                  parameters: const [],
                  body: [
                    EsmReturnStatement(
                      EsmCall(
                        callee: EsmPropertyAccess(
                          receiver: EsmIdentifier(field.backingName),
                          property: 'get',
                        ),
                        arguments: const [],
                      ),
                    ),
                  ],
                ),
              ),
              EsmObjectLiteralProperty.static(
                key: 'set',
                value: EsmFunctionExpression(
                  parameters: const [EsmIdentifierParameter(name: 'value')],
                  body: [
                    EsmExpressionStatement(
                      EsmCall(
                        callee: EsmPropertyAccess(
                          receiver: EsmIdentifier(field.backingName),
                          property: 'set',
                        ),
                        arguments: const [EsmIdentifier('value')],
                      ),
                    ),
                  ],
                ),
              ),
              EsmObjectLiteralProperty.static(
                key: 'enumerable',
                value: EsmBooleanLiteral(true),
              ),
            ]),
          ],
        ),
      ),
    ];
  }

  EsmExpression _lateWritableArgument(bool isFinal, bool mutable) {
    if (isFinal) {
      return const EsmStringLiteral('once');
    }
    return EsmBooleanLiteral(mutable);
  }

  List<EsmStatement> _lowerLateInstanceFieldDefinitions(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmClassSymbol klass,
    EsmExpression receiver,
    Set<String> usedNames,
  ) {
    final statements = <EsmStatement>[];
    for (final field in klass.fields) {
      if (!field.node.isLate) {
        continue;
      }
      helpers.require(EsmRuntimeHelper.lazyField);
      final backingName = _freshIn(usedNames, '\$${field.name}');
      final initializer = field.node.initializer;
      statements.add(
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(backingName),
          initializer: EsmCall(
            callee: helpers.reference(
              runtimeHelpers,
              EsmRuntimeHelper.lazyField,
            ),
            arguments: [
              EsmStringLiteral('${klass.node.name}.${field.node.name.text}'),
              initializer == null
                  ? const EsmNullLiteral()
                  : EsmArrowFunction(
                      parameters: const [],
                      body: _lowerExpression(
                        semantic,
                        helpers,
                        locals,
                        initializer,
                        thisExpression: receiver,
                      ),
                    ),
              _lateWritableArgument(field.node.isFinal, field.node.hasSetter),
            ],
          ),
          mutable: false,
        ),
      );
      statements.add(
        EsmExpressionStatement(
          EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Object'),
              property: 'defineProperty',
            ),
            arguments: [
              receiver,
              EsmStringLiteral(field.name),
              EsmObjectLiteral([
                EsmObjectLiteralProperty.static(
                  key: 'get',
                  value: EsmFunctionExpression(
                    parameters: const [],
                    body: [
                      EsmReturnStatement(
                        EsmCall(
                          callee: EsmPropertyAccess(
                            receiver: EsmIdentifier(backingName),
                            property: 'get',
                          ),
                          arguments: const [],
                        ),
                      ),
                    ],
                  ),
                ),
                EsmObjectLiteralProperty.static(
                  key: 'set',
                  value: EsmFunctionExpression(
                    parameters: const [EsmIdentifierParameter(name: 'value')],
                    body: [
                      EsmExpressionStatement(
                        EsmCall(
                          callee: EsmPropertyAccess(
                            receiver: EsmIdentifier(backingName),
                            property: 'set',
                          ),
                          arguments: const [EsmIdentifier('value')],
                        ),
                      ),
                    ],
                  ),
                ),
                EsmObjectLiteralProperty.static(
                  key: 'enumerable',
                  value: EsmBooleanLiteral(true),
                ),
              ]),
            ],
          ),
        ),
      );
    }
    return statements;
  }

  List<EsmStatement> _lowerInstanceFieldInitializers(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmClassSymbol klass,
    EsmExpression receiver,
  ) {
    return [
      for (final field in klass.fields)
        if (!field.node.isLate)
          _lowerOwnDataPropertyDefinition(
            receiver,
            field.name,
            field.node.initializer == null
                ? const EsmNullLiteral()
                : _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    field.node.initializer!,
                    thisExpression: receiver,
                  ),
          ),
    ];
  }

  EsmExpressionStatement _lowerOwnDataPropertyDefinition(
    EsmExpression receiver,
    String property,
    EsmExpression value,
  ) {
    return EsmExpressionStatement(
      EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Object'),
          property: 'defineProperty',
        ),
        arguments: [
          receiver,
          EsmStringLiteral(property),
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(key: 'value', value: value),
            EsmObjectLiteralProperty.static(
              key: 'writable',
              value: EsmBooleanLiteral(true),
            ),
            EsmObjectLiteralProperty.static(
              key: 'enumerable',
              value: EsmBooleanLiteral(true),
            ),
            EsmObjectLiteralProperty.static(
              key: 'configurable',
              value: EsmBooleanLiteral(true),
            ),
          ]),
        ],
      ),
    );
  }

  EsmClassConstructor _lowerImplicitDefaultConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass, {
    List<String> interfaceMarkers = const [],
  }) {
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    return EsmClassConstructor(
      parameters: const [],
      body: [
        if (klass.jsSuperclass != null)
          const EsmExpressionStatement(
            EsmCall(callee: EsmSuper(), arguments: []),
          ),
        ..._lowerLateInstanceFieldDefinitions(
          semantic,
          helpers,
          locals,
          klass,
          const EsmThis(),
          usedNames,
        ),
        ..._lowerInstanceFieldInitializers(
          semantic,
          helpers,
          locals,
          klass,
          const EsmThis(),
        ),
        ..._lowerInterfaceMarkerDefinitions(const EsmThis(), interfaceMarkers),
      ],
    );
  }

  EsmExpressionStatement _lowerInterfaceHasInstance(
    EsmClassSymbol klass,
    String markerName,
  ) {
    return EsmExpressionStatement(
      EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Object'),
          property: 'defineProperty',
        ),
        arguments: [
          EsmIdentifier(klass.name),
          const EsmPropertyAccess(
            receiver: EsmIdentifier('Symbol'),
            property: 'hasInstance',
          ),
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(
              key: 'value',
              value: EsmFunctionExpression(
                parameters: const [EsmIdentifierParameter(name: 'value')],
                body: [
                  EsmReturnStatement(
                    EsmBinary(
                      left: EsmBinary(
                        left: const EsmIdentifier('value'),
                        operator: EsmBinaryOperator.looseNotEquals,
                        right: const EsmNullLiteral(),
                      ),
                      operator: EsmBinaryOperator.logicalAnd,
                      right: EsmParenthesized(
                        EsmBinary(
                          left: EsmCall(
                            callee: EsmPropertyAccess(
                              receiver: EsmPropertyAccess(
                                receiver: EsmIdentifier(klass.name),
                                property: 'prototype',
                              ),
                              property: 'isPrototypeOf',
                            ),
                            arguments: const [EsmIdentifier('value')],
                          ),
                          operator: EsmBinaryOperator.logicalOr,
                          right: EsmBinary(
                            left: EsmComputedPropertyAccess(
                              receiver: const EsmIdentifier('value'),
                              property: EsmIdentifier(markerName),
                            ),
                            operator: EsmBinaryOperator.strictEquals,
                            right: const EsmBooleanLiteral(true),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ]),
        ],
      ),
    );
  }

  List<String> _interfaceMarkersForClass(
    Semantic semantic,
    EsmClassSymbol klass,
  ) {
    return [
      for (final interfaceClass in klass.interfaceMarkerClasses)
        if (semantic.classSymbolFor(interfaceClass)?.interfaceMarkerName
            case final markerName?)
          markerName,
    ];
  }

  List<EsmStatement> _lowerInterfaceMarkerDefinitions(
    EsmExpression receiver,
    List<String> markerNames,
  ) {
    return [
      for (final markerName in markerNames)
        EsmExpressionStatement(
          EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Object'),
              property: 'defineProperty',
            ),
            arguments: [
              receiver,
              EsmIdentifier(markerName),
              EsmObjectLiteral([
                EsmObjectLiteralProperty.static(
                  key: 'value',
                  value: EsmBooleanLiteral(true),
                ),
              ]),
            ],
          ),
        ),
    ];
  }

  EsmClassConstructor _lowerMissingUnnamedConstructor(EsmClassSymbol klass) {
    return EsmClassConstructor(
      parameters: const [],
      body: [
        EsmThrowStatement(
          EsmNew(
            callee: const EsmIdentifier('TypeError'),
            arguments: [
              EsmStringLiteral(
                'Class ${klass.node.name} has no unnamed constructor',
              ),
            ],
          ),
        ),
      ],
    );
  }

  EsmClassConstructor _lowerFactoryConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmStaticProcedureSymbol procedure,
  ) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async factory lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    if (body == null) {
      throw UnsupportedCompilerFeature(function, 'factory without body');
    }
    return EsmClassConstructor(
      parameters: parameters,
      body: _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  EsmClassConstructor _lowerConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmConstructorSymbol constructor, {
    List<String> interfaceMarkers = const [],
  }) {
    assert(constructor.name.isEmpty);
    final klass = semantic.classSymbolFor(constructor.node.enclosingClass);
    if (klass == null) {
      throw UnsupportedCompilerFeature(constructor.node, 'constructor class');
    }
    final function = constructor.node.function;
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final redirectingInitializer = _redirectingInitializer(constructor);
    if (redirectingInitializer != null) {
      return EsmClassConstructor(
        parameters: parameters,
        body: [
          EsmReturnStatement(
            _lowerRedirectingAllocation(
              semantic,
              helpers,
              locals,
              redirectingInitializer,
              const EsmNewTarget(),
            ),
          ),
        ],
      );
    }
    final superInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is k.SuperInitializer) initializer,
    ];
    final factorySuperInitializers = [
      for (final initializer in superInitializers)
        if (_isFactorySuperInitializer(semantic, initializer)) initializer,
    ];
    if (factorySuperInitializers.length > 1) {
      throw UnsupportedCompilerFeature(
        constructor.node,
        'multiple factory super initializers',
      );
    }
    final otherInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is! k.SuperInitializer) initializer,
    ];
    if (factorySuperInitializers case [final superInitializer]) {
      final selfName = _freshLocalName(semantic, usedParameters, r'$self');
      usedParameters.add(selfName);
      final self = EsmIdentifier(selfName);
      final body = <EsmStatement>[
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(selfName),
          initializer: _lowerSuperFactoryAllocation(
            semantic,
            helpers,
            locals,
            superInitializer,
            const EsmNewTarget(),
          ),
          mutable: false,
        ),
        ..._lowerLateInstanceFieldDefinitions(
          semantic,
          helpers,
          locals,
          klass,
          self,
          usedParameters,
        ),
        ..._lowerInstanceFieldInitializers(
          semantic,
          helpers,
          locals,
          klass,
          self,
        ),
        for (final initializer in otherInitializers)
          ..._lowerConstructorInitializer(
            semantic,
            helpers,
            locals,
            initializer,
            self,
          ),
        if (function.body case final body?) ...[
          ..._lowerStatementList(
            semantic,
            helpers,
            locals,
            labels,
            body,
            thisExpression: self,
          ),
        ],
        ..._lowerInterfaceMarkerDefinitions(self, interfaceMarkers),
        EsmReturnStatement(self),
      ];
      return EsmClassConstructor(parameters: parameters, body: body);
    }
    final superInitializerStatements = [
      for (final initializer in superInitializers)
        ..._lowerSuperInitializer(semantic, helpers, locals, initializer),
    ];
    final needsImplicitSuperCall =
        superInitializerStatements.isEmpty && klass.jsSuperclass != null;
    final body = <EsmStatement>[
      if (needsImplicitSuperCall)
        const EsmExpressionStatement(
          EsmCall(callee: EsmSuper(), arguments: []),
        ),
      ...superInitializerStatements,
      ..._lowerLateInstanceFieldDefinitions(
        semantic,
        helpers,
        locals,
        klass,
        const EsmThis(),
        usedParameters,
      ),
      ..._lowerInstanceFieldInitializers(
        semantic,
        helpers,
        locals,
        klass,
        const EsmThis(),
      ),
      for (final initializer in otherInitializers)
        ..._lowerConstructorInitializer(
          semantic,
          helpers,
          locals,
          initializer,
          const EsmThis(),
        ),
      if (function.body case final body?) ...[
        ..._lowerStatementList(semantic, helpers, locals, labels, body),
      ],
      ..._lowerInterfaceMarkerDefinitions(const EsmThis(), interfaceMarkers),
    ];
    return EsmClassConstructor(parameters: parameters, body: body);
  }

  EsmClassMethod _lowerNamedConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmConstructorSymbol constructor, {
    List<String> interfaceMarkers = const [],
  }) {
    final klass = semantic.classSymbolFor(constructor.node.enclosingClass);
    if (klass == null) {
      throw UnsupportedCompilerFeature(constructor.node, 'constructor class');
    }
    final function = constructor.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async constructor lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedNames = <String>{};
    final selfName = _freshIn(usedNames, r'$self');
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedNames,
      function,
    );
    final redirectingInitializer = _redirectingInitializer(constructor);
    if (redirectingInitializer != null) {
      return EsmClassMethod(
        key: EsmStaticPropertyKey(constructor.name),
        kind: EsmClassMethodKind.method,
        isStatic: true,
        parameters: parameters,
        body: [
          EsmReturnStatement(
            _lowerRedirectingAllocation(
              semantic,
              helpers,
              locals,
              redirectingInitializer,
              const EsmThis(),
            ),
          ),
        ],
      );
    }
    final self = EsmIdentifier(selfName);
    final superInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is k.SuperInitializer) initializer,
    ];
    if (superInitializers.length > 1) {
      throw UnsupportedCompilerFeature(
        constructor.node,
        'multiple super initializers',
      );
    }
    final otherInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is! k.SuperInitializer) initializer,
    ];
    final allocation = superInitializers.isEmpty
        ? _lowerObjectCreate(const EsmThis())
        : _lowerSuperFactoryAllocation(
            semantic,
            helpers,
            locals,
            superInitializers.single,
            const EsmThis(),
          );
    final body = <EsmStatement>[
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(selfName),
        initializer: allocation,
        mutable: false,
      ),
      ..._lowerLateInstanceFieldDefinitions(
        semantic,
        helpers,
        locals,
        klass,
        self,
        usedNames,
      ),
      ..._lowerInstanceFieldInitializers(
        semantic,
        helpers,
        locals,
        klass,
        self,
      ),
      for (final initializer in otherInitializers)
        ..._lowerConstructorInitializer(
          semantic,
          helpers,
          locals,
          initializer,
          self,
        ),
      if (function.body case final body?) ...[
        ..._lowerStatementList(
          semantic,
          helpers,
          locals,
          labels,
          body,
          thisExpression: self,
        ),
      ],
      ..._lowerInterfaceMarkerDefinitions(self, interfaceMarkers),
      EsmReturnStatement(self),
    ];
    return EsmClassMethod(
      key: EsmStaticPropertyKey(constructor.name),
      kind: EsmClassMethodKind.method,
      isStatic: true,
      parameters: parameters,
      body: body,
    );
  }

  k.RedirectingInitializer? _redirectingInitializer(
    EsmConstructorSymbol constructor,
  ) {
    k.RedirectingInitializer? redirectingInitializer;
    for (final initializer in constructor.node.initializers) {
      if (initializer is! k.RedirectingInitializer) {
        continue;
      }
      if (redirectingInitializer != null) {
        throw UnsupportedCompilerFeature(
          initializer,
          'multiple redirecting calls',
        );
      }
      redirectingInitializer = initializer;
    }
    if (redirectingInitializer != null &&
        constructor.node.initializers.length != 1) {
      throw UnsupportedCompilerFeature(
        constructor.node,
        'redirecting constructor initializers',
      );
    }
    return redirectingInitializer;
  }

  EsmExpression _lowerRedirectingAllocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.RedirectingInitializer initializer,
    EsmExpression newTarget,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'redirecting initializer arguments',
      );
    }
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      throw UnsupportedCompilerFeature(initializer, 'redirecting initializer');
    }
    return _lowerConstructorAllocation(
      semantic,
      helpers,
      locals,
      target,
      initializer.arguments,
      newTarget,
      initializer,
      'redirecting initializer',
    );
  }

  bool _isFactorySuperInitializer(
    Semantic semantic,
    k.SuperInitializer initializer,
  ) {
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      return false;
    }
    final resolvedTarget = _resolveEmittableConstructorTarget(semantic, target);
    return resolvedTarget != null &&
        semantic.constructorSymbolFor(resolvedTarget)?.name.isNotEmpty == true;
  }

  EsmExpression _lowerObjectCreate(EsmExpression newTarget) {
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Object'),
        property: 'create',
      ),
      arguments: [
        EsmPropertyAccess(receiver: newTarget, property: 'prototype'),
      ],
    );
  }

  EsmExpression _lowerSuperFactoryAllocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
    EsmExpression newTarget,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer arguments',
      );
    }
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      if (initializer.arguments.positional.isEmpty &&
          initializer.arguments.named.isEmpty) {
        return _lowerObjectCreate(newTarget);
      }
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer target ${kernelReferencePath(initializer.targetReference)}',
      );
    }
    final resolvedTarget = _resolveEmittableConstructorTarget(semantic, target);
    if (resolvedTarget == null) {
      if (initializer.arguments.positional.isEmpty &&
          initializer.arguments.named.isEmpty) {
        return _lowerObjectCreate(newTarget);
      }
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer target ${kernelReferencePath(initializer.targetReference)}',
      );
    }
    return _lowerConstructorAllocation(
      semantic,
      helpers,
      locals,
      resolvedTarget,
      initializer.arguments,
      newTarget,
      initializer,
      'super initializer target',
    );
  }

  EsmExpression _lowerConstructorAllocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Constructor target,
    k.Arguments argumentsNode,
    EsmExpression newTarget,
    k.TreeNode contextNode,
    String context,
  ) {
    final resolvedTarget = _resolveEmittableConstructorTarget(semantic, target);
    if (resolvedTarget == null) {
      throw UnsupportedCompilerFeature(
        contextNode,
        '$context ${kernelReferencePath(target.reference)}',
      );
    }
    final constructor = semantic.constructorSymbolFor(resolvedTarget)!;
    final klass = semantic.classSymbolFor(resolvedTarget.enclosingClass)!;
    final arguments = _lowerArguments(
      semantic,
      helpers,
      locals,
      argumentsNode,
      contextNode: contextNode,
      context: context,
    );
    if (constructor.name.isEmpty) {
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Reflect'),
          property: 'construct',
        ),
        arguments: [
          EsmIdentifier(klass.name),
          EsmArrayLiteral(arguments),
          newTarget,
        ],
      );
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: constructor.name,
        ),
        property: 'call',
      ),
      arguments: [newTarget, ...arguments],
    );
  }

  List<EsmStatement> _lowerConstructorInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Initializer initializer,
    EsmExpression receiver,
  ) {
    return switch (initializer) {
      k.FieldInitializer() => [
        _lowerOwnDataPropertyDefinition(
          receiver,
          _instanceFieldName(semantic, initializer.field),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            initializer.value,
            thisExpression: receiver,
          ),
        ),
      ],
      k.AssertInitializer() => const [],
      _ => throw UnsupportedCompilerFeature(
        initializer,
        'constructor initializer lowering',
      ),
    };
  }

  List<EsmStatement> _lowerSuperInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer arguments',
      );
    }
    final coreErrorInitializer = _lowerCoreErrorSuperInitializer(
      semantic,
      helpers,
      locals,
      initializer,
      const EsmThis(),
    );
    if (coreErrorInitializer != null) {
      return coreErrorInitializer;
    }
    final target = initializer.targetReference.node;
    if (target is k.Constructor &&
        _resolveEmittableConstructorTarget(semantic, target) != null) {
      return [
        EsmExpressionStatement(
          EsmCall(
            callee: const EsmSuper(),
            arguments: _lowerArguments(
              semantic,
              helpers,
              locals,
              initializer.arguments,
              contextNode: initializer,
              context: 'super initializer arguments',
            ),
          ),
        ),
      ];
    }
    if (initializer.arguments.positional.isEmpty) {
      return const [];
    }
    throw UnsupportedCompilerFeature(initializer, 'super initializer lowering');
  }

  List<EsmStatement>? _lowerCoreErrorSuperInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
    EsmExpression receiver,
  ) {
    final typeName = dartCoreErrorConstructorName(initializer.targetReference);
    if (typeName == null) {
      return null;
    }
    if (initializer.arguments.named.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'core error super initializer arguments',
      );
    }
    final positional = initializer.arguments.positional;
    final message = positional.isEmpty
        ? const EsmStringLiteral('')
        : _lowerExpression(semantic, helpers, locals, positional.first);
    return [
      _lowerOwnDataPropertyDefinition(
        receiver,
        '__dartCoreErrorType',
        EsmStringLiteral(typeName),
      ),
      _lowerOwnDataPropertyDefinition(
        receiver,
        'name',
        EsmStringLiteral(typeName),
      ),
      _lowerOwnDataPropertyDefinition(receiver, 'message', message),
      if (typeName == 'FormatException') ...[
        _lowerOwnDataPropertyDefinition(
          receiver,
          'source',
          positional.length > 1
              ? _lowerExpression(semantic, helpers, locals, positional[1])
              : const EsmNullLiteral(),
        ),
        _lowerOwnDataPropertyDefinition(
          receiver,
          'offset',
          positional.length > 2
              ? _lowerExpression(semantic, helpers, locals, positional[2])
              : const EsmNullLiteral(),
        ),
      ],
      _lowerOwnDataPropertyDefinition(
        receiver,
        'toString',
        EsmFunctionExpression(
          parameters: const [],
          body: [
            EsmReturnStatement(
              EsmConditional(
                condition: EsmBinary(
                  left: const EsmPropertyAccess(
                    receiver: EsmThis(),
                    property: 'message',
                  ),
                  operator: EsmBinaryOperator.strictEquals,
                  right: const EsmStringLiteral(''),
                ),
                thenExpression: const EsmPropertyAccess(
                  receiver: EsmThis(),
                  property: 'name',
                ),
                otherwiseExpression: EsmStringConcatenation([
                  const EsmPropertyAccess(
                    receiver: EsmThis(),
                    property: 'name',
                  ),
                  const EsmStringLiteral(': '),
                  const EsmPropertyAccess(
                    receiver: EsmThis(),
                    property: 'message',
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    ];
  }

  k.Constructor? _resolveEmittableConstructorTarget(
    Semantic semantic,
    k.Constructor target,
  ) {
    if (semantic.constructorSymbolFor(target) != null &&
        semantic.classSymbolFor(target.enclosingClass) != null) {
      return target;
    }

    final visited = <k.Class>{};
    var current = target.enclosingClass;
    while (current.isAnonymousMixin) {
      if (!visited.add(current)) {
        throw UnsupportedCompilerFeature(
          target,
          'cyclic anonymous mixin constructor hierarchy',
        );
      }
      final superclass = _localSuperclass(current);
      if (superclass == null) {
        return null;
      }
      final candidate = _constructorNamed(superclass, target.name);
      if (candidate != null &&
          semantic.constructorSymbolFor(candidate) != null &&
          semantic.classSymbolFor(candidate.enclosingClass) != null) {
        return candidate;
      }
      current = superclass;
    }
    return null;
  }

  k.Class? _localSuperclass(k.Class klass) {
    final supertype = klass.supertype;
    if (supertype == null ||
        isKernelCoreClassReference(supertype.className, 'Object') ||
        isDartSdkReference(supertype.className)) {
      return null;
    }
    final node = supertype.className.node;
    return node is k.Class ? node : null;
  }

  k.Constructor? _constructorNamed(k.Class klass, k.Name name) {
    for (final constructor in klass.constructors) {
      if (_sameKernelName(constructor.name, name)) {
        return constructor;
      }
    }
    return null;
  }

  bool _sameKernelName(k.Name left, k.Name right) {
    return left.text == right.text &&
        left.libraryReference == right.libraryReference;
  }

  EsmClassMethod _lowerClassProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    EsmClassProcedureSymbol procedure, {
    bool isStatic = false,
  }) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async function lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    return EsmClassMethod(
      key: EsmStaticPropertyKey(procedure.name),
      kind: switch (procedure.kind) {
        EsmProcedureKind.method => EsmClassMethodKind.method,
        EsmProcedureKind.getter => EsmClassMethodKind.getter,
        EsmProcedureKind.setter => EsmClassMethodKind.setter,
      },
      isStatic: isStatic,
      parameters: parameters,
      body: body == null
          ? _lowerAbstractMemberBody(klass, procedure)
          : _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  List<EsmStatement> _lowerAbstractMemberBody(
    EsmClassSymbol klass,
    EsmClassProcedureSymbol procedure,
  ) {
    return [
      EsmThrowStatement(
        EsmNew(
          callee: const EsmIdentifier('TypeError'),
          arguments: [
            EsmStringLiteral(
              'Abstract member ${klass.node.name}.${procedure.node.name.text}',
            ),
          ],
        ),
      ),
    ];
  }

  List<EsmModuleItem> _lowerFieldItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmFieldSymbol field,
  ) {
    if (field.node.isLate) {
      helpers.require(EsmRuntimeHelper.lazyField);
      final initializer = field.node.initializer;
      return [
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(field.name),
          initializer: null,
          mutable: true,
          export: field.export,
        ),
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(field.backingName!),
          initializer: EsmCall(
            callee: helpers.reference(
              runtimeHelpers,
              EsmRuntimeHelper.lazyField,
            ),
            arguments: [
              EsmStringLiteral(field.node.name.text),
              initializer == null
                  ? const EsmNullLiteral()
                  : EsmArrowFunction(
                      parameters: const [],
                      body: _lowerExpression(
                        semantic,
                        helpers,
                        const <k.VariableDeclaration, String>{},
                        initializer,
                      ),
                    ),
              _lateWritableArgument(field.node.isFinal, field.mutable),
              EsmArrowFunction(
                parameters: const [EsmIdentifierParameter(name: 'value')],
                body: EsmAssignment(
                  target: EsmIdentifier(field.name),
                  value: const EsmIdentifier('value'),
                ),
              ),
            ],
          ),
          mutable: false,
        ),
      ];
    }
    final initializer = field.node.initializer;
    return [
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(field.name),
        initializer: initializer == null
            ? null
            : _lowerExpression(
                semantic,
                helpers,
                const <k.VariableDeclaration, String>{},
                initializer,
              ),
        mutable: field.mutable,
        export: field.export,
      ),
    ];
  }

  EsmFunction _lowerProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmProcedureSymbol procedure,
  ) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async function lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    if (body == null) {
      throw UnsupportedCompilerFeature(function, 'procedure without body');
    }
    return EsmFunction(
      name: procedure.name,
      export: procedure.export,
      parameters: parameters,
      body: _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  List<EsmParameter> _bindParameters(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.FunctionNode function,
  ) {
    return [
      for (final parameter in function.positionalParameters)
        _bindPositionalParameter(
          semantic,
          helpers,
          locals,
          usedParameters,
          parameter,
        ),
      if (function.namedParameters.isNotEmpty)
        EsmObjectPatternParameter(
          bindings: [
            for (final parameter in function.namedParameters)
              _bindNamedParameter(
                semantic,
                helpers,
                locals,
                usedParameters,
                parameter,
              ),
          ],
        ),
    ];
  }

  EsmIdentifierParameter _bindPositionalParameter(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.VariableDeclaration parameter,
  ) {
    final original = parameter.name ?? 'arg';
    final name = _freshParameterName(semantic, usedParameters, original);
    locals[parameter] = name;
    final initializer = parameter.initializer;
    return EsmIdentifierParameter(
      name: name,
      defaultValue: initializer == null
          ? null
          : _lowerExpression(semantic, helpers, locals, initializer),
    );
  }

  EsmObjectPatternBinding _bindNamedParameter(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.VariableDeclaration parameter,
  ) {
    final original = parameter.name ?? 'arg';
    final name = _freshParameterName(semantic, usedParameters, original);
    locals[parameter] = name;
    final initializer = parameter.initializer;
    return EsmObjectPatternBinding(
      property: original,
      name: name,
      defaultValue: initializer == null
          ? parameter.isRequired
                ? null
                : const EsmNullLiteral()
          : _lowerExpression(semantic, helpers, locals, initializer),
    );
  }

  List<EsmExpression> _lowerArguments(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments, {
    EsmExpression thisExpression = const EsmThis(),
    required k.TreeNode contextNode,
    required String context,
  }) {
    return [
      for (final argument in arguments.positional)
        _lowerExpression(
          semantic,
          helpers,
          locals,
          argument,
          thisExpression: thisExpression,
        ),
      if (arguments.named.isNotEmpty)
        EsmObjectLiteral([
          for (final argument in arguments.named)
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
    ];
  }

  EsmExpression _lowerOptionalPositionalArgument(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    List<k.Expression> positional,
    int index, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (index >= positional.length) {
      return const EsmNullLiteral();
    }
    return _lowerExpression(
      semantic,
      helpers,
      locals,
      positional[index],
      thisExpression: thisExpression,
    );
  }
}
