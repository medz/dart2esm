part of 'kernel_to_esm_ast.dart';

extension _ExtensionTypeLowering on Lowerer {
  List<EsmModuleItem> _lowerExtensionTypeItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
  ) {
    return [
      _lowerExtensionTypeFacade(semantic, helpers, extensionType),
      for (final member in extensionType.members)
        ..._lowerExtensionTypeBackingItems(semantic, helpers, member),
    ];
  }

  EsmClass _lowerExtensionTypeFacade(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
  ) {
    final constructors = [
      for (final member in extensionType.members)
        if (member.descriptor.kind == k.ExtensionTypeMemberKind.Constructor &&
            member.descriptor.name.text.isEmpty)
          member,
    ];
    if (constructors.length > 1) {
      throw UnsupportedCompilerFeature(
        extensionType.node,
        'extension type constructor lowering',
      );
    }
    return EsmClass(
      name: extensionType.name,
      export: extensionType.export,
      superclass: null,
      constructor: constructors.isEmpty
          ? null
          : _lowerExtensionTypeFacadeConstructor(
              semantic,
              helpers,
              extensionType,
              constructors.single,
            ),
      methods: [
        for (final member in extensionType.members)
          ..._lowerExtensionTypeFacadeMethods(
            semantic,
            helpers,
            extensionType,
            member,
          ),
      ],
    );
  }

  EsmClassConstructor _lowerExtensionTypeFacadeConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final procedure = _extensionTypeProcedure(member);
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    final parameters = _bindExtensionTypeFacadeParameters(
      semantic,
      helpers,
      locals,
      usedNames,
      procedure.function,
      skipReceiver: false,
    );
    return EsmClassConstructor(
      parameters: parameters,
      body: [
        EsmExpressionStatement(
          EsmAssignment(
            target: EsmPropertyAccess(
              receiver: const EsmThis(),
              property: extensionType.representationName,
            ),
            value: EsmCall(
              callee: EsmIdentifier(member.backingName),
              arguments: _extensionTypeFacadeArguments(
                procedure.function,
                locals,
                skipReceiver: false,
              ),
            ),
          ),
        ),
      ],
    );
  }

  List<EsmClassMethod> _lowerExtensionTypeFacadeMethods(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final descriptor = member.descriptor;
    return switch (descriptor.kind) {
      k.ExtensionTypeMemberKind.Constructor => const [],
      k.ExtensionTypeMemberKind.Field => [
        EsmClassMethod(
          key: EsmStaticPropertyKey(member.name),
          kind: EsmClassMethodKind.getter,
          isStatic: true,
          parameters: const [],
          body: [
            EsmReturnStatement(
              _lowerExtensionTypeFacadeReturn(
                semantic,
                helpers,
                _extensionTypeMemberType(member),
                EsmIdentifier(member.backingName),
              ),
            ),
          ],
        ),
        if (member.mutable)
          EsmClassMethod(
            key: EsmStaticPropertyKey(member.name),
            kind: EsmClassMethodKind.setter,
            isStatic: true,
            parameters: const [EsmIdentifierParameter(name: 'value')],
            body: [
              EsmReturnStatement(
                EsmAssignment(
                  target: EsmIdentifier(member.backingName),
                  value: _lowerExtensionTypeRepresentation(
                    helpers,
                    const EsmIdentifier('value'),
                    extensionType,
                  ),
                ),
              ),
            ],
          ),
      ],
      k.ExtensionTypeMemberKind.Factory ||
      k.ExtensionTypeMemberKind.RedirectingFactory ||
      k.ExtensionTypeMemberKind.Method ||
      k.ExtensionTypeMemberKind.Operator ||
      k.ExtensionTypeMemberKind.Getter ||
      k.ExtensionTypeMemberKind.Setter => [
        _lowerExtensionTypeFacadeProcedure(
          semantic,
          helpers,
          extensionType,
          member,
        ),
      ],
    };
  }

  EsmClassMethod _lowerExtensionTypeFacadeProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final procedure = _extensionTypeProcedure(member);
    final descriptor = member.descriptor;
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    final skipReceiver =
        !descriptor.isStatic &&
        descriptor.kind != k.ExtensionTypeMemberKind.Factory &&
        descriptor.kind != k.ExtensionTypeMemberKind.RedirectingFactory;
    final parameters = _bindExtensionTypeFacadeParameters(
      semantic,
      helpers,
      locals,
      usedNames,
      procedure.function,
      skipReceiver: skipReceiver,
    );
    final call = EsmCall(
      callee: EsmIdentifier(member.backingName),
      arguments: [
        if (skipReceiver)
          _lowerExtensionTypeRepresentation(
            helpers,
            const EsmThis(),
            extensionType,
          ),
        ..._extensionTypeFacadeArguments(
          procedure.function,
          locals,
          skipReceiver: skipReceiver,
        ),
      ],
    );
    final isSetter = descriptor.kind == k.ExtensionTypeMemberKind.Setter;
    return EsmClassMethod(
      key: EsmStaticPropertyKey(member.name),
      kind: switch (descriptor.kind) {
        k.ExtensionTypeMemberKind.Getter => EsmClassMethodKind.getter,
        k.ExtensionTypeMemberKind.Setter => EsmClassMethodKind.setter,
        _ => EsmClassMethodKind.method,
      },
      isStatic: descriptor.isStatic,
      parameters: parameters,
      body: [
        if (isSetter)
          EsmReturnStatement(call)
        else
          EsmReturnStatement(
            _lowerExtensionTypeFacadeReturn(
              semantic,
              helpers,
              procedure.function.returnType,
              call,
            ),
          ),
      ],
    );
  }

  List<EsmModuleItem> _lowerExtensionTypeBackingItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final node = member.memberReference?.node;
    return switch (node) {
      k.Field() => [
        _lowerExtensionTypeBackingField(semantic, helpers, member, node),
      ],
      k.Procedure() => [
        _lowerExtensionTypeBackingProcedure(semantic, helpers, member, node),
      ],
      _ => throw UnsupportedCompilerFeature(
        member.descriptor,
        'extension type member lowering',
      ),
    };
  }

  EsmVariableDeclaration _lowerExtensionTypeBackingField(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    k.Field field,
  ) {
    final initializer = field.initializer;
    return EsmVariableDeclaration(
      binding: EsmIdentifierBinding(member.backingName),
      initializer: initializer == null
          ? null
          : _lowerExpression(
              semantic,
              helpers,
              const <k.VariableDeclaration, String>{},
              initializer,
            ),
      mutable: member.mutable,
    );
  }

  EsmFunction _lowerExtensionTypeBackingProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    k.Procedure procedure,
  ) {
    if (procedure.function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(
        procedure.function,
        'async extension type member lowering',
      );
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedNames = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedNames,
      procedure.function,
    );
    final body = procedure.function.body;
    if (body == null) {
      if (procedure.function.positionalParameters.length == 1 &&
          member.descriptor.kind == k.ExtensionTypeMemberKind.Constructor) {
        return EsmFunction(
          name: member.backingName,
          export: false,
          parameters: parameters,
          body: [
            EsmReturnStatement(
              EsmIdentifier(
                locals[procedure.function.positionalParameters.single]!,
              ),
            ),
          ],
        );
      }
      throw UnsupportedCompilerFeature(
        procedure.function,
        'extension type member without body',
      );
    }
    return EsmFunction(
      name: member.backingName,
      export: false,
      parameters: parameters,
      body: _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  List<EsmParameter> _bindExtensionTypeFacadeParameters(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.FunctionNode function, {
    required bool skipReceiver,
  }) {
    final positional = skipReceiver
        ? function.positionalParameters.skip(1)
        : function.positionalParameters;
    return [
      for (final parameter in positional)
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

  List<EsmExpression> _extensionTypeFacadeArguments(
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals, {
    required bool skipReceiver,
  }) {
    final positional = skipReceiver
        ? function.positionalParameters.skip(1)
        : function.positionalParameters;
    return [
      for (final parameter in positional) EsmIdentifier(locals[parameter]!),
      for (final parameter in function.namedParameters)
        EsmIdentifier(locals[parameter]!),
    ];
  }

  EsmExpression _lowerExtensionTypeFacadeReturn(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
    EsmExpression value,
  ) {
    final unaliased = type.unalias;
    if (unaliased is k.ExtensionType) {
      final symbol = semantic.extensionTypeSymbolFor(
        unaliased.extensionTypeDeclaration,
      );
      if (symbol != null) {
        return EsmNew(
          callee: EsmIdentifier(symbol.name),
          arguments: [
            _lowerExtensionTypeRepresentation(helpers, value, symbol),
          ],
        );
      }
    }
    return value;
  }

  EsmExpression _lowerExtensionTypeRepresentation(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression value,
    EsmExtensionTypeSymbol extensionType,
  ) {
    helpers.require(EsmRuntimeHelper.extensionTypeRep);
    return EsmCall(
      callee: helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.extensionTypeRep,
      ),
      arguments: [value, EsmStringLiteral(extensionType.representationName)],
    );
  }

  k.Procedure _extensionTypeProcedure(EsmExtensionTypeMemberSymbol member) {
    final node = member.memberReference?.node;
    if (node is k.Procedure) {
      return node;
    }
    throw UnsupportedCompilerFeature(
      member.descriptor,
      'extension type procedure',
    );
  }

  k.DartType _extensionTypeMemberType(EsmExtensionTypeMemberSymbol member) {
    final node = member.memberReference?.node;
    return switch (node) {
      k.Field() => node.type,
      k.Procedure() => node.function.returnType,
      _ => const k.DynamicType(),
    };
  }
}
