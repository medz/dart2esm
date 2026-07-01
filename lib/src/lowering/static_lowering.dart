part of 'kernel_to_esm_ast.dart';

extension _StaticLowering on Lowerer {
  EsmExpression _lowerStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final helperCall = _lowerRuntimeStaticInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (helperCall != null) {
      return helperCall;
    }
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.targetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeStaticInvocation(
        semantic,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final targetNode = expression.targetReference.node;
    final target =
        (targetNode is k.Procedure ? semantic.symbolFor(targetNode) : null) ??
        semantic.symbolForReference(expression.targetReference);
    if (target != null) {
      if (target.kind != EsmProcedureKind.method) {
        throw UnsupportedCompilerFeature(
          expression.targetReference,
          'static accessor call',
        );
      }
      return EsmCall(
        callee: EsmIdentifier(target.name),
        arguments: _lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'static invocation arguments',
        ),
      );
    }
    final staticTarget =
        (targetNode is k.Procedure
            ? semantic.staticProcedureSymbolFor(targetNode)
            : null) ??
        semantic.staticProcedureSymbolForReference(expression.targetReference);
    final staticClass = staticTarget == null
        ? null
        : semantic.classSymbolFor(staticTarget.node.enclosingClass!);
    if (staticTarget != null &&
        staticClass != null &&
        staticTarget.kind == EsmProcedureKind.method) {
      final arguments = _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'static invocation arguments',
      );
      if (staticTarget.node.kind == k.ProcedureKind.Factory &&
          staticTarget.node.name.text.isEmpty) {
        return EsmNew(
          callee: EsmIdentifier(staticClass.name),
          arguments: arguments,
        );
      }
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(staticClass.name),
          property: staticTarget.name,
        ),
        arguments: arguments,
      );
    }
    throw UnsupportedCompilerFeature(
      expression,
      'external static target '
      '${kernelReferencePath(expression.targetReference)} '
      '(positional ${expression.arguments.positional.length}, '
      'named ${expression.arguments.named.length}, '
      'types ${expression.arguments.types.length})',
    );
  }

  EsmExpression _lowerExtensionTypeStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final kind = member.descriptor.kind;
    if (kind == k.ExtensionTypeMemberKind.Field) {
      throw UnsupportedCompilerFeature(
        expression,
        'extension type static invocation',
      );
    }
    if (_isExtensionTypeTearOffReference(member, expression.targetReference) &&
        !member.descriptor.isStatic &&
        expression.arguments.positional.length == 1 &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      final extensionType = semantic.extensionTypeSymbolFor(
        member.extensionType,
      );
      if (extensionType == null) {
        throw UnsupportedCompilerFeature(
          member.descriptor,
          'extension type tear-off',
        );
      }
      return _lowerExtensionTypeInstanceTearOff(
        semantic,
        helpers,
        member,
        _lowerExtensionTypeRepresentation(
          helpers,
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
          extensionType,
        ),
      );
    }
    return EsmCall(
      callee: EsmIdentifier(member.backingName),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'extension type static invocation arguments',
      ),
    );
  }

  bool _isExtensionTypeTearOffReference(
    EsmExtensionTypeMemberSymbol member,
    k.Reference reference,
  ) {
    final tearOffReference = member.tearOffReference;
    return tearOffReference != null &&
        kernelReferencePath(tearOffReference) == kernelReferencePath(reference);
  }

  EsmExpression? _lowerRuntimeStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final coreErrorFactoryName = dartCoreErrorFactoryName(
      expression.targetReference,
    );
    if (coreErrorFactoryName != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      return _lowerCoreErrorCreation(
        semantic,
        helpers,
        locals,
        coreErrorFactoryName,
        expression.arguments.positional,
        thisExpression: thisExpression,
      );
    }
    final sdkStatic = sdkIntrinsics.lowerStaticInvocation(
      expression: expression,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
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
    if (sdkStatic != null) {
      return sdkStatic;
    }
    final webStatic = _lowerWebStaticInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (webStatic != null) {
      return webStatic;
    }
    if (_isCoreGrowableListLiteral(expression.targetReference)) {
      return _lowerCoreGrowableListLiteral(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
    }
    return null;
  }

  EsmExpression? _lowerWebStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    if (kernelReferencePath(expression.targetReference) ==
            'dart:svg::SvgElement::@factories::tag' &&
        positional.length == 1 &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmPropertyAccess(
            receiver: EsmIdentifier('globalThis'),
            property: 'document',
          ),
          property: 'createElementNS',
        ),
        arguments: [
          const EsmStringLiteral('http://www.w3.org/2000/svg'),
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

  bool _isCoreStringBufferConstructor(String target) {
    return target == 'dart:core::StringBuffer::@constructors::';
  }

  bool _isCoreStringBufferMember(String target) {
    return target.startsWith('dart:core::StringBuffer::@');
  }

  bool _isCoreRunesConstructor(String target) {
    return target == 'dart:core::Runes::@constructors::';
  }

  bool _isCoreExpandoMember(String target) {
    return target.startsWith('dart:core::Expando::@');
  }

  EsmExpression? _lowerNamedArgument(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments,
    String name, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    for (final argument in arguments.named) {
      if (argument.name == name) {
        return _lowerExpression(
          semantic,
          helpers,
          locals,
          argument.value,
          thisExpression: thisExpression,
        );
      }
    }
    return null;
  }

  bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
    return arguments.named.every((argument) => names.contains(argument.name));
  }

  EsmCall _arrayFrom(EsmRuntimeHelperUseSet helpers, EsmExpression value) {
    helpers.require(EsmRuntimeHelper.iterableToArray);
    return EsmCall(
      callee: helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.iterableToArray,
      ),
      arguments: [value],
    );
  }

  EsmCall _stringRunes(EsmExpression value) {
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Array'),
        property: 'from',
      ),
      arguments: [
        EsmCall(callee: const EsmIdentifier('String'), arguments: [value]),
        const EsmArrowFunction(
          parameters: [EsmIdentifierParameter(name: 'char')],
          body: EsmCall(
            callee: EsmPropertyAccess(
              receiver: EsmIdentifier('char'),
              property: 'codePointAt',
            ),
            arguments: [EsmNumberLiteral(0)],
          ),
        ),
      ],
    );
  }

  EsmExpression _lowerCoreGrowableListLiteral(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        expression,
        'GrowableList literal shape',
      );
    }
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

  bool _isCoreGrowableListLiteral(k.Reference reference) {
    return reference.toStringInternal().startsWith(
      'dart:core::_GrowableList::@factories::dart:core::_literal',
    );
  }

  String _instanceMemberName(Semantic semantic, k.Member member) {
    if (member is k.Field) {
      return _instanceFieldName(semantic, member);
    }
    if (member is k.Procedure) {
      final symbol = semantic.instanceProcedureSymbolFor(member);
      if (symbol != null) {
        return symbol.name;
      }
    }
    throw UnsupportedCompilerFeature(
      member,
      'instance member lowering ${kernelReferencePath(member.reference)}',
    );
  }

  EsmExpression _memberAccess(EsmExpression receiver, String memberName) {
    if (isJsIdentifierName(memberName)) {
      return EsmPropertyAccess(receiver: receiver, property: memberName);
    }
    return EsmComputedPropertyAccess(
      receiver: receiver,
      property: EsmStringLiteral(memberName),
    );
  }

  String _instanceFieldName(Semantic semantic, k.Field field) {
    final symbol = semantic.instanceFieldSymbolFor(field);
    if (symbol == null) {
      throw UnsupportedCompilerFeature(field, 'instance field lowering');
    }
    return symbol.name;
  }

  EsmExpression _lowerVariableGet(
    Map<k.VariableDeclaration, String> locals,
    k.VariableGet expression,
  ) {
    final name = locals[expression.variable];
    if (name == null) {
      throw UnsupportedCompilerFeature(
        expression,
        'unbound variable get ${expression.variable.name ?? '<unnamed>'} '
        'in ${expression.variable.parent.runtimeType}',
      );
    }
    if (expression.variable.isLate) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(name),
          property: 'get',
        ),
        arguments: const [],
      );
    }
    return EsmIdentifier(name);
  }

  String _freshParameterName(
    Semantic semantic,
    Set<String> usedParameters,
    String original,
  ) {
    final name = _freshLocalName(semantic, usedParameters, original);
    usedParameters.add(name);
    return name;
  }

  String _freshLocalName(
    Semantic semantic,
    Iterable<String> usedNames,
    String original, {
    Iterable<String> reservedNames = const [],
  }) {
    return _freshIn({
      ...semantic.globalBindingNames,
      ...reservedNames,
      ...usedNames,
    }, original);
  }

  String _freshIn(Set<String> usedNames, String original) {
    var name = sanitizeJsIdentifier(original);
    if (!isJsBindingIdentifier(name)) {
      name = '\$$name';
    }
    var candidate = name;
    var suffix = 1;
    while (!usedNames.add(candidate)) {
      candidate = '${name}_$suffix';
      suffix++;
    }
    return candidate;
  }
}
