part of 'kernel_to_esm_ast.dart';

extension _ConstantLowering on Lowerer {
  EsmExpression _lowerConstantExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.ConstantExpression expression,
  ) {
    return _lowerConstant(semantic, helpers, expression.constant, expression);
  }

  EsmExpression _lowerConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    Object context,
  ) {
    if (constant is k.IntConstant) {
      return EsmNumberLiteral(constant.value);
    }
    if (constant is k.DoubleConstant) {
      return EsmNumberLiteral(constant.value);
    }
    if (constant is k.StringConstant) {
      return EsmStringLiteral(constant.value);
    }
    if (constant is k.BoolConstant) {
      return EsmBooleanLiteral(constant.value);
    }
    if (constant is k.NullConstant) {
      return const EsmNullLiteral();
    }
    if (constant is k.SymbolConstant) {
      return _lowerSymbolLiteral(
        helpers,
        constant.name,
        libraryReference: constant.libraryReference,
      );
    }
    if (constant is k.TypeLiteralConstant) {
      return _lowerTypeLiteral(helpers, constant.type);
    }
    if (constant is k.ListConstant) {
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'freeze',
          ),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.entries)
                _lowerConstant(semantic, helpers, entry, context),
            ]),
          ],
        ),
      );
    }
    if (constant is k.SetConstant) {
      helpers.require(EsmRuntimeHelper.constSet);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constSet),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.entries)
                _lowerConstant(semantic, helpers, entry, context),
            ]),
          ],
        ),
      );
    }
    if (constant is k.MapConstant) {
      helpers.require(EsmRuntimeHelper.constMap);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constMap),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.entries)
                EsmArrayLiteral([
                  _lowerConstant(semantic, helpers, entry.key, context),
                  _lowerConstant(semantic, helpers, entry.value, context),
                ]),
            ]),
          ],
        ),
      );
    }
    if (constant is k.RecordConstant) {
      helpers.require(EsmRuntimeHelper.record);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.record),
          arguments: [
            EsmArrayLiteral([
              for (final entry in constant.positional)
                _lowerConstant(semantic, helpers, entry, context),
            ]),
            EsmObjectLiteral([
              for (final entry in constant.named.entries)
                EsmObjectLiteralProperty.static(
                  key: entry.key,
                  value: _lowerConstant(
                    semantic,
                    helpers,
                    entry.value,
                    context,
                  ),
                ),
            ]),
          ],
        ),
      );
    }
    if (constant is k.StaticTearOffConstant) {
      final extensionTypeMember = semantic
          .extensionTypeMemberSymbolForReference(constant.targetReference);
      if (extensionTypeMember != null) {
        return EsmIdentifier(extensionTypeMember.backingName);
      }
      final sdkTearOff = _lowerSdkStaticTearOffConstant(
        helpers,
        constant.targetReference,
      );
      if (sdkTearOff != null) {
        return sdkTearOff;
      }
      final target = constant.targetReference.node;
      if (target is k.Procedure) {
        final symbol = semantic.symbolFor(target);
        if (symbol != null && symbol.kind == EsmProcedureKind.method) {
          return EsmIdentifier(symbol.name);
        }
        final staticSymbol =
            semantic.staticProcedureSymbolFor(target) ??
            semantic.staticProcedureSymbolForReference(
              constant.targetReference,
            );
        final staticClass = staticSymbol == null
            ? null
            : semantic.classSymbolFor(staticSymbol.node.enclosingClass!);
        if (staticSymbol != null &&
            staticClass != null &&
            staticSymbol.kind == EsmProcedureKind.method) {
          return EsmPropertyAccess(
            receiver: EsmIdentifier(staticClass.name),
            property: staticSymbol.name,
          );
        }
      }
      throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering ${kernelReferencePath(constant.targetReference)}',
      );
    }
    if (constant is k.ConstructorTearOffConstant ||
        constant is k.RedirectingFactoryTearOffConstant) {
      final target = switch (constant) {
        k.ConstructorTearOffConstant() => constant.target,
        k.RedirectingFactoryTearOffConstant() => constant.target,
        _ => throw UnsupportedCompilerFeature(
          context,
          'constructor tear-off constant lowering',
        ),
      };
      return _constructorTearOffReference(semantic, target);
    }
    if (constant is k.InstantiationConstant) {
      return _lowerConstant(
        semantic,
        helpers,
        constant.tearOffConstant,
        context,
      );
    }
    if (constant is k.TypedefTearOffConstant) {
      return _lowerConstant(
        semantic,
        helpers,
        constant.tearOffConstant,
        context,
      );
    }
    if (constant is k.InstanceConstant) {
      final sdkConstant = sdkIntrinsics.lowerInstanceConstant(
        constant,
        helpers,
      );
      if (sdkConstant != null) {
        return sdkConstant;
      }
      final convertConstant = _lowerDartConvertInstanceConstant(
        helpers,
        constant,
      );
      if (convertConstant != null) {
        return _lowerCanonicalConstant(helpers, constant, convertConstant);
      }
      final instance = _lowerInstanceConstant(
        semantic,
        helpers,
        constant,
        context,
      );
      return _lowerCanonicalConstant(helpers, constant, instance);
    }
    throw UnsupportedCompilerFeature(
      context,
      'constant expression lowering ${constant.runtimeType}',
    );
  }

  EsmExpression? _lowerSdkStaticTearOffConstant(
    EsmRuntimeHelperUseSet helpers,
    k.Reference reference,
  ) {
    final target = kernelReferencePath(reference);
    if (target ==
        'dart:collection::ListBase::@methods::dart:collection::_compareAny') {
      helpers.require(EsmRuntimeHelper.compare);
      return EsmArrowFunction(
        parameters: const [
          EsmIdentifierParameter(name: 'left'),
          EsmIdentifierParameter(name: 'right'),
        ],
        body: EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare),
          arguments: const [EsmIdentifier('left'), EsmIdentifier('right')],
        ),
      );
    }

    return sdkIntrinsics.lowerStaticTearOffConstant(reference: reference);
  }

  EsmExpression? _lowerDartConvertInstanceConstant(
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
  ) {
    final classPath = kernelReferencePath(constant.classReference);
    final expression = switch (classPath) {
      'dart:convert::Latin1Codec' => EsmCall(
        callee: const EsmIdentifier('__dartLatin1Codec'),
        arguments: [
          EsmBooleanLiteral(
            _constantBoolField(constant, 'allowInvalid') ?? false,
          ),
        ],
      ),
      'dart:convert::AsciiCodec' => EsmCall(
        callee: const EsmIdentifier('__dartAsciiCodec'),
        arguments: [
          EsmBooleanLiteral(
            _constantBoolField(constant, 'allowInvalid') ?? false,
          ),
        ],
      ),
      'dart:convert::Utf8Codec' => EsmCall(
        callee: const EsmIdentifier('__dartUtf8Codec'),
        arguments: [
          EsmBooleanLiteral(
            _constantBoolField(constant, 'allowMalformed') ?? false,
          ),
        ],
      ),
      'dart:convert::Utf8Encoder' => const EsmCall(
        callee: EsmIdentifier('__dartUtf8Encoder'),
        arguments: [],
      ),
      'dart:convert::Utf8Decoder' => EsmCall(
        callee: const EsmIdentifier('__dartUtf8Decoder'),
        arguments: [
          EsmBooleanLiteral(
            _constantBoolField(constant, 'allowMalformed') ?? false,
          ),
        ],
      ),
      'dart:convert::AsciiEncoder' => const EsmCall(
        callee: EsmIdentifier('__dartAsciiEncoder'),
        arguments: [],
      ),
      'dart:convert::AsciiDecoder' => EsmCall(
        callee: const EsmIdentifier('__dartAsciiDecoder'),
        arguments: [
          EsmBooleanLiteral(
            _constantBoolField(constant, 'allowInvalid') ?? false,
          ),
        ],
      ),
      'dart:convert::Latin1Encoder' => const EsmCall(
        callee: EsmIdentifier('__dartLatin1Encoder'),
        arguments: [],
      ),
      'dart:convert::Latin1Decoder' => EsmCall(
        callee: const EsmIdentifier('__dartLatin1Decoder'),
        arguments: [
          EsmBooleanLiteral(
            _constantBoolField(constant, 'allowInvalid') ?? false,
          ),
        ],
      ),
      'dart:convert::JsonEncoder' => EsmCall(
        callee: const EsmIdentifier('__dartJsonEncoder'),
        arguments: [
          if (_constantStringField(constant, 'indent') case final indent?)
            EsmStringLiteral(indent)
          else
            const EsmNullLiteral(),
          const EsmNullLiteral(),
        ],
      ),
      'dart:convert::JsonDecoder' => const EsmCall(
        callee: EsmIdentifier('__dartJsonDecoder'),
        arguments: [],
      ),
      'dart:convert::JsonCodec' => const EsmCall(
        callee: EsmIdentifier('__dartJsonCodec'),
        arguments: [],
      ),
      'dart:convert::JsonUtf8Encoder' => EsmCall(
        callee: const EsmIdentifier('__dartJsonUtf8Encoder'),
        arguments: [
          if (_constantStringField(constant, 'indent') case final indent?)
            EsmStringLiteral(indent)
          else
            const EsmNullLiteral(),
          const EsmNullLiteral(),
        ],
      ),
      'dart:convert::Base64Encoder' => EsmCall(
        callee: const EsmIdentifier('__dartBase64Encoder'),
        arguments: [EsmBooleanLiteral(_constantAnyBool(constant) ?? false)],
      ),
      'dart:convert::Base64Decoder' => const EsmCall(
        callee: EsmIdentifier('__dartBase64Decoder'),
        arguments: [],
      ),
      'dart:convert::Base64Codec' => EsmCall(
        callee: const EsmIdentifier('__dartBase64Codec'),
        arguments: [EsmBooleanLiteral(_constantAnyBool(constant) ?? false)],
      ),
      'dart:convert::LineSplitter' => const EsmCall(
        callee: EsmIdentifier('__dartLineSplitter'),
        arguments: [],
      ),
      'dart:convert::HtmlEscapeMode' => _lowerHtmlEscapeModeConstant(constant),
      'dart:convert::HtmlEscape' => EsmCall(
        callee: const EsmIdentifier('__dartHtmlEscape'),
        arguments: [
          if (_constantHtmlEscapeMode(constant) case final mode?)
            _lowerHtmlEscapeModeConstant(mode)
          else
            const EsmNullLiteral(),
        ],
      ),
      _ => null,
    };
    if (expression == null) return null;
    helpers.require(EsmRuntimeHelper.encoding);
    return expression;
  }

  EsmCall _lowerHtmlEscapeModeConstant(k.InstanceConstant constant) {
    return EsmCall(
      callee: const EsmIdentifier('__dartHtmlEscapeMode'),
      arguments: [
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'escapeLtGt',
            value: EsmBooleanLiteral(
              _constantBoolField(constant, 'escapeLtGt') ?? true,
            ),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeQuot',
            value: EsmBooleanLiteral(
              _constantBoolField(constant, 'escapeQuot') ?? true,
            ),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeApos',
            value: EsmBooleanLiteral(
              _constantBoolField(constant, 'escapeApos') ?? true,
            ),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeSlash',
            value: EsmBooleanLiteral(
              _constantBoolField(constant, 'escapeSlash') ?? true,
            ),
          ),
        ]),
      ],
    );
  }

  bool? _constantBoolField(k.InstanceConstant constant, String fieldName) {
    for (final entry in constant.fieldValues.entries) {
      if (kernelReferencePath(entry.key).contains(fieldName) &&
          entry.value is k.BoolConstant) {
        return (entry.value as k.BoolConstant).value;
      }
    }
    return null;
  }

  bool? _constantAnyBool(k.InstanceConstant constant) {
    for (final value in constant.fieldValues.values) {
      if (value is k.BoolConstant) return value.value;
    }
    return null;
  }

  String? _constantStringField(k.InstanceConstant constant, String fieldName) {
    for (final entry in constant.fieldValues.entries) {
      if (kernelReferencePath(entry.key).contains(fieldName) &&
          entry.value is k.StringConstant) {
        return (entry.value as k.StringConstant).value;
      }
    }
    return null;
  }

  k.InstanceConstant? _constantHtmlEscapeMode(k.InstanceConstant constant) {
    for (final value in constant.fieldValues.values) {
      if (value is k.InstanceConstant &&
          kernelReferencePath(value.classReference) ==
              'dart:convert::HtmlEscapeMode') {
        return value;
      }
    }
    return null;
  }

  EsmExpression _lowerSymbolLiteral(
    EsmRuntimeHelperUseSet helpers,
    String name, {
    k.Reference? libraryReference,
  }) {
    helpers.require(EsmRuntimeHelper.symbol);
    final key = libraryReference == null
        ? name
        : '${kernelReferencePath(libraryReference)}::$name';
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.symbol),
      arguments: [EsmStringLiteral(key), EsmStringLiteral(name)],
    );
  }

  EsmExpression _lowerTypeLiteral(
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
  ) {
    helpers.require(EsmRuntimeHelper.type);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.type),
      arguments: [EsmStringLiteral(_dartTypeName(type))],
    );
  }

  String _dartTypeName(k.DartType type) {
    return switch (type) {
      k.TypeParameterType() =>
        '${type.parameter.name ?? 'T'}${_nullabilitySuffix(type.declaredNullability)}',
      _ => type.toStringInternal(),
    };
  }

  String _nullabilitySuffix(k.Nullability nullability) {
    return switch (nullability) {
      k.Nullability.nullable => '?',
      k.Nullability.nonNullable || k.Nullability.undetermined => '',
    };
  }

  EsmExpression _lowerInstanceConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    final klass = constant.classReference.node;
    final mathConstant = _lowerDartMathInstanceConstant(
      semantic,
      helpers,
      constant,
      context,
    );
    if (mathConstant != null) {
      return mathConstant;
    }
    final coreConstant = _lowerDartCoreInstanceConstant(
      semantic,
      helpers,
      constant,
      context,
    );
    if (coreConstant != null) {
      return coreConstant;
    }
    final classPath = kernelReferencePath(constant.classReference);
    if (klass is! k.Class ||
        klass.enclosingLibrary.importUri.scheme == 'dart') {
      throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering $classPath',
      );
    }
    final symbol = semantic.classSymbolFor(klass);
    if (symbol == null) {
      throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering $classPath',
      );
    }
    final fields = <EsmObjectLiteralProperty>[];
    String? enumName;
    for (final entry in constant.fieldValues.entries) {
      final enumBackingName = klass.isEnum
          ? _enumBackingFieldName(entry.key)
          : null;
      if (enumBackingName != null) {
        final loweredValue = _lowerConstant(
          semantic,
          helpers,
          entry.value,
          context,
        );
        switch (enumBackingName) {
          case 'index':
            fields.add(
              EsmObjectLiteralProperty.static(
                key: 'index',
                value: loweredValue,
              ),
            );
          case '_name':
            enumName = entry.value is k.StringConstant
                ? (entry.value as k.StringConstant).value
                : null;
            fields.add(
              EsmObjectLiteralProperty.static(
                key: '__dartEnumName',
                value: loweredValue,
              ),
            );
            fields.add(
              EsmObjectLiteralProperty.static(key: 'name', value: loweredValue),
            );
          default:
            throw UnsupportedCompilerFeature(
              context,
              'constant expression lowering',
            );
        }
        continue;
      }
      final field = entry.key.node;
      if (field is! k.Field) {
        throw UnsupportedCompilerFeature(
          context,
          'constant expression lowering',
        );
      }
      final fieldSymbol = semantic.instanceFieldSymbolFor(field);
      if (fieldSymbol == null) {
        throw UnsupportedCompilerFeature(
          context,
          'constant expression lowering',
        );
      }
      fields.add(
        EsmObjectLiteralProperty.static(
          key: fieldSymbol.name,
          value: _lowerConstant(semantic, helpers, entry.value, context),
        ),
      );
    }
    if (klass.isEnum && enumName != null) {
      fields.add(
        EsmObjectLiteralProperty.static(
          key: 'toString',
          value: EsmFunctionExpression(
            parameters: const [],
            body: [
              EsmReturnStatement(EsmStringLiteral('${klass.name}.$enumName')),
            ],
          ),
        ),
      );
    }
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Object'),
        property: 'freeze',
      ),
      arguments: [
        EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'create',
          ),
          arguments: [
            EsmPropertyAccess(
              receiver: EsmIdentifier(symbol.name),
              property: 'prototype',
            ),
            EsmObjectLiteral([
              for (final field in fields)
                EsmObjectLiteralProperty(
                  key: field.key,
                  value: _constantPropertyDescriptor(field.value),
                ),
            ]),
          ],
        ),
      ],
    );
  }

  EsmObjectLiteral _constantPropertyDescriptor(EsmExpression value) {
    return EsmObjectLiteral([
      EsmObjectLiteralProperty.static(key: 'value', value: value),
      EsmObjectLiteralProperty.static(
        key: 'enumerable',
        value: const EsmBooleanLiteral(true),
      ),
    ]);
  }

  EsmExpression? _lowerDartCoreInstanceConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    if (kernelReferencePath(constant.classReference) == 'dart:core::Duration') {
      helpers.require(EsmRuntimeHelper.duration);
      for (final value in constant.fieldValues.values) {
        if (value is k.IntConstant) {
          return EsmCall(
            callee: helpers.reference(
              runtimeHelpers,
              EsmRuntimeHelper.duration,
            ),
            arguments: [
              EsmObjectLiteral([
                EsmObjectLiteralProperty.static(
                  key: 'microseconds',
                  value: EsmNumberLiteral(value.value),
                ),
              ]),
            ],
          );
        }
      }
      throw UnsupportedCompilerFeature(context, 'constant Duration lowering');
    }
    if (_isDartCoreObjectConstant(constant)) {
      return const EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier('Object'),
          property: 'freeze',
        ),
        arguments: [EsmObjectLiteral([])],
      );
    }
    final errorTypeName = _dartCoreErrorConstantTypeName(constant);
    if (errorTypeName != null) {
      helpers.require(EsmRuntimeHelper.coreError);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
        arguments: [
          EsmStringLiteral(errorTypeName),
          _lowerOptionalConstantField(
                semantic,
                helpers,
                constant,
                'message',
                context,
              ) ??
              const EsmNullLiteral(),
        ],
      );
    }
    return null;
  }

  String? _dartCoreErrorConstantTypeName(k.InstanceConstant constant) {
    final path = kernelReferencePath(constant.classReference);
    if (!path.startsWith('dart:core::')) {
      return null;
    }
    final typeName = path.substring('dart:core::'.length);
    return dartCoreErrorTypeNames.contains(typeName) ? typeName : null;
  }

  bool _isDartCoreObjectConstant(k.InstanceConstant constant) {
    return kernelReferencePath(constant.classReference) ==
            'dart:core::Object' &&
        constant.fieldValues.isEmpty;
  }

  EsmExpression? _lowerDartMathInstanceConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    final classPath = kernelReferencePath(constant.classReference);
    if (classPath == 'dart:math::Point') {
      helpers.require(EsmRuntimeHelper.mathPoint);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mathPoint),
        arguments: [
          _lowerConstantField(semantic, helpers, constant, 'x', context),
          _lowerConstantField(semantic, helpers, constant, 'y', context),
        ],
      );
    }
    if (classPath == 'dart:math::Rectangle') {
      helpers.require(EsmRuntimeHelper.mathRectangle);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mathRectangle,
        ),
        arguments: [
          _lowerConstantField(semantic, helpers, constant, 'left', context),
          _lowerConstantField(semantic, helpers, constant, 'top', context),
          _lowerConstantField(semantic, helpers, constant, 'width', context),
          _lowerConstantField(semantic, helpers, constant, 'height', context),
        ],
      );
    }
    return null;
  }

  EsmExpression _lowerConstantField(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    String fieldName,
    Object context,
  ) {
    for (final entry in constant.fieldValues.entries) {
      final path = kernelReferencePath(entry.key);
      if (path.endsWith('::@fields::$fieldName') ||
          path.endsWith('::$fieldName')) {
        return _lowerConstant(semantic, helpers, entry.value, context);
      }
    }
    throw UnsupportedCompilerFeature(context, 'constant expression lowering');
  }

  EsmExpression? _lowerOptionalConstantField(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    String fieldName,
    Object context,
  ) {
    for (final entry in constant.fieldValues.entries) {
      final path = kernelReferencePath(entry.key);
      if (path.endsWith('::@fields::$fieldName') ||
          path.endsWith('::$fieldName')) {
        return _lowerConstant(semantic, helpers, entry.value, context);
      }
    }
    return null;
  }

  String? _enumBackingFieldName(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (!path.contains('::_Enum::')) {
      return null;
    }
    if (path.endsWith('::index') || path.endsWith('::@fields::index')) {
      return 'index';
    }
    if (path.endsWith('::_name') || path.endsWith('::@fields::_name')) {
      return '_name';
    }
    return null;
  }

  EsmFunction _lowerConstructorTearOff(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmConstructorTearOffSymbol tearOff,
  ) {
    final target = tearOff.target;
    final function = target.function;
    if (function == null || function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(target, 'constructor tear-off lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    return EsmFunction(
      name: tearOff.name,
      export: false,
      parameters: parameters,
      body: [
        EsmReturnStatement(
          _lowerConstructorTearOffInvocation(
            semantic,
            target,
            function,
            locals,
          ),
        ),
      ],
    );
  }

  EsmExpression _constructorTearOffReference(
    Semantic semantic,
    k.Member target,
  ) {
    return EsmIdentifier(semantic.constructorTearOffSymbolFor(target).name);
  }

  EsmExpression _lowerConstructorTearOffInvocation(
    Semantic semantic,
    k.Member target,
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals,
  ) {
    final arguments = _forwardingArguments(function, locals);
    if (target is k.Constructor) {
      final klass = semantic.classSymbolFor(target.enclosingClass);
      final constructor = semantic.constructorSymbolFor(target);
      if (klass == null || constructor == null) {
        throw UnsupportedCompilerFeature(target, 'constructor tear-off target');
      }
      if (constructor.name.isEmpty) {
        return EsmNew(callee: EsmIdentifier(klass.name), arguments: arguments);
      }
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: constructor.name,
        ),
        arguments: arguments,
      );
    }
    if (target is k.Procedure &&
        target.kind == k.ProcedureKind.Factory &&
        target.enclosingClass != null) {
      final klass = semantic.classSymbolFor(target.enclosingClass!);
      final procedure = semantic.staticProcedureSymbolFor(target);
      if (klass == null || procedure == null) {
        throw UnsupportedCompilerFeature(target, 'constructor tear-off target');
      }
      if (target.name.text.isEmpty) {
        return EsmNew(callee: EsmIdentifier(klass.name), arguments: arguments);
      }
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: procedure.name,
        ),
        arguments: arguments,
      );
    }
    throw UnsupportedCompilerFeature(target, 'constructor tear-off target');
  }

  List<EsmExpression> _forwardingArguments(
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals,
  ) {
    return [
      for (final parameter in function.positionalParameters)
        EsmIdentifier(locals[parameter]!),
      if (function.namedParameters.isNotEmpty)
        EsmObjectLiteral([
          for (final parameter in function.namedParameters)
            EsmObjectLiteralProperty.static(
              key: parameter.name ?? 'arg',
              value: EsmIdentifier(locals[parameter]!),
            ),
        ]),
    ];
  }

  EsmExpression _lowerCanonicalConstant(
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    EsmExpression value,
  ) {
    helpers.require(EsmRuntimeHelper.constValue);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constValue),
      arguments: [
        EsmStringLiteral(_constantKey(constant)),
        EsmArrowFunction(parameters: const [], body: value),
      ],
    );
  }

  String _constantKey(k.Constant constant) {
    return jsonEncode(_constantKeyParts(constant));
  }

  Object? _constantKeyParts(k.Constant constant) {
    return switch (constant) {
      k.NullConstant() => const ['null'],
      k.BoolConstant() => ['bool', constant.value],
      k.IntConstant() => ['int', constant.value.toString()],
      k.DoubleConstant() => ['double', _doubleConstantKey(constant.value)],
      k.StringConstant() => ['string', constant.value],
      k.SymbolConstant() => [
        'symbol',
        constant.name,
        if (constant.libraryReference case final library?)
          _referenceKey(library),
      ],
      k.ListConstant() => [
        'list',
        constant.typeArgument.toString(),
        for (final entry in constant.entries) _constantKeyParts(entry),
      ],
      k.SetConstant() => [
        'set',
        constant.typeArgument.toString(),
        for (final entry in constant.entries) _constantKeyParts(entry),
      ],
      k.MapConstant() => [
        'map',
        constant.keyType.toString(),
        constant.valueType.toString(),
        for (final entry in constant.entries)
          [_constantKeyParts(entry.key), _constantKeyParts(entry.value)],
      ],
      k.RecordConstant() => [
        'record',
        for (final value in constant.positional) _constantKeyParts(value),
        for (final entry in constant.named.entries)
          ['named', entry.key, _constantKeyParts(entry.value)],
      ],
      k.InstanceConstant() when _isDartCoreObjectConstant(constant) => [
        'instance',
        'dart:core::Object',
      ],
      k.StaticTearOffConstant() => [
        'staticTearOff',
        _referenceKey(constant.targetReference),
      ],
      _ => [constant.runtimeType.toString(), constant.toString()],
    };
  }

  String _doubleConstantKey(double value) {
    if (value.isNaN) {
      return 'nan';
    }
    if (value == double.infinity) {
      return 'infinity';
    }
    if (value == double.negativeInfinity) {
      return '-infinity';
    }
    if (value == 0 && value.isNegative) {
      return '-0.0';
    }
    return value.toString();
  }

  String _referenceKey(k.Reference reference) {
    final path = kernelReferencePath(reference);
    final node = reference.node;
    if (node is k.Class && node.enclosingLibrary.importUri.scheme != 'dart') {
      return 'class:${node.name}';
    }
    if (node is k.Member && node.enclosingLibrary.importUri.scheme != 'dart') {
      final owner = node.enclosingClass?.name ?? '';
      return owner.isEmpty ? node.name.text : '$owner.${node.name.text}';
    }
    return path;
  }
}
