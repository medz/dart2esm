import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../foundation/kernel/kernel_references.dart';
import '../foundation/kernel/sdk_symbols.dart';
import '../foundation/names/js_names.dart';
import '../semantic/analysis/sdk_classification.dart';
import '../ast/esm_ast.dart';
import '../foundation/diagnostics/unsupported_compiler_feature.dart';
import '../runtime/runtime_helpers.dart';
import '../semantic/semantic_world.dart';
import 'intrinsics/sdk_intrinsics.dart';
import 'lowering_context.dart';

final class LowererReturn {
  LowererReturn({
    required this.semantic,
    required Iterable<EsmModuleItem> items,
    required Iterable<EsmRuntimeHelper> runtimeHelpers,
  }) : module = EsmModule(items: List.unmodifiable(items)),
       runtimeHelpers = List.unmodifiable(runtimeHelpers);

  final SemanticBuilderReturn semantic;
  final EsmModule module;
  final List<EsmRuntimeHelper> runtimeHelpers;
}

final class Lowerer {
  const Lowerer({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
    this.sdkIntrinsics = const DartSdkIntrinsicRegistry(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;
  final DartSdkIntrinsicRegistry sdkIntrinsics;

  LowererReturn lower(
    SemanticBuilderReturn semanticReturn, {
    required bool runMain,
  }) {
    final context = DartLoweringContext(
      semantic: semanticReturn.semantic,
      runtimeHelpers: runtimeHelpers,
    );
    final semantic = context.semantic;
    final helpers = context.helpers;
    final items = <EsmModuleItem>[
      for (final klass in semantic.classes)
        ..._lowerClassItems(semantic, helpers, klass),
      for (final extensionType in semantic.extensionTypes)
        ..._lowerExtensionTypeItems(semantic, helpers, extensionType),
      for (final field in semantic.fields)
        ..._lowerFieldItems(semantic, helpers, field),
      for (final procedure in semantic.procedures)
        _lowerProcedure(semantic, helpers, procedure),
      if (runMain)
        EsmExpressionStatement(
          EsmCall(
            callee: EsmIdentifier(
              semantic.symbolForRequired(semantic.main).name,
            ),
            arguments: const [],
          ),
        ),
    ];
    return LowererReturn(
      semantic: semanticReturn,
      items: items,
      runtimeHelpers: context.runtimeHelperUses,
    );
  }

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

  List<EsmModuleItem> _lowerExtensionTypeItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
  ) {
    return [
      _lowerExtensionTypeFacade(semantic, helpers, extensionType),
      for (final member in extensionType.members)
        ..._lowerExtensionTypeBackingItems(semantic, helpers, member),
    ];
  }

  EsmClass _lowerExtensionTypeFacade(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
  ) {
    final constructors = [
      for (final member in extensionType.members)
        if (member.descriptor.kind == k.ExtensionTypeMemberKind.Constructor &&
            member.descriptor.name.text.isEmpty)
          member,
    ];
    if (constructors.length > 1) {
      throw UnsupportedCompilerFeature(
        extensionType.node,
        'extension type constructor lowering',
      );
    }
    return EsmClass(
      name: extensionType.name,
      export: extensionType.export,
      superclass: null,
      constructor: constructors.isEmpty
          ? null
          : _lowerExtensionTypeFacadeConstructor(
              semantic,
              helpers,
              extensionType,
              constructors.single,
            ),
      methods: [
        for (final member in extensionType.members)
          ..._lowerExtensionTypeFacadeMethods(
            semantic,
            helpers,
            extensionType,
            member,
          ),
      ],
    );
  }

  EsmClassConstructor _lowerExtensionTypeFacadeConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
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
      skipReceiver: false,
    );
    return EsmClassConstructor(
      parameters: parameters,
      body: [
        EsmExpressionStatement(
          EsmAssignment(
            target: EsmPropertyAccess(
              receiver: const EsmThis(),
              property: extensionType.representationName,
            ),
            value: EsmCall(
              callee: EsmIdentifier(member.backingName),
              arguments: _extensionTypeFacadeArguments(
                procedure.function,
                locals,
                skipReceiver: false,
              ),
            ),
          ),
        ),
      ],
    );
  }

  List<EsmClassMethod> _lowerExtensionTypeFacadeMethods(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final descriptor = member.descriptor;
    return switch (descriptor.kind) {
      k.ExtensionTypeMemberKind.Constructor => const [],
      k.ExtensionTypeMemberKind.Field => [
        EsmClassMethod(
          key: EsmStaticPropertyKey(member.name),
          kind: EsmClassMethodKind.getter,
          isStatic: true,
          parameters: const [],
          body: [
            EsmReturnStatement(
              _lowerExtensionTypeFacadeReturn(
                semantic,
                helpers,
                _extensionTypeMemberType(member),
                EsmIdentifier(member.backingName),
              ),
            ),
          ],
        ),
        if (member.mutable)
          EsmClassMethod(
            key: EsmStaticPropertyKey(member.name),
            kind: EsmClassMethodKind.setter,
            isStatic: true,
            parameters: const [EsmIdentifierParameter(name: 'value')],
            body: [
              EsmReturnStatement(
                EsmAssignment(
                  target: EsmIdentifier(member.backingName),
                  value: _lowerExtensionTypeRepresentation(
                    helpers,
                    const EsmIdentifier('value'),
                    extensionType,
                  ),
                ),
              ),
            ],
          ),
      ],
      k.ExtensionTypeMemberKind.Factory ||
      k.ExtensionTypeMemberKind.RedirectingFactory ||
      k.ExtensionTypeMemberKind.Method ||
      k.ExtensionTypeMemberKind.Operator ||
      k.ExtensionTypeMemberKind.Getter ||
      k.ExtensionTypeMemberKind.Setter => [
        _lowerExtensionTypeFacadeProcedure(
          semantic,
          helpers,
          extensionType,
          member,
        ),
      ],
    };
  }

