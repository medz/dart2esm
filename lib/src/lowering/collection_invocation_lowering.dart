part of 'kernel_to_esm_ast.dart';

extension _CollectionInvocationLowering on Lowerer {
  EsmExpression? _lowerMixinCollectionInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    String memberName, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final isListMixin = target.contains('ListMixin::@methods::$memberName');
    final isIterableMixin = target.contains(
      'IterableMixin::@methods::$memberName',
    );
    if (!isListMixin && !isIterableMixin) {
      return null;
    }
    final positional = expression.arguments.positional;
    if (memberName == 'join' && positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.iterableJoin);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.iterableJoin,
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          if (positional case [final separator])
            _lowerExpression(
              semantic,
              helpers,
              locals,
              separator,
              thisExpression: thisExpression,
            )
          else
            const EsmStringLiteral(''),
        ],
      );
    }
    if (memberName == 'insert' && positional.length == 2) {
      if (!isListMixin) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.listMixin);
      return EsmCall(
        callee: const EsmIdentifier('__dartListMixinInsert'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
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

  EsmExpression? _lowerTypedDataInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final name = expression.name.text;
    if (!isDartTypedDataMember(expression.interfaceTargetReference, name)) {
      return null;
    }
    EsmExpression lower(k.Expression argument) => _lowerExpression(
      semantic,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );

    final sdkIntrinsic = sdkIntrinsics.lowerInstanceInvocation(
      reference: expression.interfaceTargetReference,
      name: name,
      arguments: expression.arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: () => _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      lower: lower,
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
    return sdkIntrinsic;
  }
}
