part of 'kernel_to_esm_ast.dart';

extension _ConvertInvocationLowering on Lowerer {
  EsmExpression? _lowerSinkInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    String memberName, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final isSinkTarget =
        target.startsWith('dart:core::Sink::') ||
        (target.startsWith('dart:convert::') &&
            target.contains('Sink::@methods::'));
    if (!isSinkTarget) {
      return null;
    }
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final allowed = switch (memberName) {
      'add' || 'addSlice' || 'addCharCode' || 'close' => true,
      _ => false,
    };
    if (!allowed) {
      return null;
    }
    return EsmCall(
      callee: _memberAccess(
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        memberName,
      ),
      arguments: [
        for (final argument in expression.arguments.positional)
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

  EsmExpression? _lowerDartConvertInterfaceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String memberName, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (!isDartConvertConverterMember(
      expression.interfaceTargetReference,
      memberName,
    )) {
      return null;
    }
    if (expression.arguments.types.isNotEmpty) {
      return null;
    }
    final allowed = switch (memberName) {
      'bind' ||
      'cast' ||
      'convert' ||
      'decode' ||
      'encode' ||
      'fuse' ||
      'startChunkedConversion' => true,
      _ => false,
    };
    if (!allowed) {
      return null;
    }
    return EsmCall(
      callee: _memberAccess(
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        memberName,
      ),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'dart:convert interface invocation arguments',
      ),
    );
  }
}