  EsmClassMethod _lowerExtensionTypeFacadeProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final procedure = _extensionTypeProcedure(member);
    final descriptor = member.descriptor;
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    final skipReceiver =
        !descriptor.isStatic &&
        descriptor.kind != k.ExtensionTypeMemberKind.Factory &&
        descriptor.kind != k.ExtensionTypeMemberKind.RedirectingFactory;
    final parameters = _bindExtensionTypeFacadeParameters(
      semantic,
      helpers,
      locals,
      usedNames,
      procedure.function,
      skipReceiver: skipReceiver,
    );
    final call = EsmCall(
      callee: EsmIdentifier(member.backingName),
      arguments: [
        if (skipReceiver)
          _lowerExtensionTypeRepresentation(
            helpers,
            const EsmThis(),
            extensionType,
          ),
        ..._extensionTypeFacadeArguments(
          procedure.function,
          locals,
          skipReceiver: skipReceiver,
        ),
      ],
    );
    final isSetter = descriptor.kind == k.ExtensionTypeMemberKind.Setter;
    return EsmClassMethod(
      key: EsmStaticPropertyKey(member.name),
      kind: switch (descriptor.kind) {
        k.ExtensionTypeMemberKind.Getter => EsmClassMethodKind.getter,
        k.ExtensionTypeMemberKind.Setter => EsmClassMethodKind.setter,
        _ => EsmClassMethodKind.method,
      },
      isStatic: descriptor.isStatic,
      parameters: parameters,
      body: [
        if (isSetter)
          EsmReturnStatement(call)
        else
          EsmReturnStatement(
            _lowerExtensionTypeFacadeReturn(
              semantic,
              helpers,
              procedure.function.returnType,
              call,
            ),
          ),
      ],
    );
  }

  List<EsmModuleItem> _lowerExtensionTypeBackingItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final node = member.memberReference?.node;
    return switch (node) {
      k.Field() => [
        _lowerExtensionTypeBackingField(semantic, helpers, member, node),
      ],
      k.Procedure() => [
        _lowerExtensionTypeBackingProcedure(semantic, helpers, member, node),
      ],
      _ => throw UnsupportedCompilerFeature(
        member.descriptor,
        'extension type member lowering',
      ),
    };
  }

  EsmVariableDeclaration _lowerExtensionTypeBackingField(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    k.Field field,
  ) {
    final initializer = field.initializer;
    return EsmVariableDeclaration(
      binding: EsmIdentifierBinding(member.backingName),
      initializer: initializer == null
          ? null
          : _lowerExpression(
              semantic,
              helpers,
              const <k.VariableDeclaration, String>{},
              initializer,
            ),
      mutable: member.mutable,
    );
  }

  EsmFunction _lowerExtensionTypeBackingProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    k.Procedure procedure,
  ) {
    if (procedure.function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(
        procedure.function,
        'async extension type member lowering',
      );
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedNames = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedNames,
      procedure.function,
    );
    final body = procedure.function.body;
    if (body == null) {
      if (procedure.function.positionalParameters.length == 1 &&
          member.descriptor.kind == k.ExtensionTypeMemberKind.Constructor) {
        return EsmFunction(
          name: member.backingName,
          export: false,
          parameters: parameters,
          body: [
            EsmReturnStatement(
              EsmIdentifier(
                locals[procedure.function.positionalParameters.single]!,
              ),
            ),
          ],
        );
      }
      throw UnsupportedCompilerFeature(
        procedure.function,
        'extension type member without body',
      );
    }
    return EsmFunction(
      name: member.backingName,
      export: false,
      parameters: parameters,
      body: _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  List<EsmParameter> _bindExtensionTypeFacadeParameters(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.FunctionNode function, {
    required bool skipReceiver,
  }) {
    final positional = skipReceiver
        ? function.positionalParameters.skip(1)
        : function.positionalParameters;
    return [
      for (final parameter in positional)
        _bindPositionalParameter(
          semantic,
          helpers,
          locals,
          usedParameters,
          parameter,
        ),
      if (function.namedParameters.isNotEmpty)
        EsmObjectPatternParameter(
          bindings: [
            for (final parameter in function.namedParameters)
              _bindNamedParameter(
                semantic,
                helpers,
                locals,
                usedParameters,
                parameter,
              ),
          ],
        ),
    ];
  }

  List<EsmExpression> _extensionTypeFacadeArguments(
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals, {
    required bool skipReceiver,
  }) {
    final positional = skipReceiver
        ? function.positionalParameters.skip(1)
        : function.positionalParameters;
    return [
      for (final parameter in positional) EsmIdentifier(locals[parameter]!),
      for (final parameter in function.namedParameters)
        EsmIdentifier(locals[parameter]!),
    ];
  }

  EsmExpression _lowerExtensionTypeFacadeReturn(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
    EsmExpression value,
  ) {
    final unaliased = type.unalias;
    if (unaliased is k.ExtensionType) {
      final symbol = semantic.extensionTypeSymbolFor(
        unaliased.extensionTypeDeclaration,
      );
      if (symbol != null) {
        return EsmNew(
          callee: EsmIdentifier(symbol.name),
          arguments: [
            _lowerExtensionTypeRepresentation(helpers, value, symbol),
          ],
        );
      }
    }
    return value;
  }

  EsmExpression _lowerExtensionTypeRepresentation(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression value,
    EsmExtensionTypeSymbol extensionType,
  ) {
    helpers.require(EsmRuntimeHelper.extensionTypeRep);
    return EsmCall(
      callee: helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.extensionTypeRep,
      ),
      arguments: [value, EsmStringLiteral(extensionType.representationName)],
    );
  }

  k.Procedure _extensionTypeProcedure(EsmExtensionTypeMemberSymbol member) {
    final node = member.memberReference?.node;
    if (node is k.Procedure) {
      return node;
    }
    throw UnsupportedCompilerFeature(
      member.descriptor,
      'extension type procedure',
    );
  }

  k.DartType _extensionTypeMemberType(EsmExtensionTypeMemberSymbol member) {
    final node = member.memberReference?.node;
    return switch (node) {
      k.Field() => node.type,
      k.Procedure() => node.function.returnType,
      _ => const k.DynamicType(),
    };
  }

  List<EsmModuleItem> _lowerStaticFieldItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    EsmStaticFieldSymbol field,
  ) {
    helpers.require(EsmRuntimeHelper.lazyField);
    final initializer = field.node.initializer;
    return [
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(field.backingName),
        initializer: EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.lazyField),
          arguments: [
            EsmStringLiteral('${klass.node.name}.${field.node.name.text}'),
            EsmArrowFunction(
              parameters: const [],
              body: initializer == null
                  ? const EsmNullLiteral()
                  : _lowerExpression(
                      semantic,
                      helpers,
                      const <k.VariableDeclaration, String>{},
                      initializer,
                    ),
            ),
            _lateWritableArgument(field.node.isFinal, field.mutable),
          ],
        ),
        mutable: false,
      ),
      EsmExpressionStatement(
        EsmCall(
          callee: const EsmPropertyAccess(
            receiver: EsmIdentifier('Object'),
            property: 'defineProperty',
          ),
          arguments: [
            EsmIdentifier(klass.name),
            EsmStringLiteral(field.name),
            EsmObjectLiteral([
              EsmObjectLiteralProperty.static(
                key: 'get',
                value: EsmFunctionExpression(
                  parameters: const [],
                  body: [
                    EsmReturnStatement(
                      EsmCall(
                        callee: EsmPropertyAccess(
                          receiver: EsmIdentifier(field.backingName),
                          property: 'get',
                        ),
                        arguments: const [],
                      ),
                    ),
                  ],
                ),
              ),
              EsmObjectLiteralProperty.static(
                key: 'set',
                value: EsmFunctionExpression(
                  parameters: const [EsmIdentifierParameter(name: 'value')],
                  body: [
                    EsmExpressionStatement(
                      EsmCall(
                        callee: EsmPropertyAccess(
                          receiver: EsmIdentifier(field.backingName),
                          property: 'set',
                        ),
                        arguments: const [EsmIdentifier('value')],
                      ),
                    ),
                  ],
                ),
              ),
              EsmObjectLiteralProperty.static(
                key: 'enumerable',
                value: EsmBooleanLiteral(true),
              ),
            ]),
          ],
        ),
      ),
    ];
  }

  EsmExpression _lateWritableArgument(bool isFinal, bool mutable) {
    if (isFinal) {
      return const EsmStringLiteral('once');
    }
    return EsmBooleanLiteral(mutable);
  }

  List<EsmStatement> _lowerLateInstanceFieldDefinitions(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmClassSymbol klass,
    EsmExpression receiver,
    Set<String> usedNames,
  ) {
    final statements = <EsmStatement>[];
    for (final field in klass.fields) {
      if (!field.node.isLate) {
        continue;
      }
      helpers.require(EsmRuntimeHelper.lazyField);
      final backingName = _freshIn(usedNames, '\$${field.name}');
      final initializer = field.node.initializer;
      statements.add(
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(backingName),
          initializer: EsmCall(
            callee: helpers.reference(
              runtimeHelpers,
              EsmRuntimeHelper.lazyField,
            ),
            arguments: [
              EsmStringLiteral('${klass.node.name}.${field.node.name.text}'),
              initializer == null
                  ? const EsmNullLiteral()
                  : EsmArrowFunction(
                      parameters: const [],
                      body: _lowerExpression(
                        semantic,
                        helpers,
                        locals,
                        initializer,
                        thisExpression: receiver,
                      ),
                    ),
              _lateWritableArgument(field.node.isFinal, field.node.hasSetter),
            ],
          ),
          mutable: false,
        ),
      );
      statements.add(
        EsmExpressionStatement(
          EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Object'),
              property: 'defineProperty',
            ),
            arguments: [
              receiver,
              EsmStringLiteral(field.name),
              EsmObjectLiteral([
                EsmObjectLiteralProperty.static(
                  key: 'get',
                  value: EsmFunctionExpression(
                    parameters: const [],
                    body: [
                      EsmReturnStatement(
                        EsmCall(
                          callee: EsmPropertyAccess(
                            receiver: EsmIdentifier(backingName),
                            property: 'get',
                          ),
                          arguments: const [],
                        ),
                      ),
                    ],
                  ),
                ),
                EsmObjectLiteralProperty.static(
                  key: 'set',
                  value: EsmFunctionExpression(
                    parameters: const [EsmIdentifierParameter(name: 'value')],
                    body: [
                      EsmExpressionStatement(
                        EsmCall(
                          callee: EsmPropertyAccess(
                            receiver: EsmIdentifier(backingName),
                            property: 'set',
                          ),
                          arguments: const [EsmIdentifier('value')],
                        ),
                      ),
                    ],
                  ),
                ),
                EsmObjectLiteralProperty.static(
                  key: 'enumerable',
                  value: EsmBooleanLiteral(true),
                ),
              ]),
            ],
          ),
        ),
      );
    }
    return statements;
  }

  List<EsmStatement> _lowerInstanceFieldInitializers(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmClassSymbol klass,
    EsmExpression receiver,
  ) {
    return [
      for (final field in klass.fields)
        if (!field.node.isLate)
          _lowerOwnDataPropertyDefinition(
            receiver,
            field.name,
            field.node.initializer == null
                ? const EsmNullLiteral()
                : _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    field.node.initializer!,
                    thisExpression: receiver,
                  ),
          ),
    ];
  }

  EsmExpressionStatement _lowerOwnDataPropertyDefinition(
    EsmExpression receiver,
    String property,
    EsmExpression value,
  ) {
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
              key: 'writable',
              value: EsmBooleanLiteral(true),
            ),
            EsmObjectLiteralProperty.static(
              key: 'enumerable',
              value: EsmBooleanLiteral(true),
            ),
            EsmObjectLiteralProperty.static(
              key: 'configurable',
              value: EsmBooleanLiteral(true),
            ),
          ]),
        ],
      ),
    );
  }

  EsmClassConstructor _lowerImplicitDefaultConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass, {
    List<String> interfaceMarkers = const [],
  }) {
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    return EsmClassConstructor(
      parameters: const [],
      body: [
        if (klass.jsSuperclass != null)
          const EsmExpressionStatement(
            EsmCall(callee: EsmSuper(), arguments: []),
          ),
        ..._lowerLateInstanceFieldDefinitions(
          semantic,
          helpers,
          locals,
          klass,
          const EsmThis(),
          usedNames,
        ),
        ..._lowerInstanceFieldInitializers(
          semantic,
          helpers,
          locals,
          klass,
          const EsmThis(),
        ),
        ..._lowerInterfaceMarkerDefinitions(const EsmThis(), interfaceMarkers),
      ],
    );
  }

  EsmExpressionStatement _lowerInterfaceHasInstance(
    EsmClassSymbol klass,
    String markerName,
  ) {
    return EsmExpressionStatement(
      EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Object'),
          property: 'defineProperty',
        ),
        arguments: [
          EsmIdentifier(klass.name),
          const EsmPropertyAccess(
            receiver: EsmIdentifier('Symbol'),
            property: 'hasInstance',
          ),
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(
              key: 'value',
              value: EsmFunctionExpression(
                parameters: const [EsmIdentifierParameter(name: 'value')],
                body: [
                  EsmReturnStatement(
                    EsmBinary(
                      left: EsmBinary(
                        left: const EsmIdentifier('value'),
                        operator: EsmBinaryOperator.looseNotEquals,
                        right: const EsmNullLiteral(),
                      ),
                      operator: EsmBinaryOperator.logicalAnd,
                      right: EsmParenthesized(
                        EsmBinary(
                          left: EsmCall(
                            callee: EsmPropertyAccess(
                              receiver: EsmPropertyAccess(
                                receiver: EsmIdentifier(klass.name),
                                property: 'prototype',
                              ),
                              property: 'isPrototypeOf',
                            ),
                            arguments: const [EsmIdentifier('value')],
                          ),
                          operator: EsmBinaryOperator.logicalOr,
                          right: EsmBinary(
                            left: EsmComputedPropertyAccess(
                              receiver: const EsmIdentifier('value'),
                              property: EsmIdentifier(markerName),
                            ),
                            operator: EsmBinaryOperator.strictEquals,
                            right: const EsmBooleanLiteral(true),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ]),
        ],
      ),
    );
  }

  List<String> _interfaceMarkersForClass(
    Semantic semantic,
    EsmClassSymbol klass,
  ) {
    return [
      for (final interfaceClass in klass.interfaceMarkerClasses)
        if (semantic.classSymbolFor(interfaceClass)?.interfaceMarkerName
            case final markerName?)
          markerName,
    ];
  }

  List<EsmStatement> _lowerInterfaceMarkerDefinitions(
    EsmExpression receiver,
    List<String> markerNames,
  ) {
    return [
      for (final markerName in markerNames)
        EsmExpressionStatement(
          EsmCall(
            callee: const EsmPropertyAccess(
              receiver: EsmIdentifier('Object'),
              property: 'defineProperty',
            ),
            arguments: [
              receiver,
              EsmIdentifier(markerName),
              EsmObjectLiteral([
                EsmObjectLiteralProperty.static(
                  key: 'value',
                  value: EsmBooleanLiteral(true),
                ),
              ]),
            ],
          ),
        ),
    ];
  }

  EsmClassConstructor _lowerMissingUnnamedConstructor(EsmClassSymbol klass) {
    return EsmClassConstructor(
      parameters: const [],
      body: [
        EsmThrowStatement(
          EsmNew(
            callee: const EsmIdentifier('TypeError'),
            arguments: [
              EsmStringLiteral(
                'Class ${klass.node.name} has no unnamed constructor',
              ),
            ],
          ),
        ),
      ],
    );
  }

  EsmClassConstructor _lowerFactoryConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmStaticProcedureSymbol procedure,
  ) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async factory lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    if (body == null) {
      throw UnsupportedCompilerFeature(function, 'factory without body');
    }
    return EsmClassConstructor(
      parameters: parameters,
      body: _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  EsmClassConstructor _lowerConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmConstructorSymbol constructor, {
    List<String> interfaceMarkers = const [],
  }) {
    assert(constructor.name.isEmpty);
    final klass = semantic.classSymbolFor(constructor.node.enclosingClass);
    if (klass == null) {
      throw UnsupportedCompilerFeature(constructor.node, 'constructor class');
    }
    final function = constructor.node.function;
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final redirectingInitializer = _redirectingInitializer(constructor);
    if (redirectingInitializer != null) {
      return EsmClassConstructor(
        parameters: parameters,
        body: [
          EsmReturnStatement(
            _lowerRedirectingAllocation(
              semantic,
              helpers,
              locals,
              redirectingInitializer,
              const EsmNewTarget(),
            ),
          ),
        ],
      );
    }
    final superInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is k.SuperInitializer) initializer,
    ];
    final factorySuperInitializers = [
      for (final initializer in superInitializers)
        if (_isFactorySuperInitializer(semantic, initializer)) initializer,
    ];
    if (factorySuperInitializers.length > 1) {
      throw UnsupportedCompilerFeature(
        constructor.node,
        'multiple factory super initializers',
      );
    }
    final otherInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is! k.SuperInitializer) initializer,
    ];
    if (factorySuperInitializers case [final superInitializer]) {
      final selfName = _freshLocalName(semantic, usedParameters, r'$self');
      usedParameters.add(selfName);
      final self = EsmIdentifier(selfName);
      final body = <EsmStatement>[
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(selfName),
          initializer: _lowerSuperFactoryAllocation(
            semantic,
            helpers,
            locals,
            superInitializer,
            const EsmNewTarget(),
          ),
          mutable: false,
        ),
        ..._lowerLateInstanceFieldDefinitions(
          semantic,
          helpers,
          locals,
          klass,
          self,
          usedParameters,
        ),
        ..._lowerInstanceFieldInitializers(
          semantic,
          helpers,
          locals,
          klass,
          self,
        ),
        for (final initializer in otherInitializers)
          ..._lowerConstructorInitializer(
            semantic,
            helpers,
            locals,
            initializer,
            self,
          ),
        if (function.body case final body?) ...[
          ..._lowerStatementList(
            semantic,
            helpers,
            locals,
            labels,
            body,
            thisExpression: self,
          ),
        ],
        ..._lowerInterfaceMarkerDefinitions(self, interfaceMarkers),
        EsmReturnStatement(self),
      ];
      return EsmClassConstructor(parameters: parameters, body: body);
    }
    final superInitializerStatements = [
      for (final initializer in superInitializers)
        ..._lowerSuperInitializer(semantic, helpers, locals, initializer),
    ];
    final needsImplicitSuperCall =
        superInitializerStatements.isEmpty && klass.jsSuperclass != null;
    final body = <EsmStatement>[
      if (needsImplicitSuperCall)
        const EsmExpressionStatement(
          EsmCall(callee: EsmSuper(), arguments: []),
        ),
      ...superInitializerStatements,
      ..._lowerLateInstanceFieldDefinitions(
        semantic,
        helpers,
        locals,
        klass,
        const EsmThis(),
        usedParameters,
      ),
      ..._lowerInstanceFieldInitializers(
        semantic,
        helpers,
        locals,
        klass,
        const EsmThis(),
      ),
      for (final initializer in otherInitializers)
        ..._lowerConstructorInitializer(
          semantic,
          helpers,
          locals,
          initializer,
          const EsmThis(),
        ),
      if (function.body case final body?) ...[
        ..._lowerStatementList(semantic, helpers, locals, labels, body),
      ],
      ..._lowerInterfaceMarkerDefinitions(const EsmThis(), interfaceMarkers),
    ];
    return EsmClassConstructor(parameters: parameters, body: body);
  }

  EsmClassMethod _lowerNamedConstructor(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmConstructorSymbol constructor, {
    List<String> interfaceMarkers = const [],
  }) {
    final klass = semantic.classSymbolFor(constructor.node.enclosingClass);
    if (klass == null) {
      throw UnsupportedCompilerFeature(constructor.node, 'constructor class');
    }
    final function = constructor.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async constructor lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedNames = <String>{};
    final selfName = _freshIn(usedNames, r'$self');
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedNames,
      function,
    );
    final redirectingInitializer = _redirectingInitializer(constructor);
    if (redirectingInitializer != null) {
      return EsmClassMethod(
        key: EsmStaticPropertyKey(constructor.name),
        kind: EsmClassMethodKind.method,
        isStatic: true,
        parameters: parameters,
        body: [
          EsmReturnStatement(
            _lowerRedirectingAllocation(
              semantic,
              helpers,
              locals,
              redirectingInitializer,
              const EsmThis(),
            ),
          ),
        ],
      );
    }
    final self = EsmIdentifier(selfName);
    final superInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is k.SuperInitializer) initializer,
    ];
    if (superInitializers.length > 1) {
      throw UnsupportedCompilerFeature(
        constructor.node,
        'multiple super initializers',
      );
    }
    final otherInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is! k.SuperInitializer) initializer,
    ];
    final allocation = superInitializers.isEmpty
        ? _lowerObjectCreate(const EsmThis())
        : _lowerSuperFactoryAllocation(
            semantic,
            helpers,
            locals,
            superInitializers.single,
            const EsmThis(),
          );
    final body = <EsmStatement>[
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(selfName),
        initializer: allocation,
        mutable: false,
      ),
      ..._lowerLateInstanceFieldDefinitions(
        semantic,
        helpers,
        locals,
        klass,
        self,
        usedNames,
      ),
      ..._lowerInstanceFieldInitializers(
        semantic,
        helpers,
        locals,
        klass,
        self,
      ),
      for (final initializer in otherInitializers)
        ..._lowerConstructorInitializer(
          semantic,
          helpers,
          locals,
          initializer,
          self,
        ),
      if (function.body case final body?) ...[
        ..._lowerStatementList(
          semantic,
          helpers,
          locals,
          labels,
          body,
          thisExpression: self,
        ),
      ],
      ..._lowerInterfaceMarkerDefinitions(self, interfaceMarkers),
      EsmReturnStatement(self),
    ];
    return EsmClassMethod(
      key: EsmStaticPropertyKey(constructor.name),
      kind: EsmClassMethodKind.method,
      isStatic: true,
      parameters: parameters,
      body: body,
    );
  }

  k.RedirectingInitializer? _redirectingInitializer(
    EsmConstructorSymbol constructor,
  ) {
    k.RedirectingInitializer? redirectingInitializer;
    for (final initializer in constructor.node.initializers) {
      if (initializer is! k.RedirectingInitializer) {
        continue;
      }
      if (redirectingInitializer != null) {
        throw UnsupportedCompilerFeature(
          initializer,
          'multiple redirecting calls',
        );
      }
      redirectingInitializer = initializer;
    }
    if (redirectingInitializer != null &&
        constructor.node.initializers.length != 1) {
      throw UnsupportedCompilerFeature(
        constructor.node,
        'redirecting constructor initializers',
      );
    }
    return redirectingInitializer;
  }

  EsmExpression _lowerRedirectingAllocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.RedirectingInitializer initializer,
    EsmExpression newTarget,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'redirecting initializer arguments',
      );
    }
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      throw UnsupportedCompilerFeature(initializer, 'redirecting initializer');
    }
    return _lowerConstructorAllocation(
      semantic,
      helpers,
      locals,
      target,
      initializer.arguments,
      newTarget,
      initializer,
      'redirecting initializer',
    );
  }

  bool _isFactorySuperInitializer(
    Semantic semantic,
    k.SuperInitializer initializer,
  ) {
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      return false;
    }
    final resolvedTarget = _resolveEmittableConstructorTarget(semantic, target);
    return resolvedTarget != null &&
        semantic.constructorSymbolFor(resolvedTarget)?.name.isNotEmpty == true;
  }

  EsmExpression _lowerObjectCreate(EsmExpression newTarget) {
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Object'),
        property: 'create',
      ),
      arguments: [
        EsmPropertyAccess(receiver: newTarget, property: 'prototype'),
      ],
    );
  }

  EsmExpression _lowerSuperFactoryAllocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
    EsmExpression newTarget,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer arguments',
      );
    }
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      if (initializer.arguments.positional.isEmpty &&
          initializer.arguments.named.isEmpty) {
        return _lowerObjectCreate(newTarget);
      }
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer target ${kernelReferencePath(initializer.targetReference)}',
      );
    }
    final resolvedTarget = _resolveEmittableConstructorTarget(semantic, target);
    if (resolvedTarget == null) {
      if (initializer.arguments.positional.isEmpty &&
          initializer.arguments.named.isEmpty) {
        return _lowerObjectCreate(newTarget);
      }
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer target ${kernelReferencePath(initializer.targetReference)}',
      );
    }
    return _lowerConstructorAllocation(
      semantic,
      helpers,
      locals,
      resolvedTarget,
      initializer.arguments,
      newTarget,
      initializer,
      'super initializer target',
    );
  }

  EsmExpression _lowerConstructorAllocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Constructor target,
    k.Arguments argumentsNode,
    EsmExpression newTarget,
    k.TreeNode contextNode,
    String context,
  ) {
    final resolvedTarget = _resolveEmittableConstructorTarget(semantic, target);
    if (resolvedTarget == null) {
      throw UnsupportedCompilerFeature(
        contextNode,
        '$context ${kernelReferencePath(target.reference)}',
      );
    }
    final constructor = semantic.constructorSymbolFor(resolvedTarget)!;
    final klass = semantic.classSymbolFor(resolvedTarget.enclosingClass)!;
    final arguments = _lowerArguments(
      semantic,
      helpers,
      locals,
      argumentsNode,
      contextNode: contextNode,
      context: context,
    );
    if (constructor.name.isEmpty) {
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Reflect'),
          property: 'construct',
        ),
        arguments: [
          EsmIdentifier(klass.name),
          EsmArrayLiteral(arguments),
          newTarget,
        ],
      );
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: EsmPropertyAccess(
          receiver: EsmIdentifier(klass.name),
          property: constructor.name,
        ),
        property: 'call',
      ),
      arguments: [newTarget, ...arguments],
    );
  }

  List<EsmStatement> _lowerConstructorInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Initializer initializer,
    EsmExpression receiver,
  ) {
    return switch (initializer) {
      k.FieldInitializer() => [
        _lowerOwnDataPropertyDefinition(
          receiver,
          _instanceFieldName(semantic, initializer.field),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            initializer.value,
            thisExpression: receiver,
          ),
        ),
      ],
      k.AssertInitializer() => const [],
      _ => throw UnsupportedCompilerFeature(
        initializer,
        'constructor initializer lowering',
      ),
    };
  }

  List<EsmStatement> _lowerSuperInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'super initializer arguments',
      );
    }
    final coreErrorInitializer = _lowerCoreErrorSuperInitializer(
      semantic,
      helpers,
      locals,
      initializer,
      const EsmThis(),
    );
    if (coreErrorInitializer != null) {
      return coreErrorInitializer;
    }
    final target = initializer.targetReference.node;
    if (target is k.Constructor &&
        _resolveEmittableConstructorTarget(semantic, target) != null) {
      return [
        EsmExpressionStatement(
          EsmCall(
            callee: const EsmSuper(),
            arguments: _lowerArguments(
              semantic,
              helpers,
              locals,
              initializer.arguments,
              contextNode: initializer,
              context: 'super initializer arguments',
            ),
          ),
        ),
      ];
    }
    if (initializer.arguments.positional.isEmpty) {
      return const [];
    }
    throw UnsupportedCompilerFeature(initializer, 'super initializer lowering');
  }

  List<EsmStatement>? _lowerCoreErrorSuperInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
    EsmExpression receiver,
  ) {
    final typeName = dartCoreErrorConstructorName(initializer.targetReference);
    if (typeName == null) {
      return null;
    }
    if (initializer.arguments.named.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        initializer,
        'core error super initializer arguments',
      );
    }
    final positional = initializer.arguments.positional;
    final message = positional.isEmpty
        ? const EsmStringLiteral('')
        : _lowerExpression(semantic, helpers, locals, positional.first);
    return [
      _lowerOwnDataPropertyDefinition(
        receiver,
        '__dartCoreErrorType',
        EsmStringLiteral(typeName),
      ),
      _lowerOwnDataPropertyDefinition(
        receiver,
        'name',
        EsmStringLiteral(typeName),
      ),
      _lowerOwnDataPropertyDefinition(receiver, 'message', message),
      if (typeName == 'FormatException') ...[
        _lowerOwnDataPropertyDefinition(
          receiver,
          'source',
          positional.length > 1
              ? _lowerExpression(semantic, helpers, locals, positional[1])
              : const EsmNullLiteral(),
        ),
        _lowerOwnDataPropertyDefinition(
          receiver,
          'offset',
          positional.length > 2
              ? _lowerExpression(semantic, helpers, locals, positional[2])
              : const EsmNullLiteral(),
        ),
      ],
      _lowerOwnDataPropertyDefinition(
        receiver,
        'toString',
        EsmFunctionExpression(
          parameters: const [],
          body: [
            EsmReturnStatement(
              EsmConditional(
                condition: EsmBinary(
                  left: const EsmPropertyAccess(
                    receiver: EsmThis(),
                    property: 'message',
                  ),
                  operator: EsmBinaryOperator.strictEquals,
                  right: const EsmStringLiteral(''),
                ),
                thenExpression: const EsmPropertyAccess(
                  receiver: EsmThis(),
                  property: 'name',
                ),
                otherwiseExpression: EsmStringConcatenation([
                  const EsmPropertyAccess(
                    receiver: EsmThis(),
                    property: 'name',
                  ),
                  const EsmStringLiteral(': '),
                  const EsmPropertyAccess(
                    receiver: EsmThis(),
                    property: 'message',
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    ];
  }

  k.Constructor? _resolveEmittableConstructorTarget(
    Semantic semantic,
    k.Constructor target,
  ) {
    if (semantic.constructorSymbolFor(target) != null &&
        semantic.classSymbolFor(target.enclosingClass) != null) {
      return target;
    }

    final visited = <k.Class>{};
    var current = target.enclosingClass;
    while (current.isAnonymousMixin) {
      if (!visited.add(current)) {
        throw UnsupportedCompilerFeature(
          target,
          'cyclic anonymous mixin constructor hierarchy',
        );
      }
      final superclass = _localSuperclass(current);
      if (superclass == null) {
        return null;
      }
      final candidate = _constructorNamed(superclass, target.name);
      if (candidate != null &&
          semantic.constructorSymbolFor(candidate) != null &&
          semantic.classSymbolFor(candidate.enclosingClass) != null) {
        return candidate;
      }
      current = superclass;
    }
    return null;
  }

  k.Class? _localSuperclass(k.Class klass) {
    final supertype = klass.supertype;
    if (supertype == null ||
        isKernelCoreClassReference(supertype.className, 'Object') ||
        isDartSdkReference(supertype.className)) {
      return null;
    }
    final node = supertype.className.node;
    return node is k.Class ? node : null;
  }

  k.Constructor? _constructorNamed(k.Class klass, k.Name name) {
    for (final constructor in klass.constructors) {
      if (_sameKernelName(constructor.name, name)) {
        return constructor;
      }
    }
    return null;
  }

  bool _sameKernelName(k.Name left, k.Name right) {
    return left.text == right.text &&
        left.libraryReference == right.libraryReference;
  }

  EsmClassMethod _lowerClassProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    EsmClassProcedureSymbol procedure, {
    bool isStatic = false,
  }) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async function lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    return EsmClassMethod(
      key: EsmStaticPropertyKey(procedure.name),
      kind: switch (procedure.kind) {
        EsmProcedureKind.method => EsmClassMethodKind.method,
        EsmProcedureKind.getter => EsmClassMethodKind.getter,
        EsmProcedureKind.setter => EsmClassMethodKind.setter,
      },
      isStatic: isStatic,
      parameters: parameters,
      body: body == null
          ? _lowerAbstractMemberBody(klass, procedure)
          : _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  List<EsmStatement> _lowerAbstractMemberBody(
    EsmClassSymbol klass,
    EsmClassProcedureSymbol procedure,
  ) {
    return [
      EsmThrowStatement(
        EsmNew(
          callee: const EsmIdentifier('TypeError'),
          arguments: [
            EsmStringLiteral(
              'Abstract member ${klass.node.name}.${procedure.node.name.text}',
            ),
          ],
        ),
      ),
    ];
  }

  List<EsmModuleItem> _lowerFieldItems(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmFieldSymbol field,
  ) {
    if (field.node.isLate) {
      helpers.require(EsmRuntimeHelper.lazyField);
      final initializer = field.node.initializer;
      return [
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(field.name),
          initializer: null,
          mutable: true,
          export: field.export,
        ),
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(field.backingName!),
          initializer: EsmCall(
            callee: helpers.reference(
              runtimeHelpers,
              EsmRuntimeHelper.lazyField,
            ),
            arguments: [
              EsmStringLiteral(field.node.name.text),
              initializer == null
                  ? const EsmNullLiteral()
                  : EsmArrowFunction(
                      parameters: const [],
                      body: _lowerExpression(
                        semantic,
                        helpers,
                        const <k.VariableDeclaration, String>{},
                        initializer,
                      ),
                    ),
              _lateWritableArgument(field.node.isFinal, field.mutable),
              EsmArrowFunction(
                parameters: const [EsmIdentifierParameter(name: 'value')],
                body: EsmAssignment(
                  target: EsmIdentifier(field.name),
                  value: const EsmIdentifier('value'),
                ),
              ),
            ],
          ),
          mutable: false,
        ),
      ];
    }
    final initializer = field.node.initializer;
    return [
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(field.name),
        initializer: initializer == null
            ? null
            : _lowerExpression(
                semantic,
                helpers,
                const <k.VariableDeclaration, String>{},
                initializer,
              ),
        mutable: field.mutable,
        export: field.export,
      ),
    ];
  }

  EsmFunction _lowerProcedure(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    EsmProcedureSymbol procedure,
  ) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(function, 'async function lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      semantic,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    if (body == null) {
      throw UnsupportedCompilerFeature(function, 'procedure without body');
    }
    return EsmFunction(
      name: procedure.name,
      export: procedure.export,
      parameters: parameters,
      body: _lowerStatementList(semantic, helpers, locals, labels, body),
    );
  }

  List<EsmParameter> _bindParameters(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.FunctionNode function,
  ) {
    return [
      for (final parameter in function.positionalParameters)
        _bindPositionalParameter(
          semantic,
          helpers,
          locals,
          usedParameters,
          parameter,
        ),
      if (function.namedParameters.isNotEmpty)
        EsmObjectPatternParameter(
          bindings: [
            for (final parameter in function.namedParameters)
              _bindNamedParameter(
                semantic,
                helpers,
                locals,
                usedParameters,
                parameter,
              ),
          ],
        ),
    ];
  }

  EsmIdentifierParameter _bindPositionalParameter(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.VariableDeclaration parameter,
  ) {
    final original = parameter.name ?? 'arg';
    final name = _freshParameterName(semantic, usedParameters, original);
    locals[parameter] = name;
    final initializer = parameter.initializer;
    return EsmIdentifierParameter(
      name: name,
      defaultValue: initializer == null
          ? null
          : _lowerExpression(semantic, helpers, locals, initializer),
    );
  }

  EsmObjectPatternBinding _bindNamedParameter(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.VariableDeclaration parameter,
  ) {
    final original = parameter.name ?? 'arg';
    final name = _freshParameterName(semantic, usedParameters, original);
    locals[parameter] = name;
    final initializer = parameter.initializer;
    return EsmObjectPatternBinding(
      property: original,
      name: name,
      defaultValue: initializer == null
          ? parameter.isRequired
                ? null
                : const EsmNullLiteral()
          : _lowerExpression(semantic, helpers, locals, initializer),
    );
  }

  List<EsmExpression> _lowerArguments(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments, {
    EsmExpression thisExpression = const EsmThis(),
    required k.TreeNode contextNode,
    required String context,
  }) {
    return [
      for (final argument in arguments.positional)
        _lowerExpression(
          semantic,
          helpers,
          locals,
          argument,
          thisExpression: thisExpression,
        ),
      if (arguments.named.isNotEmpty)
        EsmObjectLiteral([
          for (final argument in arguments.named)
            EsmObjectLiteralProperty.static(
              key: argument.name,
              value: _lowerExpression(
                semantic,
                helpers,
                locals,
                argument.value,
                thisExpression: thisExpression,
              ),
            ),
        ]),
    ];
  }

  EsmExpression _lowerOptionalPositionalArgument(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    List<k.Expression> positional,
    int index, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (index >= positional.length) {
      return const EsmNullLiteral();
    }
    return _lowerExpression(
      semantic,
      helpers,
      locals,
      positional[index],
      thisExpression: thisExpression,
    );
  }

  List<EsmStatement> _lowerStatementList(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Statement statement, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    EsmExpression thisExpression = const EsmThis(),
    String? rethrowName,
  }) {
    return switch (statement) {
      k.Block() => [
        for (final child in statement.statements)
          ..._lowerStatementList(
            semantic,
            helpers,
            locals,
            labels,
            child,
            continueSwitchTargets: continueSwitchTargets,
            thisExpression: thisExpression,
            rethrowName: rethrowName,
          ),
      ],
      k.LabeledStatement() => [
        _lowerLabeledStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.BreakStatement() => [_lowerBreakStatement(labels, statement)],
      k.ContinueSwitchStatement() => _lowerContinueSwitchStatement(
        continueSwitchTargets,
        statement,
      ),
      k.VariableDeclaration() => [
        _lowerVariableDeclaration(
          semantic,
          helpers,
          locals,
          statement,
          thisExpression: thisExpression,
        ),
      ],
      k.FunctionDeclaration() => [
        _lowerFunctionDeclaration(semantic, helpers, locals, statement),
      ],
      k.EmptyStatement() => const [],
      k.AssertStatement() => const [],
      k.ExpressionStatement(expression: k.Throw()) => [
        _lowerThrowStatement(
          semantic,
          helpers,
          locals,
          statement.expression as k.Throw,
          thisExpression: thisExpression,
        ),
      ],
      k.ExpressionStatement(expression: k.Rethrow()) => [
        _lowerRethrowStatement(statement.expression as k.Rethrow, rethrowName),
      ],
      k.ExpressionStatement() => [
        EsmExpressionStatement(
          _lowerExpression(
            semantic,
            helpers,
            locals,
            statement.expression,
            thisExpression: thisExpression,
          ),
        ),
      ],
      k.IfStatement() => [
        _lowerIfStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.WhileStatement() => [
        _lowerWhileStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.DoStatement() => [
        _lowerDoStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.SwitchStatement() => [
        _lowerSwitchStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.ForStatement() => [
        _lowerForStatement(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          continueSwitchTargets: continueSwitchTargets,
          rethrowName: rethrowName,
        ),
      ],
      k.TryCatch() => [
        _lowerTryCatch(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          rethrowName,
          continueSwitchTargets: continueSwitchTargets,
        ),
      ],
      k.TryFinally() => [
        _lowerTryFinally(
          semantic,
          helpers,
          locals,
          labels,
          statement,
          thisExpression,
          rethrowName,
          continueSwitchTargets: continueSwitchTargets,
        ),
      ],
      k.ReturnStatement() => [
        EsmReturnStatement(
          statement.expression == null
              ? null
              : _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  statement.expression!,
                  thisExpression: thisExpression,
                ),
        ),
      ],
      _ => throw UnsupportedCompilerFeature(statement, 'statement lowering'),
    };
  }

  EsmLabeledStatement _lowerLabeledStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.LabeledStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    final label = _freshIn(labels.values.toSet(), 'label');
    labels[statement] = label;
    final body = _lowerStatementList(
      semantic,
      helpers,
      locals,
      labels,
      statement.body,
      continueSwitchTargets: continueSwitchTargets,
      thisExpression: thisExpression,
      rethrowName: rethrowName,
    );
    return EsmLabeledStatement(
      label: label,
      statement: body.length == 1 && body.single is EsmBlockStatement
          ? body.single
          : EsmBlockStatement(body),
    );
  }

  EsmBreakStatement _lowerBreakStatement(
    Map<k.LabeledStatement, String> labels,
    k.BreakStatement statement,
  ) {
    final label = labels[statement.target];
    if (label == null) {
      throw UnsupportedCompilerFeature(statement, 'unbound break target');
    }
    return EsmBreakStatement(label);
  }

  EsmIfStatement _lowerIfStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.IfStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    final otherwise = statement.otherwise;
    return EsmIfStatement(
      condition: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
      thenBody: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.then,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      otherwiseBody: otherwise == null
          ? null
          : _lowerStatementList(
              semantic,
              helpers,
              locals,
              labels,
              otherwise,
              continueSwitchTargets: continueSwitchTargets,
              thisExpression: thisExpression,
              rethrowName: rethrowName,
            ),
    );
  }

  EsmWhileStatement _lowerWhileStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.WhileStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmWhileStatement(
      condition: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  EsmDoStatement _lowerDoStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.DoStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmDoStatement(
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      condition: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmStatement _lowerSwitchStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.SwitchStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    if (_switchCanContinueToCase(statement)) {
      return _lowerContinuableSwitchStatement(
        semantic,
        helpers,
        locals,
        labels,
        continueSwitchTargets,
        statement,
        thisExpression,
        rethrowName: rethrowName,
      );
    }
    return EsmSwitchStatement(
      expression: _lowerExpression(
        semantic,
        helpers,
        locals,
        statement.expression,
        thisExpression: thisExpression,
      ),
      cases: [
        for (final switchCase in statement.cases)
          _lowerSwitchCase(
            semantic,
            helpers,
            locals,
            labels,
            continueSwitchTargets,
            switchCase,
            thisExpression,
            rethrowName: rethrowName,
          ),
      ],
    );
  }

  EsmSwitchCase _lowerSwitchCase(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchCase switchCase,
    EsmExpression thisExpression, {
    String? rethrowName,
  }) {
    return EsmSwitchCase(
      expressions: [
        for (final expression in switchCase.expressions)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression,
            thisExpression: thisExpression,
          ),
      ],
      isDefault: switchCase.isDefault,
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        switchCase.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  EsmBlockStatement _lowerContinuableSwitchStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchStatement statement,
    EsmExpression thisExpression, {
    String? rethrowName,
  }) {
    final usedNames = {
      ...semantic.globalBindingNames,
      ...locals.values,
      ...labels.values,
      for (final target in continueSwitchTargets.values) ...[
        target.stateName,
        target.loopLabel,
      ],
    };
    final valueName = _freshIn(usedNames, r'$switchValue');
    final targetName = _freshIn(usedNames, r'$switchTarget');
    final loopLabel = _freshIn(usedNames, r'$switchLoop');
    final targets = {
      for (var index = 0; index < statement.cases.length; index++)
        statement.cases[index]: _ContinueSwitchTarget(
          stateName: targetName,
          loopLabel: loopLabel,
          caseIndex: index,
        ),
    };
    final nestedTargets = {...continueSwitchTargets, ...targets};
    return EsmBlockStatement([
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(valueName),
        initializer: _lowerExpression(
          semantic,
          helpers,
          locals,
          statement.expression,
          thisExpression: thisExpression,
        ),
        mutable: false,
      ),
      EsmVariableDeclaration(
        binding: EsmIdentifierBinding(targetName),
        initializer: const EsmNumberLiteral(-1),
        mutable: true,
      ),
      EsmSwitchStatement(
        expression: EsmIdentifier(valueName),
        cases: [
          for (var index = 0; index < statement.cases.length; index++)
            _lowerContinuableSwitchDispatchCase(
              semantic,
              helpers,
              locals,
              statement.cases[index],
              index,
              targetName,
              thisExpression,
            ),
        ],
      ),
      EsmLabeledStatement(
        label: loopLabel,
        statement: EsmWhileStatement(
          condition: EsmBinary(
            left: EsmIdentifier(targetName),
            operator: EsmBinaryOperator.strictNotEquals,
            right: const EsmNumberLiteral(-1),
          ),
          body: [
            EsmSwitchStatement(
              expression: EsmIdentifier(targetName),
              cases: [
                for (var index = 0; index < statement.cases.length; index++)
                  _lowerContinuableSwitchBodyCase(
                    semantic,
                    helpers,
                    locals,
                    labels,
                    nestedTargets,
                    statement.cases[index],
                    index,
                    targetName,
                    thisExpression,
                    rethrowName: rethrowName,
                  ),
              ],
            ),
          ],
        ),
      ),
    ]);
  }

  EsmSwitchCase _lowerContinuableSwitchDispatchCase(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SwitchCase switchCase,
    int caseIndex,
    String targetName,
    EsmExpression thisExpression,
  ) {
    return EsmSwitchCase(
      expressions: [
        for (final expression in switchCase.expressions)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression,
            thisExpression: thisExpression,
          ),
      ],
      isDefault: switchCase.isDefault,
      body: [
        EsmExpressionStatement(
          EsmAssignment(
            target: EsmIdentifier(targetName),
            value: EsmNumberLiteral(caseIndex),
          ),
        ),
        const EsmBreakStatement(null),
      ],
    );
  }

  EsmSwitchCase _lowerContinuableSwitchBodyCase(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchCase switchCase,
    int caseIndex,
    String targetName,
    EsmExpression thisExpression, {
    String? rethrowName,
  }) {
    final body = _lowerStatementList(
      semantic,
      helpers,
      locals,
      labels,
      switchCase.body,
      continueSwitchTargets: continueSwitchTargets,
      thisExpression: thisExpression,
      rethrowName: rethrowName,
    );
    return EsmSwitchCase(
      expressions: [EsmNumberLiteral(caseIndex)],
      isDefault: false,
      body: [
        EsmExpressionStatement(
          EsmAssignment(
            target: EsmIdentifier(targetName),
            value: const EsmNumberLiteral(-1),
          ),
        ),
        ...body,
        if (!_endsAbruptly(body)) const EsmBreakStatement(null),
      ],
    );
  }

  List<EsmStatement> _lowerContinueSwitchStatement(
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.ContinueSwitchStatement statement,
  ) {
    final target = continueSwitchTargets[statement.target];
    if (target == null) {
      throw UnsupportedCompilerFeature(statement, 'continue switch statement');
    }
    return [
      EsmExpressionStatement(
        EsmAssignment(
          target: EsmIdentifier(target.stateName),
          value: EsmNumberLiteral(target.caseIndex),
        ),
      ),
      EsmContinueStatement(target.loopLabel),
    ];
  }

  bool _endsAbruptly(List<EsmStatement> statements) {
    if (statements.isEmpty) {
      return false;
    }
    return switch (statements.last) {
      EsmBreakStatement() ||
      EsmContinueStatement() ||
      EsmReturnStatement() ||
      EsmThrowStatement() => true,
      EsmBlockStatement(:final body) => _endsAbruptly(body),
      EsmIfStatement(:final thenBody, :final otherwiseBody) =>
        otherwiseBody != null &&
            _endsAbruptly(thenBody) &&
            _endsAbruptly(otherwiseBody),
      _ => false,
    };
  }

  EsmForStatement _lowerForStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.ForStatement statement,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmForStatement(
      initializers: [
        for (final initializer in statement.variableInitializations)
          _lowerForInitializer(
            semantic,
            helpers,
            locals,
            initializer,
            thisExpression,
          ),
      ],
      condition: statement.condition == null
          ? null
          : _lowerExpression(
              semantic,
              helpers,
              locals,
              statement.condition!,
              thisExpression: thisExpression,
            ),
      updates: [
        for (final update in statement.updates)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            update,
            thisExpression: thisExpression,
          ),
      ],
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  EsmThrowStatement _lowerThrowStatement(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Throw expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return EsmThrowStatement(
      _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.expression,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmThrowStatement _lowerRethrowStatement(
    k.Rethrow expression,
    String? rethrowName,
  ) {
    if (rethrowName == null) {
      throw UnsupportedCompilerFeature(expression, 'rethrow lowering');
    }
    return EsmThrowStatement(EsmIdentifier(rethrowName));
  }

  EsmTryStatement _lowerTryCatch(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.TryCatch statement,
    EsmExpression thisExpression,
    String? rethrowName, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    final errorName = _freshLocalName(semantic, locals.values, r'$error');
    return EsmTryStatement(
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      catchParameter: EsmIdentifierParameter(name: errorName),
      catchBody: _lowerCatchChain(
        semantic,
        helpers,
        locals,
        labels,
        statement.catches,
        errorName,
        thisExpression,
        continueSwitchTargets: continueSwitchTargets,
      ),
      finallyBody: null,
    );
  }

  EsmTryStatement _lowerTryFinally(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.TryFinally statement,
    EsmExpression thisExpression,
    String? rethrowName, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    return EsmTryStatement(
      body: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      catchParameter: null,
      catchBody: null,
      finallyBody: _lowerStatementList(
        semantic,
        helpers,
        locals,
        labels,
        statement.finalizer,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  List<EsmStatement> _lowerCatchChain(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    List<k.Catch> catches,
    String errorName,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    var otherwise = <EsmStatement>[EsmThrowStatement(EsmIdentifier(errorName))];
    for (final catchClause in catches.reversed) {
      final body = _lowerCatchBody(
        semantic,
        helpers,
        locals,
        labels,
        catchClause,
        errorName,
        thisExpression,
        continueSwitchTargets: continueSwitchTargets,
      );
      if (_isTopType(catchClause.guard.unalias)) {
        otherwise = body;
        continue;
      }
      otherwise = [
        EsmIfStatement(
          condition: _lowerTypeTest(
            semantic,
            helpers,
            catchClause.guard,
            EsmIdentifier(errorName),
          ),
          thenBody: body,
          otherwiseBody: otherwise,
        ),
      ];
    }
    return otherwise;
  }

  List<EsmStatement> _lowerCatchBody(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Catch catchClause,
    String errorName,
    EsmExpression thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    final catchLocals = Map<k.VariableDeclaration, String>.of(locals);
    final statements = <EsmStatement>[];
    final error = EsmIdentifier(errorName);
    final exception = catchClause.exception;
    if (exception != null) {
      final name = _freshLocalName(
        semantic,
        catchLocals.values,
        exception.name ?? 'e',
        reservedNames: [errorName],
      );
      catchLocals[exception] = name;
      statements.add(
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(name),
          initializer: error,
          mutable: exception.isAssignable,
        ),
      );
    }
    final stackTrace = catchClause.stackTrace;
    if (stackTrace != null) {
      final name = _freshLocalName(
        semantic,
        catchLocals.values,
        stackTrace.name ?? 'stack',
        reservedNames: [errorName],
      );
      catchLocals[stackTrace] = name;
      statements.add(
        EsmVariableDeclaration(
          binding: EsmIdentifierBinding(name),
          initializer: EsmNullishCoalesce(
            left: EsmOptionalPropertyAccess(receiver: error, property: 'stack'),
            right: const EsmStringLiteral('<javascript stack unavailable>'),
          ),
          mutable: stackTrace.isAssignable,
        ),
      );
    }
    statements.addAll(
      _lowerStatementList(
        semantic,
        helpers,
        catchLocals,
        labels,
        catchClause.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: errorName,
      ),
    );
    return statements;
  }

  EsmVariableDeclaration _lowerForInitializer(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableInitializationBase initializer,
    EsmExpression thisExpression,
  ) {
    if (initializer is! k.VariableDeclaration) {
      throw UnsupportedCompilerFeature(initializer, 'for initializer lowering');
    }
    return _lowerVariableDeclaration(
      semantic,
      helpers,
      locals,
      initializer,
      thisExpression: thisExpression,
    );
  }

  EsmVariableDeclaration _lowerVariableDeclaration(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableDeclaration statement, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final name = _freshLocalName(
      semantic,
      locals.values,
      statement.name ?? 'v',
    );
    locals[statement] = name;
    final initializer = statement.initializer;
    if (statement.isLate) {
      helpers.require(EsmRuntimeHelper.lazyField);
      return EsmVariableDeclaration(
        binding: EsmIdentifierBinding(name),
        initializer: EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.lazyField),
          arguments: [
            EsmStringLiteral(statement.name ?? name),
            initializer == null
                ? const EsmNullLiteral()
                : EsmArrowFunction(
                    parameters: const [],
                    body: _lowerExpression(
                      semantic,
                      helpers,
                      locals,
                      initializer,
                      thisExpression: thisExpression,
                    ),
                  ),
            _lateWritableArgument(statement.isFinal, statement.isAssignable),
          ],
        ),
        mutable: false,
      );
    }
    return EsmVariableDeclaration(
      binding: EsmIdentifierBinding(name),
      initializer: initializer == null
          ? const EsmNullLiteral()
          : _lowerExpression(
              semantic,
              helpers,
              locals,
              initializer,
              thisExpression: thisExpression,
            ),
      mutable: statement.isAssignable || initializer == null,
    );
  }

  EsmVariableDeclaration _lowerFunctionDeclaration(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.FunctionDeclaration statement,
  ) {
    final name = _freshLocalName(
      semantic,
      locals.values,
      statement.variable.name ?? 'f',
    );
    locals[statement.variable] = name;
    return EsmVariableDeclaration(
      binding: EsmIdentifierBinding(name),
      initializer: _lowerFunctionNodeExpression(
        semantic,
        helpers,
        locals,
        statement.function,
      ),
      mutable: false,
    );
  }

  EsmExpression _lowerExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return switch (expression) {
      k.StaticInvocation() => _lowerStaticInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.StaticGet() => _lowerStaticGet(semantic, helpers, expression),
      k.StaticSet() => _lowerStaticSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.ConstantExpression() => _lowerConstantExpression(
        semantic,
        helpers,
        expression,
      ),
      k.VariableGet() => _lowerVariableGet(locals, expression),
      k.VariableSet() => _lowerVariableSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.FunctionInvocation() => EsmCall(
        callee: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        arguments: _lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'function invocation arguments',
        ),
      ),
      k.LocalFunctionInvocation() => _lowerLocalFunctionInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceInvocation() => _lowerInstanceInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceGet() => _lowerInstanceGet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceSet() => _lowerInstanceSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.SuperMethodInvocation() => _lowerSuperMethodInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.SuperPropertyGet() => _lowerSuperPropertyGet(
        semantic,
        helpers,
        locals,
        expression,
      ),
      k.SuperPropertySet() => _lowerSuperPropertySet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.ConstructorInvocation() => _lowerConstructorInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.IsExpression() => _lowerIsExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.AsExpression() => _lowerAsExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.NullCheck() => _lowerNullCheck(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.Not() => EsmUnary(
        operator: EsmUnaryOperator.logicalNot,
        operand: EsmParenthesized(
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.operand,
            thisExpression: thisExpression,
          ),
        ),
      ),
      k.LogicalExpression() => EsmParenthesized(
        EsmBinary(
          left: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.left,
            thisExpression: thisExpression,
          ),
          operator: expression.operatorEnum == k.LogicalExpressionOperator.AND
              ? EsmBinaryOperator.logicalAnd
              : EsmBinaryOperator.logicalOr,
          right: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.right,
            thisExpression: thisExpression,
          ),
        ),
      ),
      k.EqualsNull() => EsmBinary(
        left: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.expression,
          thisExpression: thisExpression,
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: const EsmNullLiteral(),
      ),
      k.ConditionalExpression() => EsmConditional(
        condition: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.condition,
          thisExpression: thisExpression,
        ),
        thenExpression: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.then,
          thisExpression: thisExpression,
        ),
        otherwiseExpression: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.otherwise,
          thisExpression: thisExpression,
        ),
      ),
      k.ThisExpression() => thisExpression,
      k.StringLiteral() => EsmStringLiteral(expression.value),
      k.StringConcatenation() => _lowerStringConcatenation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.IntLiteral() => EsmNumberLiteral(expression.value),
      k.DoubleLiteral() => EsmNumberLiteral(expression.value),
      k.BoolLiteral() => EsmBooleanLiteral(expression.value),
      k.NullLiteral() => const EsmNullLiteral(),
      k.ListLiteral() => EsmArrayLiteral([
        for (final element in expression.expressions)
          _lowerExpression(
            semantic,
            helpers,
            locals,
            element,
            thisExpression: thisExpression,
          ),
      ]),
      k.SetLiteral() => () {
        helpers.require(EsmRuntimeHelper.setAddAll);
        return EsmCall(
          callee: const EsmIdentifier('__dartSetFrom'),
          arguments: [
            EsmArrayLiteral([
              for (final element in expression.expressions)
                _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  element,
                  thisExpression: thisExpression,
                ),
            ]),
          ],
        );
      }(),
      k.MapLiteral() => () {
        helpers.require(EsmRuntimeHelper.mapFactories);
        return EsmCall(
          callee: const EsmIdentifier('__dartMapFromEntries'),
          arguments: [
            EsmArrayLiteral([
              for (final entry in expression.entries)
                EsmArrayLiteral([
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    entry.key,
                    thisExpression: thisExpression,
                  ),
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    entry.value,
                    thisExpression: thisExpression,
                  ),
                ]),
            ]),
          ],
        );
      }(),
      k.RecordLiteral() => _lowerRecordLiteral(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.RecordIndexGet() => EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: _recordPositionalKey(expression.index),
      ),
      k.RecordNameGet() => EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: expression.name,
      ),
      k.SymbolLiteral() => _lowerSymbolLiteral(helpers, expression.value),
      k.TypeLiteral() => _lowerTypeLiteral(helpers, expression.type),
      k.Throw() => EsmCall(
        callee: EsmParenthesized(
          EsmArrowBlockFunction(
            parameters: const [],
            body: [
              EsmThrowStatement(
                _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  expression.expression,
                  thisExpression: thisExpression,
                ),
              ),
            ],
          ),
        ),
        arguments: const [],
      ),
      k.EqualsCall() => _lowerEqualsCall(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicGet() => _lowerDynamicGet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicSet() => _lowerDynamicSet(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicInvocation() => _lowerDynamicInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceTearOff() => _lowerInstanceTearOff(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.FunctionExpression() => _lowerFunctionExpression(
        semantic,
        helpers,
        locals,
        expression,
      ),
      k.BlockExpression() => _lowerBlockExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.Let() => _lowerLetExpression(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      _ => throw UnsupportedCompilerFeature(expression, 'expression lowering'),
    };
  }

  EsmExpression _lowerDynamicGet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicGet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.dynamicGet);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dynamicGet),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        EsmStringLiteral(expression.name.text),
      ],
    );
  }

  EsmExpression _lowerDynamicSet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicSet expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.dynamicSet);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dynamicSet),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        EsmStringLiteral(expression.name.text),
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

  EsmExpression _lowerNullCheck(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.NullCheck expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.nullCheck);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.nullCheck),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.operand,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpression _lowerRecordLiteral(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.RecordLiteral expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.record);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.record),
      arguments: [
        EsmArrayLiteral([
          for (final field in expression.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              field,
              thisExpression: thisExpression,
            ),
        ]),
        EsmObjectLiteral([
          for (final field in expression.named)
            EsmObjectLiteralProperty.static(
              key: field.name,
              value: _lowerExpression(
                semantic,
                helpers,
                locals,
                field.value,
                thisExpression: thisExpression,
              ),
            ),
        ]),
      ],
    );
  }

  EsmExpression _lowerStringConcatenation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StringConcatenation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    return EsmStringConcatenation([
      for (final part in expression.expressions)
        if (part is k.StringLiteral)
          EsmStringLiteral(part.value)
        else
          _lowerStringifiedExpression(
            semantic,
            helpers,
            locals,
            part,
            thisExpression: thisExpression,
          ),
    ]);
  }

  EsmExpression _lowerStringifiedExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    helpers.require(EsmRuntimeHelper.stringify);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringify),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  String _recordPositionalKey(int index) => '\$${index + 1}';

  EsmExpression _lowerLetExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.Let expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final optimized = _tryLowerLetExpressionInline(
      semantic,
      helpers,
      outerLocals,
      expression,
      thisExpression: thisExpression,
    );
    if (optimized != null) {
      return optimized;
    }
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    return EsmCall(
      callee: EsmParenthesized(
        EsmArrowBlockFunction(
          parameters: const [],
          body: [
            _lowerVariableDeclaration(
              semantic,
              helpers,
              locals,
              expression.variable,
              thisExpression: thisExpression,
            ),
            EsmReturnStatement(
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.body,
                thisExpression: thisExpression,
              ),
            ),
          ],
        ),
      ),
      arguments: const [],
    );
  }

  EsmExpression? _tryLowerLetExpressionInline(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Let expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final initializer = expression.variable.initializer;
    final body = expression.body;
    if (initializer == null || body is! k.ConditionalExpression) {
      return null;
    }
    if (!_isEqualsNullVariable(body.condition, expression.variable)) {
      return null;
    }
    if (_isVariableGet(body.otherwise, expression.variable)) {
      if (_referencesVariable(body.then, expression.variable)) {
        return null;
      }
      return EsmNullishCoalesce(
        left: _lowerExpression(
          semantic,
          helpers,
          locals,
          initializer,
          thisExpression: thisExpression,
        ),
        right: _lowerExpression(
          semantic,
          helpers,
          locals,
          body.then,
          thisExpression: thisExpression,
        ),
      );
    }
    if (body.then is k.NullLiteral) {
      return _tryLowerNullAwareLet(
        semantic,
        helpers,
        locals,
        expression.variable,
        initializer,
        body.otherwise,
        thisExpression: thisExpression,
      );
    }
    return null;
  }

  EsmExpression? _tryLowerNullAwareLet(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableDeclaration variable,
    k.Expression initializer,
    k.Expression otherwise, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      initializer,
      thisExpression: thisExpression,
    );
    if (otherwise is k.InstanceGet &&
        _isVariableGet(otherwise.receiver, variable)) {
      final target = otherwise.interfaceTargetReference.node;
      if (target is k.Member) {
        return EsmOptionalPropertyAccess(
          receiver: receiver,
          property:
              _sdkInstanceGetterPropertyName(
                otherwise.interfaceTargetReference,
                otherwise.name.text,
              ) ??
              _instanceMemberName(semantic, target),
        );
      }
    }
    if (otherwise is k.InstanceInvocation &&
        _isVariableGet(otherwise.receiver, variable)) {
      if (_referencesVariable(otherwise.arguments, variable)) {
        return null;
      }
      final target = otherwise.interfaceTargetReference.node;
      if (target is k.Member) {
        return EsmOptionalMethodCall(
          receiver: receiver,
          property:
              _sdkInstanceMethodName(
                otherwise.interfaceTargetReference,
                otherwise.name.text,
              ) ??
              _instanceMemberName(semantic, target),
          arguments: _lowerArguments(
            semantic,
            helpers,
            locals,
            otherwise.arguments,
            thisExpression: thisExpression,
            contextNode: otherwise,
            context: 'null-aware invocation arguments',
          ),
        );
      }
    }
    return null;
  }

  bool _isEqualsNullVariable(
    k.Expression expression,
    k.VariableDeclaration variable,
  ) {
    return expression is k.EqualsNull &&
        _isVariableGet(expression.expression, variable);
  }

  bool _isVariableGet(k.Expression expression, k.VariableDeclaration variable) {
    return expression is k.VariableGet && expression.variable == variable;
  }

  bool _referencesVariable(k.TreeNode node, k.VariableDeclaration variable) {
    final visitor = _VariableReferenceVisitor(variable);
    node.accept(visitor);
    return visitor.found;
  }

  EsmExpression _lowerBlockExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.BlockExpression expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    return EsmCall(
      callee: EsmParenthesized(
        EsmArrowBlockFunction(
          parameters: const [],
          body: [
            ..._lowerStatementList(
              semantic,
              helpers,
              locals,
              {},
              expression.body,
              thisExpression: thisExpression,
            ),
            EsmReturnStatement(
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.value,
                thisExpression: thisExpression,
              ),
            ),
          ],
        ),
      ),
      arguments: const [],
    );
  }

  EsmExpression _lowerFunctionExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.FunctionExpression expression,
  ) {
    return _lowerFunctionNodeExpression(
      semantic,
      helpers,
      outerLocals,
      expression.function,
    );
  }

  EsmExpression _lowerFunctionNodeExpression(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.FunctionNode function,
  ) {
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(
        function,
        'function expression async marker',
      );
    }
    final body = function.body;
    if (body == null) {
      throw UnsupportedCompilerFeature(function, 'function expression body');
    }
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    final usedParameters = <String>{};
    return EsmArrowBlockFunction(
      parameters: _bindParameters(
        semantic,
        helpers,
        locals,
        usedParameters,
        function,
      ),
      body: _lowerStatementList(semantic, helpers, locals, {}, body),
    );
  }

  EsmExpression _lowerLocalFunctionInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.LocalFunctionInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final name = locals[expression.variable];
    if (name == null) {
      throw UnsupportedCompilerFeature(expression, 'unbound local function');
    }
    return EsmCall(
      callee: EsmIdentifier(name),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'local function invocation arguments',
      ),
    );
  }

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
      return _lowerCanonicalConstant(
        helpers,
        constant,
        _lowerConstructorTearOffConstant(semantic, helpers, constant, context),
      );
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
      final sdkConstant = sdkIntrinsics.lowerInstanceConstant(constant);
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
    final helperName = switch (classPath) {
      'dart:convert::Latin1Codec' => '__dartLatin1Codec',
      'dart:convert::Utf8Codec' => '__dartUtf8Codec',
      _ => null,
    };
    if (helperName == null) {
      return null;
    }
    helpers.require(EsmRuntimeHelper.encoding);
    bool? allowMalformed;
    for (final value in constant.fieldValues.values) {
      if (value is k.BoolConstant) {
        allowMalformed = value.value;
        break;
      }
    }
    return EsmCall(
      callee: EsmIdentifier(helperName),
      arguments: [EsmBooleanLiteral(allowMalformed ?? false)],
    );
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

  EsmExpression _lowerConstructorTearOffConstant(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    Object context,
  ) {
    final target = switch (constant) {
      k.ConstructorTearOffConstant() => constant.target,
      k.RedirectingFactoryTearOffConstant() => constant.target,
      _ => throw UnsupportedCompilerFeature(
        context,
        'constant expression lowering',
      ),
    };
    final function = target.function;
    if (function == null || function.asyncMarker != k.AsyncMarker.Sync) {
      throw UnsupportedCompilerFeature(context, 'constant expression lowering');
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
    return EsmFunctionExpression(
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

  EsmExpression _lowerInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final operator = expression.name.text;
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.interfaceTargetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeInstanceInvocation(
        semantic,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final target = expression.interfaceTargetReference.node;
    if (target is k.Procedure) {
      final symbol = semantic.instanceProcedureSymbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.method) {
        final receiver = _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        );
        return EsmCall(
          callee: _memberAccess(receiver, symbol.name),
          arguments: _lowerArguments(
            semantic,
            helpers,
            locals,
            expression.arguments,
            thisExpression: thisExpression,
            contextNode: expression,
            context: 'instance invocation arguments',
          ),
        );
      }
    }
    final sdkIntrinsic = _lowerSdkInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    final binaryOperator = _binaryOperators[operator];
    if (binaryOperator == null ||
        expression.arguments.positional.length != 1 ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      final intrinsic = _lowerCoreInstanceInvocation(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
      if (intrinsic != null) {
        return intrinsic;
      }
      throw UnsupportedCompilerFeature(
        expression,
        'instance invocation lowering '
        '${kernelReferencePath(expression.interfaceTargetReference)}',
      );
    }
    final left = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final right = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.arguments.positional.single,
      thisExpression: thisExpression,
    );
    if (operator == '>>') {
      helpers.require(EsmRuntimeHelper.intShift);
      return EsmCall(
        callee: helpers.reference(
          const EsmRuntimeHelperRegistry(),
          EsmRuntimeHelper.intShift,
        ),
        arguments: [left, right],
      );
    }
    if (operator == '&') {
      if (_isMask32Literal(right)) {
        return EsmBinary(
          left: left,
          operator: EsmBinaryOperator.unsignedRightShift,
          right: const EsmNumberLiteral(0),
        );
      }
      if (_isMask32Literal(left)) {
        return EsmBinary(
          left: right,
          operator: EsmBinaryOperator.unsignedRightShift,
          right: const EsmNumberLiteral(0),
        );
      }
    }
    return EsmBinary(left: left, operator: binaryOperator, right: right);
  }

  bool _isMask32Literal(EsmExpression expression) {
    return expression is EsmNumberLiteral && expression.value == 0xffffffff;
  }

  EsmExpression? _lowerSdkInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final sdkIntrinsic = sdkIntrinsics.lowerInstanceInvocation(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
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
      lower: (argument) => _lowerExpression(
        semantic,
        helpers,
        locals,
        argument,
        thisExpression: thisExpression,
      ),
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
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    final coreTimeInvocation = _lowerCoreTimeInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreTimeInvocation != null) {
      return coreTimeInvocation;
    }
    final webInvocation = _lowerWebInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (webInvocation != null) {
      return webInvocation;
    }
    return _lowerMathInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
  }

  EsmExpression? _lowerCoreTimeInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.types.isNotEmpty) {
      return null;
    }
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final name = expression.name.text;
    final positional = expression.arguments.positional;
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    if (target.startsWith('dart:core::DateTime::@methods::') &&
        expression.arguments.named.isEmpty) {
      final expectedArity = switch (name) {
        'compareTo' ||
        'isBefore' ||
        'isAfter' ||
        'isAtSameMomentAs' ||
        'add' ||
        'subtract' ||
        'difference' => 1,
        'toUtc' || 'toLocal' || 'toIso8601String' || 'toString' => 0,
        _ => null,
      };
      if (expectedArity == null || positional.length != expectedArity) {
        return null;
      }
      return EsmCall(
        callee: _memberAccess(receiver, name),
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
    if (!target.startsWith('dart:core::Duration::@methods::') ||
        expression.arguments.named.isNotEmpty) {
      return null;
    }
    if ((name == 'abs' || name == 'toString') && positional.isEmpty) {
      return EsmCall(
        callee: _memberAccess(receiver, name),
        arguments: const [],
      );
    }
    if (name == 'compareTo' && positional.length == 1) {
      return EsmCall(
        callee: _memberAccess(receiver, name),
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
    if (positional.length != 1) {
      return null;
    }
    final right = _lowerExpression(
      semantic,
      helpers,
      locals,
      positional.single,
      thisExpression: thisExpression,
    );
    return switch (name) {
      '+' => _durationFromMicros(
        helpers,
        EsmBinary(
          left: EsmPropertyAccess(
            receiver: receiver,
            property: 'inMicroseconds',
          ),
          operator: EsmBinaryOperator.add,
          right: EsmPropertyAccess(receiver: right, property: 'inMicroseconds'),
        ),
      ),
      '-' => _durationFromMicros(
        helpers,
        EsmBinary(
          left: EsmPropertyAccess(
            receiver: receiver,
            property: 'inMicroseconds',
          ),
          operator: EsmBinaryOperator.subtract,
          right: EsmPropertyAccess(receiver: right, property: 'inMicroseconds'),
        ),
      ),
      '*' => _durationFromMicros(
        helpers,
        _mathRound(
          EsmBinary(
            left: EsmPropertyAccess(
              receiver: receiver,
              property: 'inMicroseconds',
            ),
            operator: EsmBinaryOperator.multiply,
            right: right,
          ),
        ),
      ),
      '~/' => _durationFromMicros(
        helpers,
        _mathTrunc(
          EsmBinary(
            left: EsmPropertyAccess(
              receiver: receiver,
              property: 'inMicroseconds',
            ),
            operator: EsmBinaryOperator.divide,
            right: right,
          ),
        ),
      ),
      '<' || '<=' || '>' || '>=' => EsmBinary(
        left: EsmPropertyAccess(receiver: receiver, property: 'inMicroseconds'),
        operator: _binaryOperators[name]!,
        right: EsmPropertyAccess(receiver: right, property: 'inMicroseconds'),
      ),
      _ => null,
    };
  }

  EsmCall _durationFromMicros(
    EsmRuntimeHelperUseSet helpers,
    EsmExpression microseconds,
  ) {
    helpers.require(EsmRuntimeHelper.duration);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.duration),
      arguments: [
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'microseconds',
            value: microseconds,
          ),
        ]),
      ],
    );
  }

  EsmExpression? _lowerWebInstanceInvocation(
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
    final positional = expression.arguments.positional;
    final methodName = _sdkInstanceMethodName(
      expression.interfaceTargetReference,
      name,
    );
    if (methodName == null) {
      return null;
    }
    if (name == 'append' && positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: methodName,
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
    if (name == 'getAttribute' || name == 'setAttribute') {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: methodName,
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

  EsmExpression? _lowerMathInstanceInvocation(
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
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final isPoint =
        target.startsWith('dart:math::Point::') ||
        target.startsWith('dart:math::_PointBase::');
    final isRectangle =
        target.startsWith('dart:math::Rectangle::') ||
        target.startsWith('dart:math::_RectangleBase::');
    final isRandom = target.startsWith('dart:math::Random::');
    if (!isPoint && !isRectangle && !isRandom) {
      return null;
    }
    final name = expression.name.text;
    final positional = expression.arguments.positional;
    final expectedArity = switch (name) {
      '+' || '-' || '*' || 'distanceTo' || 'squaredDistanceTo' => 1,
      'containsPoint' ||
      'containsRectangle' ||
      'intersects' ||
      'intersection' ||
      'boundingBox' => 1,
      'nextInt' => 1,
      'nextDouble' || 'nextBool' => 0,
      'toString' => 0,
      _ => null,
    };
    if (expectedArity == null || positional.length != expectedArity) {
      return null;
    }
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    return EsmCall(
      callee: _memberAccess(receiver, name),
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

  EsmExpression _lowerDynamicInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.types.isNotEmpty) {
      throw UnsupportedCompilerFeature(expression, 'expression lowering');
    }
    final isCall = expression.name.text == 'call';
    final helper = isCall
        ? EsmRuntimeHelper.dynamicCall
        : EsmRuntimeHelper.dynamicInvoke;
    helpers.require(helper);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, helper),
      arguments: [
        _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        if (!isCall) EsmStringLiteral(expression.name.text),
        EsmArrayLiteral([
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ]),
        if (expression.arguments.named.isEmpty)
          const EsmNullLiteral()
        else
          EsmObjectLiteral([
            for (final argument in expression.arguments.named)
              EsmObjectLiteralProperty.static(
                key: argument.name,
                value: _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  argument.value,
                  thisExpression: thisExpression,
                ),
              ),
          ]),
      ],
    );
  }

  EsmExpression _lowerExtensionTypeInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final kind = member.descriptor.kind;
    if (kind != k.ExtensionTypeMemberKind.Method &&
        kind != k.ExtensionTypeMemberKind.Operator) {
      throw UnsupportedCompilerFeature(
        expression,
        'extension type instance invocation',
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
        ..._lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'extension type instance invocation arguments',
        ),
      ],
    );
  }

  EsmExpression? _lowerCoreInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final memberName = expression.name.text;
    final isMapMember = isDartCoreMapMember(
      expression.interfaceTargetReference,
      memberName,
    );
    final isListMember = isDartCoreListMember(
      expression.interfaceTargetReference,
      memberName,
    );
    final sinkInvocation = _lowerSinkInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      memberName,
      thisExpression: thisExpression,
    );
    if (sinkInvocation != null) {
      return sinkInvocation;
    }
    final convertInvocation = _lowerDartConvertInterfaceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      memberName,
      thisExpression: thisExpression,
    );
    if (convertInvocation != null) {
      return convertInvocation;
    }
    final collectionInvocation = _lowerCoreCollectionInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (collectionInvocation != null) {
      return collectionInvocation;
    }
    final mixinCollectionInvocation = _lowerMixinCollectionInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      memberName,
      thisExpression: thisExpression,
    );
    if (mixinCollectionInvocation != null) {
      return mixinCollectionInvocation;
    }
    final typedDataInvocation = _lowerTypedDataInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (typedDataInvocation != null) {
      return typedDataInvocation;
    }
    final bigIntInvocation = _lowerBigIntInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (bigIntInvocation != null) {
      return bigIntInvocation;
    }
    final numberInvocation = _lowerCoreNumberInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (numberInvocation != null) {
      return numberInvocation;
    }
    final stringInvocation = _lowerCoreStringInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (stringInvocation != null) {
      return stringInvocation;
    }
    final stringBufferInvocation = _lowerCoreStringBufferInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (stringBufferInvocation != null) {
      return stringBufferInvocation;
    }
    final patternInvocation = _lowerCorePatternInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (patternInvocation != null) {
      return patternInvocation;
    }
    final regExpInvocation = _lowerCoreRegExpInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (regExpInvocation != null) {
      return regExpInvocation;
    }
    final matchInvocation = _lowerCoreMatchInstanceInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (matchInvocation != null) {
      return matchInvocation;
    }
    if (isDartCoreFinalizerMember(
          expression.interfaceTargetReference,
          memberName,
        ) &&
        expression.arguments.types.isEmpty) {
      final positional = expression.arguments.positional;
      if (memberName == 'attach' &&
          positional.length == 2 &&
          _hasOnlyNamedArguments(expression.arguments, {'detach'})) {
        final detach =
            _lowerNamedArgument(
              semantic,
              helpers,
              locals,
              expression.arguments,
              'detach',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteral();
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'attach',
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
            EsmObjectLiteral([
              EsmObjectLiteralProperty.static(key: 'detach', value: detach),
            ]),
          ],
        );
      }
      if (memberName == 'detach' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'detach',
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
    }
    if (_isCoreExpandoMember(target) &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      if (memberName == '[]' && expression.arguments.positional.length == 1) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'get',
          ),
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
      if (memberName == '[]=' && expression.arguments.positional.length == 2) {
        return EsmCall(
          callee: EsmPropertyAccess(
            receiver: _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'set',
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
    }
    if (memberName == '[]' && expression.arguments.positional.length == 1) {
      final receiver = _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
      final property = _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.arguments.positional.single,
        thisExpression: thisExpression,
      );
      if (isMapMember) {
        helpers.require(EsmRuntimeHelper.mapGet);
        return EsmCall(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapGet),
          arguments: [receiver, property],
        );
      }
      if (isListMember) {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCall(
          callee: const EsmIdentifier('__dartListLikeGet'),
          arguments: [receiver, property],
        );
      }
      return EsmComputedPropertyAccess(receiver: receiver, property: property);
    }
    if (memberName == '[]=' &&
        expression.arguments.positional.length == 2 &&
        isMapMember) {
      helpers.require(EsmRuntimeHelper.mapSet);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapSet),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
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
    if (memberName == '[]=' && expression.arguments.positional.length == 2) {
      if (isListMember) {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCall(
          callee: const EsmIdentifier('__dartListLikeSet'),
          arguments: [
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
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
      return EsmAssignment(
        target: EsmComputedPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional[0],
            thisExpression: thisExpression,
          ),
        ),
        value: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.arguments.positional[1],
          thisExpression: thisExpression,
        ),
      );
    }
    if (isMapMember &&
        memberName == 'addAll' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapAddAll);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapAddAll),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isMapMember &&
        memberName == 'addEntries' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapAddEntries'),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (((isMapMember && memberName == 'containsKey') ||
            target == 'dart:_compact_hash::_ConstMap::@methods::containsKey' ||
            target == 'dart:_compact_hash::_Map::@methods::containsKey') &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapContainsKey);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mapContainsKey,
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (((isMapMember && memberName == 'containsValue') ||
            target == 'dart:_compact_hash::_Map::@methods::containsValue') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapContainsValue'),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isMapMember &&
        memberName == 'putIfAbsent' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 2) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapPutIfAbsent'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
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
    if (((isMapMember && memberName == 'update') ||
            target == 'dart:_compact_hash::_Map::@methods::update') &&
        _hasOnlyNamedArguments(expression.arguments, {'ifAbsent'}) &&
        expression.arguments.positional.length == 2) {
      helpers.require(EsmRuntimeHelper.mapOps);
      final ifAbsent = _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        expression.arguments,
        'ifAbsent',
        thisExpression: thisExpression,
      );
      return EsmCall(
        callee: const EsmIdentifier('__dartMapUpdate'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              semantic,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
          if (ifAbsent != null) ifAbsent,
        ],
      );
    }
    if (isMapMember &&
        memberName == 'forEach' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapForEach'),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isMapMember &&
        memberName == 'map' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapMap'),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (((isMapMember && memberName == 'cast') ||
            target == 'dart:_compact_hash::_Map::@methods::cast') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      return _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
    }
    final mapMutationHelper = switch ((target, memberName)) {
      (_, 'remove') when isMapMember => '__dartMapRemove',
      ('dart:_compact_hash::_Map::@methods::remove', _) => '__dartMapRemove',
      (_, 'updateAll') when isMapMember => '__dartMapUpdateAll',
      ('dart:_compact_hash::_Map::@methods::updateAll', _) =>
        '__dartMapUpdateAll',
      (_, 'removeWhere') when isMapMember => '__dartMapRemoveWhere',
      ('dart:_compact_hash::_Map::@methods::removeWhere', _) =>
        '__dartMapRemoveWhere',
      _ => null,
    };
    if (mapMutationHelper != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: EsmIdentifier(mapMutationHelper),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isListMember &&
        memberName == 'clear' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      return EsmAssignment(
        target: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'length',
        ),
        value: const EsmNumberLiteral(0),
      );
    }
    if (((isMapMember && memberName == 'clear') ||
            target == 'dart:_compact_hash::_Map::@methods::clear') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartMapClear'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    final isSetMember = isDartCoreSetMember(
      expression.interfaceTargetReference,
      expression.name.text,
    );
    if (isSetMember &&
        expression.name.text == 'add' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: const EsmIdentifier('__dartSetAdd'),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isSetMember &&
        expression.name.text == 'contains' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: const EsmIdentifier('__dartSetContains'),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    final setHelper = isSetMember
        ? switch (expression.name.text) {
            'remove' => '__dartSetRemove',
            'lookup' => '__dartSetLookup',
            'containsAll' => '__dartSetContainsAll',
            'removeAll' => '__dartSetRemoveAll',
            'retainAll' => '__dartSetRetainAll',
            'removeWhere' => '__dartSetRemoveWhere',
            'retainWhere' => '__dartSetRetainWhere',
            'union' => '__dartSetUnion',
            'intersection' => '__dartSetIntersection',
            'difference' => '__dartSetDifference',
            _ => null,
          }
        : null;
    if (setHelper != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setOps);
      return EsmCall(
        callee: EsmIdentifier(setHelper),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isSetMember &&
        expression.name.text == 'addAll' &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.setAddAll),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isListMember &&
        memberName == 'add' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.listAdd);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAdd),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isListMember &&
        memberName == 'addAll' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.listAddAll);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAddAll),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartCoreCollectionMember(
          expression.interfaceTargetReference,
          'join',
        ) &&
        expression.arguments.positional.length <= 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'join',
        ),
        arguments: [
          if (expression.arguments.positional.isEmpty)
            const EsmStringLiteral('')
          else
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
    if (target == 'dart:core::Iterator::@methods::moveNext' &&
        expression.arguments.positional.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'moveNext',
        ),
        arguments: const [],
      );
    }
    if (target.startsWith('dart:') &&
        expression.name.text == 'contains' &&
        !target.contains('Set::') &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'includes',
        ),
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
    final numberFormatMethod = switch (target) {
      'dart:core::num::@methods::toStringAsFixed' ||
      'dart:core::double::@methods::toStringAsFixed' => 'toFixed',
      'dart:core::num::@methods::toStringAsExponential' ||
      'dart:core::double::@methods::toStringAsExponential' => 'toExponential',
      'dart:core::num::@methods::toStringAsPrecision' ||
      'dart:core::double::@methods::toStringAsPrecision' => 'toPrecision',
      _ => null,
    };
    if (numberFormatMethod != null &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmCall(
            callee: const EsmIdentifier('Number'),
            arguments: [
              _lowerExpression(
                semantic,
                helpers,
                locals,
                expression.receiver,
                thisExpression: thisExpression,
              ),
            ],
          ),
          property: numberFormatMethod,
        ),
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
    if (expression.arguments.positional.isNotEmpty) {
      return null;
    }
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    if (target == 'dart:core::int::@methods::unary-') {
      return EsmUnary(operator: EsmUnaryOperator.negate, operand: receiver);
    }
    if (target == 'dart:core::num::@methods::unary-' ||
        target == 'dart:core::double::@methods::unary-') {
      return EsmUnary(operator: EsmUnaryOperator.negate, operand: receiver);
    }
    if (target == 'dart:core::BigInt::@methods::unary-') {
      return EsmUnary(operator: EsmUnaryOperator.negate, operand: receiver);
    }
    if (target == 'dart:core::int::@methods::~') {
      return EsmUnary(operator: EsmUnaryOperator.bitNot, operand: receiver);
    }
    if (target == 'dart:core::Object::@methods::toString') {
      helpers.require(EsmRuntimeHelper.safeToString);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.safeToString,
        ),
        arguments: [receiver],
      );
    }
    if (target.startsWith('dart:') && expression.name.text == 'toString') {
      return EsmCall(
        callee: const EsmIdentifier('String'),
        arguments: [receiver],
      );
    }
    return null;
  }

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

  EsmExpression? _lowerCoreStringInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.types.isNotEmpty || !_isCoreStringTarget(target)) {
      return null;
    }
    final positional = expression.arguments.positional;
    final receiver = _lowerExpression(
      semantic,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final noArgMethod = switch (target) {
      'dart:core::String::@methods::trim' => 'trim',
      'dart:core::String::@methods::trimLeft' => 'trimStart',
      'dart:core::String::@methods::trimRight' => 'trimEnd',
      'dart:core::String::@methods::toUpperCase' => 'toUpperCase',
      'dart:core::String::@methods::toLowerCase' => 'toLowerCase',
      _ => null,
    };
    if (noArgMethod != null && positional.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: noArgMethod),
        arguments: const [],
      );
    }
    final directMethod = switch (target) {
      'dart:core::String::@methods::codeUnitAt' => 'charCodeAt',
      'dart:core::String::@methods::substring' => 'substring',
      'dart:core::String::@methods::endsWith' => 'endsWith',
      _ => null,
    };
    if (directMethod != null &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: directMethod),
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
    final directPatternMethod = switch (target) {
      'dart:core::String::@methods::startsWith' => 'startsWith',
      'dart:core::String::@methods::indexOf' => 'indexOf',
      'dart:core::String::@methods::split' => 'split',
      'dart:core::String::@methods::replaceAll' => 'replaceAll',
      _ => null,
    };
    if (directPatternMethod != null &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        _isStringLiteralArgument(expression.arguments, 0)) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: receiver,
          property: directPatternMethod,
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
    final patternCall = _lowerCoreStringPatternInvocation(
      semantic,
      helpers,
      locals,
      expression,
      target,
      receiver,
      thisExpression: thisExpression,
    );
    if (patternCall != null) {
      return patternCall;
    }
    if (target == 'dart:core::String::@methods::contains' &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        _isStringLiteralArgument(expression.arguments, 0)) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'includes'),
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
    if ((target == 'dart:core::String::@methods::padLeft' ||
            target == 'dart:core::String::@methods::padRight') &&
        expression.arguments.named.isEmpty &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: receiver,
          property: target.endsWith('padLeft') ? 'padStart' : 'padEnd',
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          positional.length == 1
              ? const EsmStringLiteral(' ')
              : _lowerExpression(
                  semantic,
                  helpers,
                  locals,
                  positional[1],
                  thisExpression: thisExpression,
                ),
        ],
      );
    }
    if (target == 'dart:core::String::@methods::replaceFirst' &&
        expression.arguments.named.isEmpty &&
        positional.length >= 2 &&
        positional.length <= 3) {
      helpers.require(EsmRuntimeHelper.stringOps);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringOps),
        arguments: [
          receiver,
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
    if (target == 'dart:core::String::@methods::replaceRange' &&
        expression.arguments.named.isEmpty &&
        positional.length == 3) {
      helpers.require(EsmRuntimeHelper.stringOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartStringReplaceRange'),
        arguments: [
          receiver,
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

  EsmExpression? _lowerCoreStringPatternInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    EsmExpression receiver, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    EsmExpression lower(k.Expression argument) => _lowerExpression(
      semantic,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );

    EsmExpression callPatternHelper(
      String name,
      List<EsmExpression> arguments,
    ) {
      helpers.require(EsmRuntimeHelper.pattern);
      return EsmCall(callee: EsmIdentifier(name), arguments: arguments);
    }

    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::contains' &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringContains', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::startsWith' &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringStartsWith', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::indexOf' &&
        positional.isNotEmpty &&
        positional.length <= 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringIndexOf', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::lastIndexOf' &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return callPatternHelper('__dartStringLastIndexOf', [
        receiver,
        lower(positional[0]),
        positional.length == 2 ? lower(positional[1]) : const EsmNullLiteral(),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::split' &&
        positional.length == 1 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringSplit', [
        receiver,
        lower(positional.single),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::allMatches' &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return callPatternHelper('__dartPatternAllMatches', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::matchAsPrefix' &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return callPatternHelper('__dartPatternMatchAsPrefix', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceAll' &&
        positional.length == 2 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringReplaceAll', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceAllMapped' &&
        positional.length == 2) {
      return callPatternHelper('__dartStringReplaceAllMapped', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceFirst' &&
        positional.length >= 2 &&
        positional.length <= 3 &&
        !_isStringLiteralArgument(expression.arguments, 0)) {
      return callPatternHelper('__dartStringReplaceFirstPattern', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
        positional.length == 3
            ? lower(positional[2])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::replaceFirstMapped' &&
        positional.length >= 2 &&
        positional.length <= 3) {
      return callPatternHelper('__dartStringReplaceFirstMapped', [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
        positional.length == 3
            ? lower(positional[2])
            : const EsmNumberLiteral(0),
      ]);
    }
    if (target == 'dart:core::String::@methods::splitMapJoin' &&
        positional.length == 1 &&
        _hasOnlyNamedArguments(expression.arguments, {
          'onMatch',
          'onNonMatch',
        })) {
      return callPatternHelper('__dartStringSplitMapJoin', [
        receiver,
        lower(positional.single),
        _lowerNamedArgument(
              semantic,
              helpers,
              locals,
              expression.arguments,
              'onMatch',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteral(),
        _lowerNamedArgument(
              semantic,
              helpers,
              locals,
              expression.arguments,
              'onNonMatch',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteral(),
      ]);
    }
    return null;
  }

  EsmExpression? _lowerCoreStringBufferInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (!_isCoreStringBufferMember(target) ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final positional = expression.arguments.positional;
    final name = expression.name.text;
    final matchesShape = switch (name) {
      'write' || 'writeCharCode' => positional.length == 1,
      'writeAll' => positional.length >= 1 && positional.length <= 2,
      'writeln' => positional.length <= 1,
      'clear' || 'toString' => positional.isEmpty,
      _ => false,
    };
    if (!matchesShape) {
      return null;
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: name,
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

  EsmExpression? _lowerCorePatternInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty ||
        !target.startsWith('dart:core::Pattern::@methods::')) {
      return null;
    }
    final positional = expression.arguments.positional;
    final helperName = switch (expression.name.text) {
      'allMatches' when positional.isNotEmpty && positional.length <= 2 =>
        '__dartPatternAllMatches',
      'matchAsPrefix' when positional.isNotEmpty && positional.length <= 2 =>
        '__dartPatternMatchAsPrefix',
      _ => null,
    };
    if (helperName == null) {
      return null;
    }
    helpers.require(EsmRuntimeHelper.pattern);
    return EsmCall(
      callee: EsmIdentifier(helperName),
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
          positional[0],
          thisExpression: thisExpression,
        ),
        positional.length == 2
            ? _lowerExpression(
                semantic,
                helpers,
                locals,
                positional[1],
                thisExpression: thisExpression,
              )
            : const EsmNumberLiteral(0),
      ],
    );
  }

  EsmExpression? _lowerCoreRegExpInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty ||
        !_isCoreRegExpMember(target)) {
      return null;
    }
    final positional = expression.arguments.positional;
    final method = switch (expression.name.text) {
      'hasMatch' ||
      'firstMatch' ||
      'stringMatch' when positional.length == 1 => expression.name.text,
      'matchAsPrefix' || 'allMatches'
          when positional.isNotEmpty && positional.length <= 2 =>
        expression.name.text,
      'toString' when positional.isEmpty => expression.name.text,
      _ => null,
    };
    if (method == null) {
      return null;
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: method,
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

  EsmExpression? _lowerCoreMatchInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty ||
        !_isCoreMatchMember(target)) {
      return null;
    }
    final positional = expression.arguments.positional;
    final method = switch (expression.name.text) {
      'group' ||
      'groups' ||
      'namedGroup' when positional.length == 1 => expression.name.text,
      _ => null,
    };
    if (method == null) {
      return null;
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: method,
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

  EsmExpression? _lowerCoreCollectionInstanceInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    EsmExpression lower(k.Expression argument) => _lowerExpression(
      semantic,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );
    final queueInvocation = sdkIntrinsics.lowerInstanceInvocation(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
      arguments: expression.arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: () => lower(expression.receiver),
      lower: lower,
      lowerNamedArgument: (arguments, name) => _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        arguments,
        name,
        thisExpression: thisExpression,
      ),
      arrayFrom: (value) => _arrayFrom(helpers, value),
    );
    if (queueInvocation != null) {
      return queueInvocation;
    }
    final memberName = expression.name.text;
    final isListMember = isDartCoreListMember(
      expression.interfaceTargetReference,
      memberName,
    );
    if (target == 'dart:core::Iterable::@methods::toList' &&
        expression.arguments.positional.isEmpty &&
        _hasOnlyNamedArguments(expression.arguments, {'growable'})) {
      helpers.require(EsmRuntimeHelper.listFactory);
      final growable =
          _lowerNamedArgument(
            semantic,
            helpers,
            locals,
            expression.arguments,
            'growable',
            thisExpression: thisExpression,
          ) ??
          const EsmBooleanLiteral(true);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          growable,
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::toSet' ||
            target == 'dart:core::List::@methods::toSet') &&
        expression.arguments.positional.isEmpty &&
        expression.arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCall(
        callee: const EsmIdentifier('__dartSetFrom'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::whereType' ||
            target == 'dart:core::List::@methods::whereType') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty &&
        expression.arguments.types.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
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
    if ((target == 'dart:core::Iterable::@methods::cast' ||
            target == 'dart:core::List::@methods::cast' ||
            target == 'dart:core::Set::@methods::cast' ||
            target == 'dart:_compact_hash::_Set::@methods::cast') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty &&
        expression.arguments.types.length == 1) {
      return _lowerExpression(
        semantic,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
    }
    if ((target == 'dart:core::Iterable::@methods::map' ||
            target == 'dart:core::List::@methods::map') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
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
            expression.receiver,
            thisExpression: thisExpression,
          ),
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
    if ((target == 'dart:core::Iterable::@methods::where' ||
            target == 'dart:core::List::@methods::where') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::any' ||
            target == 'dart:core::List::@methods::any' ||
            target == 'dart:core::Iterable::@methods::every' ||
            target == 'dart:core::List::@methods::every' ||
            target == 'dart:_internal::ListIterable::@methods::any' ||
            target == 'dart:_internal::ListIterable::@methods::every') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      final method =
          target == 'dart:core::Iterable::@methods::any' ||
              target == 'dart:core::List::@methods::any' ||
              target == 'dart:_internal::ListIterable::@methods::any'
          ? 'some'
          : 'every';
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: method,
        ),
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
    if ((target == 'dart:core::Iterable::@methods::firstWhere' ||
            target == 'dart:core::List::@methods::firstWhere' ||
            target == 'dart:core::Iterable::@methods::lastWhere' ||
            target == 'dart:core::List::@methods::lastWhere' ||
            target == 'dart:core::Iterable::@methods::singleWhere' ||
            target == 'dart:core::List::@methods::singleWhere') &&
        _hasOnlyNamedArguments(expression.arguments, {'orElse'}) &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterableSearch);
      final helperName = switch (target) {
        'dart:core::Iterable::@methods::firstWhere' ||
        'dart:core::List::@methods::firstWhere' => '__dartIterableFirstWhere',
        'dart:core::Iterable::@methods::lastWhere' ||
        'dart:core::List::@methods::lastWhere' => '__dartIterableLastWhere',
        'dart:core::Iterable::@methods::singleWhere' ||
        'dart:core::List::@methods::singleWhere' => '__dartIterableSingleWhere',
        _ => throw StateError('unreachable Iterable search target'),
      };
      final orElse = _lowerNamedArgument(
        semantic,
        helpers,
        locals,
        expression.arguments,
        'orElse',
        thisExpression: thisExpression,
      );
      return EsmCall(
        callee: EsmIdentifier(helperName),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
          if (orElse != null) orElse,
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::fold' ||
            target == 'dart:core::List::@methods::fold') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'reduce',
        ),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional[1],
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional[0],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::reduce' ||
            target == 'dart:core::List::@methods::reduce') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'reduce',
        ),
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
    if ((target == 'dart:core::Iterable::@methods::forEach' ||
            target == 'dart:core::List::@methods::forEach') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'forEach',
        ),
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
    if ((target == 'dart:core::Iterable::@methods::elementAt' ||
            target == 'dart:core::List::@methods::elementAt') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmComputedPropertyAccess(
        receiver: _arrayFrom(
          helpers,
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
        ),
        property: _lowerExpression(
          semantic,
          helpers,
          locals,
          expression.arguments.positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    if ((target == 'dart:core::List::@methods::indexOf' ||
            target == 'dart:core::List::@methods::lastIndexOf' ||
            target == 'dart:core::List::@methods::indexWhere' ||
            target == 'dart:core::List::@methods::lastIndexWhere') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isNotEmpty &&
        expression.arguments.positional.length <= 2) {
      helpers.require(EsmRuntimeHelper.listSearch);
      final helperName = switch (target) {
        'dart:core::List::@methods::indexOf' => '__dartListIndexOf',
        'dart:core::List::@methods::lastIndexOf' => '__dartListLastIndexOf',
        'dart:core::List::@methods::indexWhere' => '__dartListIndexWhere',
        'dart:core::List::@methods::lastIndexWhere' =>
          '__dartListLastIndexWhere',
        _ => throw StateError('unreachable List search target'),
      };
      return EsmCall(
        callee: EsmIdentifier(helperName),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
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
    if (target == 'dart:core::List::@methods::sort' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.compare);
      final compare = expression.arguments.positional.isEmpty
          ? helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare)
          : EsmArrowFunction(
              parameters: const [
                EsmIdentifierParameter(name: 'left'),
                EsmIdentifierParameter(name: 'right'),
              ],
              body: EsmCall(
                callee: helpers.reference(
                  runtimeHelpers,
                  EsmRuntimeHelper.compare,
                ),
                arguments: [
                  const EsmIdentifier('left'),
                  const EsmIdentifier('right'),
                  _lowerExpression(
                    semantic,
                    helpers,
                    locals,
                    expression.arguments.positional.single,
                    thisExpression: thisExpression,
                  ),
                ],
              ),
            );
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'sort',
        ),
        arguments: [compare],
      );
    }
    if (target == 'dart:core::List::@methods::shuffle' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length <= 1) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListShuffle'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          if (expression.arguments.positional.isEmpty)
            const EsmNullLiteral()
          else
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
    if (target ==
            'dart:collection::ListBase::@methods::dart:collection::_closeGap' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 2) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListRemoveRange'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
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
    if (target ==
            'dart:collection::ListBase::@methods::dart:collection::_filter' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty &&
        expression.arguments.positional.length == 2) {
      final retainMatching = expression.arguments.positional[1];
      if (retainMatching is k.BoolLiteral) {
        helpers.require(EsmRuntimeHelper.listMutation);
        return EsmCall(
          callee: EsmIdentifier(
            retainMatching.value
                ? '__dartListRetainWhere'
                : '__dartListRemoveWhere',
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
              expression.arguments.positional.first,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
    }
    final listMutationHelper = isListMember
        ? switch (memberName) {
            'removeAt' => '__dartListRemoveAt',
            'insert' => '__dartListInsert',
            'remove' => '__dartListRemove',
            'insertAll' => '__dartListInsertAll',
            'setAll' => '__dartListSetAll',
            'fillRange' => '__dartListFillRange',
            'replaceRange' => '__dartListReplaceRange',
            'removeRange' => '__dartListRemoveRange',
            'removeWhere' => '__dartListRemoveWhere',
            'retainWhere' => '__dartListRetainWhere',
            'setRange' => '__dartListSetRange',
            _ => null,
          }
        : null;
    if (listMutationHelper != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isNotEmpty) {
      helpers.require(
        listMutationHelper == '__dartListSetRange'
            ? EsmRuntimeHelper.listRangeOps
            : EsmRuntimeHelper.listMutation,
      );
      return EsmCall(
        callee: EsmIdentifier(listMutationHelper),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
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
    if (target == 'dart:core::List::@methods::setRange' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length >= 3 &&
        expression.arguments.positional.length <= 4) {
      helpers.require(EsmRuntimeHelper.listRangeOps);
      return EsmCall(
        callee: const EsmIdentifier('__dartListSetRange'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
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
    if (target == 'dart:core::List::@methods::removeLast' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListRemoveLast'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (target == 'dart:core::List::@methods::asMap' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.listMutation);
      return EsmCall(
        callee: const EsmIdentifier('__dartListAsMap'),
        arguments: [
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isListMember &&
        memberName == 'sublist' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isNotEmpty &&
        expression.arguments.positional.length <= 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'slice',
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
    if (isListMember &&
        memberName == 'getRange' &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 2) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'slice',
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
    if ((target == 'dart:core::Iterable::@methods::take' ||
            target == 'dart:core::List::@methods::take') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::takeWhile' ||
            target == 'dart:core::List::@methods::takeWhile') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterableWindow);
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.iterableWindow,
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::skipWhile' ||
            target == 'dart:core::List::@methods::skipWhile') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      helpers.require(EsmRuntimeHelper.iterableWindow);
      return EsmCall(
        callee: const EsmIdentifier('__dartIterableSkipWhile'),
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::followedBy' ||
            target == 'dart:core::List::@methods::followedBy') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'concat',
        ),
        arguments: [
          _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.arguments.positional.single,
              thisExpression: thisExpression,
            ),
          ),
        ],
      );
    }
    if ((target == 'dart:core::Iterable::@methods::expand' ||
            target == 'dart:core::List::@methods::expand') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
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
                    expression.arguments.positional.single,
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
    if ((target == 'dart:core::Iterable::@methods::skip' ||
            target == 'dart:core::List::@methods::skip') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              semantic,
              helpers,
              locals,
              expression.receiver,
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
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    return null;
  }

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

  EsmExpression _lowerStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final helperCall = _lowerRuntimeStaticInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (helperCall != null) {
      return helperCall;
    }
    final extensionTypeMember = semantic.extensionTypeMemberSymbolForReference(
      expression.targetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeStaticInvocation(
        semantic,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final targetNode = expression.targetReference.node;
    final target =
        (targetNode is k.Procedure ? semantic.symbolFor(targetNode) : null) ??
        semantic.symbolForReference(expression.targetReference);
    if (target != null) {
      if (target.kind != EsmProcedureKind.method) {
        throw UnsupportedCompilerFeature(
          expression.targetReference,
          'static accessor call',
        );
      }
      return EsmCall(
        callee: EsmIdentifier(target.name),
        arguments: _lowerArguments(
          semantic,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'static invocation arguments',
        ),
      );
    }
    final staticTarget =
        (targetNode is k.Procedure
            ? semantic.staticProcedureSymbolFor(targetNode)
            : null) ??
        semantic.staticProcedureSymbolForReference(expression.targetReference);
    final staticClass = staticTarget == null
        ? null
        : semantic.classSymbolFor(staticTarget.node.enclosingClass!);
    if (staticTarget != null &&
        staticClass != null &&
        staticTarget.kind == EsmProcedureKind.method) {
      final arguments = _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'static invocation arguments',
      );
      if (staticTarget.node.kind == k.ProcedureKind.Factory &&
          staticTarget.node.name.text.isEmpty) {
        return EsmNew(
          callee: EsmIdentifier(staticClass.name),
          arguments: arguments,
        );
      }
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(staticClass.name),
          property: staticTarget.name,
        ),
        arguments: arguments,
      );
    }
    throw UnsupportedCompilerFeature(
      expression,
      'external static target '
      '${kernelReferencePath(expression.targetReference)} '
      '(positional ${expression.arguments.positional.length}, '
      'named ${expression.arguments.named.length}, '
      'types ${expression.arguments.types.length})',
    );
  }

  EsmExpression _lowerExtensionTypeStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final kind = member.descriptor.kind;
    if (kind == k.ExtensionTypeMemberKind.Field) {
      throw UnsupportedCompilerFeature(
        expression,
        'extension type static invocation',
      );
    }
    if (_isExtensionTypeTearOffReference(member, expression.targetReference) &&
        !member.descriptor.isStatic &&
        expression.arguments.positional.length == 1 &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      final extensionType = semantic.extensionTypeSymbolFor(
        member.extensionType,
      );
      if (extensionType == null) {
        throw UnsupportedCompilerFeature(
          member.descriptor,
          'extension type tear-off',
        );
      }
      return _lowerExtensionTypeInstanceTearOff(
        semantic,
        helpers,
        member,
        _lowerExtensionTypeRepresentation(
          helpers,
          _lowerExpression(
            semantic,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
          extensionType,
        ),
      );
    }
    return EsmCall(
      callee: EsmIdentifier(member.backingName),
      arguments: _lowerArguments(
        semantic,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'extension type static invocation arguments',
      ),
    );
  }

  bool _isExtensionTypeTearOffReference(
    EsmExtensionTypeMemberSymbol member,
    k.Reference reference,
  ) {
    final tearOffReference = member.tearOffReference;
    return tearOffReference != null &&
        kernelReferencePath(tearOffReference) == kernelReferencePath(reference);
  }

  EsmExpression? _lowerRuntimeStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final coreErrorFactoryName = dartCoreErrorFactoryName(
      expression.targetReference,
    );
    if (coreErrorFactoryName != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      return _lowerCoreErrorCreation(
        semantic,
        helpers,
        locals,
        coreErrorFactoryName,
        expression.arguments.positional,
        thisExpression: thisExpression,
      );
    }
    final sdkStatic = sdkIntrinsics.lowerStaticInvocation(
      expression: expression,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lower: (argument) => _lowerExpression(
        semantic,
        helpers,
        locals,
        argument,
        thisExpression: thisExpression,
      ),
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
    if (sdkStatic != null) {
      return sdkStatic;
    }
    final webStatic = _lowerWebStaticInvocation(
      semantic,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (webStatic != null) {
      return webStatic;
    }
    if (_isCoreGrowableListLiteral(expression.targetReference)) {
      return _lowerCoreGrowableListLiteral(
        semantic,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
    }
    return null;
  }

  EsmExpression? _lowerWebStaticInvocation(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    final positional = expression.arguments.positional;
    if (kernelReferencePath(expression.targetReference) ==
            'dart:svg::SvgElement::@factories::tag' &&
        positional.length == 1 &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmPropertyAccess(
            receiver: EsmIdentifier('globalThis'),
            property: 'document',
          ),
          property: 'createElementNS',
        ),
        arguments: [
          const EsmStringLiteral('http://www.w3.org/2000/svg'),
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

  bool _isCoreStringBufferConstructor(String target) {
    return target == 'dart:core::StringBuffer::@constructors::';
  }

  bool _isCoreStringBufferMember(String target) {
    return target.startsWith('dart:core::StringBuffer::@');
  }

  bool _isCoreRunesConstructor(String target) {
    return target == 'dart:core::Runes::@constructors::';
  }

  bool _isCoreExpandoMember(String target) {
    return target.startsWith('dart:core::Expando::@');
  }

  EsmExpression? _lowerNamedArgument(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments,
    String name, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    for (final argument in arguments.named) {
      if (argument.name == name) {
        return _lowerExpression(
          semantic,
          helpers,
          locals,
          argument.value,
          thisExpression: thisExpression,
        );
      }
    }
    return null;
  }

  bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
    return arguments.named.every((argument) => names.contains(argument.name));
  }

  EsmCall _arrayFrom(EsmRuntimeHelperUseSet helpers, EsmExpression value) {
    helpers.require(EsmRuntimeHelper.iterableToArray);
    return EsmCall(
      callee: helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.iterableToArray,
      ),
      arguments: [value],
    );
  }

  EsmCall _stringRunes(EsmExpression value) {
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('Array'),
        property: 'from',
      ),
      arguments: [
        EsmCall(callee: const EsmIdentifier('String'), arguments: [value]),
        const EsmArrowFunction(
          parameters: [EsmIdentifierParameter(name: 'char')],
          body: EsmCall(
            callee: EsmPropertyAccess(
              receiver: EsmIdentifier('char'),
              property: 'codePointAt',
            ),
            arguments: [EsmNumberLiteral(0)],
          ),
        ),
      ],
    );
  }

  EsmExpression _lowerCoreGrowableListLiteral(
    Semantic semantic,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpression thisExpression = const EsmThis(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      throw UnsupportedCompilerFeature(
        expression,
        'GrowableList literal shape',
      );
    }
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

  bool _isCoreGrowableListLiteral(k.Reference reference) {
    return reference.toStringInternal().startsWith(
      'dart:core::_GrowableList::@factories::dart:core::_literal',
    );
  }

  String _instanceMemberName(Semantic semantic, k.Member member) {
    if (member is k.Field) {
      return _instanceFieldName(semantic, member);
    }
    if (member is k.Procedure) {
      final symbol = semantic.instanceProcedureSymbolFor(member);
      if (symbol != null) {
        return symbol.name;
      }
    }
    throw UnsupportedCompilerFeature(
      member,
      'instance member lowering ${kernelReferencePath(member.reference)}',
    );
  }

  EsmExpression _memberAccess(EsmExpression receiver, String memberName) {
    if (isJsIdentifierName(memberName)) {
      return EsmPropertyAccess(receiver: receiver, property: memberName);
    }
    return EsmComputedPropertyAccess(
      receiver: receiver,
      property: EsmStringLiteral(memberName),
    );
  }

  String _instanceFieldName(Semantic semantic, k.Field field) {
    final symbol = semantic.instanceFieldSymbolFor(field);
    if (symbol == null) {
      throw UnsupportedCompilerFeature(field, 'instance field lowering');
    }
    return symbol.name;
  }

  EsmExpression _lowerVariableGet(
    Map<k.VariableDeclaration, String> locals,
    k.VariableGet expression,
  ) {
    final name = locals[expression.variable];
    if (name == null) {
      throw UnsupportedCompilerFeature(
        expression,
        'unbound variable get ${expression.variable.name ?? '<unnamed>'} '
        'in ${expression.variable.parent.runtimeType}',
      );
    }
    if (expression.variable.isLate) {
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier(name),
          property: 'get',
        ),
        arguments: const [],
      );
    }
    return EsmIdentifier(name);
  }

  String _freshParameterName(
    Semantic semantic,
    Set<String> usedParameters,
    String original,
  ) {
    final name = _freshLocalName(semantic, usedParameters, original);
    usedParameters.add(name);
    return name;
  }

  String _freshLocalName(
    Semantic semantic,
    Iterable<String> usedNames,
    String original, {
    Iterable<String> reservedNames = const [],
  }) {
    return _freshIn({
      ...semantic.globalBindingNames,
      ...reservedNames,
      ...usedNames,
    }, original);
  }

  String _freshIn(Set<String> usedNames, String original) {
    var name = sanitizeJsIdentifier(original);
    if (!isJsBindingIdentifier(name)) {
      name = '\$$name';
    }
    var candidate = name;
    var suffix = 1;
    while (!usedNames.add(candidate)) {
      candidate = '${name}_$suffix';
      suffix++;
    }
    return candidate;
  }
}

final class _ContinueSwitchTarget {
  const _ContinueSwitchTarget({
    required this.stateName,
    required this.loopLabel,
    required this.caseIndex,
  });

  final String stateName;
  final String loopLabel;
  final int caseIndex;
}

bool _switchCanContinueToCase(k.SwitchStatement statement) {
  final targets = statement.cases.toSet();
  for (final switchCase in statement.cases) {
    if (_containsContinueToSwitchCase(switchCase.body, targets)) {
      return true;
    }
  }
  return false;
}

bool _containsContinueToSwitchCase(
  k.Statement statement,
  Set<k.SwitchCase> targets,
) {
  switch (statement) {
    case k.ContinueSwitchStatement():
      return targets.contains(statement.target);
    case k.Block():
      return statement.statements.any(
        (child) => _containsContinueToSwitchCase(child, targets),
      );
    case k.LabeledStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.ExpressionStatement() ||
        k.EmptyStatement() ||
        k.ReturnStatement() ||
        k.VariableDeclaration() ||
        k.BreakStatement() ||
        k.AssertStatement():
      return false;
    case k.FunctionDeclaration():
      return false;
    case k.IfStatement():
      return _containsContinueToSwitchCase(statement.then, targets) ||
          (statement.otherwise != null &&
              _containsContinueToSwitchCase(statement.otherwise!, targets));
    case k.WhileStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.DoStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.ForStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.ForInStatement():
      return _containsContinueToSwitchCase(statement.body, targets);
    case k.SwitchStatement():
      return statement.cases.any(
        (switchCase) => _containsContinueToSwitchCase(switchCase.body, targets),
      );
    case k.TryCatch():
      return _containsContinueToSwitchCase(statement.body, targets) ||
          statement.catches.any(
            (catchNode) =>
                _containsContinueToSwitchCase(catchNode.body, targets),
          );
    case k.TryFinally():
      return _containsContinueToSwitchCase(statement.body, targets) ||
          _containsContinueToSwitchCase(statement.finalizer, targets);
    case k.AssertBlock():
      return statement.statements.any(
        (child) => _containsContinueToSwitchCase(child, targets),
      );
    default:
      return false;
  }
}

final class _VariableReferenceVisitor extends k.RecursiveVisitor {
  _VariableReferenceVisitor(this.variable);

  final k.VariableDeclaration variable;
  bool found = false;

  @override
  void defaultDartType(k.DartType node) {}

  @override
  void visitStaticInvocation(k.StaticInvocation node) {
    node.arguments.accept(this);
  }

  @override
  void visitConstructorInvocation(k.ConstructorInvocation node) {
    node.arguments.accept(this);
  }

  @override
  void visitInstanceInvocation(k.InstanceInvocation node) {
    node.receiver.accept(this);
    node.arguments.accept(this);
  }

  @override
  void visitEqualsCall(k.EqualsCall node) {
    node.left.accept(this);
    node.right.accept(this);
  }

  @override
  void visitVariableGet(k.VariableGet node) {
    if (node.variable == variable) {
      found = true;
      return;
    }
    super.visitVariableGet(node);
  }
}

const _binaryOperators = {
  '+': EsmBinaryOperator.add,
  '-': EsmBinaryOperator.subtract,
  '*': EsmBinaryOperator.multiply,
  '/': EsmBinaryOperator.divide,
  '%': EsmBinaryOperator.remainder,
  '<': EsmBinaryOperator.lessThan,
  '<=': EsmBinaryOperator.lessThanOrEqual,
  '>': EsmBinaryOperator.greaterThan,
  '>=': EsmBinaryOperator.greaterThanOrEqual,
  '&': EsmBinaryOperator.bitAnd,
  '|': EsmBinaryOperator.bitOr,
  '^': EsmBinaryOperator.bitXor,
  '<<': EsmBinaryOperator.leftShift,
  '>>': EsmBinaryOperator.signedRightShift,
  '>>>': EsmBinaryOperator.unsignedRightShift,
};
