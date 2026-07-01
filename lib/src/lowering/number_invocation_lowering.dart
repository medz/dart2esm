part of 'kernel_to_esm_ast.dart';

extension _NumberInvocationLowering on Lowerer {
  EsmExpression? _lowerCoreNumberInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    if (expression.arguments.named.isEmpty && positional.isEmpty) {
      final receiver = _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
      final doubleResultMethod = switch (target) {
        'dart:core::num::@methods::roundToDouble' ||
        'dart:core::double::@methods::roundToDouble' => 'round',
        'dart:core::num::@methods::truncateToDouble' ||
        'dart:core::double::@methods::truncateToDouble' => 'trunc',
        'dart:core::num::@methods::floorToDouble' ||
        'dart:core::double::@methods::floorToDouble' => 'floor',
        'dart:core::num::@methods::ceilToDouble' ||
        'dart:core::double::@methods::ceilToDouble' => 'ceil',
        _ => null,
      };
      if (doubleResultMethod != null) {
        helpers.require(EsmRuntimeHelper.doubleValue);
        return EsmCall(
          callee: helpers.reference(
            runtimeHelpers,
            EsmRuntimeHelper.doubleValue,
          ),
          arguments: [
            EsmCall(
              callee: EsmPropertyAccess(
                receiver: const EsmIdentifier('Math'),
                property: doubleResultMethod,
              ),
              arguments: [receiver],
            ),
          ],
        );
      }
      final numberMethod = switch (target) {
        'dart:core::num::@methods::abs' ||
        'dart:core::int::@methods::abs' ||
        'dart:core::double::@methods::abs' => 'abs',
        'dart:core::num::@methods::floor' ||
        'dart:core::double::@methods::floor' => 'floor',
        'dart:core::num::@methods::ceil' ||
        'dart:core::double::@methods::ceil' => 'ceil',
        'dart:core::num::@methods::round' ||
        'dart:core::double::@methods::round' => 'round',
        'dart:core::num::@methods::truncate' ||
        'dart:core::double::@methods::truncate' ||
        'dart:core::num::@methods::toInt' ||
        'dart:core::double::@methods::toInt' => 'trunc',
        _ => null,
      };
      if (numberMethod != null) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: const EsmIdentifier('Math'),
            property: numberMethod,
          ),
          arguments: [receiver],
        );
      }
    }
    if (!_isCoreCompareToTarget(target) || positional.length != 1) {
      if ((target == 'dart:core::num::@methods::clamp' ||
              target == 'dart:core::int::@methods::clamp' ||
              target == 'dart:core::double::@methods::clamp') &&
          positional.length == 2 &&
          expression.arguments.named.isEmpty) {
        final receiver = _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        );
        return EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Math'),
            property: 'min',
          ),
          arguments: [
            EsmCall(
              callee: const EsmPropertyAccess(
                receiver: EsmIdentifier('Math'),
                property: 'max',
              ),
              arguments: [
                receiver,
                _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  positional[0],
                  thisExpression: thisExpression,
                ),
              ],
            ),
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional[1],
              thisExpression: thisExpression,
            ),
          ],
        );
      }
      if ((target == 'dart:core::num::@methods::remainder' ||
              target == 'dart:core::int::@methods::remainder' ||
              target == 'dart:core::double::@methods::remainder') &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return EsmBinary(
          left: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          operator: EsmBinaryOperator.remainder,
          right: _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        );
      }
      if ((target == 'dart:core::num::@methods::~/' ||
              target == 'dart:core::int::@methods::~/' ||
              target == 'dart:core::double::@methods::~/') &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return _mathTrunc(
          EsmBinary(
            left: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            operator: EsmBinaryOperator.divide,
            right: _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
          ),
        );
      }
      if (target == 'dart:core::int::@methods::gcd' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        helpers.require(EsmRuntimeHelper.intGcd);
        return EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.intGcd),
          arguments: [
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
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
      if (target == 'dart:core::int::@methods::modInverse' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        helpers.require(EsmRuntimeHelper.intModular);
        return EsmCall(
          callee: helpers.reference(
            runtimeHelpers,
            EsmRuntimeHelper.intModular,
          ),
          arguments: [
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
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
      if (target == 'dart:core::int::@methods::modPow' &&
          positional.length == 2 &&
          expression.arguments.named.isEmpty) {
        helpers.require(EsmRuntimeHelper.intModular);
        return EsmCall(
          callee: const EsmIdentifier('__dartIntModPow'),
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
      if (target == 'dart:core::int::@methods::toRadixString' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: EsmParenthesized(
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.receiver,
                thisExpression: thisExpression,
              ),
            ),
            property: 'toString',
          ),
          arguments: [
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
    helpers.require(EsmRuntimeHelper.compare);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
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

  EsmExpression? _lowerBigIntInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final positional = expression.arguments.positional;
    if (target == 'dart:core::BigInt::@methods::toInt' && positional.isEmpty) {
      return EsmCall(
        callee: const EsmIdentifier('Number'),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::BigInt::@methods::toRadixString' &&
        positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'toString'),
        arguments: [
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
    if (target == 'dart:core::BigInt::@methods::abs' && positional.isEmpty) {
      return EsmConditional(
        condition: EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.lessThan,
          right: _bigIntLiteral(0),
        ),
        thenExpression: EsmUnary(
          operator: EsmUnaryOperator.negate,
          operand: receiver,
        ),
        otherwiseExpression: receiver,
      );
    }
    if (target == 'dart:core::BigInt::@methods::remainder' &&
        positional.length == 1) {
      return EsmBinary(
        left: receiver,
        operator: EsmBinaryOperator.remainder,
        right: _lowerExpression(
          semantic,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    if (target == 'dart:core::BigInt::@methods::~/') {
      if (positional.length != 1) return null;
      return EsmBinary(
        left: receiver,
        operator: EsmBinaryOperator.divide,
        right: _lowerExpression(
          semantic,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    return null;
  }
}
