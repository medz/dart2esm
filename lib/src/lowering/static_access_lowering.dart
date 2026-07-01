part of 'kernel_to_esm_ast.dart';

extension _StaticAccessLowering on Lowerer {
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
