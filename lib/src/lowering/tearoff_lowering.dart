part of 'kernel_to_esm_ast.dart';

extension _TearoffLowering on Lowerer {
  EsmExpression _lowerEqualsCall(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.EqualsCall expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.equals);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.equals),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.left,
          thisExpression: thisExpression,
        ),
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.right,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpression _lowerInstanceTearOff(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceTearOff expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = expression.interfaceTargetReference.node;
    final targetPath = kernelReferencePath(expression.interfaceTargetReference);
    final sdkTearOff = _lowerSdkInstanceTearOff(
      semantic,
      helpers,
      locals,
      expression,
      targetPath,
      thisExpression: thisExpression,
    );
    if (sdkTearOff != null) {
      return sdkTearOff;
    }
    if (target is! k.Procedure) {
      throw UnsupportedCompilerFeature(
        expression,
        'instance tear-off target non-procedure $targetPath',
      );
    }
    final symbol = semantic.instanceProcedureSymbolFor(target);
    final targetName = target.name.text;
    final methodName = switch (symbol?.kind) {
      EsmProcedureKind.method => symbol!.name,
      EsmProcedureKind.getter ||
      EsmProcedureKind.setter => throw UnsupportedCompilerFeature(
        expression,
        'instance tear-off target accessor $targetPath',
      ),
      null => _sdkInstanceTearOffMethodName(
        expression.interfaceTargetReference,
        targetName,
      ),
    };
    if (methodName == null) {
      throw UnsupportedCompilerFeature(
        expression,
        'instance tear-off target $targetPath',
      );
    }
    final function = target.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(
        expression,
        'instance tear-off target async $targetPath',
      );
    }
    final receiverName = _freshLocalName(semantic, const [], r'$receiver');
    final forwardingLocals = <k.VariableDeclaration, String>{};
    final usedParameters = {receiverName};
    final parameters = _bindParameters(
      semantic,
      helpers,
      forwardingLocals,
      usedParameters,
      function,
    );
    return EsmCall(
      callee: EsmArrowBlockFunction(
        parameters: const [],
        body: [
          EsmVariableDeclaration(
            binding: EsmIdentifierBinding(receiverName),
            initializer: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            mutable: false,
          ),
          EsmReturnStatement(
            EsmFunctionExpression(
              parameters: parameters,
              body: [
                EsmReturnStatement(
                  EsmCall(
                    callee: _memberAccess(
                      EsmIdentifier(receiverName),
                      methodName,
                    ),
                    arguments: _forwardingArguments(function, forwardingLocals),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      arguments: const [],
    );
  }

  EsmExpression? _lowerSdkInstanceTearOff(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceTearOff expression,
    String targetPath, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (isDartCoreListMember(expression.interfaceTargetReference, 'add') ||
        targetPath.contains('List::@methods::add')) {
      helpers.require(EsmRuntimeHelper.listAdd);
      return _lowerHelperInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        '__dartListAdd',
        const ['value'],
        thisExpression: thisExpression,
      );
    }
    if (targetPath.startsWith('dart:core::Map::@methods::remove') ||
        targetPath.contains('Map::@methods::remove')) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return _lowerHelperInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        '__dartMapRemove',
        const ['key'],
        thisExpression: thisExpression,
      );
    }
    if (isDartSdkLibraryClassMember(
          expression.interfaceTargetReference,
          'dart:async',
          'Completer',
          expression.name.text,
        ) &&
        (expression.name.text == 'complete' ||
            expression.name.text == 'completeError')) {
      return _lowerSimpleInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        expression.name.text,
        expression.name.text == 'complete' ? const ['value'] : const ['error'],
        thisExpression: thisExpression,
      );
    }
    if (isDartAsyncStreamConsumerMember(
          expression.interfaceTargetReference,
          'close',
        ) &&
        targetPath.contains('::@methods::close')) {
      return _lowerSimpleInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        'close',
        const [],
        thisExpression: thisExpression,
      );
    }
    if (isDartAsyncStreamConsumerMember(
          expression.interfaceTargetReference,
          'add',
        ) &&
        targetPath.contains('::@methods::add')) {
      return _lowerSimpleInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        'add',
        const ['value'],
        thisExpression: thisExpression,
      );
    }
    if (isDartAsyncStreamConsumerMember(
          expression.interfaceTargetReference,
          'addError',
        ) &&
        targetPath.contains('::@methods::addError')) {
      return _lowerSimpleInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        'addError',
        const ['error'],
        thisExpression: thisExpression,
      );
    }
    if (isDartSdkLibraryClassMember(
          expression.interfaceTargetReference,
          'dart:async',
          'StreamSubscription',
          expression.name.text,
        ) &&
        (expression.name.text == 'pause' ||
            expression.name.text == 'resume' ||
            expression.name.text == 'cancel')) {
      return _lowerSimpleInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        expression.name.text,
        const [],
        thisExpression: thisExpression,
      );
    }
    if (targetPath.startsWith('dart:') &&
        targetPath.contains('::@methods::contains') &&
        !targetPath.contains('Set::') &&
        !targetPath.contains('_Set::')) {
      return _lowerSimpleInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression.receiver,
        'includes',
        const ['element'],
        thisExpression: thisExpression,
      );
    }
    return null;
  }

  EsmExpression _lowerHelperInstanceTearOff(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression receiver,
    String helperName,
    List<String> parameterNames, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final receiverName = _freshLocalName(semantic, const [], r'$receiver');
    return EsmCall(
      callee: EsmArrowBlockFunction(
        parameters: const [],
        body: [
          EsmVariableDeclaration(
            binding: EsmIdentifierBinding(receiverName),
            initializer: _lowerExpression(
              semantic,
              helpers,
              locals,
              receiver,
              thisExpression: thisExpression,
            ),
            mutable: false,
          ),
          EsmReturnStatement(
            EsmFunctionExpression(
              parameters: [
                for (final name in parameterNames)
                  EsmIdentifierParameter(name: name),
              ],
              body: [
                EsmReturnStatement(
                  EsmCall(
                    callee: EsmIdentifier(helperName),
                    arguments: [
                      EsmIdentifier(receiverName),
                      for (final name in parameterNames) EsmIdentifier(name),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      arguments: const [],
    );
  }

  EsmExpression _lowerSimpleInstanceTearOff(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression receiver,
    String methodName,
    List<String> parameterNames, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final receiverName = _freshLocalName(semantic, const [], r'$receiver');
    return EsmCall(
      callee: EsmArrowBlockFunction(
        parameters: const [],
        body: [
          EsmVariableDeclaration(
            binding: EsmIdentifierBinding(receiverName),
            initializer: _lowerExpression(
              semantic,
              helpers,
              locals,
              receiver,
              thisExpression: thisExpression,
            ),
            mutable: false,
          ),
          EsmReturnStatement(
            EsmFunctionExpression(
              parameters: [
                for (final name in parameterNames)
                  EsmIdentifierParameter(name: name),
              ],
              body: [
                EsmReturnStatement(
                  EsmCall(
                    callee: _memberAccess(
                      EsmIdentifier(receiverName),
                      methodName,
                    ),
                    arguments: [
                      for (final name in parameterNames) EsmIdentifier(name),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      arguments: const [],
    );
  }

  String? _sdkInstanceTearOffMethodName(k.Reference reference, String name) {
    final sdkMethod = _sdkInstanceMethodName(reference, name);
    if (sdkMethod != null) {
      return sdkMethod;
    }
    final target = kernelReferencePath(reference);
    final isContains =
        name == 'contains' || target.contains('::@methods::contains');
    if (target.startsWith('dart:') && isContains) {
      if (!target.contains('Set::') && !target.contains('_Set::')) {
        return 'includes';
      }
    }
    return null;
  }
}
