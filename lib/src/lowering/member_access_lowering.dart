part of 'kernel_to_esm_ast.dart';

extension _MemberAccessLowering on Lowerer {
  EsmExpression _lowerInstanceGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final intrinsic = _lowerCoreInstanceGet(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (intrinsic != null) {
      return intrinsic;
    }
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.interfaceTargetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeInstanceGet(
        semantic,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final sdkIntrinsic = _lowerSdkInstanceGet(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw UnsupportedCompilerFeature(
        expression,
        'instance get lowering for '
        '${kernelReferencePath(expression.interfaceTargetReference)}',
      );
    }
    return EsmPropertyAccess(
      receiver: _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      property: _instanceMemberName(semantic, target),
    );
  }

  EsmExpression? _lowerSdkInstanceGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final sdkIntrinsic = sdkIntrinsics.lowerInstanceGet(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
      helpers: helpers,
      lowerReceiver: () => _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
    );
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    return _lowerWebInstanceGet(
          semantic,
          helpers,
          locals,
          expression,
          thisExpression: thisExpression,
        ) ??
        _lowerMathInstanceGet(
          semantic,
          helpers,
          locals,
          expression,
          thisExpression: thisExpression,
        );
  }

  EsmExpression? _lowerWebInstanceGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final name = expression.name.text;
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final property = _sdkInstanceGetterPropertyName(
      expression.interfaceTargetReference,
      name,
    );
    if (property != null) {
      return EsmPropertyAccess(receiver: receiver, property: property);
    }
    return null;
  }

  EsmExpression? _lowerMixinCollectionInstanceGet(
    String target,
    String memberName,
    EsmExpression receiver,
    EsmRuntimeHelperUseSet helpers,
  ) {
    if (!target.contains('ListMixin::@getters::$memberName') &&
        !target.contains('IterableMixin::@getters::$memberName')) {
      return null;
    }
    return switch (memberName) {
      'length' => EsmPropertyAccess(receiver: receiver, property: 'length'),
      'isEmpty' => EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNumberLiteral(0),
      ),
      'isNotEmpty' => EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperator.greaterThan,
        right: const EsmNumberLiteral(0),
      ),
      'first' => () {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCall(
          callee: const EsmIdentifier('__dartListMixinFirst'),
          arguments: [receiver],
        );
      }(),
      'last' => () {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCall(
          callee: const EsmIdentifier('__dartListMixinLast'),
          arguments: [receiver],
        );
      }(),
      'single' => () {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCall(
          callee: const EsmIdentifier('__dartListMixinSingle'),
          arguments: [receiver],
        );
      }(),
      _ => null,
    };
  }

  EsmExpression? _lowerMathInstanceGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final isPoint =
        target.startsWith('dart:math::Point::') ||
        target.startsWith('dart:math::_PointBase::');
    final isRectangle =
        target.startsWith('dart:math::Rectangle::') ||
        target.startsWith('dart:math::_RectangleBase::');
    if (!isPoint && !isRectangle) {
      return null;
    }
    final property = expression.name.text;
    final allowed = switch (property) {
      'x' || 'y' || 'magnitude' => isPoint,
      'left' ||
      'top' ||
      'width' ||
      'height' ||
      'right' ||
      'bottom' ||
      'topLeft' ||
      'topRight' ||
      'bottomLeft' ||
      'bottomRight' => isRectangle,
      _ => false,
    };
    if (!allowed) {
      return null;
    }
    return EsmPropertyAccess(
      receiver: _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      property: property,
    );
  }

  EsmExpression _lowerExtensionTypeInstanceGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.InstanceGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final receiver = _lowerExtensionTypeInstanceReceiver(
      semantic,
      helpers,
      locals,
      member,
      expression.receiver,
      thisExpression: thisExpression,
    );
    return switch (member.descriptor.kind) {
      k.ExtensionTypeMemberKind.Getter => EsmCall(
        callee: EsmIdentifier(member.backingName),
        arguments: [receiver],
      ),
      k.ExtensionTypeMemberKind.Method || k.ExtensionTypeMemberKind.Operator =>
        _lowerExtensionTypeInstanceTearOff(semantic, helpers, member, receiver),
      _ => throw UnsupportedCompilerFeature(
        expression,
        'extension type instance get',
      ),
    };
  }

  EsmExpression _lowerExtensionTypeInstanceTearOff(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    EsmExpression receiver,
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
      skipReceiver: true,
    );
    return EsmFunctionExpression(
      parameters: parameters,
      body: [
        EsmReturnStatement(
          EsmCall(
            callee: EsmIdentifier(member.backingName),
            arguments: [
              receiver,
              ..._extensionTypeFacadeArguments(
                procedure.function,
                locals,
                skipReceiver: true,
              ),
            ],
          ),
        ),
      ],
    );
  }

  EsmExpression? _lowerCoreInstanceGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final queueGet = sdkIntrinsics.lowerInstanceGet(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
      helpers: helpers,
      lowerReceiver: () => receiver,
    );
    if (queueGet != null) {
      return queueGet;
    }
    final memberName = expression.name.text;
    final coreTimeGet = _lowerCoreTimeInstanceGet(target, memberName, receiver);
    if (coreTimeGet != null) {
      return coreTimeGet;
    }
    final isMapMember = isDartCoreMapMember(
      expression.interfaceTargetReference,
      memberName,
    );
    final isListMember = isDartCoreListMember(
      expression.interfaceTargetReference,
      memberName,
    );
    final isSetMember = isDartCoreSetMember(
      expression.interfaceTargetReference,
      memberName,
    );
    final mixinCollectionGet = _lowerMixinCollectionInstanceGet(
      target,
      memberName,
      receiver,
      helpers,
    );
    if (mixinCollectionGet != null) {
      return mixinCollectionGet;
    }
    if (target == 'dart:core::String::@getters::runes') {
      return _stringRunes(receiver);
    }
    if ((isListMember && memberName == 'length') ||
        target == 'dart:core::String::@getters::length') {
      return EsmPropertyAccess(receiver: receiver, property: 'length');
    }
    if (isListMember && memberName == 'isEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNumberLiteral(0),
      );
    }
    if (isListMember && memberName == 'isNotEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperator.greaterThan,
        right: const EsmNumberLiteral(0),
      );
    }
    if (target == 'dart:core::Iterable::@getters::length') {
      return EsmPropertyAccess(
        receiver: _arrayFrom(helpers, receiver),
        property: 'length',
      );
    }
    if (isMapMember && memberName == 'length') {
      return EsmPropertyAccess(receiver: receiver, property: 'size');
    }
    if (isMapMember && memberName == 'isEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNumberLiteral(0),
      );
    }
    if (isMapMember && memberName == 'isNotEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperator.greaterThan,
        right: const EsmNumberLiteral(0),
      );
    }
    if (isSetMember && memberName == 'length') {
      return EsmPropertyAccess(receiver: receiver, property: 'size');
    }
    if (isMapMember && memberName == 'keys') {
      return _arrayFrom(
        helpers,
        EsmCall(
          callee: EsmPropertyAccess(receiver: receiver, property: 'keys'),
          arguments: const [],
        ),
      );
    }
    if (isMapMember && memberName == 'values') {
      return _arrayFrom(
        helpers,
        EsmCall(
          callee: EsmPropertyAccess(receiver: receiver, property: 'values'),
          arguments: const [],
        ),
      );
    }
    if (isMapMember && memberName == 'entries') {
      return _arrayFrom(
        helpers,
        EsmCall(
          callee: EsmPropertyAccess(receiver: receiver, property: 'entries'),
          arguments: const [],
        ),
      );
    }
    if (target == 'dart:core::MapEntry::@getters::key') {
      return EsmComputedPropertyAccess(
        receiver: receiver,
        property: const EsmNumberLiteral(0),
      );
    }
    if (target == 'dart:core::MapEntry::@getters::value') {
      return EsmComputedPropertyAccess(
        receiver: receiver,
        property: const EsmNumberLiteral(1),
      );
    }
    if (_isCoreHashCodeGetter(target)) {
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCall(
        callee: const EsmIdentifier('__dartHashValue'),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::Object::@getters::runtimeType') {
      helpers.require(EsmRuntimeHelper.objectRuntimeType);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.objectRuntimeType,
        ),
        arguments: [receiver],
      );
    }
    if (_isCoreRegExpMember(target)) {
      final property = switch (memberName) {
        'pattern' ||
        'isCaseSensitive' ||
        'isMultiLine' ||
        'isUnicode' ||
        'isDotAll' => memberName,
        _ => null,
      };
      if (property != null) {
        return EsmPropertyAccess(receiver: receiver, property: property);
      }
    }
    if (_isCoreMatchMember(target)) {
      final property = switch (memberName) {
        'start' ||
        'end' ||
        'input' ||
        'pattern' ||
        'groupCount' ||
        'groupNames' => memberName,
        _ => null,
      };
      if (property != null) {
        return EsmPropertyAccess(receiver: receiver, property: property);
      }
    }
    if (_isCoreStringBufferMember(target)) {
      final property = switch (memberName) {
        'length' || 'isEmpty' || 'isNotEmpty' => memberName,
        _ => null,
      };
      if (property != null) {
        return EsmPropertyAccess(receiver: receiver, property: property);
      }
    }
    if (memberName == 'target' &&
        isDartCoreWeakReferenceMember(
          expression.interfaceTargetReference,
          memberName,
        )) {
      return EsmPropertyAccess(receiver: receiver, property: 'target');
    }
    if (target == 'dart:core::Iterable::@getters::isEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(
          receiver: _arrayFrom(helpers, receiver),
          property: 'length',
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNumberLiteral(0),
      );
    }
    if (isSetMember && memberName == 'isEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNumberLiteral(0),
      );
    }
    if (target == 'dart:core::Iterable::@getters::isNotEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(
          receiver: _arrayFrom(helpers, receiver),
          property: 'length',
        ),
        operator: EsmBinaryOperator.greaterThan,
        right: const EsmNumberLiteral(0),
      );
    }
    if (isSetMember && memberName == 'isNotEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperator.greaterThan,
        right: const EsmNumberLiteral(0),
      );
    }
    if (target == 'dart:core::_Enum::@getters::index') {
      return EsmPropertyAccess(receiver: receiver, property: 'index');
    }
    if (target == 'dart:core::_Enum::@getters::name') {
      return EsmPropertyAccess(receiver: receiver, property: 'name');
    }
    if (target == 'dart:core::Iterable::@getters::iterator') {
      helpers.require(EsmRuntimeHelper.iterator);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.iterator),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::Iterable::@getters::first' ||
        target == 'dart:core::List::@getters::first') {
      return EsmComputedPropertyAccess(
        receiver: EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Array'),
            property: 'from',
          ),
          arguments: [receiver],
        ),
        property: const EsmNumberLiteral(0),
      );
    }
    if (target == 'dart:core::Iterable::@getters::last' ||
        target == 'dart:core::List::@getters::last') {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Array'),
              property: 'from',
            ),
            arguments: [receiver],
          ),
          property: 'at',
        ),
        arguments: const [EsmNumberLiteral(-1)],
      );
    }
    if (target == 'dart:core::Iterable::@getters::reversed' ||
        target == 'dart:core::List::@getters::reversed') {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(helpers, receiver),
          property: 'reverse',
        ),
        arguments: const [],
      );
    }
    if (target == 'dart:core::Iterable::@getters::single' ||
        target == 'dart:core::List::@getters::single') {
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCall(
        callee: const EsmIdentifier('__dartIterableSingle'),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::Iterator::@getters::current') {
      return EsmPropertyAccess(receiver: receiver, property: 'current');
    }
    if (target == 'dart:core::String::@getters::isEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNumberLiteral(0),
      );
    }
    if (target == 'dart:core::String::@getters::isNotEmpty') {
      return EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperator.greaterThan,
        right: const EsmNumberLiteral(0),
      );
    }
    if (target == 'dart:core::String::@getters::codeUnits') {
      helpers.require(EsmRuntimeHelper.stringOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartStringCodeUnits'),
        arguments: [receiver],
      );
    }
    final coreErrorGetter = _coreErrorInstanceGetterProperty(
      expression.interfaceTargetReference,
      memberName,
    );
    if (coreErrorGetter != null) {
      return EsmPropertyAccess(receiver: receiver, property: coreErrorGetter);
    }
    final numberGet = _lowerCoreNumberInstanceGet(helpers, receiver, target);
    if (numberGet != null) {
      return numberGet;
    }
    final bigIntGet = _lowerBigIntInstanceGet(helpers, receiver, target);
    if (bigIntGet != null) {
      return bigIntGet;
    }
    return null;
  }

  String? _coreErrorInstanceGetterProperty(k.Reference reference, String name) {
    final property = switch (name) {
      'message' ||
      'source' ||
      'offset' ||
      'invalidValue' ||
      'name' ||
      'start' ||
      'end' ||
      'stackTrace' => name,
      _ => null,
    };
    if (property == null) {
      return null;
    }
    final path = kernelReferencePath(reference);
    for (final typeName in dartCoreErrorTypeNames) {
      if (path == 'dart:core::$typeName::@getters::$name') {
        return property;
      }
    }
    return null;
  }

  EsmExpression? _lowerCoreTimeInstanceGet(
    String target,
    String name,
    EsmExpression receiver,
  ) {
    if (target.startsWith('dart:core::DateTime::@getters::')) {
      final property = switch (name) {
        'millisecondsSinceEpoch' ||
        'microsecondsSinceEpoch' ||
        'microsecond' ||
        'millisecond' ||
        'second' ||
        'minute' ||
        'hour' ||
        'day' ||
        'month' ||
        'year' ||
        'weekday' ||
        'isUtc' ||
        'timeZoneName' ||
        'timeZoneOffset' ||
        'hashCode' => name,
        _ => null,
      };
      if (property != null) {
        return EsmPropertyAccess(receiver: receiver, property: property);
      }
    }
    if (target.startsWith('dart:core::Duration::@getters::')) {
      final property = switch (name) {
        'inDays' ||
        'inHours' ||
        'inMinutes' ||
        'inSeconds' ||
        'inMilliseconds' ||
        'inMicroseconds' ||
        'isNegative' ||
        'hashCode' => name,
        _ => null,
      };
      if (property != null) {
        return EsmPropertyAccess(receiver: receiver, property: property);
      }
    }
    return null;
  }

  EsmExpression? _lowerCoreNumberInstanceGet(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression receiver,
    String target,
  ) {
    return switch (target) {
      'dart:core::int::@getters::isEven' => EsmBinary(
        left: EsmBinary(
          left: _mathTrunc(receiver),
          operator: EsmBinaryOperator.remainder,
          right: const EsmNumberLiteral(2),
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNumberLiteral(0),
      ),
      'dart:core::int::@getters::isOdd' => EsmBinary(
        left: EsmBinary(
          left: _mathTrunc(receiver),
          operator: EsmBinaryOperator.remainder,
          right: const EsmNumberLiteral(2),
        ),
        operator: EsmBinaryOperator.strictNotEquals,
        right: const EsmNumberLiteral(0),
      ),
      'dart:core::num::@getters::hashCode' ||
      'dart:core::int::@getters::hashCode' ||
      'dart:core::double::@getters::hashCode' => () {
        helpers.require(EsmRuntimeHelper.objectHash);
        return EsmCall(
          callee: const EsmIdentifier('__dartHashValue'),
          arguments: [receiver],
        );
      }(),
      'dart:core::num::@getters::sign' ||
      'dart:core::int::@getters::sign' ||
      'dart:core::double::@getters::sign' => EsmConditional(
        condition: EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Number'),
            property: 'isNaN',
          ),
          arguments: [receiver],
        ),
        thenExpression: const EsmIdentifier('NaN'),
        otherwiseExpression: EsmConditional(
          condition: EsmBinary(
            left: receiver,
            operator: EsmBinaryOperator.lessThan,
            right: const EsmNumberLiteral(0),
          ),
          thenExpression: const EsmNumberLiteral(-1),
          otherwiseExpression: EsmConditional(
            condition: EsmBinary(
              left: receiver,
              operator: EsmBinaryOperator.greaterThan,
              right: const EsmNumberLiteral(0),
            ),
            thenExpression: const EsmNumberLiteral(1),
            otherwiseExpression: receiver,
          ),
        ),
      ),
      'dart:core::num::@getters::isNaN' ||
      'dart:core::double::@getters::isNaN' => EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Number'),
          property: 'isNaN',
        ),
        arguments: [receiver],
      ),
      'dart:core::num::@getters::isFinite' ||
      'dart:core::double::@getters::isFinite' => EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Number'),
          property: 'isFinite',
        ),
        arguments: [receiver],
      ),
      'dart:core::num::@getters::isInfinite' ||
      'dart:core::double::@getters::isInfinite' => _or(
        EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.strictEquals,
          right: const EsmIdentifier('Infinity'),
        ),
        EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.strictEquals,
          right: const EsmUnary(
            operator: EsmUnaryOperator.negate,
            operand: EsmIdentifier('Infinity'),
          ),
        ),
      ),
      'dart:core::num::@getters::isNegative' ||
      'dart:core::double::@getters::isNegative' => _or(
        EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.lessThan,
          right: const EsmNumberLiteral(0),
        ),
        EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'is',
          ),
          arguments: [
            receiver,
            const EsmUnary(
              operator: EsmUnaryOperator.negate,
              operand: EsmNumberLiteral(0),
            ),
          ],
        ),
      ),
      _ => null,
    };
  }

  EsmExpression? _lowerBigIntInstanceGet(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression receiver,
    String target,
  ) {
    return switch (target) {
      'dart:core::BigInt::@getters::isNegative' => EsmBinary(
        left: receiver,
        operator: EsmBinaryOperator.lessThan,
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::isEven' => EsmBinary(
        left: EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.remainder,
          right: _bigIntLiteral(2),
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::isOdd' => EsmBinary(
        left: EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.remainder,
          right: _bigIntLiteral(2),
        ),
        operator: EsmBinaryOperator.strictNotEquals,
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::sign' => EsmConditional(
        condition: EsmBinary(
          left: receiver,
          operator: EsmBinaryOperator.lessThan,
          right: _bigIntLiteral(0),
        ),
        thenExpression: const EsmNumberLiteral(-1),
        otherwiseExpression: EsmConditional(
          condition: EsmBinary(
            left: receiver,
            operator: EsmBinaryOperator.greaterThan,
            right: _bigIntLiteral(0),
          ),
          thenExpression: const EsmNumberLiteral(1),
          otherwiseExpression: const EsmNumberLiteral(0),
        ),
      ),
      'dart:core::BigInt::@getters::bitLength' => () {
        helpers.require(EsmRuntimeHelper.bigIntBitLength);
        return EsmCall(
          callee: helpers.reference(
            runtimeHelpers,
            EsmRuntimeHelper.bigIntBitLength,
          ),
          arguments: [receiver],
        );
      }(),
      _ => null,
    };
  }
}
