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

  EsmExpression _lowerConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final sdkConstructor = _lowerSdkConstructorInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (sdkConstructor != null) {
      return sdkConstructor;
    }
    final targetPath = kernelReferencePath(expression.targetReference);
    final target = expression.targetReference.node;
    if (target is! k.Constructor) {
      throw UnsupportedCompilerFeature(
        expression,
        'constructor invocation $targetPath '
        '(positional ${expression.arguments.positional.length}, '
        'named ${expression.arguments.named.length}, '
        'types ${expression.arguments.types.length})',
      );
    }
    final constructor = semantic.constructorSymbolFor(target);
    final klass = semantic.classSymbolFor(target.enclosingClass);
    if (klass == null) {
      throw UnsupportedCompilerFeature(
        expression,
        'constructor invocation class symbol missing $targetPath',
      );
    }
    if (constructor == null) {
      if (!_isSyntheticDefaultConstructor(target) ||
          expression.arguments.positional.isNotEmpty ||
          expression.arguments.named.isNotEmpty) {
        throw UnsupportedCompilerFeature(
          expression,
          'constructor invocation symbol missing '
          '${kernelReferencePath(expression.targetReference)}',
        );
      }
      return EsmNew(callee: EsmIdentifier(klass.name), arguments: const []);
    }
    if (constructor.name.isNotEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: constructor.name,
        ),
        arguments: _lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'constructor invocation arguments',
        ),
      );
    }
    return EsmNew(
      callee: EsmIdentifier(klass.name),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'constructor invocation arguments',
      ),
    );
  }

  EsmExpression? _lowerSdkConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final coreTimeConstructor = _lowerCoreTimeConstructorInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreTimeConstructor != null) {
      return coreTimeConstructor;
    }
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final convertConstructor = sdkIntrinsics.lowerConstructorInvocation(
      expression: expression,
      helpers: helpers,
      lower: (argument) => _lowerExpression(
        semantic,
        helpers,
        locals,
        argument,
        thisExpression: thisExpression,
      ),
    );
    if (convertConstructor != null) {
      return convertConstructor;
    }
    final mathConstructor = _lowerMathConstructorInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (mathConstructor != null) {
      return mathConstructor;
    }
    final coreErrorName = dartCoreErrorConstructorName(
      expression.targetReference,
    );
    if (coreErrorName != null) {
      return _lowerCoreErrorCreation(
        semantic,
        helpers,
        locals,
        coreErrorName,
        expression.arguments.positional,
        thisExpression: thisExpression,
      );
    }
    if (isDartListIteratorConstructorReference(expression.targetReference) &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterator);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.iterator),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartCollectionQueueConstructorReference(expression.targetReference) &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length <= 1) {
      return const EsmArrayLiteral([]);
    }
    final target = kernelReferencePath(expression.targetReference);
    final positional = expression.arguments.positional;
    if (target == 'dart:core::Object::@constructors::' && positional.isEmpty) {
      return const EsmObjectLiteral([]);
    }
    if (isDartMappedIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Array'),
          property: 'from',
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
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
    if (isDartWhereIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
              thisExpression: thisExpression,
            ),
          ),
          property: 'filter',
        ),
        arguments: [
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
    if (isDartWhereTypeIterableConstructorPath(target) &&
        positional.length == 1 &&
        expression.arguments.types.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
          ),
          property: 'filter',
        ),
        arguments: [
          EsmArrowFunction(
            parameters: const [EsmIdentifierParameter(name: 'value')],
            body: _lowerTypeTest(
              semantic,
              helpers,
              expression.arguments.types.single,
              const EsmIdentifier('value'),
            ),
          ),
        ],
      );
    }
    if (isDartExpandIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
              thisExpression: thisExpression,
            ),
          ),
          property: 'flatMap',
        ),
        arguments: [
          EsmArrowFunction(
            parameters: const [EsmIdentifierParameter(name: 'value')],
            body: _arrayFrom(
              helpers,
              EsmCall(
                callee: EsmParenthesized(
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    positional[1],
                    thisExpression: thisExpression,
                  ),
                ),
                arguments: const [EsmIdentifier('value')],
              ),
            ),
          ),
        ],
      );
    }
    if (isDartTakeIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
              thisExpression: thisExpression,
            ),
          ),
          property: 'slice',
        ),
        arguments: [
          const EsmNumberLiteral(0),
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
    if (isDartSkipIterableConstructorPath(target) && positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
              thisExpression: thisExpression,
            ),
          ),
          property: 'slice',
        ),
        arguments: [
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
    if (isDartSubListIterableConstructorPath(target) &&
        positional.length == 3) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.first,
              thisExpression: thisExpression,
            ),
          ),
          property: 'slice',
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional[1],
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional[2],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartListMapViewConstructorPath(target) && positional.length == 1) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListAsMap'),
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
    if (isDartReversedListIterableConstructorPath(target) &&
        positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
          ),
          property: 'reverse',
        ),
        arguments: const [],
      );
    }
    if (isDartMapBaseValueIterableConstructorPath(target) &&
        positional.length == 1) {
      return _arrayFrom(
        helpers,
        EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
            property: 'values',
          ),
          arguments: const [],
        ),
      );
    }
    final iterableWindowHelper = switch (target) {
      _ when isDartTakeWhileIterableConstructorPath(target) =>
        '__dartIterableTakeWhile',
      _ when isDartSkipWhileIterableConstructorPath(target) =>
        '__dartIterableSkipWhile',
      _ => null,
    };
    if (iterableWindowHelper != null && positional.length == 2) {
      helpers.require(EsmRuntimeHelper.iterableWindow);
      return EsmCall(
        callee: EsmIdentifier(iterableWindowHelper),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
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
    if (target.startsWith(
          'dart:collection::UnmodifiableListView::@constructors::',
        ) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.unmodifiableViews);
      return EsmCall(
        callee: const EsmIdentifier('__dartUnmodifiableListView'),
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
    if (target.startsWith(
          'dart:collection::UnmodifiableMapView::@constructors::',
        ) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.unmodifiableViews);
      return EsmCall(
        callee: const EsmIdentifier('__dartUnmodifiableMapView'),
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
    if (isDartCoreWeakReferenceConstructorReference(
          expression.targetReference,
        ) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.weakReference);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.weakReference,
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
    if (isDartCoreFinalizerConstructorReference(expression.targetReference) &&
        positional.length == 1) {
      helpers.require(EsmRuntimeHelper.finalizer);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.finalizer),
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
    if (isDartCoreExpandoConstructorReference(expression.targetReference) &&
        positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.expando);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.expando),
        arguments: [
          if (positional.isEmpty)
            const EsmNullLiteral()
          else
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
    if (target == 'dart:collection::SplayTreeSet::@constructors::' &&
        positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCall(
        callee: const EsmIdentifier('__dartSplayTreeSet'),
        arguments: [
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (target == 'dart:collection::SplayTreeMap::@constructors::' &&
        positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCall(
        callee: const EsmIdentifier('__dartSplayTreeMap'),
        arguments: [
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            semantic,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isCoreStringBufferConstructor(target) && positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.stringBuffer);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.stringBuffer,
        ),
        arguments: [
          if (positional.isEmpty)
            const EsmStringLiteral('')
          else
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
    if (_isCoreRunesConstructor(target) && positional.length == 1) {
      return _stringRunes(
        _lowerExpression(
          semantic,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    if (target == 'dart:_compact_hash::_Set::@constructors::' &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return const EsmCall(
        callee: EsmIdentifier('__dartSetFrom'),
        arguments: [EsmArrayLiteral([])],
      );
    }
    if (target == 'dart:_internal::EmptyIterable::@constructors::' &&
        expression.arguments.positional.isEmpty) {
      return const EsmArrayLiteral([]);
    }
    if (target.startsWith('dart:core::MapEntry::@constructors::') &&
        expression.arguments.positional.length == 2) {
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
    if ((target.startsWith('dart:core::Symbol::') ||
            target.startsWith('dart:_internal::Symbol::')) &&
        expression.arguments.positional.length == 1) {
      final argument = expression.arguments.positional.single;
      if (argument is k.StringLiteral) {
        return _lowerSymbolLiteral(helpers, argument.value);
      }
      helpers.require(EsmRuntimeHelper.symbol);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.symbol),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
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

  EsmExpression? _lowerCoreTimeConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = kernelReferencePath(expression.targetReference);
    final positional = expression.arguments.positional;
    if (target.startsWith('dart:core::Duration::@constructors::') &&
        positional.isEmpty &&
        expression.arguments.types.isEmpty &&
        _hasOnlyNamedArguments(expression.arguments, {
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'microseconds',
        })) {
      helpers.require(EsmRuntimeHelper.duration);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.duration),
        arguments: [
          _lowerCoreDurationOptionsObject(
            semantic,
            helpers,
            locals,
            expression.arguments,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (!target.startsWith('dart:core::DateTime::@constructors::') ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    helpers.require(EsmRuntimeHelper.dateTime);
    if ((target == 'dart:core::DateTime::@constructors::' ||
            target == 'dart:core::DateTime::@constructors::utc') &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 8) {
      return EsmCall(
        callee: const EsmIdentifier('__dartDateTimeFromParts'),
        arguments: [
          EsmBooleanLiteral(
            target == 'dart:core::DateTime::@constructors::utc',
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
    if ((target == 'dart:core::DateTime::@constructors::now' ||
            target == 'dart:core::DateTime::@constructors::timestamp') &&
        expression.arguments.named.isEmpty &&
        positional.isEmpty) {
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dateTime),
        arguments: [
          const EsmCall(
            callee: EsmPropertyAccess(
              receiver: EsmIdentifier('Date'),
              property: 'now',
            ),
            arguments: [],
          ),
          EsmBooleanLiteral(
            target == 'dart:core::DateTime::@constructors::timestamp',
          ),
        ],
      );
    }
    if ((target ==
                'dart:core::DateTime::@constructors::fromMillisecondsSinceEpoch' ||
            target ==
                'dart:core::DateTime::@constructors::fromMicrosecondsSinceEpoch') &&
        positional.length == 1 &&
        _hasOnlyNamedArguments(expression.arguments, {'isUtc'})) {
      final isUtc =
          _lowerNamedArgument(
            semantic,
            helpers,
            locals,
            expression.arguments,
            'isUtc',
            thisExpression: thisExpression,
          ) ??
          const EsmBooleanLiteral(false);
      return EsmCall(
        callee: target.endsWith('fromMicrosecondsSinceEpoch')
            ? const EsmIdentifier('__dartDateTimeFromMicros')
            : helpers.reference(runtimeHelpers, EsmRuntimeHelper.dateTime),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
          isUtc,
        ],
      );
    }
    return null;
  }

  EsmObjectLiteral _lowerCoreDurationOptionsObject(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return EsmObjectLiteral([
      for (final name in const [
        'days',
        'hours',
        'minutes',
        'seconds',
        'milliseconds',
        'microseconds',
      ])
        EsmObjectLiteralProperty.static(
          key: name,
          value:
              _lowerNamedArgument(
                semantic,
                helpers,
                locals,
                arguments,
                name,
                thisExpression: thisExpression,
              ) ??
              const EsmNumberLiteral(0),
        ),
    ]);
  }

  EsmExpression? _lowerMathConstructorInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    if (isDartMathPointConstructorReference(expression.targetReference) &&
        positional.length == 2) {
      helpers.require(EsmRuntimeHelper.mathPoint);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mathPoint),
        arguments: [
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
    if (isDartMathRectangleConstructorReference(expression.targetReference) &&
        positional.length == 4) {
      helpers.require(EsmRuntimeHelper.mathRectangle);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mathRectangle,
        ),
        arguments: [
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

  EsmExpression _lowerCoreErrorCreation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    String typeName,
    List<k.Expression> positionalArguments, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.coreError);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
      arguments: [
        EsmStringLiteral(typeName),
        positionalArguments.isEmpty
            ? const EsmNullLiteral()
            : _lowerExpression(
                semantic,
                helpers,
                locals,
                positionalArguments.first,
                thisExpression: thisExpression,
              ),
      ],
    );
  }

  bool _isSyntheticDefaultConstructor(k.Constructor constructor) {
    return constructor.isSynthetic && constructor.name.text.isEmpty;
  }

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
      callee: EsmFunctionExpression(
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
      callee: EsmFunctionExpression(
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
