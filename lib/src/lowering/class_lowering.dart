part of 'kernel_to_esm_ast.dart';

extension _ClassLowering on Lowerer {
  List<EsmModuleItem> _lowerClassItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
  ) {
    final markerName = klass.interfaceMarkerName;
    return [
      if (markerName != null)
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(markerName),
          initializer: EsmCall(
            callee: const EsmIdentifier('Symbol'),
            arguments: [EsmStringLiteral(klass.node.name)],
          ),
          mutable: false,
        ),
      klass.node.isEnum
          ? _lowerEnumClass(semantic, helpers, klass)
          : _lowerClass(semantic, helpers, klass),
      for (final field in klass.staticFields)
        ..._lowerStaticFieldItems(semantic, helpers, klass, field),
      if (markerName != null) _lowerInterfaceHasInstance(klass, markerName),
    ];
  }

  EsmClass _lowerEnumClass(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
  ) {
    final interfaceMarkers = _interfaceMarkersForClass(semantic, klass);
    final enumIndex = r'$index';
    final enumName = r'$name';
    return EsmClass(
      name: klass.name,
      export: klass.export,
      superclass: null,
      constructor: EsmClassConstructor(
        parameters: [
          EsmIdentifierParameter(name: enumIndex),
          EsmIdentifierParameter(name: enumName),
          for (final field in klass.fields)
            EsmIdentifierParameter(name: field.name),
        ],
        body: [
          _lowerDefineProperty(
            const EsmThis(),
            'index',
            EsmIdentifier(enumIndex),
            enumerable: true,
          ),
          _lowerDefineProperty(
            const EsmThis(),
            '__dartEnumName',
            EsmIdentifier(enumName),
          ),
          _lowerDefineProperty(
            const EsmThis(),
            'name',
            EsmIdentifier(enumName),
            enumerable: true,
          ),
          for (final field in klass.fields)
            _lowerDefineProperty(
              const EsmThis(),
              field.name,
              EsmIdentifier(field.name),
              enumerable: true,
            ),
          ..._lowerInterfaceMarkerDefinitions(
            const EsmThis(),
            interfaceMarkers,
          ),
          const EsmExpressionStatement(
            EsmCall(
              callee: EsmPropertyAccess(
                receiver: EsmIdentifier('Object'),
                property: 'freeze',
              ),
              arguments: [EsmThis()],
            ),
          ),
        ],
      ),
      methods: [
        for (final procedure in klass.staticProcedures)
          if (procedure.node.kind != k.ProcedureKind.Factory ||
              procedure.node.name.text.isNotEmpty)
            _lowerClassProcedure(
              semantic,
              helpers,
              klass,
              procedure,
              isStatic: true,
            ),
        for (final procedure in klass.procedures)
          if (procedure.emit && procedure.node.name.text != '_enumToString')
            _lowerClassProcedure(semantic, helpers, klass, procedure),
        if (!_hasInstanceProcedure(klass, 'toString'))
          _lowerEnumToString(klass),
      ],
    );
  }

  EsmClassMethod _lowerEnumToString(EsmClassSymbol klass) {
    return EsmClassMethod(
      key: EsmStaticPropertyKey('toString'),
      kind: EsmClassMethodKind.method,
      isStatic: false,
      parameters: const [],
      body: [
        EsmReturnStatement(
          EsmStringConcatenation([
            EsmStringLiteral('${klass.node.name}.'),
            const EsmPropertyAccess(
              receiver: EsmThis(),
              property: '__dartEnumName',
            ),
          ]),
        ),
      ],
    );
  }

  bool _hasInstanceProcedure(EsmClassSymbol klass, String name) {
    return klass.procedures.any(
      (procedure) => procedure.emit && procedure.node.name.text == name,
    );
  }

  EsmExpressionStatement _lowerDefineProperty(
    EsmExpression receiver,
    String property,
    EsmExpression value, {
    bool enumerable = false,
  }) {
    return EsmExpressionStatement(
      EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Object'),
          property: 'defineProperty',
        ),
        arguments: [
          receiver,
          EsmStringLiteral(property),
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(key: 'value', value: value),
            EsmObjectLiteralProperty.static(
              key: 'enumerable',
              value: EsmBooleanLiteral(enumerable),
            ),
          ]),
        ],
      ),
    );
  }

  EsmClass _lowerClass(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
  ) {
    final superclass = klass.jsSuperclass == null
        ? null
        : semantic.classSymbolFor(klass.jsSuperclass!);
    if (klass.jsSuperclass != null && superclass == null) {
      throw UnsupportedCompilerFeature(
        klass.node,
        'class inheritance lowering',
      );
    }
    final unnamedConstructors = [
      for (final constructor in klass.constructors)
        if (constructor.name.isEmpty) constructor,
    ];
    if (unnamedConstructors.length > 1) {
      throw UnsupportedCompilerFeature(
        klass.node,
        'unnamed constructor lowering',
      );
    }
    final namedConstructors = [
      for (final constructor in klass.constructors)
        if (constructor.name.isNotEmpty) constructor,
    ];
    final unnamedFactories = [
      for (final procedure in klass.staticProcedures)
        if (procedure.node.kind == k.ProcedureKind.Factory &&
            procedure.node.name.text.isEmpty)
          procedure,
    ];
    if (unnamedFactories.length > 1) {
      throw UnsupportedCompilerFeature(klass.node, 'unnamed factory lowering');
    }
    final interfaceMarkers = _interfaceMarkersForClass(semantic, klass);
    final constructor = unnamedConstructors.isNotEmpty
        ? _lowerConstructor(
            semantic,
            helpers,
            unnamedConstructors.single,
            interfaceMarkers: interfaceMarkers,
          )
        : unnamedFactories.isNotEmpty
        ? _lowerFactoryConstructor(semantic, helpers, unnamedFactories.single)
        : namedConstructors.isNotEmpty
        ? _lowerMissingUnnamedConstructor(klass)
        : klass.fields.isNotEmpty || interfaceMarkers.isNotEmpty
        ? _lowerImplicitDefaultConstructor(
            semantic,
            helpers,
            klass,
            interfaceMarkers: interfaceMarkers,
          )
        : null;
    final methods = [
      for (final constructor in namedConstructors)
        _lowerNamedConstructor(
          semantic,
          helpers,
          constructor,
          interfaceMarkers: interfaceMarkers,
        ),
      for (final procedure in klass.staticProcedures)
        if (procedure.node.kind != k.ProcedureKind.Factory ||
            procedure.node.name.text.isNotEmpty)
          _lowerClassProcedure(
            semantic,
            helpers,
            klass,
            procedure,
            isStatic: true,
          ),
      for (final procedure in klass.procedures)
        if (procedure.emit)
          _lowerClassProcedure(semantic, helpers, klass, procedure),
    ];
    methods.addAll(
      _lowerInterfaceMethodBridges(semantic, helpers, klass, methods),
    );
    methods.addAll(_lowerDartConvertSuperclassBridges(klass, methods));
    methods.addAll(
      _lowerPublicMemberNameBridges(semantic, helpers, klass, methods),
    );
    methods.addAll(_lowerInheritedAccessorBridges(semantic, klass, methods));
    return EsmClass(
      name: klass.name,
      export: klass.export,
      superclass: superclass == null ? null : EsmIdentifier(superclass.name),
      constructor: constructor,
      methods: methods,
    );
  }

  List<EsmClassMethod> _lowerInterfaceMethodBridges(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    List<EsmClassMethod> methods,
  ) {
    final existing = {
      for (final method in methods)
        if (!method.isStatic) (method.name, method.kind),
    };
    final ownProcedures = [
      for (final procedure in klass.procedures)
        if (procedure.emit) procedure,
    ];
    final bridges = <EsmClassMethod>[];
    for (final interfaceClassNode in klass.interfaceMarkerClasses) {
      final interfaceClass = semantic.classSymbolFor(interfaceClassNode);
      if (interfaceClass == null) {
        continue;
      }
      for (final interfaceProcedure in interfaceClass.procedures) {
        final implementation = ownProcedures.where((procedure) {
          return procedure.kind == interfaceProcedure.kind &&
              _sameKernelName(
                procedure.node.name,
                interfaceProcedure.node.name,
              );
        }).firstOrNull;
        if (implementation == null ||
            implementation.name == interfaceProcedure.name) {
          continue;
        }
        final bridgeKey = (
          interfaceProcedure.name,
          _classMethodKind(interfaceProcedure),
        );
        if (!existing.add(bridgeKey)) {
          continue;
        }
        bridges.add(
          _lowerMemberForwardingBridge(
            semantic,
            helpers,
            interfaceProcedure.name,
            interfaceProcedure,
            implementation,
          ),
        );
      }
    }
    return bridges;
  }

  List<EsmClassMethod> _lowerDartConvertSuperclassBridges(
    EsmClassSymbol klass,
    List<EsmClassMethod> methods,
  ) {
    final existing = {
      for (final method in methods)
        if (!method.isStatic) (method.name, method.kind),
    };
    final bridges = <EsmClassMethod>[];
    void addBridge(String name, String accessor, String parameter) {
      if (!existing.add((name, EsmClassMethodKind.method))) {
        return;
      }
      bridges.add(
        EsmClassMethod(
          key: EsmStaticPropertyKey(name),
          kind: EsmClassMethodKind.method,
          isStatic: false,
          parameters: [EsmIdentifierParameter(name: parameter)],
          body: [
            EsmReturnStatement(
              EsmCall(
                callee: EsmPropertyAccess(
                  receiver: _memberAccess(const EsmThis(), accessor),
                  property: 'convert',
                ),
                arguments: [EsmIdentifier(parameter)],
              ),
            ),
          ],
        ),
      );
    }

    if (hasDartConvertBase(klass.node, const {'Codec', 'Encoding'})) {
      addBridge('encode', 'encoder', 'input');
      addBridge('decode', 'decoder', 'encoded');
    }
    if (hasDartConvertBase(klass.node, const {
      'StringConversionSink',
      'StringConversionSinkBase',
    })) {
      _addSinkAddBridge(existing, bridges, 'string');
    }
    if (hasDartConvertBase(klass.node, const {
      'ByteConversionSink',
      'ByteConversionSinkBase',
    })) {
      _addSinkAddBridge(existing, bridges, 'chunk');
      if (existing.add(('addSlice', EsmClassMethodKind.method))) {
        bridges.add(
          EsmClassMethod(
            key: EsmStaticPropertyKey('addSlice'),
            kind: EsmClassMethodKind.method,
            isStatic: false,
            parameters: const [
              EsmIdentifierParameter(name: 'chunk'),
              EsmIdentifierParameter(name: 'start'),
              EsmIdentifierParameter(name: 'end'),
              EsmIdentifierParameter(name: 'isLast'),
            ],
            body: [
              EsmExpressionStatement(
                EsmCall(
                  callee: _memberAccess(const EsmThis(), 'add'),
                  arguments: [
                    EsmCall(
                      callee: EsmPropertyAccess(
                        receiver: EsmCall(
                          callee: const EsmPropertyAccess(
                            receiver: EsmIdentifier('Array'),
                            property: 'from',
                          ),
                          arguments: [const EsmIdentifier('chunk')],
                        ),
                        property: 'slice',
                      ),
                      arguments: const [
                        EsmIdentifier('start'),
                        EsmIdentifier('end'),
                      ],
                    ),
                  ],
                ),
              ),
              EsmIfStatement(
                condition: const EsmIdentifier('isLast'),
                thenBody: [
                  EsmExpressionStatement(
                    EsmCall(
                      callee: _memberAccess(const EsmThis(), 'close'),
                      arguments: const [],
                    ),
                  ),
                ],
                otherwiseBody: null,
              ),
            ],
          ),
        );
      }
      if (existing.add(('addByte', EsmClassMethodKind.method))) {
        bridges.add(
          EsmClassMethod(
            key: EsmStaticPropertyKey('addByte'),
            kind: EsmClassMethodKind.method,
            isStatic: false,
            parameters: const [EsmIdentifierParameter(name: 'byte')],
            body: [
              EsmReturnStatement(
                EsmCall(
                  callee: _memberAccess(const EsmThis(), 'add'),
                  arguments: const [
                    EsmArrayLiteral([EsmIdentifier('byte')]),
                  ],
                ),
              ),
            ],
          ),
        );
      }
    }
    return bridges;
  }

  void _addSinkAddBridge(
    Set<(String, EsmClassMethodKind)> existing,
    List<EsmClassMethod> bridges,
    String parameter,
  ) {
    if (!existing.add(('add', EsmClassMethodKind.method))) {
      return;
    }
    bridges.add(
      EsmClassMethod(
        key: EsmStaticPropertyKey('add'),
        kind: EsmClassMethodKind.method,
        isStatic: false,
        parameters: [EsmIdentifierParameter(name: parameter)],
        body: [
          EsmReturnStatement(
            EsmCall(
              callee: _memberAccess(const EsmThis(), 'addSlice'),
              arguments: [
                EsmIdentifier(parameter),
                const EsmNumberLiteral(0),
                EsmPropertyAccess(
                  receiver: EsmIdentifier(parameter),
                  property: 'length',
                ),
                const EsmBooleanLiteral(false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  EsmClassMethodKind _classMethodKind(EsmClassProcedureSymbol procedure) {
    return switch (procedure.kind) {
      EsmProcedureKind.method => EsmClassMethodKind.method,
      EsmProcedureKind.getter => EsmClassMethodKind.getter,
      EsmProcedureKind.setter => EsmClassMethodKind.setter,
    };
  }

  List<EsmClassMethod> _lowerPublicMemberNameBridges(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    List<EsmClassMethod> methods,
  ) {
    final existing = {
      for (final method in methods)
        if (!method.isStatic) (method.name, method.kind),
    };
    final bridges = <EsmClassMethod>[];
    for (final procedure in klass.procedures) {
      if (!procedure.emit || procedure.node.name.isPrivate) {
        continue;
      }
      final publicName = procedure.node.name.text;
      final kind = _classMethodKind(procedure);
      if (procedure.name == publicName || !existing.add((publicName, kind))) {
        continue;
      }
      bridges.add(
        _lowerMemberForwardingBridge(
          semantic,
          helpers,
          publicName,
          procedure,
          procedure,
        ),
      );
    }
    return bridges;
  }

  EsmClassMethod _lowerMemberForwardingBridge(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    String bridgeName,
    EsmClassProcedureSymbol interfaceProcedure,
    EsmClassProcedureSymbol implementation,
  ) {
    final function = interfaceProcedure.node.function;
    final locals = <k.VariableDeclaration, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    return EsmClassMethod(
      key: EsmStaticPropertyKey(bridgeName),
      kind: _classMethodKind(interfaceProcedure),
      isStatic: false,
      parameters: parameters,
      body: switch (interfaceProcedure.kind) {
        EsmProcedureKind.method => [
          EsmReturnStatement(
            EsmCall(
              callee: _memberAccess(const EsmThis(), implementation.name),
              arguments: _bridgeArguments(function, locals),
            ),
          ),
        ],
        EsmProcedureKind.getter => [
          EsmReturnStatement(
            _memberAccess(const EsmThis(), implementation.name),
          ),
        ],
        EsmProcedureKind.setter => [
          EsmExpressionStatement(
            EsmAssignment(
              target: _memberAccess(const EsmThis(), implementation.name),
              value: EsmIdentifier(
                locals[function.positionalParameters.single]!,
              ),
            ),
          ),
        ],
      },
    );
  }

  List<EsmExpression> _bridgeArguments(
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
              key: parameter.name!,
              value: EsmIdentifier(locals[parameter]!),
            ),
        ]),
    ];
  }

  List<EsmClassMethod> _lowerInheritedAccessorBridges(
    Semantic semantic,
    EsmClassSymbol klass,
    List<EsmClassMethod> methods,
  ) {
    final instanceMethods = methods.where((method) => !method.isStatic);
    final ownMethods = {
      for (final method in instanceMethods)
        if (method.kind == EsmClassMethodKind.method) method.name,
    };
    final ownGetters = {
      for (final method in instanceMethods)
        if (method.kind == EsmClassMethodKind.getter) method.name,
    };
    final ownSetters = {
      for (final method in instanceMethods)
        if (method.kind == EsmClassMethodKind.setter) method.name,
    };
    final bridges = <EsmClassMethod>[];
    for (final name in ownSetters) {
      if (!ownMethods.contains(name) &&
          !ownGetters.contains(name) &&
          _hasInheritedInstanceAccessor(
            semantic,
            klass,
            name,
            EsmProcedureKind.getter,
          )) {
        bridges.add(_lowerInheritedGetterBridge(name));
      }
    }
    for (final name in ownGetters) {
      if (!ownMethods.contains(name) &&
          !ownSetters.contains(name) &&
          _hasInheritedInstanceAccessor(
            semantic,
            klass,
            name,
            EsmProcedureKind.setter,
          )) {
        bridges.add(_lowerInheritedSetterBridge(name));
      }
    }
    return bridges;
  }

  bool _hasInheritedInstanceAccessor(
    Semantic semantic,
    EsmClassSymbol klass,
    String name,
    EsmProcedureKind kind,
  ) {
    final seen = <k.Class>{};
    var superclassNode = klass.jsSuperclass;
    while (superclassNode != null && seen.add(superclassNode)) {
      final superclass = semantic.classSymbolFor(superclassNode);
      if (superclass == null) {
        return false;
      }
      if (superclass.procedures.any(
        (procedure) =>
            procedure.emit && procedure.name == name && procedure.kind == kind,
      )) {
        return true;
      }
      superclassNode = superclass.jsSuperclass;
    }
    return false;
  }

  EsmClassMethod _lowerInheritedGetterBridge(String name) {
    return EsmClassMethod(
      key: EsmStaticPropertyKey(name),
      kind: EsmClassMethodKind.getter,
      isStatic: false,
      parameters: const [],
      body: [EsmReturnStatement(_memberAccess(const EsmSuper(), name))],
    );
  }

  EsmClassMethod _lowerInheritedSetterBridge(String name) {
    return EsmClassMethod(
      key: EsmStaticPropertyKey(name),
      kind: EsmClassMethodKind.setter,
      isStatic: false,
      parameters: const [EsmIdentifierParameter(name: 'value')],
      body: [
        EsmExpressionStatement(
          EsmAssignment(
            target: _memberAccess(const EsmSuper(), name),
            value: const EsmIdentifier('value'),
          ),
        ),
      ],
    );
  }
}
