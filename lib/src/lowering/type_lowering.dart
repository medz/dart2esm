part of 'kernel_to_esm_ast.dart';

extension _TypeLowering on Lowerer {
  EsmExpression _lowerIsExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.IsExpression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return _lowerTypeTest(
      semantic,
      helpers,
      expression.type,
      _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.operand,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmExpression _lowerAsExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.AsExpression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final type = expression.type.unalias;
    final operand = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.operand,
      thisExpression: thisExpression,
    );
    if (type is k.DynamicType || type is k.VoidType) {
      return operand;
    }
    helpers.require(EsmRuntimeHelper.typeCast);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.typeCast),
      arguments: [
        operand,
        EsmArrowFunction(
          parameters: const [EsmIdentifierParameter(name: 'value')],
          body: _lowerTypeTest(
            semantic,
            helpers,
            type,
            const EsmIdentifier('value'),
          ),
        ),
        EsmStringLiteral(_typeName(type)),
      ],
    );
  }

  EsmExpression _lowerTypeTest(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
    EsmExpression value,
  ) {
    final unaliased = type.unalias;
    if (_isTopType(unaliased)) {
      return const EsmBooleanLiteral(true);
    }
    final test = _lowerNonNullableTypeTest(semantic, helpers, unaliased, value);
    if (_isNullableType(unaliased)) {
      return _or(_strictEquals(value, const EsmNullLiteral()), test);
    }
    return test;
  }

  EsmExpression _lowerNonNullableTypeTest(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
    EsmExpression value,
  ) {
    if (type is k.DynamicType || type is k.VoidType || type is k.InvalidType) {
      return const EsmBooleanLiteral(true);
    }
    if (type is k.NeverType) {
      return const EsmBooleanLiteral(false);
    }
    if (type is k.TypeParameterType) {
      return _lowerTypeTest(semantic, helpers, type.bound, value);
    }
    if (type is k.FunctionType) {
      return _typeofEquals(value, 'function');
    }
    if (type is k.RecordType) {
      return _lowerRecordTypeTest(semantic, helpers, type, value);
    }
    if (type is k.ExtensionType) {
      final symbol = semantic.extensionTypeSymbolFor(
        type.extensionTypeDeclaration,
      );
      final representation = symbol == null
          ? value
          : _lowerExtensionTypeRepresentation(helpers, value, symbol);
      return _lowerTypeTest(
        semantic,
        helpers,
        type.extensionTypeErasure,
        representation,
      );
    }
    if (type is k.InterfaceType) {
      final target = type.classReference.toStringInternal();
      final targetNode = type.classReference.node;
      if (targetNode is k.Class) {
        final klass = semantic.classSymbolFor(targetNode);
        if (klass != null) {
          return EsmBinary(
            left: value,
            operator: EsmBinaryOperator.instanceOf,
            right: EsmIdentifier(klass.name),
          );
        }
      }
      if (target == 'dart:core::Object') {
        return _notNull(value);
      }
      final typeName = _typeName(type);
      if (dartCoreErrorTypeNames.contains(typeName)) {
        return _lowerCoreErrorTypeTest(helpers, value, typeName);
      }
      if (target == 'dart:math::Point') {
        return _lowerDartTypeTagTest(value, 'Point');
      }
      if (target == 'dart:math::Rectangle') {
        return _lowerDartTypeTagTest(value, 'Rectangle');
      }
      if (target == 'dart:svg::SvgElement') {
        return _lowerGlobalInstanceTypeTest(value, 'SVGElement');
      }
      return switch (typeName) {
        'String' => _typeofEquals(value, 'string'),
        'BigInt' => _typeofEquals(value, 'bigint'),
        'int' => _typeofEquals(value, 'number'),
        'double' || 'num' => _or(
          _typeofEquals(value, 'number'),
          _lowerDartTypeTagTest(value, 'double'),
        ),
        'bool' => _typeofEquals(value, 'boolean'),
        'Null' => _strictEquals(value, const EsmNullLiteral()),
        'List' => _or(
          EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Array'),
              property: 'isArray',
            ),
            arguments: [value],
          ),
          _andAll([
            EsmCall(
              callee: const EsmPropertyAccess(
                receiver: EsmIdentifier('ArrayBuffer'),
                property: 'isView',
              ),
              arguments: [value],
            ),
            EsmUnary(
              operator: EsmUnaryOperator.logicalNot,
              operand: EsmParenthesized(
                EsmBinary(
                  left: value,
                  operator: EsmBinaryOperator.instanceOf,
                  right: const EsmIdentifier('DataView'),
                ),
              ),
            ),
          ]),
        ),
        'Set' => EsmBinary(
          left: value,
          operator: EsmBinaryOperator.instanceOf,
          right: const EsmIdentifier('Set'),
        ),
        'Map' => EsmBinary(
          left: value,
          operator: EsmBinaryOperator.instanceOf,
          right: const EsmIdentifier('Map'),
        ),
        'Iterable' => _andAll([
          _notNull(value),
          EsmBinary(
            left: EsmUnary(operator: EsmUnaryOperator.typeOf, operand: value),
            operator: EsmBinaryOperator.strictNotEquals,
            right: const EsmStringLiteral('string'),
          ),
          EsmUnary(
            operator: EsmUnaryOperator.logicalNot,
            operand: EsmParenthesized(
              EsmBinary(
                left: value,
                operator: EsmBinaryOperator.instanceOf,
                right: const EsmIdentifier('Map'),
              ),
            ),
          ),
          EsmBinary(
            left: EsmUnary(
              operator: EsmUnaryOperator.typeOf,
              operand: EsmComputedPropertyAccess(
                receiver: value,
                property: const EsmPropertyAccess(
                  receiver: EsmIdentifier('Symbol'),
                  property: 'iterator',
                ),
              ),
            ),
            operator: EsmBinaryOperator.strictEquals,
            right: const EsmStringLiteral('function'),
          ),
        ]),
        'EfficientLengthIterable' || 'HideEfficientLengthIterable' => _andAll([
          _notNull(value),
          EsmBinary(
            left: EsmUnary(operator: EsmUnaryOperator.typeOf, operand: value),
            operator: EsmBinaryOperator.strictNotEquals,
            right: const EsmStringLiteral('string'),
          ),
          EsmBinary(
            left: EsmUnary(
              operator: EsmUnaryOperator.typeOf,
              operand: EsmPropertyAccess(receiver: value, property: 'length'),
            ),
            operator: EsmBinaryOperator.strictEquals,
            right: const EsmStringLiteral('number'),
          ),
        ]),
        'Comparable' => _andAll([
          _notNull(value),
          _orAll([
            _typeofEquals(value, 'number'),
            _typeofEquals(value, 'string'),
            _typeofEquals(value, 'bigint'),
            EsmBinary(
              left: EsmUnary(
                operator: EsmUnaryOperator.typeOf,
                operand: EsmPropertyAccess(
                  receiver: value,
                  property: 'compareTo',
                ),
              ),
              operator: EsmBinaryOperator.strictEquals,
              right: const EsmStringLiteral('function'),
            ),
          ]),
        ]),
        'Function' => _typeofEquals(value, 'function'),
        'Expando' => _lowerDartTypeTagTest(value, 'Expando'),
        'WeakReference' ||
        '_WeakReference' => _lowerDartTypeTagTest(value, 'WeakReference'),
        'Finalizer' ||
        '_FinalizerImpl' => _lowerDartTypeTagTest(value, 'Finalizer'),
        'Uri' => _lowerDartTypeTagTest(value, 'Uri'),
        'Pattern' => _lowerCorePatternTypeTest(value),
        'RegExp' => _lowerCoreRegExpTypeTest(value),
        'Record' => _lowerRecordObjectTest(helpers, value),
        _ => throw UnsupportedCompilerFeature(
          type,
          'type test lowering ${_typeName(type)}',
        ),
      };
    }
    throw UnsupportedCompilerFeature(
      type,
      'type test lowering ${_typeName(type)}',
    );
  }

  EsmExpression _lowerGlobalInstanceTypeTest(
    EsmExpression value,
    String constructorName,
  ) {
    final constructor = EsmComputedPropertyAccess(
      receiver: const EsmIdentifier('globalThis'),
      property: EsmStringLiteral(constructorName),
    );
    return _andAll([
      _typeofEquals(constructor, 'function'),
      EsmBinary(
        left: value,
        operator: EsmBinaryOperator.instanceOf,
        right: constructor,
      ),
    ]);
  }

  bool _isDartWebNodeMember(k.Reference reference, String name) {
    return isDartSdkLibraryClassMember(reference, 'dart:html', 'Node', name) ||
        isDartSdkLibraryClassMember(reference, 'dart:svg', 'Node', name) ||
        isDartSdkLibraryClassMember(reference, 'dart:svg', 'SvgElement', name);
  }

  bool _isDartWebElementMember(k.Reference reference, String name) {
    return isDartSdkLibraryClassMember(
          reference,
          'dart:html',
          'Element',
          name,
        ) ||
        isDartSdkLibraryClassMember(reference, 'dart:svg', 'SvgElement', name);
  }

  bool _isDartWebCollectionMember(k.Reference reference, String name) {
    return isDartSdkLibraryClassMember(
          reference,
          'dart:html',
          'HtmlCollection',
          name,
        ) ||
        isDartSdkLibraryClassMember(reference, 'dart:html', 'NodeList', name);
  }

  String? _sdkInstanceGetterPropertyName(k.Reference reference, String name) {
    if (name == 'text' && _isDartWebNodeMember(reference, name)) {
      return 'textContent';
    }
    if ((name == 'id' || name == 'children') &&
        _isDartWebElementMember(reference, name)) {
      return name;
    }
    if (name == 'length' && _isDartWebCollectionMember(reference, name)) {
      return 'length';
    }
    return null;
  }

  String? _sdkInstanceSetterPropertyName(k.Reference reference, String name) {
    if (name == 'length' && isDartCoreListMember(reference, name)) {
      return 'length';
    }
    if (name == 'text' && _isDartWebNodeMember(reference, name)) {
      return 'textContent';
    }
    if (name == 'id' && _isDartWebElementMember(reference, name)) {
      return 'id';
    }
    return null;
  }

  String? _sdkInstanceMethodName(k.Reference reference, String name) {
    if (name == 'append' && _isDartWebNodeMember(reference, name)) {
      return 'appendChild';
    }
    if ((name == 'getAttribute' || name == 'setAttribute') &&
        _isDartWebElementMember(reference, name)) {
      return name;
    }
    return null;
  }

  EsmExpression _lowerCoreErrorTypeTest(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression value,
    String typeName,
  ) {
    helpers.require(EsmRuntimeHelper.coreError);
    return EsmCall(
      callee: const EsmIdentifier('__dartIsCoreError'),
      arguments: [value, EsmStringLiteral(typeName)],
    );
  }

  EsmExpression _lowerRecordTypeTest(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.RecordType type,
    EsmExpression value,
  ) {
    final checks = <EsmExpression>[_lowerRecordObjectTest(helpers, value)];
    final shape = <String>[];
    for (var i = 0; i < type.positional.length; i++) {
      final name = _recordPositionalKey(i);
      shape.add(name);
      checks.add(
        _lowerTypeTest(
          semantic,
          helpers,
          type.positional[i],
          EsmPropertyAccess(receiver: value, property: name),
        ),
      );
    }
    final named = type.named.toList()
      ..sort((left, right) => left.name.compareTo(right.name));
    for (final field in named) {
      shape.add(field.name);
      checks.add(
        _lowerTypeTest(
          semantic,
          helpers,
          field.type,
          EsmPropertyAccess(receiver: value, property: field.name),
        ),
      );
    }
    final recordShape = EsmComputedPropertyAccess(
      receiver: value,
      property: helpers.reference(runtimeHelpers, EsmRuntimeHelper.recordShape),
    );
    checks.insert(
      1,
      _strictEquals(
        EsmPropertyAccess(receiver: recordShape, property: 'length'),
        EsmNumberLiteral(shape.length),
      ),
    );
    for (var i = 0; i < shape.length; i++) {
      checks.insert(
        2 + i,
        _strictEquals(
          EsmComputedPropertyAccess(
            receiver: recordShape,
            property: EsmNumberLiteral(i),
          ),
          EsmStringLiteral(shape[i]),
        ),
      );
    }
    return _andAll(checks);
  }

  EsmExpression _lowerRecordObjectTest(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression value,
  ) {
    helpers.require(EsmRuntimeHelper.isRecord);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.isRecord),
      arguments: [value],
    );
  }

  EsmExpression _lowerDartTypeTagTest(EsmExpression value, String tag) {
    return _andAll([
      _notNull(value),
      _typeofEquals(value, 'object'),
      _strictEquals(
        EsmPropertyAccess(receiver: value, property: '__dartType'),
        EsmStringLiteral(tag),
      ),
    ]);
  }

  EsmExpression _lowerCoreRegExpTypeTest(EsmExpression value) {
    return _or(
      EsmBinary(
        left: value,
        operator: EsmBinaryOperator.instanceOf,
        right: const EsmIdentifier('RegExp'),
      ),
      _andAll([
        _notNull(value),
        _typeofEquals(value, 'object'),
        _typeofEquals(
          EsmPropertyAccess(receiver: value, property: '__dartRegExpMake'),
          'function',
        ),
      ]),
    );
  }

  EsmExpression _lowerCorePatternTypeTest(EsmExpression value) {
    return _or(
      _typeofEquals(value, 'string'),
      _or(
        _lowerCoreRegExpTypeTest(value),
        _andAll([
          _notNull(value),
          _typeofEquals(value, 'object'),
          _typeofEquals(
            EsmPropertyAccess(receiver: value, property: 'matchAsPrefix'),
            'function',
          ),
        ]),
      ),
    );
  }

  bool _isTopType(k.DartType type) {
    if (type is k.DynamicType || type is k.VoidType || type is k.InvalidType) {
      return true;
    }
    return type is k.InterfaceType &&
        type.classReference.toStringInternal() == 'dart:core::Object' &&
        type.declaredNullability == k.Nullability.nullable;
  }

  bool _isNullableType(k.DartType type) {
    return switch (type) {
      k.InterfaceType() => type.declaredNullability == k.Nullability.nullable,
      k.ExtensionType() => type.declaredNullability == k.Nullability.nullable,
      k.FunctionType() => type.declaredNullability == k.Nullability.nullable,
      k.RecordType() => type.declaredNullability == k.Nullability.nullable,
      k.NeverType() => type.declaredNullability == k.Nullability.nullable,
      _ => false,
    };
  }

  EsmExpression _typeofEquals(EsmExpression value, String name) {
    return _strictEquals(
      EsmUnary(operator: EsmUnaryOperator.typeOf, operand: value),
      EsmStringLiteral(name),
    );
  }

  EsmExpression _notNull(EsmExpression value) {
    return EsmBinary(
      left: value,
      operator: EsmBinaryOperator.looseNotEquals,
      right: const EsmNullLiteral(),
    );
  }

  EsmExpression _strictEquals(EsmExpression left, EsmExpression right) {
    return EsmBinary(
      left: left,
      operator: EsmBinaryOperator.strictEquals,
      right: right,
    );
  }

  EsmExpression _bigIntLiteral(int value) {
    return EsmCall(
      callee: const EsmIdentifier('BigInt'),
      arguments: [EsmNumberLiteral(value)],
    );
  }

  EsmExpression _mathTrunc(EsmExpression value) {
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Math'),
        property: 'trunc',
      ),
      arguments: [value],
    );
  }

  EsmExpression _mathRound(EsmExpression value) {
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Math'),
        property: 'round',
      ),
      arguments: [value],
    );
  }

  bool _isCoreCompareToTarget(String target) {
    return target == 'dart:core::Comparable::@methods::compareTo' ||
        target == 'dart:core::num::@methods::compareTo' ||
        target == 'dart:core::int::@methods::compareTo' ||
        target == 'dart:core::double::@methods::compareTo' ||
        target == 'dart:core::String::@methods::compareTo';
  }

  bool _isCoreStringTarget(String target) {
    return target.startsWith('dart:core::String::@methods::');
  }

  bool _isCoreHashCodeGetter(String target) {
    return target == 'dart:core::Object::@getters::hashCode' ||
        target == 'dart:core::String::@getters::hashCode' ||
        target == 'dart:core::bool::@getters::hashCode' ||
        target == 'dart:core::BigInt::@getters::hashCode' ||
        target == 'dart:core::Null::@getters::hashCode';
  }

  bool _isCoreRegExpMember(String target) {
    return target.startsWith('dart:core::RegExp::@');
  }

  bool _isCoreMatchMember(String target) {
    return target.startsWith('dart:core::Match::@') ||
        target.startsWith('dart:core::RegExpMatch::@');
  }

  bool _isStringLiteralArgument(k.Arguments arguments, int index) {
    return arguments.positional.length > index &&
        _isKnownStringExpression(arguments.positional[index]);
  }

  bool _isKnownStringExpression(k.Expression expression) {
    return switch (expression) {
      k.StringLiteral() => true,
      k.StringConcatenation() => expression.expressions.every(
        _isKnownStringExpression,
      ),
      k.ConditionalExpression() =>
        _isKnownStringExpression(expression.then) &&
            _isKnownStringExpression(expression.otherwise),
      k.Let() => _isKnownStringExpression(expression.body),
      _ => false,
    };
  }

  EsmExpression _andAll(List<EsmExpression> expressions) {
    if (expressions.isEmpty) {
      return const EsmBooleanLiteral(true);
    }
    return expressions
        .skip(1)
        .fold<EsmExpression>(
          expressions.first,
          (left, right) => EsmParenthesized(
            EsmBinary(
              left: left,
              operator: EsmBinaryOperator.logicalAnd,
              right: right,
            ),
          ),
        );
  }

  EsmExpression _orAll(List<EsmExpression> expressions) {
    if (expressions.isEmpty) {
      return const EsmBooleanLiteral(false);
    }
    return expressions
        .skip(1)
        .fold<EsmExpression>(
          expressions.first,
          (left, right) => EsmParenthesized(
            EsmBinary(
              left: left,
              operator: EsmBinaryOperator.logicalOr,
              right: right,
            ),
          ),
        );
  }

  EsmExpression _or(EsmExpression left, EsmExpression right) {
    return EsmParenthesized(
      EsmBinary(
        left: left,
        operator: EsmBinaryOperator.logicalOr,
        right: right,
      ),
    );
  }

  String _typeName(k.DartType type) {
    if (type is k.InterfaceType) {
      final path = type.classReference.toStringInternal();
      final separator = path.lastIndexOf('::');
      if (separator != -1) {
        return path.substring(separator + 2);
      }
    }
    return type.toString();
  }
}
