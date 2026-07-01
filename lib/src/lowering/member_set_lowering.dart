part of 'kernel_to_esm_ast.dart';

extension _MemberSetLowering on Lowerer {
  EsmExpression _lowerInstanceSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.interfaceTargetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeInstanceSet(
        semantic,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final sdkIntrinsic = _lowerSdkInstanceSet(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    final reference = expression.interfaceTargetReference;
    final fieldSymbol = semantic.instanceFieldSymbolForReference(reference);
    if (fieldSymbol != null) {
      return EsmAssignment(
        target: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: fieldSymbol.name,
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
    final procedureSymbol = semantic.instanceProcedureSymbolForReference(
      reference,
    );
    if (procedureSymbol != null &&
        procedureSymbol.kind == EsmProcedureKind.setter) {
      return EsmAssignment(
        target: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: procedureSymbol.name,
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
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw UnsupportedCompilerFeature(
        expression,
        'instance set lowering ${kernelReferencePath(reference)}',
      );
    }
    return EsmAssignment(
      target: EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: _instanceMemberName(semantic, target),
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

  EsmExpression? _lowerSdkInstanceSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final name = expression.name.text;
    final property = _sdkInstanceSetterPropertyName(
      expression.interfaceTargetReference,
      name,
    );
    if (property != null) {
      return EsmAssignment(
        target: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: property,
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
    return null;
  }

  EsmExpression _lowerExtensionTypeInstanceSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.InstanceSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (member.descriptor.kind != k.ExtensionTypeMemberKind.Setter) {
      throw UnsupportedCompilerFeature(
        expression,
        'extension type instance set',
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

  EsmExpression _lowerExtensionTypeInstanceReceiver(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.Expression receiver, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final extensionType = semantic.extensionTypeSymbolFor(member.extensionType);
    if (extensionType == null) {
      throw UnsupportedCompilerFeature(
        member.descriptor,
        'extension type receiver',
      );
    }
    return _lowerExtensionTypeRepresentation(
      helpers,
      _lowerExpression(
        semantic,
        helpers,
        locals,
        receiver,
        thisExpression: thisExpression,
      ),
      extensionType,
    );
  }

  EsmExpression _lowerSuperMethodInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperMethodInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = expression.interfaceTargetReference.node;
    if (target is k.Procedure) {
      final symbol = semantic.instanceProcedureSymbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.method) {
        return EsmCall(
          callee: _memberAccess(const EsmSuper(), symbol.name),
          arguments: _lowerArguments(
            semantic,
            helpers,
            locals,
            expression.arguments,
            thisExpression: thisExpression,
            contextNode: expression,
            context: 'super method invocation arguments',
          ),
        );
      }
    }
    throw UnsupportedCompilerFeature(expression, 'super method invocation');
  }

  EsmExpression _lowerSuperPropertyGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperPropertyGet expression,
  ) {
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw UnsupportedCompilerFeature(expression, 'super get lowering');
    }
    return _memberAccess(
      const EsmSuper(),
      _instanceMemberName(semantic, target),
    );
  }

  EsmExpression _lowerSuperPropertySet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperPropertySet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw UnsupportedCompilerFeature(expression, 'super set lowering');
    }
    return EsmAssignment(
      target: _memberAccess(
        const EsmSuper(),
        _instanceMemberName(semantic, target),
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
