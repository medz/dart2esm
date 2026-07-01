import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../../kernel/kernel_references.dart';
import '../../kernel/sdk_symbols.dart';
import '../../names/js_names.dart';
import '../../world/sdk_classification.dart';
import '../compiler_stage.dart';
import '../ir/esm_ir.dart';
import '../new_compiler_unsupported.dart';
import '../runtime/runtime_helpers.dart';
import '../semantic/semantic_world.dart';
import 'intrinsics/sdk_intrinsics.dart';
import 'lowering_context.dart';

final class LoweringResult {
  LoweringResult({
    required this.semantic,
    required Iterable<EsmModuleItemIr> items,
    required Iterable<EsmRuntimeHelper> runtimeHelpers,
  }) : items = List.unmodifiable(items),
       runtimeHelpers = List.unmodifiable(runtimeHelpers);

  final SemanticWorldResult semantic;
  final List<EsmModuleItemIr> items;
  final List<EsmRuntimeHelper> runtimeHelpers;
}

final class KernelToEsmIrLoweringStage
    implements Dart2EsmCompilerStage<SemanticWorldResult, LoweringResult> {
  const KernelToEsmIrLoweringStage({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
    this.sdkIntrinsics = const DartSdkIntrinsicRegistry(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;
  final DartSdkIntrinsicRegistry sdkIntrinsics;

  @override
  Dart2EsmCompilerStageId get stageId => Dart2EsmCompilerStageId.dartLowering;

  @override
  LoweringResult run(SemanticWorldResult input, Dart2EsmStageContext context) {
    return lower(input, runMain: context.runMain);
  }

  LoweringResult lower(SemanticWorldResult semantic, {required bool runMain}) {
    final context = DartLoweringContext(
      world: semantic.world,
      runtimeHelpers: runtimeHelpers,
    );
    final world = context.world;
    final helpers = context.helpers;
    final items = <EsmModuleItemIr>[
      for (final klass in world.classes)
        ..._lowerClassItems(world, helpers, klass),
      for (final extensionType in world.extensionTypes)
        ..._lowerExtensionTypeItems(world, helpers, extensionType),
      for (final field in world.fields)
        ..._lowerFieldItems(world, helpers, field),
      for (final procedure in world.procedures)
        _lowerProcedure(world, helpers, procedure),
      if (runMain)
        EsmExpressionStatementIr(
          EsmCallIr(
            callee: EsmIdentifierIr(world.symbolForRequired(world.main).name),
            arguments: const [],
          ),
        ),
    ];
    return LoweringResult(
      semantic: semantic,
      items: items,
      runtimeHelpers: context.runtimeHelperUses,
    );
  }

  List<EsmModuleItemIr> _lowerClassItems(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
  ) {
    final markerName = klass.interfaceMarkerName;
    return [
      if (markerName != null)
        EsmVariableDeclarationIr(
          binding: EsmIdentifierBindingIr(markerName),
          initializer: EsmCallIr(
            callee: const EsmIdentifierIr('Symbol'),
            arguments: [EsmStringLiteralIr(klass.node.name)],
          ),
          mutable: false,
        ),
      klass.node.isEnum
          ? _lowerEnumClass(world, helpers, klass)
          : _lowerClass(world, helpers, klass),
      for (final field in klass.staticFields)
        ..._lowerStaticFieldItems(world, helpers, klass, field),
      if (markerName != null) _lowerInterfaceHasInstance(klass, markerName),
    ];
  }

  EsmClassIr _lowerEnumClass(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
  ) {
    final interfaceMarkers = _interfaceMarkersForClass(world, klass);
    final enumIndex = r'$index';
    final enumName = r'$name';
    return EsmClassIr(
      name: klass.name,
      export: klass.export,
      superclass: null,
      constructor: EsmClassConstructorIr(
        parameters: [
          EsmIdentifierParameterIr(name: enumIndex),
          EsmIdentifierParameterIr(name: enumName),
          for (final field in klass.fields)
            EsmIdentifierParameterIr(name: field.name),
        ],
        body: [
          _lowerDefineProperty(
            const EsmThisIr(),
            'index',
            EsmIdentifierIr(enumIndex),
            enumerable: true,
          ),
          _lowerDefineProperty(
            const EsmThisIr(),
            '__dartEnumName',
            EsmIdentifierIr(enumName),
          ),
          _lowerDefineProperty(
            const EsmThisIr(),
            'name',
            EsmIdentifierIr(enumName),
            enumerable: true,
          ),
          for (final field in klass.fields)
            _lowerDefineProperty(
              const EsmThisIr(),
              field.name,
              EsmIdentifierIr(field.name),
              enumerable: true,
            ),
          ..._lowerInterfaceMarkerDefinitions(
            const EsmThisIr(),
            interfaceMarkers,
          ),
          const EsmExpressionStatementIr(
            EsmCallIr(
              callee: EsmPropertyAccessIr(
                receiver: EsmIdentifierIr('Object'),
                property: 'freeze',
              ),
              arguments: [EsmThisIr()],
            ),
          ),
        ],
      ),
      methods: [
        for (final procedure in klass.staticProcedures)
          if (procedure.node.kind != k.ProcedureKind.Factory ||
              procedure.node.name.text.isNotEmpty)
            _lowerClassProcedure(
              world,
              helpers,
              klass,
              procedure,
              isStatic: true,
            ),
        for (final procedure in klass.procedures)
          if (procedure.emit && procedure.node.name.text != '_enumToString')
            _lowerClassProcedure(world, helpers, klass, procedure),
        if (!_hasInstanceProcedure(klass, 'toString'))
          _lowerEnumToString(klass),
      ],
    );
  }

  EsmClassMethodIr _lowerEnumToString(EsmClassSymbol klass) {
    return EsmClassMethodIr(
      key: EsmStaticPropertyKeyIr('toString'),
      kind: EsmClassMethodKindIr.method,
      isStatic: false,
      parameters: const [],
      body: [
        EsmReturnStatementIr(
          EsmStringConcatenationIr([
            EsmStringLiteralIr('${klass.node.name}.'),
            const EsmPropertyAccessIr(
              receiver: EsmThisIr(),
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

  EsmExpressionStatementIr _lowerDefineProperty(
    EsmExpressionIr receiver,
    String property,
    EsmExpressionIr value, {
    bool enumerable = false,
  }) {
    return EsmExpressionStatementIr(
      EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Object'),
          property: 'defineProperty',
        ),
        arguments: [
          receiver,
          EsmStringLiteralIr(property),
          EsmObjectLiteralIr([
            EsmObjectLiteralPropertyIr.static(key: 'value', value: value),
            EsmObjectLiteralPropertyIr.static(
              key: 'enumerable',
              value: EsmBooleanLiteralIr(enumerable),
            ),
          ]),
        ],
      ),
    );
  }

  EsmClassIr _lowerClass(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
  ) {
    final superclass = klass.jsSuperclass == null
        ? null
        : world.classSymbolFor(klass.jsSuperclass!);
    if (klass.jsSuperclass != null && superclass == null) {
      throw NewCompilerUnsupported(klass.node, 'class inheritance lowering');
    }
    final unnamedConstructors = [
      for (final constructor in klass.constructors)
        if (constructor.name.isEmpty) constructor,
    ];
    if (unnamedConstructors.length > 1) {
      throw NewCompilerUnsupported(klass.node, 'unnamed constructor lowering');
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
      throw NewCompilerUnsupported(klass.node, 'unnamed factory lowering');
    }
    final interfaceMarkers = _interfaceMarkersForClass(world, klass);
    final constructor = unnamedConstructors.isNotEmpty
        ? _lowerConstructor(
            world,
            helpers,
            unnamedConstructors.single,
            interfaceMarkers: interfaceMarkers,
          )
        : unnamedFactories.isNotEmpty
        ? _lowerFactoryConstructor(world, helpers, unnamedFactories.single)
        : namedConstructors.isNotEmpty
        ? _lowerMissingUnnamedConstructor(klass)
        : klass.fields.isNotEmpty || interfaceMarkers.isNotEmpty
        ? _lowerImplicitDefaultConstructor(
            world,
            helpers,
            klass,
            interfaceMarkers: interfaceMarkers,
          )
        : null;
    final methods = [
      for (final constructor in namedConstructors)
        _lowerNamedConstructor(
          world,
          helpers,
          constructor,
          interfaceMarkers: interfaceMarkers,
        ),
      for (final procedure in klass.staticProcedures)
        if (procedure.node.kind != k.ProcedureKind.Factory ||
            procedure.node.name.text.isNotEmpty)
          _lowerClassProcedure(
            world,
            helpers,
            klass,
            procedure,
            isStatic: true,
          ),
      for (final procedure in klass.procedures)
        if (procedure.emit)
          _lowerClassProcedure(world, helpers, klass, procedure),
    ];
    methods.addAll(
      _lowerInterfaceMethodBridges(world, helpers, klass, methods),
    );
    methods.addAll(_lowerDartConvertSuperclassBridges(klass, methods));
    methods.addAll(
      _lowerPublicMemberNameBridges(world, helpers, klass, methods),
    );
    methods.addAll(_lowerInheritedAccessorBridges(world, klass, methods));
    return EsmClassIr(
      name: klass.name,
      export: klass.export,
      superclass: superclass == null ? null : EsmIdentifierIr(superclass.name),
      constructor: constructor,
      methods: methods,
    );
  }

  List<EsmClassMethodIr> _lowerInterfaceMethodBridges(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    List<EsmClassMethodIr> methods,
  ) {
    final existing = {
      for (final method in methods)
        if (!method.isStatic) (method.name, method.kind),
    };
    final ownProcedures = [
      for (final procedure in klass.procedures)
        if (procedure.emit) procedure,
    ];
    final bridges = <EsmClassMethodIr>[];
    for (final interfaceClassNode in klass.interfaceMarkerClasses) {
      final interfaceClass = world.classSymbolFor(interfaceClassNode);
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
            world,
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

  List<EsmClassMethodIr> _lowerDartConvertSuperclassBridges(
    EsmClassSymbol klass,
    List<EsmClassMethodIr> methods,
  ) {
    final existing = {
      for (final method in methods)
        if (!method.isStatic) (method.name, method.kind),
    };
    final bridges = <EsmClassMethodIr>[];
    void addBridge(String name, String accessor, String parameter) {
      if (!existing.add((name, EsmClassMethodKindIr.method))) {
        return;
      }
      bridges.add(
        EsmClassMethodIr(
          key: EsmStaticPropertyKeyIr(name),
          kind: EsmClassMethodKindIr.method,
          isStatic: false,
          parameters: [EsmIdentifierParameterIr(name: parameter)],
          body: [
            EsmReturnStatementIr(
              EsmCallIr(
                callee: EsmPropertyAccessIr(
                  receiver: _memberAccess(const EsmThisIr(), accessor),
                  property: 'convert',
                ),
                arguments: [EsmIdentifierIr(parameter)],
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
      if (existing.add(('addSlice', EsmClassMethodKindIr.method))) {
        bridges.add(
          EsmClassMethodIr(
            key: EsmStaticPropertyKeyIr('addSlice'),
            kind: EsmClassMethodKindIr.method,
            isStatic: false,
            parameters: const [
              EsmIdentifierParameterIr(name: 'chunk'),
              EsmIdentifierParameterIr(name: 'start'),
              EsmIdentifierParameterIr(name: 'end'),
              EsmIdentifierParameterIr(name: 'isLast'),
            ],
            body: [
              EsmExpressionStatementIr(
                EsmCallIr(
                  callee: _memberAccess(const EsmThisIr(), 'add'),
                  arguments: [
                    EsmCallIr(
                      callee: EsmPropertyAccessIr(
                        receiver: EsmCallIr(
                          callee: const EsmPropertyAccessIr(
                            receiver: EsmIdentifierIr('Array'),
                            property: 'from',
                          ),
                          arguments: [const EsmIdentifierIr('chunk')],
                        ),
                        property: 'slice',
                      ),
                      arguments: const [
                        EsmIdentifierIr('start'),
                        EsmIdentifierIr('end'),
                      ],
                    ),
                  ],
                ),
              ),
              EsmIfStatementIr(
                condition: const EsmIdentifierIr('isLast'),
                thenBody: [
                  EsmExpressionStatementIr(
                    EsmCallIr(
                      callee: _memberAccess(const EsmThisIr(), 'close'),
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
      if (existing.add(('addByte', EsmClassMethodKindIr.method))) {
        bridges.add(
          EsmClassMethodIr(
            key: EsmStaticPropertyKeyIr('addByte'),
            kind: EsmClassMethodKindIr.method,
            isStatic: false,
            parameters: const [EsmIdentifierParameterIr(name: 'byte')],
            body: [
              EsmReturnStatementIr(
                EsmCallIr(
                  callee: _memberAccess(const EsmThisIr(), 'add'),
                  arguments: const [
                    EsmArrayLiteralIr([EsmIdentifierIr('byte')]),
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
    Set<(String, EsmClassMethodKindIr)> existing,
    List<EsmClassMethodIr> bridges,
    String parameter,
  ) {
    if (!existing.add(('add', EsmClassMethodKindIr.method))) {
      return;
    }
    bridges.add(
      EsmClassMethodIr(
        key: EsmStaticPropertyKeyIr('add'),
        kind: EsmClassMethodKindIr.method,
        isStatic: false,
        parameters: [EsmIdentifierParameterIr(name: parameter)],
        body: [
          EsmReturnStatementIr(
            EsmCallIr(
              callee: _memberAccess(const EsmThisIr(), 'addSlice'),
              arguments: [
                EsmIdentifierIr(parameter),
                const EsmNumberLiteralIr(0),
                EsmPropertyAccessIr(
                  receiver: EsmIdentifierIr(parameter),
                  property: 'length',
                ),
                const EsmBooleanLiteralIr(false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  EsmClassMethodKindIr _classMethodKind(EsmClassProcedureSymbol procedure) {
    return switch (procedure.kind) {
      EsmProcedureKind.method => EsmClassMethodKindIr.method,
      EsmProcedureKind.getter => EsmClassMethodKindIr.getter,
      EsmProcedureKind.setter => EsmClassMethodKindIr.setter,
    };
  }

  List<EsmClassMethodIr> _lowerPublicMemberNameBridges(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    List<EsmClassMethodIr> methods,
  ) {
    final existing = {
      for (final method in methods)
        if (!method.isStatic) (method.name, method.kind),
    };
    final bridges = <EsmClassMethodIr>[];
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
          world,
          helpers,
          publicName,
          procedure,
          procedure,
        ),
      );
    }
    return bridges;
  }

  EsmClassMethodIr _lowerMemberForwardingBridge(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    String bridgeName,
    EsmClassProcedureSymbol interfaceProcedure,
    EsmClassProcedureSymbol implementation,
  ) {
    final function = interfaceProcedure.node.function;
    final locals = <k.VariableDeclaration, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedParameters,
      function,
    );
    return EsmClassMethodIr(
      key: EsmStaticPropertyKeyIr(bridgeName),
      kind: _classMethodKind(interfaceProcedure),
      isStatic: false,
      parameters: parameters,
      body: switch (interfaceProcedure.kind) {
        EsmProcedureKind.method => [
          EsmReturnStatementIr(
            EsmCallIr(
              callee: _memberAccess(const EsmThisIr(), implementation.name),
              arguments: _bridgeArguments(function, locals),
            ),
          ),
        ],
        EsmProcedureKind.getter => [
          EsmReturnStatementIr(
            _memberAccess(const EsmThisIr(), implementation.name),
          ),
        ],
        EsmProcedureKind.setter => [
          EsmExpressionStatementIr(
            EsmAssignmentIr(
              target: _memberAccess(const EsmThisIr(), implementation.name),
              value: EsmIdentifierIr(
                locals[function.positionalParameters.single]!,
              ),
            ),
          ),
        ],
      },
    );
  }

  List<EsmExpressionIr> _bridgeArguments(
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals,
  ) {
    return [
      for (final parameter in function.positionalParameters)
        EsmIdentifierIr(locals[parameter]!),
      if (function.namedParameters.isNotEmpty)
        EsmObjectLiteralIr([
          for (final parameter in function.namedParameters)
            EsmObjectLiteralPropertyIr.static(
              key: parameter.name!,
              value: EsmIdentifierIr(locals[parameter]!),
            ),
        ]),
    ];
  }

  List<EsmClassMethodIr> _lowerInheritedAccessorBridges(
    EsmSemanticWorld world,
    EsmClassSymbol klass,
    List<EsmClassMethodIr> methods,
  ) {
    final instanceMethods = methods.where((method) => !method.isStatic);
    final ownMethods = {
      for (final method in instanceMethods)
        if (method.kind == EsmClassMethodKindIr.method) method.name,
    };
    final ownGetters = {
      for (final method in instanceMethods)
        if (method.kind == EsmClassMethodKindIr.getter) method.name,
    };
    final ownSetters = {
      for (final method in instanceMethods)
        if (method.kind == EsmClassMethodKindIr.setter) method.name,
    };
    final bridges = <EsmClassMethodIr>[];
    for (final name in ownSetters) {
      if (!ownMethods.contains(name) &&
          !ownGetters.contains(name) &&
          _hasInheritedInstanceAccessor(
            world,
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
            world,
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
    EsmSemanticWorld world,
    EsmClassSymbol klass,
    String name,
    EsmProcedureKind kind,
  ) {
    final seen = <k.Class>{};
    var superclassNode = klass.jsSuperclass;
    while (superclassNode != null && seen.add(superclassNode)) {
      final superclass = world.classSymbolFor(superclassNode);
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

  EsmClassMethodIr _lowerInheritedGetterBridge(String name) {
    return EsmClassMethodIr(
      key: EsmStaticPropertyKeyIr(name),
      kind: EsmClassMethodKindIr.getter,
      isStatic: false,
      parameters: const [],
      body: [EsmReturnStatementIr(_memberAccess(const EsmSuperIr(), name))],
    );
  }

  EsmClassMethodIr _lowerInheritedSetterBridge(String name) {
    return EsmClassMethodIr(
      key: EsmStaticPropertyKeyIr(name),
      kind: EsmClassMethodKindIr.setter,
      isStatic: false,
      parameters: const [EsmIdentifierParameterIr(name: 'value')],
      body: [
        EsmExpressionStatementIr(
          EsmAssignmentIr(
            target: _memberAccess(const EsmSuperIr(), name),
            value: const EsmIdentifierIr('value'),
          ),
        ),
      ],
    );
  }

  List<EsmModuleItemIr> _lowerExtensionTypeItems(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
  ) {
    return [
      _lowerExtensionTypeFacade(world, helpers, extensionType),
      for (final member in extensionType.members)
        ..._lowerExtensionTypeBackingItems(world, helpers, member),
    ];
  }

  EsmClassIr _lowerExtensionTypeFacade(
    EsmSemanticWorld world,
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
      throw NewCompilerUnsupported(
        extensionType.node,
        'extension type constructor lowering',
      );
    }
    return EsmClassIr(
      name: extensionType.name,
      export: extensionType.export,
      superclass: null,
      constructor: constructors.isEmpty
          ? null
          : _lowerExtensionTypeFacadeConstructor(
              world,
              helpers,
              extensionType,
              constructors.single,
            ),
      methods: [
        for (final member in extensionType.members)
          ..._lowerExtensionTypeFacadeMethods(
            world,
            helpers,
            extensionType,
            member,
          ),
      ],
    );
  }

  EsmClassConstructorIr _lowerExtensionTypeFacadeConstructor(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final procedure = _extensionTypeProcedure(member);
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    final parameters = _bindExtensionTypeFacadeParameters(
      world,
      helpers,
      locals,
      usedNames,
      procedure.function,
      skipReceiver: false,
    );
    return EsmClassConstructorIr(
      parameters: parameters,
      body: [
        EsmExpressionStatementIr(
          EsmAssignmentIr(
            target: EsmPropertyAccessIr(
              receiver: const EsmThisIr(),
              property: extensionType.representationName,
            ),
            value: EsmCallIr(
              callee: EsmIdentifierIr(member.backingName),
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

  List<EsmClassMethodIr> _lowerExtensionTypeFacadeMethods(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeSymbol extensionType,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final descriptor = member.descriptor;
    return switch (descriptor.kind) {
      k.ExtensionTypeMemberKind.Constructor => const [],
      k.ExtensionTypeMemberKind.Field => [
        EsmClassMethodIr(
          key: EsmStaticPropertyKeyIr(member.name),
          kind: EsmClassMethodKindIr.getter,
          isStatic: true,
          parameters: const [],
          body: [
            EsmReturnStatementIr(
              _lowerExtensionTypeFacadeReturn(
                world,
                helpers,
                _extensionTypeMemberType(member),
                EsmIdentifierIr(member.backingName),
              ),
            ),
          ],
        ),
        if (member.mutable)
          EsmClassMethodIr(
            key: EsmStaticPropertyKeyIr(member.name),
            kind: EsmClassMethodKindIr.setter,
            isStatic: true,
            parameters: const [EsmIdentifierParameterIr(name: 'value')],
            body: [
              EsmReturnStatementIr(
                EsmAssignmentIr(
                  target: EsmIdentifierIr(member.backingName),
                  value: _lowerExtensionTypeRepresentation(
                    helpers,
                    const EsmIdentifierIr('value'),
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
          world,
          helpers,
          extensionType,
          member,
        ),
      ],
    };
  }

  EsmClassMethodIr _lowerExtensionTypeFacadeProcedure(
    EsmSemanticWorld world,
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
      world,
      helpers,
      locals,
      usedNames,
      procedure.function,
      skipReceiver: skipReceiver,
    );
    final call = EsmCallIr(
      callee: EsmIdentifierIr(member.backingName),
      arguments: [
        if (skipReceiver)
          _lowerExtensionTypeRepresentation(
            helpers,
            const EsmThisIr(),
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
    return EsmClassMethodIr(
      key: EsmStaticPropertyKeyIr(member.name),
      kind: switch (descriptor.kind) {
        k.ExtensionTypeMemberKind.Getter => EsmClassMethodKindIr.getter,
        k.ExtensionTypeMemberKind.Setter => EsmClassMethodKindIr.setter,
        _ => EsmClassMethodKindIr.method,
      },
      isStatic: descriptor.isStatic,
      parameters: parameters,
      body: [
        if (isSetter)
          EsmReturnStatementIr(call)
        else
          EsmReturnStatementIr(
            _lowerExtensionTypeFacadeReturn(
              world,
              helpers,
              procedure.function.returnType,
              call,
            ),
          ),
      ],
    );
  }

  List<EsmModuleItemIr> _lowerExtensionTypeBackingItems(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
  ) {
    final node = member.memberReference?.node;
    return switch (node) {
      k.Field() => [
        _lowerExtensionTypeBackingField(world, helpers, member, node),
      ],
      k.Procedure() => [
        _lowerExtensionTypeBackingProcedure(world, helpers, member, node),
      ],
      _ => throw NewCompilerUnsupported(
        member.descriptor,
        'extension type member lowering',
      ),
    };
  }

  EsmVariableDeclarationIr _lowerExtensionTypeBackingField(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    k.Field field,
  ) {
    final initializer = field.initializer;
    return EsmVariableDeclarationIr(
      binding: EsmIdentifierBindingIr(member.backingName),
      initializer: initializer == null
          ? null
          : _lowerExpression(
              world,
              helpers,
              const <k.VariableDeclaration, String>{},
              initializer,
            ),
      mutable: member.mutable,
    );
  }

  EsmFunctionIr _lowerExtensionTypeBackingProcedure(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    k.Procedure procedure,
  ) {
    if (procedure.function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(
        procedure.function,
        'async extension type member lowering',
      );
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedNames = <String>{};
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedNames,
      procedure.function,
    );
    final body = procedure.function.body;
    if (body == null) {
      if (procedure.function.positionalParameters.length == 1 &&
          member.descriptor.kind == k.ExtensionTypeMemberKind.Constructor) {
        return EsmFunctionIr(
          name: member.backingName,
          export: false,
          parameters: parameters,
          body: [
            EsmReturnStatementIr(
              EsmIdentifierIr(
                locals[procedure.function.positionalParameters.single]!,
              ),
            ),
          ],
        );
      }
      throw NewCompilerUnsupported(
        procedure.function,
        'extension type member without body',
      );
    }
    return EsmFunctionIr(
      name: member.backingName,
      export: false,
      parameters: parameters,
      body: _lowerStatementList(world, helpers, locals, labels, body),
    );
  }

  List<EsmParameterIr> _bindExtensionTypeFacadeParameters(
    EsmSemanticWorld world,
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
          world,
          helpers,
          locals,
          usedParameters,
          parameter,
        ),
      if (function.namedParameters.isNotEmpty)
        EsmObjectPatternParameterIr(
          bindings: [
            for (final parameter in function.namedParameters)
              _bindNamedParameter(
                world,
                helpers,
                locals,
                usedParameters,
                parameter,
              ),
          ],
        ),
    ];
  }

  List<EsmExpressionIr> _extensionTypeFacadeArguments(
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals, {
    required bool skipReceiver,
  }) {
    final positional = skipReceiver
        ? function.positionalParameters.skip(1)
        : function.positionalParameters;
    return [
      for (final parameter in positional) EsmIdentifierIr(locals[parameter]!),
      for (final parameter in function.namedParameters)
        EsmIdentifierIr(locals[parameter]!),
    ];
  }

  EsmExpressionIr _lowerExtensionTypeFacadeReturn(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
    EsmExpressionIr value,
  ) {
    final unaliased = type.unalias;
    if (unaliased is k.ExtensionType) {
      final symbol = world.extensionTypeSymbolFor(
        unaliased.extensionTypeDeclaration,
      );
      if (symbol != null) {
        return EsmNewIr(
          callee: EsmIdentifierIr(symbol.name),
          arguments: [
            _lowerExtensionTypeRepresentation(helpers, value, symbol),
          ],
        );
      }
    }
    return value;
  }

  EsmExpressionIr _lowerExtensionTypeRepresentation(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr value,
    EsmExtensionTypeSymbol extensionType,
  ) {
    helpers.require(EsmRuntimeHelper.extensionTypeRep);
    return EsmCallIr(
      callee: helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.extensionTypeRep,
      ),
      arguments: [value, EsmStringLiteralIr(extensionType.representationName)],
    );
  }

  k.Procedure _extensionTypeProcedure(EsmExtensionTypeMemberSymbol member) {
    final node = member.memberReference?.node;
    if (node is k.Procedure) {
      return node;
    }
    throw NewCompilerUnsupported(member.descriptor, 'extension type procedure');
  }

  k.DartType _extensionTypeMemberType(EsmExtensionTypeMemberSymbol member) {
    final node = member.memberReference?.node;
    return switch (node) {
      k.Field() => node.type,
      k.Procedure() => node.function.returnType,
      _ => const k.DynamicType(),
    };
  }

  List<EsmModuleItemIr> _lowerStaticFieldItems(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    EsmStaticFieldSymbol field,
  ) {
    helpers.require(EsmRuntimeHelper.lazyField);
    final initializer = field.node.initializer;
    return [
      EsmVariableDeclarationIr(
        binding: EsmIdentifierBindingIr(field.backingName),
        initializer: EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.lazyField),
          arguments: [
            EsmStringLiteralIr('${klass.node.name}.${field.node.name.text}'),
            EsmArrowFunctionIr(
              parameters: const [],
              body: initializer == null
                  ? const EsmNullLiteralIr()
                  : _lowerExpression(
                      world,
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
      EsmExpressionStatementIr(
        EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Object'),
            property: 'defineProperty',
          ),
          arguments: [
            EsmIdentifierIr(klass.name),
            EsmStringLiteralIr(field.name),
            EsmObjectLiteralIr([
              EsmObjectLiteralPropertyIr.static(
                key: 'get',
                value: EsmFunctionExpressionIr(
                  parameters: const [],
                  body: [
                    EsmReturnStatementIr(
                      EsmCallIr(
                        callee: EsmPropertyAccessIr(
                          receiver: EsmIdentifierIr(field.backingName),
                          property: 'get',
                        ),
                        arguments: const [],
                      ),
                    ),
                  ],
                ),
              ),
              EsmObjectLiteralPropertyIr.static(
                key: 'set',
                value: EsmFunctionExpressionIr(
                  parameters: const [EsmIdentifierParameterIr(name: 'value')],
                  body: [
                    EsmExpressionStatementIr(
                      EsmCallIr(
                        callee: EsmPropertyAccessIr(
                          receiver: EsmIdentifierIr(field.backingName),
                          property: 'set',
                        ),
                        arguments: const [EsmIdentifierIr('value')],
                      ),
                    ),
                  ],
                ),
              ),
              EsmObjectLiteralPropertyIr.static(
                key: 'enumerable',
                value: EsmBooleanLiteralIr(true),
              ),
            ]),
          ],
        ),
      ),
    ];
  }

  EsmExpressionIr _lateWritableArgument(bool isFinal, bool mutable) {
    if (isFinal) {
      return const EsmStringLiteralIr('once');
    }
    return EsmBooleanLiteralIr(mutable);
  }

  List<EsmStatementIr> _lowerLateInstanceFieldDefinitions(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmClassSymbol klass,
    EsmExpressionIr receiver,
    Set<String> usedNames,
  ) {
    final statements = <EsmStatementIr>[];
    for (final field in klass.fields) {
      if (!field.node.isLate) {
        continue;
      }
      helpers.require(EsmRuntimeHelper.lazyField);
      final backingName = _freshIn(usedNames, '\$${field.name}');
      final initializer = field.node.initializer;
      statements.add(
        EsmVariableDeclarationIr(
          binding: EsmIdentifierBindingIr(backingName),
          initializer: EsmCallIr(
            callee: helpers.reference(
              runtimeHelpers,
              EsmRuntimeHelper.lazyField,
            ),
            arguments: [
              EsmStringLiteralIr('${klass.node.name}.${field.node.name.text}'),
              initializer == null
                  ? const EsmNullLiteralIr()
                  : EsmArrowFunctionIr(
                      parameters: const [],
                      body: _lowerExpression(
                        world,
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
        EsmExpressionStatementIr(
          EsmCallIr(
            callee: const EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('Object'),
              property: 'defineProperty',
            ),
            arguments: [
              receiver,
              EsmStringLiteralIr(field.name),
              EsmObjectLiteralIr([
                EsmObjectLiteralPropertyIr.static(
                  key: 'get',
                  value: EsmFunctionExpressionIr(
                    parameters: const [],
                    body: [
                      EsmReturnStatementIr(
                        EsmCallIr(
                          callee: EsmPropertyAccessIr(
                            receiver: EsmIdentifierIr(backingName),
                            property: 'get',
                          ),
                          arguments: const [],
                        ),
                      ),
                    ],
                  ),
                ),
                EsmObjectLiteralPropertyIr.static(
                  key: 'set',
                  value: EsmFunctionExpressionIr(
                    parameters: const [EsmIdentifierParameterIr(name: 'value')],
                    body: [
                      EsmExpressionStatementIr(
                        EsmCallIr(
                          callee: EsmPropertyAccessIr(
                            receiver: EsmIdentifierIr(backingName),
                            property: 'set',
                          ),
                          arguments: const [EsmIdentifierIr('value')],
                        ),
                      ),
                    ],
                  ),
                ),
                EsmObjectLiteralPropertyIr.static(
                  key: 'enumerable',
                  value: EsmBooleanLiteralIr(true),
                ),
              ]),
            ],
          ),
        ),
      );
    }
    return statements;
  }

  List<EsmStatementIr> _lowerInstanceFieldInitializers(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmClassSymbol klass,
    EsmExpressionIr receiver,
  ) {
    return [
      for (final field in klass.fields)
        if (!field.node.isLate)
          _lowerOwnDataPropertyDefinition(
            receiver,
            field.name,
            field.node.initializer == null
                ? const EsmNullLiteralIr()
                : _lowerExpression(
                    world,
                    helpers,
                    locals,
                    field.node.initializer!,
                    thisExpression: receiver,
                  ),
          ),
    ];
  }

  EsmExpressionStatementIr _lowerOwnDataPropertyDefinition(
    EsmExpressionIr receiver,
    String property,
    EsmExpressionIr value,
  ) {
    return EsmExpressionStatementIr(
      EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Object'),
          property: 'defineProperty',
        ),
        arguments: [
          receiver,
          EsmStringLiteralIr(property),
          EsmObjectLiteralIr([
            EsmObjectLiteralPropertyIr.static(key: 'value', value: value),
            EsmObjectLiteralPropertyIr.static(
              key: 'writable',
              value: EsmBooleanLiteralIr(true),
            ),
            EsmObjectLiteralPropertyIr.static(
              key: 'enumerable',
              value: EsmBooleanLiteralIr(true),
            ),
            EsmObjectLiteralPropertyIr.static(
              key: 'configurable',
              value: EsmBooleanLiteralIr(true),
            ),
          ]),
        ],
      ),
    );
  }

  EsmClassConstructorIr _lowerImplicitDefaultConstructor(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass, {
    List<String> interfaceMarkers = const [],
  }) {
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    return EsmClassConstructorIr(
      parameters: const [],
      body: [
        if (klass.jsSuperclass != null)
          const EsmExpressionStatementIr(
            EsmCallIr(callee: EsmSuperIr(), arguments: []),
          ),
        ..._lowerLateInstanceFieldDefinitions(
          world,
          helpers,
          locals,
          klass,
          const EsmThisIr(),
          usedNames,
        ),
        ..._lowerInstanceFieldInitializers(
          world,
          helpers,
          locals,
          klass,
          const EsmThisIr(),
        ),
        ..._lowerInterfaceMarkerDefinitions(
          const EsmThisIr(),
          interfaceMarkers,
        ),
      ],
    );
  }

  EsmExpressionStatementIr _lowerInterfaceHasInstance(
    EsmClassSymbol klass,
    String markerName,
  ) {
    return EsmExpressionStatementIr(
      EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Object'),
          property: 'defineProperty',
        ),
        arguments: [
          EsmIdentifierIr(klass.name),
          const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Symbol'),
            property: 'hasInstance',
          ),
          EsmObjectLiteralIr([
            EsmObjectLiteralPropertyIr.static(
              key: 'value',
              value: EsmFunctionExpressionIr(
                parameters: const [EsmIdentifierParameterIr(name: 'value')],
                body: [
                  EsmReturnStatementIr(
                    EsmBinaryIr(
                      left: EsmBinaryIr(
                        left: const EsmIdentifierIr('value'),
                        operator: EsmBinaryOperatorIr.looseNotEquals,
                        right: const EsmNullLiteralIr(),
                      ),
                      operator: EsmBinaryOperatorIr.logicalAnd,
                      right: EsmParenthesizedIr(
                        EsmBinaryIr(
                          left: EsmCallIr(
                            callee: EsmPropertyAccessIr(
                              receiver: EsmPropertyAccessIr(
                                receiver: EsmIdentifierIr(klass.name),
                                property: 'prototype',
                              ),
                              property: 'isPrototypeOf',
                            ),
                            arguments: const [EsmIdentifierIr('value')],
                          ),
                          operator: EsmBinaryOperatorIr.logicalOr,
                          right: EsmBinaryIr(
                            left: EsmComputedPropertyAccessIr(
                              receiver: const EsmIdentifierIr('value'),
                              property: EsmIdentifierIr(markerName),
                            ),
                            operator: EsmBinaryOperatorIr.strictEquals,
                            right: const EsmBooleanLiteralIr(true),
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
    EsmSemanticWorld world,
    EsmClassSymbol klass,
  ) {
    return [
      for (final interfaceClass in klass.interfaceMarkerClasses)
        if (world.classSymbolFor(interfaceClass)?.interfaceMarkerName
            case final markerName?)
          markerName,
    ];
  }

  List<EsmStatementIr> _lowerInterfaceMarkerDefinitions(
    EsmExpressionIr receiver,
    List<String> markerNames,
  ) {
    return [
      for (final markerName in markerNames)
        EsmExpressionStatementIr(
          EsmCallIr(
            callee: const EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('Object'),
              property: 'defineProperty',
            ),
            arguments: [
              receiver,
              EsmIdentifierIr(markerName),
              EsmObjectLiteralIr([
                EsmObjectLiteralPropertyIr.static(
                  key: 'value',
                  value: EsmBooleanLiteralIr(true),
                ),
              ]),
            ],
          ),
        ),
    ];
  }

  EsmClassConstructorIr _lowerMissingUnnamedConstructor(EsmClassSymbol klass) {
    return EsmClassConstructorIr(
      parameters: const [],
      body: [
        EsmThrowStatementIr(
          EsmNewIr(
            callee: const EsmIdentifierIr('TypeError'),
            arguments: [
              EsmStringLiteralIr(
                'Class ${klass.node.name} has no unnamed constructor',
              ),
            ],
          ),
        ),
      ],
    );
  }

  EsmClassConstructorIr _lowerFactoryConstructor(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmStaticProcedureSymbol procedure,
  ) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(function, 'async factory lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    if (body == null) {
      throw NewCompilerUnsupported(function, 'factory without body');
    }
    return EsmClassConstructorIr(
      parameters: parameters,
      body: _lowerStatementList(world, helpers, locals, labels, body),
    );
  }

  EsmClassConstructorIr _lowerConstructor(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmConstructorSymbol constructor, {
    List<String> interfaceMarkers = const [],
  }) {
    assert(constructor.name.isEmpty);
    final klass = world.classSymbolFor(constructor.node.enclosingClass);
    if (klass == null) {
      throw NewCompilerUnsupported(constructor.node, 'constructor class');
    }
    final function = constructor.node.function;
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final redirectingInitializer = _redirectingInitializer(constructor);
    if (redirectingInitializer != null) {
      return EsmClassConstructorIr(
        parameters: parameters,
        body: [
          EsmReturnStatementIr(
            _lowerRedirectingAllocation(
              world,
              helpers,
              locals,
              redirectingInitializer,
              const EsmNewTargetIr(),
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
        if (_isFactorySuperInitializer(world, initializer)) initializer,
    ];
    if (factorySuperInitializers.length > 1) {
      throw NewCompilerUnsupported(
        constructor.node,
        'multiple factory super initializers',
      );
    }
    final otherInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is! k.SuperInitializer) initializer,
    ];
    if (factorySuperInitializers case [final superInitializer]) {
      final selfName = _freshLocalName(world, usedParameters, r'$self');
      usedParameters.add(selfName);
      final self = EsmIdentifierIr(selfName);
      final body = <EsmStatementIr>[
        EsmVariableDeclarationIr(
          binding: EsmIdentifierBindingIr(selfName),
          initializer: _lowerSuperFactoryAllocation(
            world,
            helpers,
            locals,
            superInitializer,
            const EsmNewTargetIr(),
          ),
          mutable: false,
        ),
        ..._lowerLateInstanceFieldDefinitions(
          world,
          helpers,
          locals,
          klass,
          self,
          usedParameters,
        ),
        ..._lowerInstanceFieldInitializers(world, helpers, locals, klass, self),
        for (final initializer in otherInitializers)
          ..._lowerConstructorInitializer(
            world,
            helpers,
            locals,
            initializer,
            self,
          ),
        if (function.body case final body?) ...[
          ..._lowerStatementList(
            world,
            helpers,
            locals,
            labels,
            body,
            thisExpression: self,
          ),
        ],
        ..._lowerInterfaceMarkerDefinitions(self, interfaceMarkers),
        EsmReturnStatementIr(self),
      ];
      return EsmClassConstructorIr(parameters: parameters, body: body);
    }
    final superInitializerStatements = [
      for (final initializer in superInitializers)
        ..._lowerSuperInitializer(world, helpers, locals, initializer),
    ];
    final needsImplicitSuperCall =
        superInitializerStatements.isEmpty && klass.jsSuperclass != null;
    final body = <EsmStatementIr>[
      if (needsImplicitSuperCall)
        const EsmExpressionStatementIr(
          EsmCallIr(callee: EsmSuperIr(), arguments: []),
        ),
      ...superInitializerStatements,
      ..._lowerLateInstanceFieldDefinitions(
        world,
        helpers,
        locals,
        klass,
        const EsmThisIr(),
        usedParameters,
      ),
      ..._lowerInstanceFieldInitializers(
        world,
        helpers,
        locals,
        klass,
        const EsmThisIr(),
      ),
      for (final initializer in otherInitializers)
        ..._lowerConstructorInitializer(
          world,
          helpers,
          locals,
          initializer,
          const EsmThisIr(),
        ),
      if (function.body case final body?) ...[
        ..._lowerStatementList(world, helpers, locals, labels, body),
      ],
      ..._lowerInterfaceMarkerDefinitions(const EsmThisIr(), interfaceMarkers),
    ];
    return EsmClassConstructorIr(parameters: parameters, body: body);
  }

  EsmClassMethodIr _lowerNamedConstructor(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmConstructorSymbol constructor, {
    List<String> interfaceMarkers = const [],
  }) {
    final klass = world.classSymbolFor(constructor.node.enclosingClass);
    if (klass == null) {
      throw NewCompilerUnsupported(constructor.node, 'constructor class');
    }
    final function = constructor.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(function, 'async constructor lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedNames = <String>{};
    final selfName = _freshIn(usedNames, r'$self');
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedNames,
      function,
    );
    final redirectingInitializer = _redirectingInitializer(constructor);
    if (redirectingInitializer != null) {
      return EsmClassMethodIr(
        key: EsmStaticPropertyKeyIr(constructor.name),
        kind: EsmClassMethodKindIr.method,
        isStatic: true,
        parameters: parameters,
        body: [
          EsmReturnStatementIr(
            _lowerRedirectingAllocation(
              world,
              helpers,
              locals,
              redirectingInitializer,
              const EsmThisIr(),
            ),
          ),
        ],
      );
    }
    final self = EsmIdentifierIr(selfName);
    final superInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is k.SuperInitializer) initializer,
    ];
    if (superInitializers.length > 1) {
      throw NewCompilerUnsupported(
        constructor.node,
        'multiple super initializers',
      );
    }
    final otherInitializers = [
      for (final initializer in constructor.node.initializers)
        if (initializer is! k.SuperInitializer) initializer,
    ];
    final allocation = superInitializers.isEmpty
        ? _lowerObjectCreate(const EsmThisIr())
        : _lowerSuperFactoryAllocation(
            world,
            helpers,
            locals,
            superInitializers.single,
            const EsmThisIr(),
          );
    final body = <EsmStatementIr>[
      EsmVariableDeclarationIr(
        binding: EsmIdentifierBindingIr(selfName),
        initializer: allocation,
        mutable: false,
      ),
      ..._lowerLateInstanceFieldDefinitions(
        world,
        helpers,
        locals,
        klass,
        self,
        usedNames,
      ),
      ..._lowerInstanceFieldInitializers(world, helpers, locals, klass, self),
      for (final initializer in otherInitializers)
        ..._lowerConstructorInitializer(
          world,
          helpers,
          locals,
          initializer,
          self,
        ),
      if (function.body case final body?) ...[
        ..._lowerStatementList(
          world,
          helpers,
          locals,
          labels,
          body,
          thisExpression: self,
        ),
      ],
      ..._lowerInterfaceMarkerDefinitions(self, interfaceMarkers),
      EsmReturnStatementIr(self),
    ];
    return EsmClassMethodIr(
      key: EsmStaticPropertyKeyIr(constructor.name),
      kind: EsmClassMethodKindIr.method,
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
        throw NewCompilerUnsupported(initializer, 'multiple redirecting calls');
      }
      redirectingInitializer = initializer;
    }
    if (redirectingInitializer != null &&
        constructor.node.initializers.length != 1) {
      throw NewCompilerUnsupported(
        constructor.node,
        'redirecting constructor initializers',
      );
    }
    return redirectingInitializer;
  }

  EsmExpressionIr _lowerRedirectingAllocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.RedirectingInitializer initializer,
    EsmExpressionIr newTarget,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(
        initializer,
        'redirecting initializer arguments',
      );
    }
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      throw NewCompilerUnsupported(initializer, 'redirecting initializer');
    }
    return _lowerConstructorAllocation(
      world,
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
    EsmSemanticWorld world,
    k.SuperInitializer initializer,
  ) {
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      return false;
    }
    final resolvedTarget = _resolveEmittableConstructorTarget(world, target);
    return resolvedTarget != null &&
        world.constructorSymbolFor(resolvedTarget)?.name.isNotEmpty == true;
  }

  EsmExpressionIr _lowerObjectCreate(EsmExpressionIr newTarget) {
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('Object'),
        property: 'create',
      ),
      arguments: [
        EsmPropertyAccessIr(receiver: newTarget, property: 'prototype'),
      ],
    );
  }

  EsmExpressionIr _lowerSuperFactoryAllocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
    EsmExpressionIr newTarget,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(initializer, 'super initializer arguments');
    }
    final target = initializer.targetReference.node;
    if (target is! k.Constructor) {
      if (initializer.arguments.positional.isEmpty &&
          initializer.arguments.named.isEmpty) {
        return _lowerObjectCreate(newTarget);
      }
      throw NewCompilerUnsupported(
        initializer,
        'super initializer target ${kernelReferencePath(initializer.targetReference)}',
      );
    }
    final resolvedTarget = _resolveEmittableConstructorTarget(world, target);
    if (resolvedTarget == null) {
      if (initializer.arguments.positional.isEmpty &&
          initializer.arguments.named.isEmpty) {
        return _lowerObjectCreate(newTarget);
      }
      throw NewCompilerUnsupported(
        initializer,
        'super initializer target ${kernelReferencePath(initializer.targetReference)}',
      );
    }
    return _lowerConstructorAllocation(
      world,
      helpers,
      locals,
      resolvedTarget,
      initializer.arguments,
      newTarget,
      initializer,
      'super initializer target',
    );
  }

  EsmExpressionIr _lowerConstructorAllocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Constructor target,
    k.Arguments argumentsNode,
    EsmExpressionIr newTarget,
    k.TreeNode contextNode,
    String context,
  ) {
    final resolvedTarget = _resolveEmittableConstructorTarget(world, target);
    if (resolvedTarget == null) {
      throw NewCompilerUnsupported(
        contextNode,
        '$context ${kernelReferencePath(target.reference)}',
      );
    }
    final constructor = world.constructorSymbolFor(resolvedTarget)!;
    final klass = world.classSymbolFor(resolvedTarget.enclosingClass)!;
    final arguments = _lowerArguments(
      world,
      helpers,
      locals,
      argumentsNode,
      contextNode: contextNode,
      context: context,
    );
    if (constructor.name.isEmpty) {
      return EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Reflect'),
          property: 'construct',
        ),
        arguments: [
          EsmIdentifierIr(klass.name),
          EsmArrayLiteralIr(arguments),
          newTarget,
        ],
      );
    }
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(klass.name),
          property: constructor.name,
        ),
        property: 'call',
      ),
      arguments: [newTarget, ...arguments],
    );
  }

  List<EsmStatementIr> _lowerConstructorInitializer(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Initializer initializer,
    EsmExpressionIr receiver,
  ) {
    return switch (initializer) {
      k.FieldInitializer() => [
        _lowerOwnDataPropertyDefinition(
          receiver,
          _instanceFieldName(world, initializer.field),
          _lowerExpression(
            world,
            helpers,
            locals,
            initializer.value,
            thisExpression: receiver,
          ),
        ),
      ],
      k.AssertInitializer() => const [],
      _ => throw NewCompilerUnsupported(
        initializer,
        'constructor initializer lowering',
      ),
    };
  }

  List<EsmStatementIr> _lowerSuperInitializer(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
  ) {
    if (initializer.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(initializer, 'super initializer arguments');
    }
    final coreErrorInitializer = _lowerCoreErrorSuperInitializer(
      world,
      helpers,
      locals,
      initializer,
      const EsmThisIr(),
    );
    if (coreErrorInitializer != null) {
      return coreErrorInitializer;
    }
    final target = initializer.targetReference.node;
    if (target is k.Constructor &&
        _resolveEmittableConstructorTarget(world, target) != null) {
      return [
        EsmExpressionStatementIr(
          EsmCallIr(
            callee: const EsmSuperIr(),
            arguments: _lowerArguments(
              world,
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
    throw NewCompilerUnsupported(initializer, 'super initializer lowering');
  }

  List<EsmStatementIr>? _lowerCoreErrorSuperInitializer(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperInitializer initializer,
    EsmExpressionIr receiver,
  ) {
    final typeName = dartCoreErrorConstructorName(initializer.targetReference);
    if (typeName == null) {
      return null;
    }
    if (initializer.arguments.named.isNotEmpty) {
      throw NewCompilerUnsupported(
        initializer,
        'core error super initializer arguments',
      );
    }
    final positional = initializer.arguments.positional;
    final message = positional.isEmpty
        ? const EsmStringLiteralIr('')
        : _lowerExpression(world, helpers, locals, positional.first);
    return [
      _lowerOwnDataPropertyDefinition(
        receiver,
        '__dartCoreErrorType',
        EsmStringLiteralIr(typeName),
      ),
      _lowerOwnDataPropertyDefinition(
        receiver,
        'name',
        EsmStringLiteralIr(typeName),
      ),
      _lowerOwnDataPropertyDefinition(receiver, 'message', message),
      if (typeName == 'FormatException') ...[
        _lowerOwnDataPropertyDefinition(
          receiver,
          'source',
          positional.length > 1
              ? _lowerExpression(world, helpers, locals, positional[1])
              : const EsmNullLiteralIr(),
        ),
        _lowerOwnDataPropertyDefinition(
          receiver,
          'offset',
          positional.length > 2
              ? _lowerExpression(world, helpers, locals, positional[2])
              : const EsmNullLiteralIr(),
        ),
      ],
      _lowerOwnDataPropertyDefinition(
        receiver,
        'toString',
        EsmFunctionExpressionIr(
          parameters: const [],
          body: [
            EsmReturnStatementIr(
              EsmConditionalIr(
                condition: EsmBinaryIr(
                  left: const EsmPropertyAccessIr(
                    receiver: EsmThisIr(),
                    property: 'message',
                  ),
                  operator: EsmBinaryOperatorIr.strictEquals,
                  right: const EsmStringLiteralIr(''),
                ),
                thenExpression: const EsmPropertyAccessIr(
                  receiver: EsmThisIr(),
                  property: 'name',
                ),
                otherwiseExpression: EsmStringConcatenationIr([
                  const EsmPropertyAccessIr(
                    receiver: EsmThisIr(),
                    property: 'name',
                  ),
                  const EsmStringLiteralIr(': '),
                  const EsmPropertyAccessIr(
                    receiver: EsmThisIr(),
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
    EsmSemanticWorld world,
    k.Constructor target,
  ) {
    if (world.constructorSymbolFor(target) != null &&
        world.classSymbolFor(target.enclosingClass) != null) {
      return target;
    }

    final visited = <k.Class>{};
    var current = target.enclosingClass;
    while (current.isAnonymousMixin) {
      if (!visited.add(current)) {
        throw NewCompilerUnsupported(
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
          world.constructorSymbolFor(candidate) != null &&
          world.classSymbolFor(candidate.enclosingClass) != null) {
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

  EsmClassMethodIr _lowerClassProcedure(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmClassSymbol klass,
    EsmClassProcedureSymbol procedure, {
    bool isStatic = false,
  }) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(function, 'async function lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    return EsmClassMethodIr(
      key: EsmStaticPropertyKeyIr(procedure.name),
      kind: switch (procedure.kind) {
        EsmProcedureKind.method => EsmClassMethodKindIr.method,
        EsmProcedureKind.getter => EsmClassMethodKindIr.getter,
        EsmProcedureKind.setter => EsmClassMethodKindIr.setter,
      },
      isStatic: isStatic,
      parameters: parameters,
      body: body == null
          ? _lowerAbstractMemberBody(klass, procedure)
          : _lowerStatementList(world, helpers, locals, labels, body),
    );
  }

  List<EsmStatementIr> _lowerAbstractMemberBody(
    EsmClassSymbol klass,
    EsmClassProcedureSymbol procedure,
  ) {
    return [
      EsmThrowStatementIr(
        EsmNewIr(
          callee: const EsmIdentifierIr('TypeError'),
          arguments: [
            EsmStringLiteralIr(
              'Abstract member ${klass.node.name}.${procedure.node.name.text}',
            ),
          ],
        ),
      ),
    ];
  }

  List<EsmModuleItemIr> _lowerFieldItems(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmFieldSymbol field,
  ) {
    if (field.node.isLate) {
      helpers.require(EsmRuntimeHelper.lazyField);
      final initializer = field.node.initializer;
      return [
        EsmVariableDeclarationIr(
          binding: EsmIdentifierBindingIr(field.name),
          initializer: null,
          mutable: true,
          export: field.export,
        ),
        EsmVariableDeclarationIr(
          binding: EsmIdentifierBindingIr(field.backingName!),
          initializer: EsmCallIr(
            callee: helpers.reference(
              runtimeHelpers,
              EsmRuntimeHelper.lazyField,
            ),
            arguments: [
              EsmStringLiteralIr(field.node.name.text),
              initializer == null
                  ? const EsmNullLiteralIr()
                  : EsmArrowFunctionIr(
                      parameters: const [],
                      body: _lowerExpression(
                        world,
                        helpers,
                        const <k.VariableDeclaration, String>{},
                        initializer,
                      ),
                    ),
              _lateWritableArgument(field.node.isFinal, field.mutable),
              EsmArrowFunctionIr(
                parameters: const [EsmIdentifierParameterIr(name: 'value')],
                body: EsmAssignmentIr(
                  target: EsmIdentifierIr(field.name),
                  value: const EsmIdentifierIr('value'),
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
      EsmVariableDeclarationIr(
        binding: EsmIdentifierBindingIr(field.name),
        initializer: initializer == null
            ? null
            : _lowerExpression(
                world,
                helpers,
                const <k.VariableDeclaration, String>{},
                initializer,
              ),
        mutable: field.mutable,
        export: field.export,
      ),
    ];
  }

  EsmFunctionIr _lowerProcedure(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmProcedureSymbol procedure,
  ) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(function, 'async function lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedParameters,
      function,
    );
    final body = function.body;
    if (body == null) {
      throw NewCompilerUnsupported(function, 'procedure without body');
    }
    return EsmFunctionIr(
      name: procedure.name,
      export: procedure.export,
      parameters: parameters,
      body: _lowerStatementList(world, helpers, locals, labels, body),
    );
  }

  List<EsmParameterIr> _bindParameters(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.FunctionNode function,
  ) {
    return [
      for (final parameter in function.positionalParameters)
        _bindPositionalParameter(
          world,
          helpers,
          locals,
          usedParameters,
          parameter,
        ),
      if (function.namedParameters.isNotEmpty)
        EsmObjectPatternParameterIr(
          bindings: [
            for (final parameter in function.namedParameters)
              _bindNamedParameter(
                world,
                helpers,
                locals,
                usedParameters,
                parameter,
              ),
          ],
        ),
    ];
  }

  EsmIdentifierParameterIr _bindPositionalParameter(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.VariableDeclaration parameter,
  ) {
    final original = parameter.name ?? 'arg';
    final name = _freshParameterName(world, usedParameters, original);
    locals[parameter] = name;
    final initializer = parameter.initializer;
    return EsmIdentifierParameterIr(
      name: name,
      defaultValue: initializer == null
          ? null
          : _lowerExpression(world, helpers, locals, initializer),
    );
  }

  EsmObjectPatternBindingIr _bindNamedParameter(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.VariableDeclaration parameter,
  ) {
    final original = parameter.name ?? 'arg';
    final name = _freshParameterName(world, usedParameters, original);
    locals[parameter] = name;
    final initializer = parameter.initializer;
    return EsmObjectPatternBindingIr(
      property: original,
      name: name,
      defaultValue: initializer == null
          ? parameter.isRequired
                ? null
                : const EsmNullLiteralIr()
          : _lowerExpression(world, helpers, locals, initializer),
    );
  }

  List<EsmExpressionIr> _lowerArguments(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
    required k.TreeNode contextNode,
    required String context,
  }) {
    return [
      for (final argument in arguments.positional)
        _lowerExpression(
          world,
          helpers,
          locals,
          argument,
          thisExpression: thisExpression,
        ),
      if (arguments.named.isNotEmpty)
        EsmObjectLiteralIr([
          for (final argument in arguments.named)
            EsmObjectLiteralPropertyIr.static(
              key: argument.name,
              value: _lowerExpression(
                world,
                helpers,
                locals,
                argument.value,
                thisExpression: thisExpression,
              ),
            ),
        ]),
    ];
  }

  EsmExpressionIr _lowerOptionalPositionalArgument(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    List<k.Expression> positional,
    int index, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (index >= positional.length) {
      return const EsmNullLiteralIr();
    }
    return _lowerExpression(
      world,
      helpers,
      locals,
      positional[index],
      thisExpression: thisExpression,
    );
  }

  List<EsmStatementIr> _lowerStatementList(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Statement statement, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    EsmExpressionIr thisExpression = const EsmThisIr(),
    String? rethrowName,
  }) {
    return switch (statement) {
      k.Block() => [
        for (final child in statement.statements)
          ..._lowerStatementList(
            world,
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
          world,
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
          world,
          helpers,
          locals,
          statement,
          thisExpression: thisExpression,
        ),
      ],
      k.FunctionDeclaration() => [
        _lowerFunctionDeclaration(world, helpers, locals, statement),
      ],
      k.EmptyStatement() => const [],
      k.AssertStatement() => const [],
      k.ExpressionStatement(expression: k.Throw()) => [
        _lowerThrowStatement(
          world,
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
        EsmExpressionStatementIr(
          _lowerExpression(
            world,
            helpers,
            locals,
            statement.expression,
            thisExpression: thisExpression,
          ),
        ),
      ],
      k.IfStatement() => [
        _lowerIfStatement(
          world,
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
          world,
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
          world,
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
          world,
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
          world,
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
          world,
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
          world,
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
        EsmReturnStatementIr(
          statement.expression == null
              ? null
              : _lowerExpression(
                  world,
                  helpers,
                  locals,
                  statement.expression!,
                  thisExpression: thisExpression,
                ),
        ),
      ],
      _ => throw NewCompilerUnsupported(statement, 'statement lowering'),
    };
  }

  EsmLabeledStatementIr _lowerLabeledStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.LabeledStatement statement,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    final label = _freshIn(labels.values.toSet(), 'label');
    labels[statement] = label;
    final body = _lowerStatementList(
      world,
      helpers,
      locals,
      labels,
      statement.body,
      continueSwitchTargets: continueSwitchTargets,
      thisExpression: thisExpression,
      rethrowName: rethrowName,
    );
    return EsmLabeledStatementIr(
      label: label,
      statement: body.length == 1 && body.single is EsmBlockStatementIr
          ? body.single
          : EsmBlockStatementIr(body),
    );
  }

  EsmBreakStatementIr _lowerBreakStatement(
    Map<k.LabeledStatement, String> labels,
    k.BreakStatement statement,
  ) {
    final label = labels[statement.target];
    if (label == null) {
      throw NewCompilerUnsupported(statement, 'unbound break target');
    }
    return EsmBreakStatementIr(label);
  }

  EsmIfStatementIr _lowerIfStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.IfStatement statement,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    final otherwise = statement.otherwise;
    return EsmIfStatementIr(
      condition: _lowerExpression(
        world,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
      thenBody: _lowerStatementList(
        world,
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
              world,
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

  EsmWhileStatementIr _lowerWhileStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.WhileStatement statement,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmWhileStatementIr(
      condition: _lowerExpression(
        world,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
      body: _lowerStatementList(
        world,
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

  EsmDoStatementIr _lowerDoStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.DoStatement statement,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmDoStatementIr(
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      condition: _lowerExpression(
        world,
        helpers,
        locals,
        statement.condition,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmStatementIr _lowerSwitchStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.SwitchStatement statement,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    if (_switchCanContinueToCase(statement)) {
      return _lowerContinuableSwitchStatement(
        world,
        helpers,
        locals,
        labels,
        continueSwitchTargets,
        statement,
        thisExpression,
        rethrowName: rethrowName,
      );
    }
    return EsmSwitchStatementIr(
      expression: _lowerExpression(
        world,
        helpers,
        locals,
        statement.expression,
        thisExpression: thisExpression,
      ),
      cases: [
        for (final switchCase in statement.cases)
          _lowerSwitchCase(
            world,
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

  EsmSwitchCaseIr _lowerSwitchCase(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchCase switchCase,
    EsmExpressionIr thisExpression, {
    String? rethrowName,
  }) {
    return EsmSwitchCaseIr(
      expressions: [
        for (final expression in switchCase.expressions)
          _lowerExpression(
            world,
            helpers,
            locals,
            expression,
            thisExpression: thisExpression,
          ),
      ],
      isDefault: switchCase.isDefault,
      body: _lowerStatementList(
        world,
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

  EsmBlockStatementIr _lowerContinuableSwitchStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchStatement statement,
    EsmExpressionIr thisExpression, {
    String? rethrowName,
  }) {
    final usedNames = {
      ...world.globalBindingNames,
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
    return EsmBlockStatementIr([
      EsmVariableDeclarationIr(
        binding: EsmIdentifierBindingIr(valueName),
        initializer: _lowerExpression(
          world,
          helpers,
          locals,
          statement.expression,
          thisExpression: thisExpression,
        ),
        mutable: false,
      ),
      EsmVariableDeclarationIr(
        binding: EsmIdentifierBindingIr(targetName),
        initializer: const EsmNumberLiteralIr(-1),
        mutable: true,
      ),
      EsmSwitchStatementIr(
        expression: EsmIdentifierIr(valueName),
        cases: [
          for (var index = 0; index < statement.cases.length; index++)
            _lowerContinuableSwitchDispatchCase(
              world,
              helpers,
              locals,
              statement.cases[index],
              index,
              targetName,
              thisExpression,
            ),
        ],
      ),
      EsmLabeledStatementIr(
        label: loopLabel,
        statement: EsmWhileStatementIr(
          condition: EsmBinaryIr(
            left: EsmIdentifierIr(targetName),
            operator: EsmBinaryOperatorIr.strictNotEquals,
            right: const EsmNumberLiteralIr(-1),
          ),
          body: [
            EsmSwitchStatementIr(
              expression: EsmIdentifierIr(targetName),
              cases: [
                for (var index = 0; index < statement.cases.length; index++)
                  _lowerContinuableSwitchBodyCase(
                    world,
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

  EsmSwitchCaseIr _lowerContinuableSwitchDispatchCase(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SwitchCase switchCase,
    int caseIndex,
    String targetName,
    EsmExpressionIr thisExpression,
  ) {
    return EsmSwitchCaseIr(
      expressions: [
        for (final expression in switchCase.expressions)
          _lowerExpression(
            world,
            helpers,
            locals,
            expression,
            thisExpression: thisExpression,
          ),
      ],
      isDefault: switchCase.isDefault,
      body: [
        EsmExpressionStatementIr(
          EsmAssignmentIr(
            target: EsmIdentifierIr(targetName),
            value: EsmNumberLiteralIr(caseIndex),
          ),
        ),
        const EsmBreakStatementIr(null),
      ],
    );
  }

  EsmSwitchCaseIr _lowerContinuableSwitchBodyCase(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.SwitchCase switchCase,
    int caseIndex,
    String targetName,
    EsmExpressionIr thisExpression, {
    String? rethrowName,
  }) {
    final body = _lowerStatementList(
      world,
      helpers,
      locals,
      labels,
      switchCase.body,
      continueSwitchTargets: continueSwitchTargets,
      thisExpression: thisExpression,
      rethrowName: rethrowName,
    );
    return EsmSwitchCaseIr(
      expressions: [EsmNumberLiteralIr(caseIndex)],
      isDefault: false,
      body: [
        EsmExpressionStatementIr(
          EsmAssignmentIr(
            target: EsmIdentifierIr(targetName),
            value: const EsmNumberLiteralIr(-1),
          ),
        ),
        ...body,
        if (!_endsAbruptly(body)) const EsmBreakStatementIr(null),
      ],
    );
  }

  List<EsmStatementIr> _lowerContinueSwitchStatement(
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets,
    k.ContinueSwitchStatement statement,
  ) {
    final target = continueSwitchTargets[statement.target];
    if (target == null) {
      throw NewCompilerUnsupported(statement, 'continue switch statement');
    }
    return [
      EsmExpressionStatementIr(
        EsmAssignmentIr(
          target: EsmIdentifierIr(target.stateName),
          value: EsmNumberLiteralIr(target.caseIndex),
        ),
      ),
      EsmContinueStatementIr(target.loopLabel),
    ];
  }

  bool _endsAbruptly(List<EsmStatementIr> statements) {
    if (statements.isEmpty) {
      return false;
    }
    return switch (statements.last) {
      EsmBreakStatementIr() ||
      EsmContinueStatementIr() ||
      EsmReturnStatementIr() ||
      EsmThrowStatementIr() => true,
      EsmBlockStatementIr(:final body) => _endsAbruptly(body),
      EsmIfStatementIr(:final thenBody, :final otherwiseBody) =>
        otherwiseBody != null &&
            _endsAbruptly(thenBody) &&
            _endsAbruptly(otherwiseBody),
      _ => false,
    };
  }

  EsmForStatementIr _lowerForStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.ForStatement statement,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
    String? rethrowName,
  }) {
    return EsmForStatementIr(
      initializers: [
        for (final initializer in statement.variableInitializations)
          _lowerForInitializer(
            world,
            helpers,
            locals,
            initializer,
            thisExpression,
          ),
      ],
      condition: statement.condition == null
          ? null
          : _lowerExpression(
              world,
              helpers,
              locals,
              statement.condition!,
              thisExpression: thisExpression,
            ),
      updates: [
        for (final update in statement.updates)
          _lowerExpression(
            world,
            helpers,
            locals,
            update,
            thisExpression: thisExpression,
          ),
      ],
      body: _lowerStatementList(
        world,
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

  EsmThrowStatementIr _lowerThrowStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Throw expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    return EsmThrowStatementIr(
      _lowerExpression(
        world,
        helpers,
        locals,
        expression.expression,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmThrowStatementIr _lowerRethrowStatement(
    k.Rethrow expression,
    String? rethrowName,
  ) {
    if (rethrowName == null) {
      throw NewCompilerUnsupported(expression, 'rethrow lowering');
    }
    return EsmThrowStatementIr(EsmIdentifierIr(rethrowName));
  }

  EsmTryStatementIr _lowerTryCatch(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.TryCatch statement,
    EsmExpressionIr thisExpression,
    String? rethrowName, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    final errorName = _freshLocalName(world, locals.values, r'$error');
    return EsmTryStatementIr(
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.body,
        continueSwitchTargets: continueSwitchTargets,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      catchParameter: EsmIdentifierParameterIr(name: errorName),
      catchBody: _lowerCatchChain(
        world,
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

  EsmTryStatementIr _lowerTryFinally(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.TryFinally statement,
    EsmExpressionIr thisExpression,
    String? rethrowName, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    return EsmTryStatementIr(
      body: _lowerStatementList(
        world,
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
        world,
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

  List<EsmStatementIr> _lowerCatchChain(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    List<k.Catch> catches,
    String errorName,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    var otherwise = <EsmStatementIr>[
      EsmThrowStatementIr(EsmIdentifierIr(errorName)),
    ];
    for (final catchClause in catches.reversed) {
      final body = _lowerCatchBody(
        world,
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
        EsmIfStatementIr(
          condition: _lowerTypeTest(
            world,
            helpers,
            catchClause.guard,
            EsmIdentifierIr(errorName),
          ),
          thenBody: body,
          otherwiseBody: otherwise,
        ),
      ];
    }
    return otherwise;
  }

  List<EsmStatementIr> _lowerCatchBody(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Catch catchClause,
    String errorName,
    EsmExpressionIr thisExpression, {
    Map<k.SwitchCase, _ContinueSwitchTarget> continueSwitchTargets = const {},
  }) {
    final catchLocals = Map<k.VariableDeclaration, String>.of(locals);
    final statements = <EsmStatementIr>[];
    final error = EsmIdentifierIr(errorName);
    final exception = catchClause.exception;
    if (exception != null) {
      final name = _freshLocalName(
        world,
        catchLocals.values,
        exception.name ?? 'e',
        reservedNames: [errorName],
      );
      catchLocals[exception] = name;
      statements.add(
        EsmVariableDeclarationIr(
          binding: EsmIdentifierBindingIr(name),
          initializer: error,
          mutable: exception.isAssignable,
        ),
      );
    }
    final stackTrace = catchClause.stackTrace;
    if (stackTrace != null) {
      final name = _freshLocalName(
        world,
        catchLocals.values,
        stackTrace.name ?? 'stack',
        reservedNames: [errorName],
      );
      catchLocals[stackTrace] = name;
      statements.add(
        EsmVariableDeclarationIr(
          binding: EsmIdentifierBindingIr(name),
          initializer: EsmNullishCoalesceIr(
            left: EsmOptionalPropertyAccessIr(
              receiver: error,
              property: 'stack',
            ),
            right: const EsmStringLiteralIr('<javascript stack unavailable>'),
          ),
          mutable: stackTrace.isAssignable,
        ),
      );
    }
    statements.addAll(
      _lowerStatementList(
        world,
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

  EsmVariableDeclarationIr _lowerForInitializer(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableInitializationBase initializer,
    EsmExpressionIr thisExpression,
  ) {
    if (initializer is! k.VariableDeclaration) {
      throw NewCompilerUnsupported(initializer, 'for initializer lowering');
    }
    return _lowerVariableDeclaration(
      world,
      helpers,
      locals,
      initializer,
      thisExpression: thisExpression,
    );
  }

  EsmVariableDeclarationIr _lowerVariableDeclaration(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableDeclaration statement, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final name = _freshLocalName(world, locals.values, statement.name ?? 'v');
    locals[statement] = name;
    final initializer = statement.initializer;
    if (statement.isLate) {
      helpers.require(EsmRuntimeHelper.lazyField);
      return EsmVariableDeclarationIr(
        binding: EsmIdentifierBindingIr(name),
        initializer: EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.lazyField),
          arguments: [
            EsmStringLiteralIr(statement.name ?? name),
            initializer == null
                ? const EsmNullLiteralIr()
                : EsmArrowFunctionIr(
                    parameters: const [],
                    body: _lowerExpression(
                      world,
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
    return EsmVariableDeclarationIr(
      binding: EsmIdentifierBindingIr(name),
      initializer: initializer == null
          ? const EsmNullLiteralIr()
          : _lowerExpression(
              world,
              helpers,
              locals,
              initializer,
              thisExpression: thisExpression,
            ),
      mutable: statement.isAssignable || initializer == null,
    );
  }

  EsmVariableDeclarationIr _lowerFunctionDeclaration(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.FunctionDeclaration statement,
  ) {
    final name = _freshLocalName(
      world,
      locals.values,
      statement.variable.name ?? 'f',
    );
    locals[statement.variable] = name;
    return EsmVariableDeclarationIr(
      binding: EsmIdentifierBindingIr(name),
      initializer: _lowerFunctionNodeExpression(
        world,
        helpers,
        locals,
        statement.function,
      ),
      mutable: false,
    );
  }

  EsmExpressionIr _lowerExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    return switch (expression) {
      k.StaticInvocation() => _lowerStaticInvocation(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.StaticGet() => _lowerStaticGet(world, helpers, expression),
      k.StaticSet() => _lowerStaticSet(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.ConstantExpression() => _lowerConstantExpression(
        world,
        helpers,
        expression,
      ),
      k.VariableGet() => _lowerVariableGet(locals, expression),
      k.VariableSet() => _lowerVariableSet(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.FunctionInvocation() => EsmCallIr(
        callee: _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        arguments: _lowerArguments(
          world,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'function invocation arguments',
        ),
      ),
      k.LocalFunctionInvocation() => _lowerLocalFunctionInvocation(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceInvocation() => _lowerInstanceInvocation(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceGet() => _lowerInstanceGet(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceSet() => _lowerInstanceSet(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.SuperMethodInvocation() => _lowerSuperMethodInvocation(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.SuperPropertyGet() => _lowerSuperPropertyGet(
        world,
        helpers,
        locals,
        expression,
      ),
      k.SuperPropertySet() => _lowerSuperPropertySet(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.ConstructorInvocation() => _lowerConstructorInvocation(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.IsExpression() => _lowerIsExpression(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.AsExpression() => _lowerAsExpression(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.NullCheck() => _lowerNullCheck(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.Not() => EsmUnaryIr(
        operator: EsmUnaryOperatorIr.logicalNot,
        operand: EsmParenthesizedIr(
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.operand,
            thisExpression: thisExpression,
          ),
        ),
      ),
      k.LogicalExpression() => EsmParenthesizedIr(
        EsmBinaryIr(
          left: _lowerExpression(
            world,
            helpers,
            locals,
            expression.left,
            thisExpression: thisExpression,
          ),
          operator: expression.operatorEnum == k.LogicalExpressionOperator.AND
              ? EsmBinaryOperatorIr.logicalAnd
              : EsmBinaryOperatorIr.logicalOr,
          right: _lowerExpression(
            world,
            helpers,
            locals,
            expression.right,
            thisExpression: thisExpression,
          ),
        ),
      ),
      k.EqualsNull() => EsmBinaryIr(
        left: _lowerExpression(
          world,
          helpers,
          locals,
          expression.expression,
          thisExpression: thisExpression,
        ),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNullLiteralIr(),
      ),
      k.ConditionalExpression() => EsmConditionalIr(
        condition: _lowerExpression(
          world,
          helpers,
          locals,
          expression.condition,
          thisExpression: thisExpression,
        ),
        thenExpression: _lowerExpression(
          world,
          helpers,
          locals,
          expression.then,
          thisExpression: thisExpression,
        ),
        otherwiseExpression: _lowerExpression(
          world,
          helpers,
          locals,
          expression.otherwise,
          thisExpression: thisExpression,
        ),
      ),
      k.ThisExpression() => thisExpression,
      k.StringLiteral() => EsmStringLiteralIr(expression.value),
      k.StringConcatenation() => _lowerStringConcatenation(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.IntLiteral() => EsmNumberLiteralIr(expression.value),
      k.DoubleLiteral() => EsmNumberLiteralIr(expression.value),
      k.BoolLiteral() => EsmBooleanLiteralIr(expression.value),
      k.NullLiteral() => const EsmNullLiteralIr(),
      k.ListLiteral() => EsmArrayLiteralIr([
        for (final element in expression.expressions)
          _lowerExpression(
            world,
            helpers,
            locals,
            element,
            thisExpression: thisExpression,
          ),
      ]),
      k.SetLiteral() => () {
        helpers.require(EsmRuntimeHelper.setAddAll);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartSetFrom'),
          arguments: [
            EsmArrayLiteralIr([
              for (final element in expression.expressions)
                _lowerExpression(
                  world,
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
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartMapFromEntries'),
          arguments: [
            EsmArrayLiteralIr([
              for (final entry in expression.entries)
                EsmArrayLiteralIr([
                  _lowerExpression(
                    world,
                    helpers,
                    locals,
                    entry.key,
                    thisExpression: thisExpression,
                  ),
                  _lowerExpression(
                    world,
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
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.RecordIndexGet() => EsmPropertyAccessIr(
        receiver: _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: _recordPositionalKey(expression.index),
      ),
      k.RecordNameGet() => EsmPropertyAccessIr(
        receiver: _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: expression.name,
      ),
      k.SymbolLiteral() => _lowerSymbolLiteral(helpers, expression.value),
      k.TypeLiteral() => _lowerTypeLiteral(helpers, expression.type),
      k.Throw() => EsmCallIr(
        callee: EsmParenthesizedIr(
          EsmArrowBlockFunctionIr(
            parameters: const [],
            body: [
              EsmThrowStatementIr(
                _lowerExpression(
                  world,
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
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicGet() => _lowerDynamicGet(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicSet() => _lowerDynamicSet(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.DynamicInvocation() => _lowerDynamicInvocation(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.InstanceTearOff() => _lowerInstanceTearOff(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.FunctionExpression() => _lowerFunctionExpression(
        world,
        helpers,
        locals,
        expression,
      ),
      k.BlockExpression() => _lowerBlockExpression(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      k.Let() => _lowerLetExpression(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      ),
      _ => throw NewCompilerUnsupported(expression, 'expression lowering'),
    };
  }

  EsmExpressionIr _lowerDynamicGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    helpers.require(EsmRuntimeHelper.dynamicGet);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dynamicGet),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        EsmStringLiteralIr(expression.name.text),
      ],
    );
  }

  EsmExpressionIr _lowerDynamicSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    helpers.require(EsmRuntimeHelper.dynamicSet);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dynamicSet),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        EsmStringLiteralIr(expression.name.text),
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpressionIr _lowerNullCheck(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.NullCheck expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    helpers.require(EsmRuntimeHelper.nullCheck);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.nullCheck),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.operand,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpressionIr _lowerRecordLiteral(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.RecordLiteral expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    helpers.require(EsmRuntimeHelper.record);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.record),
      arguments: [
        EsmArrayLiteralIr([
          for (final field in expression.positional)
            _lowerExpression(
              world,
              helpers,
              locals,
              field,
              thisExpression: thisExpression,
            ),
        ]),
        EsmObjectLiteralIr([
          for (final field in expression.named)
            EsmObjectLiteralPropertyIr.static(
              key: field.name,
              value: _lowerExpression(
                world,
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

  EsmExpressionIr _lowerStringConcatenation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StringConcatenation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    return EsmStringConcatenationIr([
      for (final part in expression.expressions)
        if (part is k.StringLiteral)
          EsmStringLiteralIr(part.value)
        else
          _lowerStringifiedExpression(
            world,
            helpers,
            locals,
            part,
            thisExpression: thisExpression,
          ),
    ]);
  }

  EsmExpressionIr _lowerStringifiedExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    helpers.require(EsmRuntimeHelper.stringify);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringify),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  String _recordPositionalKey(int index) => '\$${index + 1}';

  EsmExpressionIr _lowerLetExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.Let expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final optimized = _tryLowerLetExpressionInline(
      world,
      helpers,
      outerLocals,
      expression,
      thisExpression: thisExpression,
    );
    if (optimized != null) {
      return optimized;
    }
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    return EsmCallIr(
      callee: EsmParenthesizedIr(
        EsmArrowBlockFunctionIr(
          parameters: const [],
          body: [
            _lowerVariableDeclaration(
              world,
              helpers,
              locals,
              expression.variable,
              thisExpression: thisExpression,
            ),
            EsmReturnStatementIr(
              _lowerExpression(
                world,
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

  EsmExpressionIr? _tryLowerLetExpressionInline(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Let expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
      return EsmNullishCoalesceIr(
        left: _lowerExpression(
          world,
          helpers,
          locals,
          initializer,
          thisExpression: thisExpression,
        ),
        right: _lowerExpression(
          world,
          helpers,
          locals,
          body.then,
          thisExpression: thisExpression,
        ),
      );
    }
    if (body.then is k.NullLiteral) {
      return _tryLowerNullAwareLet(
        world,
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

  EsmExpressionIr? _tryLowerNullAwareLet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableDeclaration variable,
    k.Expression initializer,
    k.Expression otherwise, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final receiver = _lowerExpression(
      world,
      helpers,
      locals,
      initializer,
      thisExpression: thisExpression,
    );
    if (otherwise is k.InstanceGet &&
        _isVariableGet(otherwise.receiver, variable)) {
      final target = otherwise.interfaceTargetReference.node;
      if (target is k.Member) {
        return EsmOptionalPropertyAccessIr(
          receiver: receiver,
          property:
              _sdkInstanceGetterPropertyName(
                otherwise.interfaceTargetReference,
                otherwise.name.text,
              ) ??
              _instanceMemberName(world, target),
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
        return EsmOptionalMethodCallIr(
          receiver: receiver,
          property:
              _sdkInstanceMethodName(
                otherwise.interfaceTargetReference,
                otherwise.name.text,
              ) ??
              _instanceMemberName(world, target),
          arguments: _lowerArguments(
            world,
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

  EsmExpressionIr _lowerBlockExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.BlockExpression expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    return EsmCallIr(
      callee: EsmParenthesizedIr(
        EsmArrowBlockFunctionIr(
          parameters: const [],
          body: [
            ..._lowerStatementList(
              world,
              helpers,
              locals,
              {},
              expression.body,
              thisExpression: thisExpression,
            ),
            EsmReturnStatementIr(
              _lowerExpression(
                world,
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

  EsmExpressionIr _lowerFunctionExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.FunctionExpression expression,
  ) {
    return _lowerFunctionNodeExpression(
      world,
      helpers,
      outerLocals,
      expression.function,
    );
  }

  EsmExpressionIr _lowerFunctionNodeExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> outerLocals,
    k.FunctionNode function,
  ) {
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(
        function,
        'function expression async marker',
      );
    }
    final body = function.body;
    if (body == null) {
      throw NewCompilerUnsupported(function, 'function expression body');
    }
    final locals = Map<k.VariableDeclaration, String>.of(outerLocals);
    final usedParameters = <String>{};
    return EsmArrowBlockFunctionIr(
      parameters: _bindParameters(
        world,
        helpers,
        locals,
        usedParameters,
        function,
      ),
      body: _lowerStatementList(world, helpers, locals, {}, body),
    );
  }

  EsmExpressionIr _lowerLocalFunctionInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.LocalFunctionInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final name = locals[expression.variable];
    if (name == null) {
      throw NewCompilerUnsupported(expression, 'unbound local function');
    }
    return EsmCallIr(
      callee: EsmIdentifierIr(name),
      arguments: _lowerArguments(
        world,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'local function invocation arguments',
      ),
    );
  }

  EsmExpressionIr _lowerConstantExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.ConstantExpression expression,
  ) {
    return _lowerConstant(world, helpers, expression.constant, expression);
  }

  EsmExpressionIr _lowerConstant(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    Object context,
  ) {
    if (constant is k.IntConstant) {
      return EsmNumberLiteralIr(constant.value);
    }
    if (constant is k.DoubleConstant) {
      return EsmNumberLiteralIr(constant.value);
    }
    if (constant is k.StringConstant) {
      return EsmStringLiteralIr(constant.value);
    }
    if (constant is k.BoolConstant) {
      return EsmBooleanLiteralIr(constant.value);
    }
    if (constant is k.NullConstant) {
      return const EsmNullLiteralIr();
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
        EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Object'),
            property: 'freeze',
          ),
          arguments: [
            EsmArrayLiteralIr([
              for (final entry in constant.entries)
                _lowerConstant(world, helpers, entry, context),
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
        EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constSet),
          arguments: [
            EsmArrayLiteralIr([
              for (final entry in constant.entries)
                _lowerConstant(world, helpers, entry, context),
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
        EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constMap),
          arguments: [
            EsmArrayLiteralIr([
              for (final entry in constant.entries)
                EsmArrayLiteralIr([
                  _lowerConstant(world, helpers, entry.key, context),
                  _lowerConstant(world, helpers, entry.value, context),
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
        EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.record),
          arguments: [
            EsmArrayLiteralIr([
              for (final entry in constant.positional)
                _lowerConstant(world, helpers, entry, context),
            ]),
            EsmObjectLiteralIr([
              for (final entry in constant.named.entries)
                EsmObjectLiteralPropertyIr.static(
                  key: entry.key,
                  value: _lowerConstant(world, helpers, entry.value, context),
                ),
            ]),
          ],
        ),
      );
    }
    if (constant is k.StaticTearOffConstant) {
      final extensionTypeMember = world.extensionTypeMemberSymbolForReference(
        constant.targetReference,
      );
      if (extensionTypeMember != null) {
        return EsmIdentifierIr(extensionTypeMember.backingName);
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
        final symbol = world.symbolFor(target);
        if (symbol != null && symbol.kind == EsmProcedureKind.method) {
          return EsmIdentifierIr(symbol.name);
        }
        final staticSymbol =
            world.staticProcedureSymbolFor(target) ??
            world.staticProcedureSymbolForReference(constant.targetReference);
        final staticClass = staticSymbol == null
            ? null
            : world.classSymbolFor(staticSymbol.node.enclosingClass!);
        if (staticSymbol != null &&
            staticClass != null &&
            staticSymbol.kind == EsmProcedureKind.method) {
          return EsmPropertyAccessIr(
            receiver: EsmIdentifierIr(staticClass.name),
            property: staticSymbol.name,
          );
        }
      }
      throw NewCompilerUnsupported(
        context,
        'constant expression lowering ${kernelReferencePath(constant.targetReference)}',
      );
    }
    if (constant is k.ConstructorTearOffConstant ||
        constant is k.RedirectingFactoryTearOffConstant) {
      return _lowerCanonicalConstant(
        helpers,
        constant,
        _lowerConstructorTearOffConstant(world, helpers, constant, context),
      );
    }
    if (constant is k.InstantiationConstant) {
      return _lowerConstant(world, helpers, constant.tearOffConstant, context);
    }
    if (constant is k.TypedefTearOffConstant) {
      return _lowerConstant(world, helpers, constant.tearOffConstant, context);
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
        world,
        helpers,
        constant,
        context,
      );
      return _lowerCanonicalConstant(helpers, constant, instance);
    }
    throw NewCompilerUnsupported(
      context,
      'constant expression lowering ${constant.runtimeType}',
    );
  }

  EsmExpressionIr? _lowerSdkStaticTearOffConstant(
    EsmRuntimeHelperUseSet helpers,
    k.Reference reference,
  ) {
    final target = kernelReferencePath(reference);
    if (target ==
        'dart:collection::ListBase::@methods::dart:collection::_compareAny') {
      helpers.require(EsmRuntimeHelper.compare);
      return EsmArrowFunctionIr(
        parameters: const [
          EsmIdentifierParameterIr(name: 'left'),
          EsmIdentifierParameterIr(name: 'right'),
        ],
        body: EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare),
          arguments: const [EsmIdentifierIr('left'), EsmIdentifierIr('right')],
        ),
      );
    }

    return sdkIntrinsics.lowerStaticTearOffConstant(reference: reference);
  }

  EsmExpressionIr? _lowerDartConvertInstanceConstant(
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
    return EsmCallIr(
      callee: EsmIdentifierIr(helperName),
      arguments: [EsmBooleanLiteralIr(allowMalformed ?? false)],
    );
  }

  EsmExpressionIr _lowerSymbolLiteral(
    EsmRuntimeHelperUseSet helpers,
    String name, {
    k.Reference? libraryReference,
  }) {
    helpers.require(EsmRuntimeHelper.symbol);
    final key = libraryReference == null
        ? name
        : '${kernelReferencePath(libraryReference)}::$name';
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.symbol),
      arguments: [EsmStringLiteralIr(key), EsmStringLiteralIr(name)],
    );
  }

  EsmExpressionIr _lowerTypeLiteral(
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
  ) {
    helpers.require(EsmRuntimeHelper.type);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.type),
      arguments: [EsmStringLiteralIr(_dartTypeName(type))],
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

  EsmExpressionIr _lowerInstanceConstant(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    final klass = constant.classReference.node;
    final mathConstant = _lowerDartMathInstanceConstant(
      world,
      helpers,
      constant,
      context,
    );
    if (mathConstant != null) {
      return mathConstant;
    }
    final coreConstant = _lowerDartCoreInstanceConstant(
      world,
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
      throw NewCompilerUnsupported(
        context,
        'constant expression lowering $classPath',
      );
    }
    final symbol = world.classSymbolFor(klass);
    if (symbol == null) {
      throw NewCompilerUnsupported(
        context,
        'constant expression lowering $classPath',
      );
    }
    final fields = <EsmObjectLiteralPropertyIr>[];
    String? enumName;
    for (final entry in constant.fieldValues.entries) {
      final enumBackingName = klass.isEnum
          ? _enumBackingFieldName(entry.key)
          : null;
      if (enumBackingName != null) {
        final loweredValue = _lowerConstant(
          world,
          helpers,
          entry.value,
          context,
        );
        switch (enumBackingName) {
          case 'index':
            fields.add(
              EsmObjectLiteralPropertyIr.static(
                key: 'index',
                value: loweredValue,
              ),
            );
          case '_name':
            enumName = entry.value is k.StringConstant
                ? (entry.value as k.StringConstant).value
                : null;
            fields.add(
              EsmObjectLiteralPropertyIr.static(
                key: '__dartEnumName',
                value: loweredValue,
              ),
            );
            fields.add(
              EsmObjectLiteralPropertyIr.static(
                key: 'name',
                value: loweredValue,
              ),
            );
          default:
            throw NewCompilerUnsupported(
              context,
              'constant expression lowering',
            );
        }
        continue;
      }
      final field = entry.key.node;
      if (field is! k.Field) {
        throw NewCompilerUnsupported(context, 'constant expression lowering');
      }
      final fieldSymbol = world.instanceFieldSymbolFor(field);
      if (fieldSymbol == null) {
        throw NewCompilerUnsupported(context, 'constant expression lowering');
      }
      fields.add(
        EsmObjectLiteralPropertyIr.static(
          key: fieldSymbol.name,
          value: _lowerConstant(world, helpers, entry.value, context),
        ),
      );
    }
    if (klass.isEnum && enumName != null) {
      fields.add(
        EsmObjectLiteralPropertyIr.static(
          key: 'toString',
          value: EsmFunctionExpressionIr(
            parameters: const [],
            body: [
              EsmReturnStatementIr(
                EsmStringLiteralIr('${klass.name}.$enumName'),
              ),
            ],
          ),
        ),
      );
    }
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('Object'),
        property: 'freeze',
      ),
      arguments: [
        EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Object'),
            property: 'create',
          ),
          arguments: [
            EsmPropertyAccessIr(
              receiver: EsmIdentifierIr(symbol.name),
              property: 'prototype',
            ),
            EsmObjectLiteralIr([
              for (final field in fields)
                EsmObjectLiteralPropertyIr(
                  key: field.key,
                  value: _constantPropertyDescriptor(field.value),
                ),
            ]),
          ],
        ),
      ],
    );
  }

  EsmObjectLiteralIr _constantPropertyDescriptor(EsmExpressionIr value) {
    return EsmObjectLiteralIr([
      EsmObjectLiteralPropertyIr.static(key: 'value', value: value),
      EsmObjectLiteralPropertyIr.static(
        key: 'enumerable',
        value: const EsmBooleanLiteralIr(true),
      ),
    ]);
  }

  EsmExpressionIr? _lowerDartCoreInstanceConstant(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    if (_isDartCoreObjectConstant(constant)) {
      return const EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Object'),
          property: 'freeze',
        ),
        arguments: [EsmObjectLiteralIr([])],
      );
    }
    final errorTypeName = _dartCoreErrorConstantTypeName(constant);
    if (errorTypeName != null) {
      helpers.require(EsmRuntimeHelper.coreError);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
        arguments: [
          EsmStringLiteralIr(errorTypeName),
          _lowerOptionalConstantField(
                world,
                helpers,
                constant,
                'message',
                context,
              ) ??
              const EsmNullLiteralIr(),
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

  EsmExpressionIr? _lowerDartMathInstanceConstant(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    final classPath = kernelReferencePath(constant.classReference);
    if (classPath == 'dart:math::Point') {
      helpers.require(EsmRuntimeHelper.mathPoint);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mathPoint),
        arguments: [
          _lowerConstantField(world, helpers, constant, 'x', context),
          _lowerConstantField(world, helpers, constant, 'y', context),
        ],
      );
    }
    if (classPath == 'dart:math::Rectangle') {
      helpers.require(EsmRuntimeHelper.mathRectangle);
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mathRectangle,
        ),
        arguments: [
          _lowerConstantField(world, helpers, constant, 'left', context),
          _lowerConstantField(world, helpers, constant, 'top', context),
          _lowerConstantField(world, helpers, constant, 'width', context),
          _lowerConstantField(world, helpers, constant, 'height', context),
        ],
      );
    }
    return null;
  }

  EsmExpressionIr _lowerConstantField(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    String fieldName,
    Object context,
  ) {
    for (final entry in constant.fieldValues.entries) {
      final path = kernelReferencePath(entry.key);
      if (path.endsWith('::@fields::$fieldName') ||
          path.endsWith('::$fieldName')) {
        return _lowerConstant(world, helpers, entry.value, context);
      }
    }
    throw NewCompilerUnsupported(context, 'constant expression lowering');
  }

  EsmExpressionIr? _lowerOptionalConstantField(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    String fieldName,
    Object context,
  ) {
    for (final entry in constant.fieldValues.entries) {
      final path = kernelReferencePath(entry.key);
      if (path.endsWith('::@fields::$fieldName') ||
          path.endsWith('::$fieldName')) {
        return _lowerConstant(world, helpers, entry.value, context);
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

  EsmExpressionIr _lowerConstructorTearOffConstant(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    Object context,
  ) {
    final target = switch (constant) {
      k.ConstructorTearOffConstant() => constant.target,
      k.RedirectingFactoryTearOffConstant() => constant.target,
      _ => throw NewCompilerUnsupported(
        context,
        'constant expression lowering',
      ),
    };
    final function = target.function;
    if (function == null || function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(context, 'constant expression lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final usedParameters = <String>{};
    final parameters = _bindParameters(
      world,
      helpers,
      locals,
      usedParameters,
      function,
    );
    return EsmFunctionExpressionIr(
      parameters: parameters,
      body: [
        EsmReturnStatementIr(
          _lowerConstructorTearOffInvocation(world, target, function, locals),
        ),
      ],
    );
  }

  EsmExpressionIr _lowerConstructorTearOffInvocation(
    EsmSemanticWorld world,
    k.Member target,
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals,
  ) {
    final arguments = _forwardingArguments(function, locals);
    if (target is k.Constructor) {
      final klass = world.classSymbolFor(target.enclosingClass);
      final constructor = world.constructorSymbolFor(target);
      if (klass == null || constructor == null) {
        throw NewCompilerUnsupported(target, 'constructor tear-off target');
      }
      if (constructor.name.isEmpty) {
        return EsmNewIr(
          callee: EsmIdentifierIr(klass.name),
          arguments: arguments,
        );
      }
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(klass.name),
          property: constructor.name,
        ),
        arguments: arguments,
      );
    }
    if (target is k.Procedure &&
        target.kind == k.ProcedureKind.Factory &&
        target.enclosingClass != null) {
      final klass = world.classSymbolFor(target.enclosingClass!);
      final procedure = world.staticProcedureSymbolFor(target);
      if (klass == null || procedure == null) {
        throw NewCompilerUnsupported(target, 'constructor tear-off target');
      }
      if (target.name.text.isEmpty) {
        return EsmNewIr(
          callee: EsmIdentifierIr(klass.name),
          arguments: arguments,
        );
      }
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(klass.name),
          property: procedure.name,
        ),
        arguments: arguments,
      );
    }
    throw NewCompilerUnsupported(target, 'constructor tear-off target');
  }

  List<EsmExpressionIr> _forwardingArguments(
    k.FunctionNode function,
    Map<k.VariableDeclaration, String> locals,
  ) {
    return [
      for (final parameter in function.positionalParameters)
        EsmIdentifierIr(locals[parameter]!),
      if (function.namedParameters.isNotEmpty)
        EsmObjectLiteralIr([
          for (final parameter in function.namedParameters)
            EsmObjectLiteralPropertyIr.static(
              key: parameter.name ?? 'arg',
              value: EsmIdentifierIr(locals[parameter]!),
            ),
        ]),
    ];
  }

  EsmExpressionIr _lowerCanonicalConstant(
    EsmRuntimeHelperUseSet helpers,
    k.Constant constant,
    EsmExpressionIr value,
  ) {
    helpers.require(EsmRuntimeHelper.constValue);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.constValue),
      arguments: [
        EsmStringLiteralIr(_constantKey(constant)),
        EsmArrowFunctionIr(parameters: const [], body: value),
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

  EsmExpressionIr _lowerStaticGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.StaticGet expression,
  ) {
    final runtimeStaticGet = _lowerRuntimeStaticGet(helpers, expression);
    if (runtimeStaticGet != null) {
      return runtimeStaticGet;
    }
    final extensionTypeMember = world.extensionTypeMemberSymbolForReference(
      expression.targetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeStaticGet(extensionTypeMember);
    }
    final target = expression.targetReference.node;
    if (target is k.Field) {
      final symbol = world.fieldSymbolFor(target);
      if (symbol != null) {
        if (symbol.node.isLate) {
          return EsmCallIr(
            callee: EsmPropertyAccessIr(
              receiver: EsmIdentifierIr(symbol.backingName!),
              property: 'get',
            ),
            arguments: const [],
          );
        }
        return EsmIdentifierIr(symbol.name);
      }
      final staticSymbol = world.staticFieldSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = world.classSymbolFor(enclosingClass);
        if (staticSymbol != null && klass != null) {
          return EsmPropertyAccessIr(
            receiver: EsmIdentifierIr(klass.name),
            property: staticSymbol.name,
          );
        }
      }
    }
    final symbol =
        (target is k.Procedure ? world.symbolFor(target) : null) ??
        world.symbolForReference(expression.targetReference);
    if (symbol != null) {
      return switch (symbol.kind) {
        EsmProcedureKind.method => EsmIdentifierIr(symbol.name),
        EsmProcedureKind.getter => EsmCallIr(
          callee: EsmIdentifierIr(symbol.name),
          arguments: const [],
        ),
        EsmProcedureKind.setter => throw NewCompilerUnsupported(
          expression,
          'static setter get lowering',
        ),
      };
    }
    final staticSymbol =
        (target is k.Procedure
            ? world.staticProcedureSymbolFor(target)
            : null) ??
        world.staticProcedureSymbolForReference(expression.targetReference);
    final staticClass = staticSymbol == null
        ? null
        : world.classSymbolFor(staticSymbol.node.enclosingClass!);
    if (staticSymbol != null && staticClass != null) {
      return switch (staticSymbol.kind) {
        EsmProcedureKind.method => EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(staticClass.name),
          property: staticSymbol.name,
        ),
        EsmProcedureKind.getter => EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(staticClass.name),
          property: staticSymbol.name,
        ),
        EsmProcedureKind.setter => throw NewCompilerUnsupported(
          expression,
          'static setter get lowering',
        ),
      };
    }
    throw NewCompilerUnsupported(
      expression,
      'static get lowering ${kernelReferencePath(expression.targetReference)}',
    );
  }

  EsmExpressionIr? _lowerRuntimeStaticGet(
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
      return const EsmNullishCoalesceIr(
        left: EsmPropertyAccessIr(
          receiver: EsmNewIr(callee: EsmIdentifierIr('Error'), arguments: []),
          property: 'stack',
        ),
        right: EsmStringLiteralIr(''),
      );
    }
    return null;
  }

  EsmExpressionIr _lowerExtensionTypeStaticGet(
    EsmExtensionTypeMemberSymbol member,
  ) {
    return switch (member.descriptor.kind) {
      k.ExtensionTypeMemberKind.Field => EsmIdentifierIr(member.backingName),
      k.ExtensionTypeMemberKind.Getter => EsmCallIr(
        callee: EsmIdentifierIr(member.backingName),
        arguments: const [],
      ),
      k.ExtensionTypeMemberKind.Constructor ||
      k.ExtensionTypeMemberKind.Factory ||
      k.ExtensionTypeMemberKind.RedirectingFactory ||
      k.ExtensionTypeMemberKind.Method ||
      k.ExtensionTypeMemberKind.Operator => EsmIdentifierIr(member.backingName),
      k.ExtensionTypeMemberKind.Setter => throw NewCompilerUnsupported(
        member.descriptor,
        'extension type setter get',
      ),
    };
  }

  EsmExpressionIr _lowerStaticSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final extensionTypeMember = world.extensionTypeMemberSymbolForReference(
      expression.targetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeStaticSet(
        world,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final target = expression.targetReference.node;
    if (target is k.Field) {
      final symbol = world.fieldSymbolFor(target);
      if (symbol != null) {
        final value = _lowerExpression(
          world,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        );
        if (symbol.node.isLate) {
          return EsmCallIr(
            callee: EsmPropertyAccessIr(
              receiver: EsmIdentifierIr(symbol.backingName!),
              property: 'set',
            ),
            arguments: [value],
          );
        }
        if (!symbol.mutable) {
          throw NewCompilerUnsupported(expression, 'write to final field');
        }
        return EsmAssignmentIr(
          target: EsmIdentifierIr(symbol.name),
          value: value,
        );
      }
      final staticSymbol = world.staticFieldSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = world.classSymbolFor(enclosingClass);
        if (staticSymbol != null && klass != null) {
          if (!staticSymbol.mutable && !staticSymbol.node.isLate) {
            throw NewCompilerUnsupported(expression, 'write to final field');
          }
          return EsmAssignmentIr(
            target: EsmPropertyAccessIr(
              receiver: EsmIdentifierIr(klass.name),
              property: staticSymbol.name,
            ),
            value: _lowerExpression(
              world,
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
      final symbol = world.symbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.setter) {
        return EsmCallIr(
          callee: EsmIdentifierIr(symbol.name),
          arguments: [
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.value,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
      final staticSymbol = world.staticProcedureSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = world.classSymbolFor(enclosingClass);
        if (staticSymbol != null &&
            klass != null &&
            staticSymbol.kind == EsmProcedureKind.setter) {
          return EsmAssignmentIr(
            target: EsmPropertyAccessIr(
              receiver: EsmIdentifierIr(klass.name),
              property: staticSymbol.name,
            ),
            value: _lowerExpression(
              world,
              helpers,
              locals,
              expression.value,
              thisExpression: thisExpression,
            ),
          );
        }
      }
    }
    throw NewCompilerUnsupported(expression, 'static set lowering');
  }

  EsmExpressionIr _lowerExtensionTypeStaticSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.StaticSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (member.descriptor.kind != k.ExtensionTypeMemberKind.Field ||
        !member.mutable) {
      throw NewCompilerUnsupported(expression, 'extension type static set');
    }
    return EsmAssignmentIr(
      target: EsmIdentifierIr(member.backingName),
      value: _lowerExpression(
        world,
        helpers,
        locals,
        expression.value,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmExpressionIr _lowerVariableSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final name = locals[expression.variable];
    if (name == null) {
      throw NewCompilerUnsupported(expression, 'unbound variable set');
    }
    final value = _lowerExpression(
      world,
      helpers,
      locals,
      expression.value,
      thisExpression: thisExpression,
    );
    if (expression.variable.isLate) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(name),
          property: 'set',
        ),
        arguments: [value],
      );
    }
    return EsmAssignmentIr(target: EsmIdentifierIr(name), value: value);
  }

  EsmExpressionIr _lowerInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final operator = expression.name.text;
    final extensionTypeMember = world.extensionTypeMemberSymbolForReference(
      expression.interfaceTargetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeInstanceInvocation(
        world,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final target = expression.interfaceTargetReference.node;
    if (target is k.Procedure) {
      final symbol = world.instanceProcedureSymbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.method) {
        final receiver = _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        );
        return EsmCallIr(
          callee: _memberAccess(receiver, symbol.name),
          arguments: _lowerArguments(
            world,
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
      world,
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
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
      if (intrinsic != null) {
        return intrinsic;
      }
      throw NewCompilerUnsupported(
        expression,
        'instance invocation lowering '
        '${kernelReferencePath(expression.interfaceTargetReference)}',
      );
    }
    final left = _lowerExpression(
      world,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final right = _lowerExpression(
      world,
      helpers,
      locals,
      expression.arguments.positional.single,
      thisExpression: thisExpression,
    );
    if (operator == '>>') {
      helpers.require(EsmRuntimeHelper.intShift);
      return EsmCallIr(
        callee: helpers.reference(
          const EsmRuntimeHelperRegistry(),
          EsmRuntimeHelper.intShift,
        ),
        arguments: [left, right],
      );
    }
    if (operator == '&') {
      if (_isMask32Literal(right)) {
        return EsmBinaryIr(
          left: left,
          operator: EsmBinaryOperatorIr.unsignedRightShift,
          right: const EsmNumberLiteralIr(0),
        );
      }
      if (_isMask32Literal(left)) {
        return EsmBinaryIr(
          left: right,
          operator: EsmBinaryOperatorIr.unsignedRightShift,
          right: const EsmNumberLiteralIr(0),
        );
      }
    }
    return EsmBinaryIr(left: left, operator: binaryOperator, right: right);
  }

  bool _isMask32Literal(EsmExpressionIr expression) {
    return expression is EsmNumberLiteralIr && expression.value == 0xffffffff;
  }

  EsmExpressionIr? _lowerSdkInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final sdkIntrinsic = sdkIntrinsics.lowerInstanceInvocation(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
      arguments: expression.arguments,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lowerReceiver: () => _lowerExpression(
        world,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      lower: (argument) => _lowerExpression(
        world,
        helpers,
        locals,
        argument,
        thisExpression: thisExpression,
      ),
      lowerNamedArgument: (arguments, argumentName) => _lowerNamedArgument(
        world,
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
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreTimeInvocation != null) {
      return coreTimeInvocation;
    }
    final webInvocation = _lowerWebInstanceInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (webInvocation != null) {
      return webInvocation;
    }
    return _lowerMathInstanceInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
  }

  EsmExpressionIr? _lowerCoreTimeInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.types.isNotEmpty) {
      return null;
    }
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final name = expression.name.text;
    final positional = expression.arguments.positional;
    final receiver = _lowerExpression(
      world,
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
      return EsmCallIr(
        callee: _memberAccess(receiver, name),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: _memberAccess(receiver, name),
        arguments: const [],
      );
    }
    if (name == 'compareTo' && positional.length == 1) {
      return EsmCallIr(
        callee: _memberAccess(receiver, name),
        arguments: [
          _lowerExpression(
            world,
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
      world,
      helpers,
      locals,
      positional.single,
      thisExpression: thisExpression,
    );
    return switch (name) {
      '+' => _durationFromMicros(
        helpers,
        EsmBinaryIr(
          left: EsmPropertyAccessIr(
            receiver: receiver,
            property: 'inMicroseconds',
          ),
          operator: EsmBinaryOperatorIr.add,
          right: EsmPropertyAccessIr(
            receiver: right,
            property: 'inMicroseconds',
          ),
        ),
      ),
      '-' => _durationFromMicros(
        helpers,
        EsmBinaryIr(
          left: EsmPropertyAccessIr(
            receiver: receiver,
            property: 'inMicroseconds',
          ),
          operator: EsmBinaryOperatorIr.subtract,
          right: EsmPropertyAccessIr(
            receiver: right,
            property: 'inMicroseconds',
          ),
        ),
      ),
      '*' => _durationFromMicros(
        helpers,
        _mathRound(
          EsmBinaryIr(
            left: EsmPropertyAccessIr(
              receiver: receiver,
              property: 'inMicroseconds',
            ),
            operator: EsmBinaryOperatorIr.multiply,
            right: right,
          ),
        ),
      ),
      '~/' => _durationFromMicros(
        helpers,
        _mathTrunc(
          EsmBinaryIr(
            left: EsmPropertyAccessIr(
              receiver: receiver,
              property: 'inMicroseconds',
            ),
            operator: EsmBinaryOperatorIr.divide,
            right: right,
          ),
        ),
      ),
      '<' || '<=' || '>' || '>=' => EsmBinaryIr(
        left: EsmPropertyAccessIr(
          receiver: receiver,
          property: 'inMicroseconds',
        ),
        operator: _binaryOperators[name]!,
        right: EsmPropertyAccessIr(receiver: right, property: 'inMicroseconds'),
      ),
      _ => null,
    };
  }

  EsmCallIr _durationFromMicros(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr microseconds,
  ) {
    helpers.require(EsmRuntimeHelper.duration);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.duration),
      arguments: [
        EsmObjectLiteralIr([
          EsmObjectLiteralPropertyIr.static(
            key: 'microseconds',
            value: microseconds,
          ),
        ]),
      ],
    );
  }

  EsmExpressionIr? _lowerWebInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: methodName,
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (name == 'getAttribute' || name == 'setAttribute') {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
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
              world,
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

  EsmExpressionIr? _lowerMathInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
      world,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    return EsmCallIr(
      callee: _memberAccess(receiver, name),
      arguments: [
        for (final argument in positional)
          _lowerExpression(
            world,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
      ],
    );
  }

  EsmExpressionIr _lowerDynamicInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.DynamicInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(expression, 'expression lowering');
    }
    final isCall = expression.name.text == 'call';
    final helper = isCall
        ? EsmRuntimeHelper.dynamicCall
        : EsmRuntimeHelper.dynamicInvoke;
    helpers.require(helper);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, helper),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        if (!isCall) EsmStringLiteralIr(expression.name.text),
        EsmArrayLiteralIr([
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ]),
        if (expression.arguments.named.isEmpty)
          const EsmNullLiteralIr()
        else
          EsmObjectLiteralIr([
            for (final argument in expression.arguments.named)
              EsmObjectLiteralPropertyIr.static(
                key: argument.name,
                value: _lowerExpression(
                  world,
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

  EsmExpressionIr _lowerExtensionTypeInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final kind = member.descriptor.kind;
    if (kind != k.ExtensionTypeMemberKind.Method &&
        kind != k.ExtensionTypeMemberKind.Operator) {
      throw NewCompilerUnsupported(
        expression,
        'extension type instance invocation',
      );
    }
    return EsmCallIr(
      callee: EsmIdentifierIr(member.backingName),
      arguments: [
        _lowerExtensionTypeInstanceReceiver(
          world,
          helpers,
          locals,
          member,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        ..._lowerArguments(
          world,
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

  EsmExpressionIr? _lowerCoreInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
      world,
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
      world,
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
      world,
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
      world,
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
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (typedDataInvocation != null) {
      return typedDataInvocation;
    }
    final bigIntInvocation = _lowerBigIntInstanceInvocation(
      world,
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
      world,
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
      world,
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
      world,
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
      world,
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
      world,
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
      world,
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
              world,
              helpers,
              locals,
              expression.arguments,
              'detach',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteralIr();
        return EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: _lowerExpression(
              world,
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
                world,
                helpers,
                locals,
                argument,
                thisExpression: thisExpression,
              ),
            EsmObjectLiteralIr([
              EsmObjectLiteralPropertyIr.static(key: 'detach', value: detach),
            ]),
          ],
        );
      }
      if (memberName == 'detach' &&
          positional.length == 1 &&
          expression.arguments.named.isEmpty) {
        return EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'detach',
          ),
          arguments: [
            _lowerExpression(
              world,
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
        return EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            property: 'get',
          ),
          arguments: [
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.arguments.positional.single,
              thisExpression: thisExpression,
            ),
          ],
        );
      }
      if (memberName == '[]=' && expression.arguments.positional.length == 2) {
        return EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: _lowerExpression(
              world,
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
                world,
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
        world,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      );
      final property = _lowerExpression(
        world,
        helpers,
        locals,
        expression.arguments.positional.single,
        thisExpression: thisExpression,
      );
      if (isMapMember) {
        helpers.require(EsmRuntimeHelper.mapGet);
        return EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapGet),
          arguments: [receiver, property],
        );
      }
      if (isListMember) {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartListLikeGet'),
          arguments: [receiver, property],
        );
      }
      return EsmComputedPropertyAccessIr(
        receiver: receiver,
        property: property,
      );
    }
    if (memberName == '[]=' &&
        expression.arguments.positional.length == 2 &&
        isMapMember) {
      helpers.require(EsmRuntimeHelper.mapSet);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapSet),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
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
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartListLikeSet'),
          arguments: [
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            for (final argument in expression.arguments.positional)
              _lowerExpression(
                world,
                helpers,
                locals,
                argument,
                thisExpression: thisExpression,
              ),
          ],
        );
      }
      return EsmAssignmentIr(
        target: EsmComputedPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: _lowerExpression(
            world,
            helpers,
            locals,
            expression.arguments.positional[0],
            thisExpression: thisExpression,
          ),
        ),
        value: _lowerExpression(
          world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mapAddAll),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapAddEntries'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mapContainsKey,
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapContainsValue'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapPutIfAbsent'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
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
        world,
        helpers,
        locals,
        expression.arguments,
        'ifAbsent',
        thisExpression: thisExpression,
      );
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapUpdate'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapForEach'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapMap'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
        world,
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
      return EsmCallIr(
        callee: EsmIdentifierIr(mapMutationHelper),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmAssignmentIr(
        target: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'length',
        ),
        value: const EsmNumberLiteralIr(0),
      );
    }
    if (((isMapMember && memberName == 'clear') ||
            target == 'dart:_compact_hash::_Map::@methods::clear') &&
        expression.arguments.named.isEmpty &&
        expression.arguments.positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.mapOps);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapClear'),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSetAdd'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSetContains'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmIdentifierIr(setHelper),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.setAddAll),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAdd),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listAddAll),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            const EsmStringLiteralIr('')
          else
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: 'includes',
        ),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmCallIr(
            callee: const EsmIdentifierIr('Number'),
            arguments: [
              _lowerExpression(
                world,
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
            world,
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
      world,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    if (target == 'dart:core::int::@methods::unary-') {
      return EsmUnaryIr(operator: EsmUnaryOperatorIr.negate, operand: receiver);
    }
    if (target == 'dart:core::num::@methods::unary-' ||
        target == 'dart:core::double::@methods::unary-') {
      return EsmUnaryIr(operator: EsmUnaryOperatorIr.negate, operand: receiver);
    }
    if (target == 'dart:core::BigInt::@methods::unary-') {
      return EsmUnaryIr(operator: EsmUnaryOperatorIr.negate, operand: receiver);
    }
    if (target == 'dart:core::int::@methods::~') {
      return EsmUnaryIr(operator: EsmUnaryOperatorIr.bitNot, operand: receiver);
    }
    if (target == 'dart:core::Object::@methods::toString') {
      helpers.require(EsmRuntimeHelper.safeToString);
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.safeToString,
        ),
        arguments: [receiver],
      );
    }
    if (target.startsWith('dart:') && expression.name.text == 'toString') {
      return EsmCallIr(
        callee: const EsmIdentifierIr('String'),
        arguments: [receiver],
      );
    }
    return null;
  }

  EsmExpressionIr? _lowerMixinCollectionInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    String memberName, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.iterableJoin,
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          if (positional case [final separator])
            _lowerExpression(
              world,
              helpers,
              locals,
              separator,
              thisExpression: thisExpression,
            )
          else
            const EsmStringLiteralIr(''),
        ],
      );
    }
    if (memberName == 'insert' && positional.length == 2) {
      if (!isListMixin) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.listMixin);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListMixinInsert'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in positional)
            _lowerExpression(
              world,
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

  EsmExpressionIr? _lowerTypedDataInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final name = expression.name.text;
    if (!isDartTypedDataMember(expression.interfaceTargetReference, name)) {
      return null;
    }
    EsmExpressionIr lower(k.Expression argument) => _lowerExpression(
      world,
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
        world,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      lower: lower,
      lowerNamedArgument: (arguments, argumentName) => _lowerNamedArgument(
        world,
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

  EsmExpressionIr? _lowerCoreStringInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.types.isNotEmpty || !_isCoreStringTarget(target)) {
      return null;
    }
    final positional = expression.arguments.positional;
    final receiver = _lowerExpression(
      world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(receiver: receiver, property: noArgMethod),
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(receiver: receiver, property: directMethod),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: receiver,
          property: directPatternMethod,
        ),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ],
      );
    }
    final patternCall = _lowerCoreStringPatternInvocation(
      world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(receiver: receiver, property: 'includes'),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: receiver,
          property: target.endsWith('padLeft') ? 'padStart' : 'padEnd',
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          positional.length == 1
              ? const EsmStringLiteralIr(' ')
              : _lowerExpression(
                  world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringOps),
        arguments: [
          receiver,
          for (final argument in positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartStringReplaceRange'),
        arguments: [
          receiver,
          for (final argument in positional)
            _lowerExpression(
              world,
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

  EsmExpressionIr? _lowerCoreStringPatternInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    EsmExpressionIr receiver, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final positional = expression.arguments.positional;
    EsmExpressionIr lower(k.Expression argument) => _lowerExpression(
      world,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );

    EsmExpressionIr callPatternHelper(
      String name,
      List<EsmExpressionIr> arguments,
    ) {
      helpers.require(EsmRuntimeHelper.pattern);
      return EsmCallIr(callee: EsmIdentifierIr(name), arguments: arguments);
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
            : const EsmNumberLiteralIr(0),
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
            : const EsmNumberLiteralIr(0),
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
            : const EsmNumberLiteralIr(0),
      ]);
    }
    if (expression.arguments.named.isEmpty &&
        target == 'dart:core::String::@methods::lastIndexOf' &&
        positional.isNotEmpty &&
        positional.length <= 2) {
      return callPatternHelper('__dartStringLastIndexOf', [
        receiver,
        lower(positional[0]),
        positional.length == 2
            ? lower(positional[1])
            : const EsmNullLiteralIr(),
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
            : const EsmNumberLiteralIr(0),
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
            : const EsmNumberLiteralIr(0),
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
            : const EsmNumberLiteralIr(0),
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
            : const EsmNumberLiteralIr(0),
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
              world,
              helpers,
              locals,
              expression.arguments,
              'onMatch',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteralIr(),
        _lowerNamedArgument(
              world,
              helpers,
              locals,
              expression.arguments,
              'onNonMatch',
              thisExpression: thisExpression,
            ) ??
            const EsmNullLiteralIr(),
      ]);
    }
    return null;
  }

  EsmExpressionIr? _lowerCoreStringBufferInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: _lowerExpression(
          world,
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
            world,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
      ],
    );
  }

  EsmExpressionIr? _lowerCorePatternInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
    return EsmCallIr(
      callee: EsmIdentifierIr(helperName),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        _lowerExpression(
          world,
          helpers,
          locals,
          positional[0],
          thisExpression: thisExpression,
        ),
        positional.length == 2
            ? _lowerExpression(
                world,
                helpers,
                locals,
                positional[1],
                thisExpression: thisExpression,
              )
            : const EsmNumberLiteralIr(0),
      ],
    );
  }

  EsmExpressionIr? _lowerCoreRegExpInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: _lowerExpression(
          world,
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
            world,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
      ],
    );
  }

  EsmExpressionIr? _lowerCoreMatchInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: method,
      ),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpressionIr? _lowerCoreCollectionInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    EsmExpressionIr lower(k.Expression argument) => _lowerExpression(
      world,
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
        world,
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
            world,
            helpers,
            locals,
            expression.arguments,
            'growable',
            thisExpression: thisExpression,
          ) ??
          const EsmBooleanLiteralIr(true);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSetFrom'),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'filter',
        ),
        arguments: [
          EsmArrowFunctionIr(
            parameters: const [EsmIdentifierParameterIr(name: 'value')],
            body: _lowerTypeTest(
              world,
              helpers,
              expression.arguments.types.single,
              const EsmIdentifierIr('value'),
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
        world,
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
      return EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Array'),
          property: 'from',
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
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
        world,
        helpers,
        locals,
        expression.arguments,
        'orElse',
        thisExpression: thisExpression,
      );
      return EsmCallIr(
        callee: EsmIdentifierIr(helperName),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
            helpers,
            locals,
            expression.arguments.positional[1],
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
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
      return EsmComputedPropertyAccessIr(
        receiver: _arrayFrom(
          helpers,
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
        ),
        property: _lowerExpression(
          world,
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
      return EsmCallIr(
        callee: EsmIdentifierIr(helperName),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
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
          : EsmArrowFunctionIr(
              parameters: const [
                EsmIdentifierParameterIr(name: 'left'),
                EsmIdentifierParameterIr(name: 'right'),
              ],
              body: EsmCallIr(
                callee: helpers.reference(
                  runtimeHelpers,
                  EsmRuntimeHelper.compare,
                ),
                arguments: [
                  const EsmIdentifierIr('left'),
                  const EsmIdentifierIr('right'),
                  _lowerExpression(
                    world,
                    helpers,
                    locals,
                    expression.arguments.positional.single,
                    thisExpression: thisExpression,
                  ),
                ],
              ),
            );
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListShuffle'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          if (expression.arguments.positional.isEmpty)
            const EsmNullLiteralIr()
          else
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListRemoveRange'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
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
        return EsmCallIr(
          callee: EsmIdentifierIr(
            retainMatching.value
                ? '__dartListRetainWhere'
                : '__dartListRemoveWhere',
          ),
          arguments: [
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: EsmIdentifierIr(listMutationHelper),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListSetRange'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          for (final argument in expression.arguments.positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListRemoveLast'),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListAsMap'),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
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
              world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
              world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'slice',
        ),
        arguments: [
          const EsmNumberLiteralIr(0),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.iterableWindow,
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartIterableSkipWhile'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
              world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
          ),
          property: 'flatMap',
        ),
        arguments: [
          EsmArrowFunctionIr(
            parameters: const [EsmIdentifierParameterIr(name: 'value')],
            body: _arrayFrom(
              helpers,
              EsmCallIr(
                callee: EsmParenthesizedIr(
                  _lowerExpression(
                    world,
                    helpers,
                    locals,
                    expression.arguments.positional.single,
                    thisExpression: thisExpression,
                  ),
                ),
                arguments: const [EsmIdentifierIr('value')],
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
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

  EsmExpressionIr? _lowerSinkInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target,
    String memberName, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
    return EsmCallIr(
      callee: _memberAccess(
        _lowerExpression(
          world,
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
            world,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
      ],
    );
  }

  EsmExpressionIr? _lowerDartConvertInterfaceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String memberName, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
    return EsmCallIr(
      callee: _memberAccess(
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        memberName,
      ),
      arguments: _lowerArguments(
        world,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'dart:convert interface invocation arguments',
      ),
    );
  }

  EsmExpressionIr? _lowerCoreNumberInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final positional = expression.arguments.positional;
    if (expression.arguments.named.isEmpty && positional.isEmpty) {
      final receiver = _lowerExpression(
        world,
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
        return EsmCallIr(
          callee: helpers.reference(
            runtimeHelpers,
            EsmRuntimeHelper.doubleValue,
          ),
          arguments: [
            EsmCallIr(
              callee: EsmPropertyAccessIr(
                receiver: const EsmIdentifierIr('Math'),
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
        return EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: const EsmIdentifierIr('Math'),
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
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        );
        return EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Math'),
            property: 'min',
          ),
          arguments: [
            EsmCallIr(
              callee: const EsmPropertyAccessIr(
                receiver: EsmIdentifierIr('Math'),
                property: 'max',
              ),
              arguments: [
                receiver,
                _lowerExpression(
                  world,
                  helpers,
                  locals,
                  positional[0],
                  thisExpression: thisExpression,
                ),
              ],
            ),
            _lowerExpression(
              world,
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
        return EsmBinaryIr(
          left: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          operator: EsmBinaryOperatorIr.remainder,
          right: _lowerExpression(
            world,
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
          EsmBinaryIr(
            left: _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            operator: EsmBinaryOperatorIr.divide,
            right: _lowerExpression(
              world,
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
        return EsmCallIr(
          callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.intGcd),
          arguments: [
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            _lowerExpression(
              world,
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
        return EsmCallIr(
          callee: helpers.reference(
            runtimeHelpers,
            EsmRuntimeHelper.intModular,
          ),
          arguments: [
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            _lowerExpression(
              world,
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
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartIntModPow'),
          arguments: [
            _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            for (final argument in positional)
              _lowerExpression(
                world,
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
        return EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: EsmParenthesizedIr(
              _lowerExpression(
                world,
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
              world,
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
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.compare),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        _lowerExpression(
          world,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpressionIr? _lowerBigIntInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final receiver = _lowerExpression(
      world,
      helpers,
      locals,
      expression.receiver,
      thisExpression: thisExpression,
    );
    final positional = expression.arguments.positional;
    if (target == 'dart:core::BigInt::@methods::toInt' && positional.isEmpty) {
      return EsmCallIr(
        callee: const EsmIdentifierIr('Number'),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::BigInt::@methods::toRadixString' &&
        positional.length == 1) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(receiver: receiver, property: 'toString'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (target == 'dart:core::BigInt::@methods::abs' && positional.isEmpty) {
      return EsmConditionalIr(
        condition: EsmBinaryIr(
          left: receiver,
          operator: EsmBinaryOperatorIr.lessThan,
          right: _bigIntLiteral(0),
        ),
        thenExpression: EsmUnaryIr(
          operator: EsmUnaryOperatorIr.negate,
          operand: receiver,
        ),
        otherwiseExpression: receiver,
      );
    }
    if (target == 'dart:core::BigInt::@methods::remainder' &&
        positional.length == 1) {
      return EsmBinaryIr(
        left: receiver,
        operator: EsmBinaryOperatorIr.remainder,
        right: _lowerExpression(
          world,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    if (target == 'dart:core::BigInt::@methods::~/') {
      if (positional.length != 1) return null;
      return EsmBinaryIr(
        left: receiver,
        operator: EsmBinaryOperatorIr.divide,
        right: _lowerExpression(
          world,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      );
    }
    return null;
  }

  EsmExpressionIr _lowerInstanceGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final intrinsic = _lowerCoreInstanceGet(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (intrinsic != null) {
      return intrinsic;
    }
    final extensionTypeMember = world.extensionTypeMemberSymbolForReference(
      expression.interfaceTargetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeInstanceGet(
        world,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final sdkIntrinsic = _lowerSdkInstanceGet(
      world,
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
      throw NewCompilerUnsupported(
        expression,
        'instance get lowering for '
        '${kernelReferencePath(expression.interfaceTargetReference)}',
      );
    }
    return EsmPropertyAccessIr(
      receiver: _lowerExpression(
        world,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      property: _instanceMemberName(world, target),
    );
  }

  EsmExpressionIr? _lowerSdkInstanceGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final sdkIntrinsic = sdkIntrinsics.lowerInstanceGet(
      reference: expression.interfaceTargetReference,
      name: expression.name.text,
      helpers: helpers,
      lowerReceiver: () => _lowerExpression(
        world,
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
          world,
          helpers,
          locals,
          expression,
          thisExpression: thisExpression,
        ) ??
        _lowerMathInstanceGet(
          world,
          helpers,
          locals,
          expression,
          thisExpression: thisExpression,
        );
  }

  EsmExpressionIr? _lowerWebInstanceGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final name = expression.name.text;
    final receiver = _lowerExpression(
      world,
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
      return EsmPropertyAccessIr(receiver: receiver, property: property);
    }
    return null;
  }

  EsmExpressionIr? _lowerMixinCollectionInstanceGet(
    String target,
    String memberName,
    EsmExpressionIr receiver,
    EsmRuntimeHelperUseSet helpers,
  ) {
    if (!target.contains('ListMixin::@getters::$memberName') &&
        !target.contains('IterableMixin::@getters::$memberName')) {
      return null;
    }
    return switch (memberName) {
      'length' => EsmPropertyAccessIr(receiver: receiver, property: 'length'),
      'isEmpty' => EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNumberLiteralIr(0),
      ),
      'isNotEmpty' => EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperatorIr.greaterThan,
        right: const EsmNumberLiteralIr(0),
      ),
      'first' => () {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartListMixinFirst'),
          arguments: [receiver],
        );
      }(),
      'last' => () {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartListMixinLast'),
          arguments: [receiver],
        );
      }(),
      'single' => () {
        helpers.require(EsmRuntimeHelper.listMixin);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartListMixinSingle'),
          arguments: [receiver],
        );
      }(),
      _ => null,
    };
  }

  EsmExpressionIr? _lowerMathInstanceGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
    return EsmPropertyAccessIr(
      receiver: _lowerExpression(
        world,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      property: property,
    );
  }

  EsmExpressionIr _lowerExtensionTypeInstanceGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.InstanceGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final receiver = _lowerExtensionTypeInstanceReceiver(
      world,
      helpers,
      locals,
      member,
      expression.receiver,
      thisExpression: thisExpression,
    );
    return switch (member.descriptor.kind) {
      k.ExtensionTypeMemberKind.Getter => EsmCallIr(
        callee: EsmIdentifierIr(member.backingName),
        arguments: [receiver],
      ),
      k.ExtensionTypeMemberKind.Method || k.ExtensionTypeMemberKind.Operator =>
        _lowerExtensionTypeInstanceTearOff(world, helpers, member, receiver),
      _ => throw NewCompilerUnsupported(
        expression,
        'extension type instance get',
      ),
    };
  }

  EsmExpressionIr _lowerExtensionTypeInstanceTearOff(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmExtensionTypeMemberSymbol member,
    EsmExpressionIr receiver,
  ) {
    final procedure = _extensionTypeProcedure(member);
    final locals = <k.VariableDeclaration, String>{};
    final usedNames = <String>{};
    final parameters = _bindExtensionTypeFacadeParameters(
      world,
      helpers,
      locals,
      usedNames,
      procedure.function,
      skipReceiver: true,
    );
    return EsmFunctionExpressionIr(
      parameters: parameters,
      body: [
        EsmReturnStatementIr(
          EsmCallIr(
            callee: EsmIdentifierIr(member.backingName),
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

  EsmExpressionIr? _lowerCoreInstanceGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final target = kernelReferencePath(expression.interfaceTargetReference);
    final receiver = _lowerExpression(
      world,
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
      return EsmPropertyAccessIr(receiver: receiver, property: 'length');
    }
    if (isListMember && memberName == 'isEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (isListMember && memberName == 'isNotEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperatorIr.greaterThan,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::Iterable::@getters::length') {
      return EsmPropertyAccessIr(
        receiver: _arrayFrom(helpers, receiver),
        property: 'length',
      );
    }
    if (isMapMember && memberName == 'length') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'size');
    }
    if (isMapMember && memberName == 'isEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (isMapMember && memberName == 'isNotEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperatorIr.greaterThan,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (isSetMember && memberName == 'length') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'size');
    }
    if (isMapMember && memberName == 'keys') {
      return _arrayFrom(
        helpers,
        EsmCallIr(
          callee: EsmPropertyAccessIr(receiver: receiver, property: 'keys'),
          arguments: const [],
        ),
      );
    }
    if (isMapMember && memberName == 'values') {
      return _arrayFrom(
        helpers,
        EsmCallIr(
          callee: EsmPropertyAccessIr(receiver: receiver, property: 'values'),
          arguments: const [],
        ),
      );
    }
    if (isMapMember && memberName == 'entries') {
      return _arrayFrom(
        helpers,
        EsmCallIr(
          callee: EsmPropertyAccessIr(receiver: receiver, property: 'entries'),
          arguments: const [],
        ),
      );
    }
    if (target == 'dart:core::MapEntry::@getters::key') {
      return EsmComputedPropertyAccessIr(
        receiver: receiver,
        property: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::MapEntry::@getters::value') {
      return EsmComputedPropertyAccessIr(
        receiver: receiver,
        property: const EsmNumberLiteralIr(1),
      );
    }
    if (_isCoreHashCodeGetter(target)) {
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartHashValue'),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::Object::@getters::runtimeType') {
      helpers.require(EsmRuntimeHelper.objectRuntimeType);
      return EsmCallIr(
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
        return EsmPropertyAccessIr(receiver: receiver, property: property);
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
        return EsmPropertyAccessIr(receiver: receiver, property: property);
      }
    }
    if (_isCoreStringBufferMember(target)) {
      final property = switch (memberName) {
        'length' || 'isEmpty' || 'isNotEmpty' => memberName,
        _ => null,
      };
      if (property != null) {
        return EsmPropertyAccessIr(receiver: receiver, property: property);
      }
    }
    if (memberName == 'target' &&
        isDartCoreWeakReferenceMember(
          expression.interfaceTargetReference,
          memberName,
        )) {
      return EsmPropertyAccessIr(receiver: receiver, property: 'target');
    }
    if (target == 'dart:core::Iterable::@getters::isEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(
          receiver: _arrayFrom(helpers, receiver),
          property: 'length',
        ),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (isSetMember && memberName == 'isEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::Iterable::@getters::isNotEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(
          receiver: _arrayFrom(helpers, receiver),
          property: 'length',
        ),
        operator: EsmBinaryOperatorIr.greaterThan,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (isSetMember && memberName == 'isNotEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'size'),
        operator: EsmBinaryOperatorIr.greaterThan,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::_Enum::@getters::index') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'index');
    }
    if (target == 'dart:core::_Enum::@getters::name') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'name');
    }
    if (target == 'dart:core::Iterable::@getters::iterator') {
      helpers.require(EsmRuntimeHelper.iterator);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.iterator),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::Iterable::@getters::first' ||
        target == 'dart:core::List::@getters::first') {
      return EsmComputedPropertyAccessIr(
        receiver: EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Array'),
            property: 'from',
          ),
          arguments: [receiver],
        ),
        property: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::Iterable::@getters::last' ||
        target == 'dart:core::List::@getters::last') {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmCallIr(
            callee: const EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('Array'),
              property: 'from',
            ),
            arguments: [receiver],
          ),
          property: 'at',
        ),
        arguments: const [EsmNumberLiteralIr(-1)],
      );
    }
    if (target == 'dart:core::Iterable::@getters::reversed' ||
        target == 'dart:core::List::@getters::reversed') {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(helpers, receiver),
          property: 'reverse',
        ),
        arguments: const [],
      );
    }
    if (target == 'dart:core::Iterable::@getters::single' ||
        target == 'dart:core::List::@getters::single') {
      helpers.require(EsmRuntimeHelper.iterableSearch);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartIterableSingle'),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::Iterator::@getters::current') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'current');
    }
    if (target == 'dart:core::String::@getters::isEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::String::@getters::isNotEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: EsmBinaryOperatorIr.greaterThan,
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::String::@getters::codeUnits') {
      helpers.require(EsmRuntimeHelper.stringOps);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartStringCodeUnits'),
        arguments: [receiver],
      );
    }
    final coreErrorGetter = _coreErrorInstanceGetterProperty(
      expression.interfaceTargetReference,
      memberName,
    );
    if (coreErrorGetter != null) {
      return EsmPropertyAccessIr(receiver: receiver, property: coreErrorGetter);
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

  EsmExpressionIr? _lowerCoreTimeInstanceGet(
    String target,
    String name,
    EsmExpressionIr receiver,
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
        return EsmPropertyAccessIr(receiver: receiver, property: property);
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
        return EsmPropertyAccessIr(receiver: receiver, property: property);
      }
    }
    return null;
  }

  EsmExpressionIr? _lowerCoreNumberInstanceGet(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr receiver,
    String target,
  ) {
    return switch (target) {
      'dart:core::int::@getters::isEven' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: _mathTrunc(receiver),
          operator: EsmBinaryOperatorIr.remainder,
          right: const EsmNumberLiteralIr(2),
        ),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: const EsmNumberLiteralIr(0),
      ),
      'dart:core::int::@getters::isOdd' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: _mathTrunc(receiver),
          operator: EsmBinaryOperatorIr.remainder,
          right: const EsmNumberLiteralIr(2),
        ),
        operator: EsmBinaryOperatorIr.strictNotEquals,
        right: const EsmNumberLiteralIr(0),
      ),
      'dart:core::num::@getters::hashCode' ||
      'dart:core::int::@getters::hashCode' ||
      'dart:core::double::@getters::hashCode' => () {
        helpers.require(EsmRuntimeHelper.objectHash);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartHashValue'),
          arguments: [receiver],
        );
      }(),
      'dart:core::num::@getters::sign' ||
      'dart:core::int::@getters::sign' ||
      'dart:core::double::@getters::sign' => EsmConditionalIr(
        condition: EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Number'),
            property: 'isNaN',
          ),
          arguments: [receiver],
        ),
        thenExpression: const EsmIdentifierIr('NaN'),
        otherwiseExpression: EsmConditionalIr(
          condition: EsmBinaryIr(
            left: receiver,
            operator: EsmBinaryOperatorIr.lessThan,
            right: const EsmNumberLiteralIr(0),
          ),
          thenExpression: const EsmNumberLiteralIr(-1),
          otherwiseExpression: EsmConditionalIr(
            condition: EsmBinaryIr(
              left: receiver,
              operator: EsmBinaryOperatorIr.greaterThan,
              right: const EsmNumberLiteralIr(0),
            ),
            thenExpression: const EsmNumberLiteralIr(1),
            otherwiseExpression: receiver,
          ),
        ),
      ),
      'dart:core::num::@getters::isNaN' ||
      'dart:core::double::@getters::isNaN' => EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Number'),
          property: 'isNaN',
        ),
        arguments: [receiver],
      ),
      'dart:core::num::@getters::isFinite' ||
      'dart:core::double::@getters::isFinite' => EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Number'),
          property: 'isFinite',
        ),
        arguments: [receiver],
      ),
      'dart:core::num::@getters::isInfinite' ||
      'dart:core::double::@getters::isInfinite' => _or(
        EsmBinaryIr(
          left: receiver,
          operator: EsmBinaryOperatorIr.strictEquals,
          right: const EsmIdentifierIr('Infinity'),
        ),
        EsmBinaryIr(
          left: receiver,
          operator: EsmBinaryOperatorIr.strictEquals,
          right: const EsmUnaryIr(
            operator: EsmUnaryOperatorIr.negate,
            operand: EsmIdentifierIr('Infinity'),
          ),
        ),
      ),
      'dart:core::num::@getters::isNegative' ||
      'dart:core::double::@getters::isNegative' => _or(
        EsmBinaryIr(
          left: receiver,
          operator: EsmBinaryOperatorIr.lessThan,
          right: const EsmNumberLiteralIr(0),
        ),
        EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Object'),
            property: 'is',
          ),
          arguments: [
            receiver,
            const EsmUnaryIr(
              operator: EsmUnaryOperatorIr.negate,
              operand: EsmNumberLiteralIr(0),
            ),
          ],
        ),
      ),
      _ => null,
    };
  }

  EsmExpressionIr? _lowerBigIntInstanceGet(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr receiver,
    String target,
  ) {
    return switch (target) {
      'dart:core::BigInt::@getters::isNegative' => EsmBinaryIr(
        left: receiver,
        operator: EsmBinaryOperatorIr.lessThan,
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::isEven' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: receiver,
          operator: EsmBinaryOperatorIr.remainder,
          right: _bigIntLiteral(2),
        ),
        operator: EsmBinaryOperatorIr.strictEquals,
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::isOdd' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: receiver,
          operator: EsmBinaryOperatorIr.remainder,
          right: _bigIntLiteral(2),
        ),
        operator: EsmBinaryOperatorIr.strictNotEquals,
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::sign' => EsmConditionalIr(
        condition: EsmBinaryIr(
          left: receiver,
          operator: EsmBinaryOperatorIr.lessThan,
          right: _bigIntLiteral(0),
        ),
        thenExpression: const EsmNumberLiteralIr(-1),
        otherwiseExpression: EsmConditionalIr(
          condition: EsmBinaryIr(
            left: receiver,
            operator: EsmBinaryOperatorIr.greaterThan,
            right: _bigIntLiteral(0),
          ),
          thenExpression: const EsmNumberLiteralIr(1),
          otherwiseExpression: const EsmNumberLiteralIr(0),
        ),
      ),
      'dart:core::BigInt::@getters::bitLength' => () {
        helpers.require(EsmRuntimeHelper.bigIntBitLength);
        return EsmCallIr(
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

  EsmExpressionIr _lowerInstanceSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final extensionTypeMember = world.extensionTypeMemberSymbolForReference(
      expression.interfaceTargetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeInstanceSet(
        world,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final sdkIntrinsic = _lowerSdkInstanceSet(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (sdkIntrinsic != null) {
      return sdkIntrinsic;
    }
    final reference = expression.interfaceTargetReference;
    final fieldSymbol = world.instanceFieldSymbolForReference(reference);
    if (fieldSymbol != null) {
      return EsmAssignmentIr(
        target: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: fieldSymbol.name,
        ),
        value: _lowerExpression(
          world,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        ),
      );
    }
    final procedureSymbol = world.instanceProcedureSymbolForReference(
      reference,
    );
    if (procedureSymbol != null &&
        procedureSymbol.kind == EsmProcedureKind.setter) {
      return EsmAssignmentIr(
        target: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: procedureSymbol.name,
        ),
        value: _lowerExpression(
          world,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        ),
      );
    }
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw NewCompilerUnsupported(
        expression,
        'instance set lowering ${kernelReferencePath(reference)}',
      );
    }
    return EsmAssignmentIr(
      target: EsmPropertyAccessIr(
        receiver: _lowerExpression(
          world,
          helpers,
          locals,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        property: _instanceMemberName(world, target),
      ),
      value: _lowerExpression(
        world,
        helpers,
        locals,
        expression.value,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmExpressionIr? _lowerSdkInstanceSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final name = expression.name.text;
    final property = _sdkInstanceSetterPropertyName(
      expression.interfaceTargetReference,
      name,
    );
    if (property != null) {
      return EsmAssignmentIr(
        target: EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            expression.receiver,
            thisExpression: thisExpression,
          ),
          property: property,
        ),
        value: _lowerExpression(
          world,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        ),
      );
    }
    return null;
  }

  EsmExpressionIr _lowerExtensionTypeInstanceSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.InstanceSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (member.descriptor.kind != k.ExtensionTypeMemberKind.Setter) {
      throw NewCompilerUnsupported(expression, 'extension type instance set');
    }
    return EsmCallIr(
      callee: EsmIdentifierIr(member.backingName),
      arguments: [
        _lowerExtensionTypeInstanceReceiver(
          world,
          helpers,
          locals,
          member,
          expression.receiver,
          thisExpression: thisExpression,
        ),
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.value,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpressionIr _lowerExtensionTypeInstanceReceiver(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.Expression receiver, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final extensionType = world.extensionTypeSymbolFor(member.extensionType);
    if (extensionType == null) {
      throw NewCompilerUnsupported(
        member.descriptor,
        'extension type receiver',
      );
    }
    return _lowerExtensionTypeRepresentation(
      helpers,
      _lowerExpression(
        world,
        helpers,
        locals,
        receiver,
        thisExpression: thisExpression,
      ),
      extensionType,
    );
  }

  EsmExpressionIr _lowerSuperMethodInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperMethodInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final target = expression.interfaceTargetReference.node;
    if (target is k.Procedure) {
      final symbol = world.instanceProcedureSymbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.method) {
        return EsmCallIr(
          callee: _memberAccess(const EsmSuperIr(), symbol.name),
          arguments: _lowerArguments(
            world,
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
    throw NewCompilerUnsupported(expression, 'super method invocation');
  }

  EsmExpressionIr _lowerSuperPropertyGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperPropertyGet expression,
  ) {
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw NewCompilerUnsupported(expression, 'super get lowering');
    }
    return _memberAccess(
      const EsmSuperIr(),
      _instanceMemberName(world, target),
    );
  }

  EsmExpressionIr _lowerSuperPropertySet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.SuperPropertySet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw NewCompilerUnsupported(expression, 'super set lowering');
    }
    return EsmAssignmentIr(
      target: _memberAccess(
        const EsmSuperIr(),
        _instanceMemberName(world, target),
      ),
      value: _lowerExpression(
        world,
        helpers,
        locals,
        expression.value,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmExpressionIr _lowerConstructorInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final sdkConstructor = _lowerSdkConstructorInvocation(
      world,
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
      throw NewCompilerUnsupported(
        expression,
        'constructor invocation $targetPath '
        '(positional ${expression.arguments.positional.length}, '
        'named ${expression.arguments.named.length}, '
        'types ${expression.arguments.types.length})',
      );
    }
    final constructor = world.constructorSymbolFor(target);
    final klass = world.classSymbolFor(target.enclosingClass);
    if (klass == null) {
      throw NewCompilerUnsupported(
        expression,
        'constructor invocation class symbol missing $targetPath',
      );
    }
    if (constructor == null) {
      if (!_isSyntheticDefaultConstructor(target) ||
          expression.arguments.positional.isNotEmpty ||
          expression.arguments.named.isNotEmpty) {
        throw NewCompilerUnsupported(
          expression,
          'constructor invocation symbol missing '
          '${kernelReferencePath(expression.targetReference)}',
        );
      }
      return EsmNewIr(callee: EsmIdentifierIr(klass.name), arguments: const []);
    }
    if (constructor.name.isNotEmpty) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(klass.name),
          property: constructor.name,
        ),
        arguments: _lowerArguments(
          world,
          helpers,
          locals,
          expression.arguments,
          thisExpression: thisExpression,
          contextNode: expression,
          context: 'constructor invocation arguments',
        ),
      );
    }
    return EsmNewIr(
      callee: EsmIdentifierIr(klass.name),
      arguments: _lowerArguments(
        world,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'constructor invocation arguments',
      ),
    );
  }

  EsmExpressionIr? _lowerSdkConstructorInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final coreTimeConstructor = _lowerCoreTimeConstructorInvocation(
      world,
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
        world,
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
      world,
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
        world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.iterator),
        arguments: [
          _lowerExpression(
            world,
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
      return const EsmArrayLiteralIr([]);
    }
    final target = kernelReferencePath(expression.targetReference);
    final positional = expression.arguments.positional;
    if (target == 'dart:core::Object::@constructors::' && positional.isEmpty) {
      return const EsmObjectLiteralIr([]);
    }
    if (isDartMappedIterableConstructorPath(target) && positional.length == 2) {
      return EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Array'),
          property: 'from',
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
            helpers,
            locals,
            positional[1],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartWhereIterableConstructorPath(target) && positional.length == 2) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
              helpers,
              locals,
              positional.single,
              thisExpression: thisExpression,
            ),
          ),
          property: 'filter',
        ),
        arguments: [
          EsmArrowFunctionIr(
            parameters: const [EsmIdentifierParameterIr(name: 'value')],
            body: _lowerTypeTest(
              world,
              helpers,
              expression.arguments.types.single,
              const EsmIdentifierIr('value'),
            ),
          ),
        ],
      );
    }
    if (isDartExpandIterableConstructorPath(target) && positional.length == 2) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
              helpers,
              locals,
              positional.first,
              thisExpression: thisExpression,
            ),
          ),
          property: 'flatMap',
        ),
        arguments: [
          EsmArrowFunctionIr(
            parameters: const [EsmIdentifierParameterIr(name: 'value')],
            body: _arrayFrom(
              helpers,
              EsmCallIr(
                callee: EsmParenthesizedIr(
                  _lowerExpression(
                    world,
                    helpers,
                    locals,
                    positional[1],
                    thisExpression: thisExpression,
                  ),
                ),
                arguments: const [EsmIdentifierIr('value')],
              ),
            ),
          ),
        ],
      );
    }
    if (isDartTakeIterableConstructorPath(target) && positional.length == 2) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
              helpers,
              locals,
              positional.first,
              thisExpression: thisExpression,
            ),
          ),
          property: 'slice',
        ),
        arguments: [
          const EsmNumberLiteralIr(0),
          _lowerExpression(
            world,
            helpers,
            locals,
            positional[1],
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (isDartSkipIterableConstructorPath(target) && positional.length == 2) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
            world,
            helpers,
            locals,
            positional[1],
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListAsMap'),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: _arrayFrom(
            helpers,
            _lowerExpression(
              world,
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
        EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: EsmIdentifierIr(iterableWindowHelper),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartUnmodifiableListView'),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartUnmodifiableMapView'),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.weakReference,
        ),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.finalizer),
        arguments: [
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.expando),
        arguments: [
          if (positional.isEmpty)
            const EsmNullLiteralIr()
          else
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSplayTreeSet'),
        arguments: [
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSplayTreeMap'),
        arguments: [
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.stringBuffer,
        ),
        arguments: [
          if (positional.isEmpty)
            const EsmStringLiteralIr('')
          else
            _lowerExpression(
              world,
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
          world,
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
      return const EsmCallIr(
        callee: EsmIdentifierIr('__dartSetFrom'),
        arguments: [EsmArrayLiteralIr([])],
      );
    }
    if (target == 'dart:_internal::EmptyIterable::@constructors::' &&
        expression.arguments.positional.isEmpty) {
      return const EsmArrayLiteralIr([]);
    }
    if (target.startsWith('dart:core::MapEntry::@constructors::') &&
        expression.arguments.positional.length == 2) {
      return EsmArrayLiteralIr([
        for (final argument in expression.arguments.positional)
          _lowerExpression(
            world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.symbol),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
          _lowerExpression(
            world,
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

  EsmExpressionIr? _lowerCoreTimeConstructorInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.duration),
        arguments: [
          _lowerCoreDurationOptionsObject(
            world,
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartDateTimeFromParts'),
        arguments: [
          EsmBooleanLiteralIr(
            target == 'dart:core::DateTime::@constructors::utc',
          ),
          for (final argument in positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.dateTime),
        arguments: [
          const EsmCallIr(
            callee: EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('Date'),
              property: 'now',
            ),
            arguments: [],
          ),
          EsmBooleanLiteralIr(
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
            world,
            helpers,
            locals,
            expression.arguments,
            'isUtc',
            thisExpression: thisExpression,
          ) ??
          const EsmBooleanLiteralIr(false);
      return EsmCallIr(
        callee: target.endsWith('fromMicrosecondsSinceEpoch')
            ? const EsmIdentifierIr('__dartDateTimeFromMicros')
            : helpers.reference(runtimeHelpers, EsmRuntimeHelper.dateTime),
        arguments: [
          _lowerExpression(
            world,
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

  EsmObjectLiteralIr _lowerCoreDurationOptionsObject(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    return EsmObjectLiteralIr([
      for (final name in const [
        'days',
        'hours',
        'minutes',
        'seconds',
        'milliseconds',
        'microseconds',
      ])
        EsmObjectLiteralPropertyIr.static(
          key: name,
          value:
              _lowerNamedArgument(
                world,
                helpers,
                locals,
                arguments,
                name,
                thisExpression: thisExpression,
              ) ??
              const EsmNumberLiteralIr(0),
        ),
    ]);
  }

  EsmExpressionIr? _lowerMathConstructorInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.ConstructorInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final positional = expression.arguments.positional;
    if (isDartMathPointConstructorReference(expression.targetReference) &&
        positional.length == 2) {
      helpers.require(EsmRuntimeHelper.mathPoint);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.mathPoint),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
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
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mathRectangle,
        ),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
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

  EsmExpressionIr _lowerCoreErrorCreation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    String typeName,
    List<k.Expression> positionalArguments, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    helpers.require(EsmRuntimeHelper.coreError);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
      arguments: [
        EsmStringLiteralIr(typeName),
        positionalArguments.isEmpty
            ? const EsmNullLiteralIr()
            : _lowerExpression(
                world,
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

  EsmExpressionIr _lowerEqualsCall(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.EqualsCall expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    helpers.require(EsmRuntimeHelper.equals);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.equals),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.left,
          thisExpression: thisExpression,
        ),
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.right,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpressionIr _lowerInstanceTearOff(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceTearOff expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final target = expression.interfaceTargetReference.node;
    final targetPath = kernelReferencePath(expression.interfaceTargetReference);
    final sdkTearOff = _lowerSdkInstanceTearOff(
      world,
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
      throw NewCompilerUnsupported(
        expression,
        'instance tear-off target non-procedure $targetPath',
      );
    }
    final symbol = world.instanceProcedureSymbolFor(target);
    final targetName = target.name.text;
    final methodName = switch (symbol?.kind) {
      EsmProcedureKind.method => symbol!.name,
      EsmProcedureKind.getter ||
      EsmProcedureKind.setter => throw NewCompilerUnsupported(
        expression,
        'instance tear-off target accessor $targetPath',
      ),
      null => _sdkInstanceTearOffMethodName(
        expression.interfaceTargetReference,
        targetName,
      ),
    };
    if (methodName == null) {
      throw NewCompilerUnsupported(
        expression,
        'instance tear-off target $targetPath',
      );
    }
    final function = target.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(
        expression,
        'instance tear-off target async $targetPath',
      );
    }
    final receiverName = _freshLocalName(world, const [], r'$receiver');
    final forwardingLocals = <k.VariableDeclaration, String>{};
    final usedParameters = {receiverName};
    final parameters = _bindParameters(
      world,
      helpers,
      forwardingLocals,
      usedParameters,
      function,
    );
    return EsmCallIr(
      callee: EsmFunctionExpressionIr(
        parameters: const [],
        body: [
          EsmVariableDeclarationIr(
            binding: EsmIdentifierBindingIr(receiverName),
            initializer: _lowerExpression(
              world,
              helpers,
              locals,
              expression.receiver,
              thisExpression: thisExpression,
            ),
            mutable: false,
          ),
          EsmReturnStatementIr(
            EsmFunctionExpressionIr(
              parameters: parameters,
              body: [
                EsmReturnStatementIr(
                  EsmCallIr(
                    callee: _memberAccess(
                      EsmIdentifierIr(receiverName),
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

  EsmExpressionIr? _lowerSdkInstanceTearOff(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceTearOff expression,
    String targetPath, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (targetPath.startsWith('dart:') &&
        targetPath.contains('::@methods::contains') &&
        !targetPath.contains('Set::') &&
        !targetPath.contains('_Set::')) {
      return _lowerSimpleInstanceTearOff(
        world,
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

  EsmExpressionIr _lowerSimpleInstanceTearOff(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression receiver,
    String methodName,
    List<String> parameterNames, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final receiverName = _freshLocalName(world, const [], r'$receiver');
    return EsmCallIr(
      callee: EsmFunctionExpressionIr(
        parameters: const [],
        body: [
          EsmVariableDeclarationIr(
            binding: EsmIdentifierBindingIr(receiverName),
            initializer: _lowerExpression(
              world,
              helpers,
              locals,
              receiver,
              thisExpression: thisExpression,
            ),
            mutable: false,
          ),
          EsmReturnStatementIr(
            EsmFunctionExpressionIr(
              parameters: [
                for (final name in parameterNames)
                  EsmIdentifierParameterIr(name: name),
              ],
              body: [
                EsmReturnStatementIr(
                  EsmCallIr(
                    callee: _memberAccess(
                      EsmIdentifierIr(receiverName),
                      methodName,
                    ),
                    arguments: [
                      for (final name in parameterNames) EsmIdentifierIr(name),
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

  EsmExpressionIr _lowerIsExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.IsExpression expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    return _lowerTypeTest(
      world,
      helpers,
      expression.type,
      _lowerExpression(
        world,
        helpers,
        locals,
        expression.operand,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmExpressionIr _lowerAsExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.AsExpression expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final type = expression.type.unalias;
    final operand = _lowerExpression(
      world,
      helpers,
      locals,
      expression.operand,
      thisExpression: thisExpression,
    );
    if (type is k.DynamicType || type is k.VoidType) {
      return operand;
    }
    helpers.require(EsmRuntimeHelper.typeCast);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.typeCast),
      arguments: [
        operand,
        EsmArrowFunctionIr(
          parameters: const [EsmIdentifierParameterIr(name: 'value')],
          body: _lowerTypeTest(
            world,
            helpers,
            type,
            const EsmIdentifierIr('value'),
          ),
        ),
        EsmStringLiteralIr(_typeName(type)),
      ],
    );
  }

  EsmExpressionIr _lowerTypeTest(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
    EsmExpressionIr value,
  ) {
    final unaliased = type.unalias;
    if (_isTopType(unaliased)) {
      return const EsmBooleanLiteralIr(true);
    }
    final test = _lowerNonNullableTypeTest(world, helpers, unaliased, value);
    if (_isNullableType(unaliased)) {
      return _or(_strictEquals(value, const EsmNullLiteralIr()), test);
    }
    return test;
  }

  EsmExpressionIr _lowerNonNullableTypeTest(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
    EsmExpressionIr value,
  ) {
    if (type is k.DynamicType || type is k.VoidType || type is k.InvalidType) {
      return const EsmBooleanLiteralIr(true);
    }
    if (type is k.NeverType) {
      return const EsmBooleanLiteralIr(false);
    }
    if (type is k.TypeParameterType) {
      return _lowerTypeTest(world, helpers, type.bound, value);
    }
    if (type is k.FunctionType) {
      return _typeofEquals(value, 'function');
    }
    if (type is k.RecordType) {
      return _lowerRecordTypeTest(world, helpers, type, value);
    }
    if (type is k.ExtensionType) {
      final symbol = world.extensionTypeSymbolFor(
        type.extensionTypeDeclaration,
      );
      final representation = symbol == null
          ? value
          : _lowerExtensionTypeRepresentation(helpers, value, symbol);
      return _lowerTypeTest(
        world,
        helpers,
        type.extensionTypeErasure,
        representation,
      );
    }
    if (type is k.InterfaceType) {
      final target = type.classReference.toStringInternal();
      final targetNode = type.classReference.node;
      if (targetNode is k.Class) {
        final klass = world.classSymbolFor(targetNode);
        if (klass != null) {
          return EsmBinaryIr(
            left: value,
            operator: EsmBinaryOperatorIr.instanceOf,
            right: EsmIdentifierIr(klass.name),
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
        'Null' => _strictEquals(value, const EsmNullLiteralIr()),
        'List' => _or(
          EsmCallIr(
            callee: const EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('Array'),
              property: 'isArray',
            ),
            arguments: [value],
          ),
          _andAll([
            EsmCallIr(
              callee: const EsmPropertyAccessIr(
                receiver: EsmIdentifierIr('ArrayBuffer'),
                property: 'isView',
              ),
              arguments: [value],
            ),
            EsmUnaryIr(
              operator: EsmUnaryOperatorIr.logicalNot,
              operand: EsmParenthesizedIr(
                EsmBinaryIr(
                  left: value,
                  operator: EsmBinaryOperatorIr.instanceOf,
                  right: const EsmIdentifierIr('DataView'),
                ),
              ),
            ),
          ]),
        ),
        'Set' => EsmBinaryIr(
          left: value,
          operator: EsmBinaryOperatorIr.instanceOf,
          right: const EsmIdentifierIr('Set'),
        ),
        'Map' => EsmBinaryIr(
          left: value,
          operator: EsmBinaryOperatorIr.instanceOf,
          right: const EsmIdentifierIr('Map'),
        ),
        'Iterable' => _andAll([
          _notNull(value),
          EsmBinaryIr(
            left: EsmUnaryIr(
              operator: EsmUnaryOperatorIr.typeOf,
              operand: value,
            ),
            operator: EsmBinaryOperatorIr.strictNotEquals,
            right: const EsmStringLiteralIr('string'),
          ),
          EsmUnaryIr(
            operator: EsmUnaryOperatorIr.logicalNot,
            operand: EsmParenthesizedIr(
              EsmBinaryIr(
                left: value,
                operator: EsmBinaryOperatorIr.instanceOf,
                right: const EsmIdentifierIr('Map'),
              ),
            ),
          ),
          EsmBinaryIr(
            left: EsmUnaryIr(
              operator: EsmUnaryOperatorIr.typeOf,
              operand: EsmComputedPropertyAccessIr(
                receiver: value,
                property: const EsmPropertyAccessIr(
                  receiver: EsmIdentifierIr('Symbol'),
                  property: 'iterator',
                ),
              ),
            ),
            operator: EsmBinaryOperatorIr.strictEquals,
            right: const EsmStringLiteralIr('function'),
          ),
        ]),
        'EfficientLengthIterable' || 'HideEfficientLengthIterable' => _andAll([
          _notNull(value),
          EsmBinaryIr(
            left: EsmUnaryIr(
              operator: EsmUnaryOperatorIr.typeOf,
              operand: value,
            ),
            operator: EsmBinaryOperatorIr.strictNotEquals,
            right: const EsmStringLiteralIr('string'),
          ),
          EsmBinaryIr(
            left: EsmUnaryIr(
              operator: EsmUnaryOperatorIr.typeOf,
              operand: EsmPropertyAccessIr(receiver: value, property: 'length'),
            ),
            operator: EsmBinaryOperatorIr.strictEquals,
            right: const EsmStringLiteralIr('number'),
          ),
        ]),
        'Comparable' => _andAll([
          _notNull(value),
          _orAll([
            _typeofEquals(value, 'number'),
            _typeofEquals(value, 'string'),
            _typeofEquals(value, 'bigint'),
            EsmBinaryIr(
              left: EsmUnaryIr(
                operator: EsmUnaryOperatorIr.typeOf,
                operand: EsmPropertyAccessIr(
                  receiver: value,
                  property: 'compareTo',
                ),
              ),
              operator: EsmBinaryOperatorIr.strictEquals,
              right: const EsmStringLiteralIr('function'),
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
        _ => throw NewCompilerUnsupported(
          type,
          'type test lowering ${_typeName(type)}',
        ),
      };
    }
    throw NewCompilerUnsupported(type, 'type test lowering ${_typeName(type)}');
  }

  EsmExpressionIr _lowerGlobalInstanceTypeTest(
    EsmExpressionIr value,
    String constructorName,
  ) {
    final constructor = EsmComputedPropertyAccessIr(
      receiver: const EsmIdentifierIr('globalThis'),
      property: EsmStringLiteralIr(constructorName),
    );
    return _andAll([
      _typeofEquals(constructor, 'function'),
      EsmBinaryIr(
        left: value,
        operator: EsmBinaryOperatorIr.instanceOf,
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

  EsmExpressionIr _lowerCoreErrorTypeTest(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr value,
    String typeName,
  ) {
    helpers.require(EsmRuntimeHelper.coreError);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartIsCoreError'),
      arguments: [value, EsmStringLiteralIr(typeName)],
    );
  }

  EsmExpressionIr _lowerRecordTypeTest(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.RecordType type,
    EsmExpressionIr value,
  ) {
    final checks = <EsmExpressionIr>[_lowerRecordObjectTest(helpers, value)];
    final shape = <String>[];
    for (var i = 0; i < type.positional.length; i++) {
      final name = _recordPositionalKey(i);
      shape.add(name);
      checks.add(
        _lowerTypeTest(
          world,
          helpers,
          type.positional[i],
          EsmPropertyAccessIr(receiver: value, property: name),
        ),
      );
    }
    final named = type.named.toList()
      ..sort((left, right) => left.name.compareTo(right.name));
    for (final field in named) {
      shape.add(field.name);
      checks.add(
        _lowerTypeTest(
          world,
          helpers,
          field.type,
          EsmPropertyAccessIr(receiver: value, property: field.name),
        ),
      );
    }
    final recordShape = EsmComputedPropertyAccessIr(
      receiver: value,
      property: helpers.reference(runtimeHelpers, EsmRuntimeHelper.recordShape),
    );
    checks.insert(
      1,
      _strictEquals(
        EsmPropertyAccessIr(receiver: recordShape, property: 'length'),
        EsmNumberLiteralIr(shape.length),
      ),
    );
    for (var i = 0; i < shape.length; i++) {
      checks.insert(
        2 + i,
        _strictEquals(
          EsmComputedPropertyAccessIr(
            receiver: recordShape,
            property: EsmNumberLiteralIr(i),
          ),
          EsmStringLiteralIr(shape[i]),
        ),
      );
    }
    return _andAll(checks);
  }

  EsmExpressionIr _lowerRecordObjectTest(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr value,
  ) {
    helpers.require(EsmRuntimeHelper.isRecord);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.isRecord),
      arguments: [value],
    );
  }

  EsmExpressionIr _lowerDartTypeTagTest(EsmExpressionIr value, String tag) {
    return _andAll([
      _notNull(value),
      _typeofEquals(value, 'object'),
      _strictEquals(
        EsmPropertyAccessIr(receiver: value, property: '__dartType'),
        EsmStringLiteralIr(tag),
      ),
    ]);
  }

  EsmExpressionIr _lowerCoreRegExpTypeTest(EsmExpressionIr value) {
    return _or(
      EsmBinaryIr(
        left: value,
        operator: EsmBinaryOperatorIr.instanceOf,
        right: const EsmIdentifierIr('RegExp'),
      ),
      _andAll([
        _notNull(value),
        _typeofEquals(value, 'object'),
        _typeofEquals(
          EsmPropertyAccessIr(receiver: value, property: '__dartRegExpMake'),
          'function',
        ),
      ]),
    );
  }

  EsmExpressionIr _lowerCorePatternTypeTest(EsmExpressionIr value) {
    return _or(
      _typeofEquals(value, 'string'),
      _or(
        _lowerCoreRegExpTypeTest(value),
        _andAll([
          _notNull(value),
          _typeofEquals(value, 'object'),
          _typeofEquals(
            EsmPropertyAccessIr(receiver: value, property: 'matchAsPrefix'),
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

  EsmExpressionIr _typeofEquals(EsmExpressionIr value, String name) {
    return _strictEquals(
      EsmUnaryIr(operator: EsmUnaryOperatorIr.typeOf, operand: value),
      EsmStringLiteralIr(name),
    );
  }

  EsmExpressionIr _notNull(EsmExpressionIr value) {
    return EsmBinaryIr(
      left: value,
      operator: EsmBinaryOperatorIr.looseNotEquals,
      right: const EsmNullLiteralIr(),
    );
  }

  EsmExpressionIr _strictEquals(EsmExpressionIr left, EsmExpressionIr right) {
    return EsmBinaryIr(
      left: left,
      operator: EsmBinaryOperatorIr.strictEquals,
      right: right,
    );
  }

  EsmExpressionIr _bigIntLiteral(int value) {
    return EsmCallIr(
      callee: const EsmIdentifierIr('BigInt'),
      arguments: [EsmNumberLiteralIr(value)],
    );
  }

  EsmExpressionIr _mathTrunc(EsmExpressionIr value) {
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('Math'),
        property: 'trunc',
      ),
      arguments: [value],
    );
  }

  EsmExpressionIr _mathRound(EsmExpressionIr value) {
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('Math'),
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

  EsmExpressionIr _andAll(List<EsmExpressionIr> expressions) {
    if (expressions.isEmpty) {
      return const EsmBooleanLiteralIr(true);
    }
    return expressions
        .skip(1)
        .fold<EsmExpressionIr>(
          expressions.first,
          (left, right) => EsmParenthesizedIr(
            EsmBinaryIr(
              left: left,
              operator: EsmBinaryOperatorIr.logicalAnd,
              right: right,
            ),
          ),
        );
  }

  EsmExpressionIr _orAll(List<EsmExpressionIr> expressions) {
    if (expressions.isEmpty) {
      return const EsmBooleanLiteralIr(false);
    }
    return expressions
        .skip(1)
        .fold<EsmExpressionIr>(
          expressions.first,
          (left, right) => EsmParenthesizedIr(
            EsmBinaryIr(
              left: left,
              operator: EsmBinaryOperatorIr.logicalOr,
              right: right,
            ),
          ),
        );
  }

  EsmExpressionIr _or(EsmExpressionIr left, EsmExpressionIr right) {
    return EsmParenthesizedIr(
      EsmBinaryIr(
        left: left,
        operator: EsmBinaryOperatorIr.logicalOr,
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

  EsmExpressionIr _lowerStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final helperCall = _lowerRuntimeStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (helperCall != null) {
      return helperCall;
    }
    final extensionTypeMember = world.extensionTypeMemberSymbolForReference(
      expression.targetReference,
    );
    if (extensionTypeMember != null) {
      return _lowerExtensionTypeStaticInvocation(
        world,
        helpers,
        locals,
        extensionTypeMember,
        expression,
        thisExpression: thisExpression,
      );
    }
    final targetNode = expression.targetReference.node;
    final target =
        (targetNode is k.Procedure ? world.symbolFor(targetNode) : null) ??
        world.symbolForReference(expression.targetReference);
    if (target != null) {
      if (target.kind != EsmProcedureKind.method) {
        throw NewCompilerUnsupported(
          expression.targetReference,
          'static accessor call',
        );
      }
      return EsmCallIr(
        callee: EsmIdentifierIr(target.name),
        arguments: _lowerArguments(
          world,
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
            ? world.staticProcedureSymbolFor(targetNode)
            : null) ??
        world.staticProcedureSymbolForReference(expression.targetReference);
    final staticClass = staticTarget == null
        ? null
        : world.classSymbolFor(staticTarget.node.enclosingClass!);
    if (staticTarget != null &&
        staticClass != null &&
        staticTarget.kind == EsmProcedureKind.method) {
      final arguments = _lowerArguments(
        world,
        helpers,
        locals,
        expression.arguments,
        thisExpression: thisExpression,
        contextNode: expression,
        context: 'static invocation arguments',
      );
      if (staticTarget.node.kind == k.ProcedureKind.Factory &&
          staticTarget.node.name.text.isEmpty) {
        return EsmNewIr(
          callee: EsmIdentifierIr(staticClass.name),
          arguments: arguments,
        );
      }
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(staticClass.name),
          property: staticTarget.name,
        ),
        arguments: arguments,
      );
    }
    throw NewCompilerUnsupported(
      expression,
      'external static target '
      '${kernelReferencePath(expression.targetReference)} '
      '(positional ${expression.arguments.positional.length}, '
      'named ${expression.arguments.named.length}, '
      'types ${expression.arguments.types.length})',
    );
  }

  EsmExpressionIr _lowerExtensionTypeStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    EsmExtensionTypeMemberSymbol member,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final kind = member.descriptor.kind;
    if (kind == k.ExtensionTypeMemberKind.Field) {
      throw NewCompilerUnsupported(
        expression,
        'extension type static invocation',
      );
    }
    if (_isExtensionTypeTearOffReference(member, expression.targetReference) &&
        !member.descriptor.isStatic &&
        expression.arguments.positional.length == 1 &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      final extensionType = world.extensionTypeSymbolFor(member.extensionType);
      if (extensionType == null) {
        throw NewCompilerUnsupported(
          member.descriptor,
          'extension type tear-off',
        );
      }
      return _lowerExtensionTypeInstanceTearOff(
        world,
        helpers,
        member,
        _lowerExtensionTypeRepresentation(
          helpers,
          _lowerExpression(
            world,
            helpers,
            locals,
            expression.arguments.positional.single,
            thisExpression: thisExpression,
          ),
          extensionType,
        ),
      );
    }
    return EsmCallIr(
      callee: EsmIdentifierIr(member.backingName),
      arguments: _lowerArguments(
        world,
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

  EsmExpressionIr? _lowerRuntimeStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final coreErrorFactoryName = dartCoreErrorFactoryName(
      expression.targetReference,
    );
    if (coreErrorFactoryName != null &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      return _lowerCoreErrorCreation(
        world,
        helpers,
        locals,
        coreErrorFactoryName,
        expression.arguments.positional,
        thisExpression: thisExpression,
      );
    }
    final coreCollectionStatic = _lowerCoreCollectionStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreCollectionStatic != null) {
      return coreCollectionStatic;
    }
    final sdkStatic = sdkIntrinsics.lowerStaticInvocation(
      expression: expression,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lower: (argument) => _lowerExpression(
        world,
        helpers,
        locals,
        argument,
        thisExpression: thisExpression,
      ),
      lowerNamedArgument: (arguments, argumentName) => _lowerNamedArgument(
        world,
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
    final coreNumberStatic = _lowerCoreNumberStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreNumberStatic != null) {
      return coreNumberStatic;
    }
    final webStatic = _lowerWebStaticInvocation(
      world,
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
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
    }
    return null;
  }

  EsmExpressionIr? _lowerWebStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final positional = expression.arguments.positional;
    if (kernelReferencePath(expression.targetReference) ==
            'dart:svg::SvgElement::@factories::tag' &&
        positional.length == 1 &&
        expression.arguments.named.isEmpty &&
        expression.arguments.types.isEmpty) {
      return EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('globalThis'),
            property: 'document',
          ),
          property: 'createElementNS',
        ),
        arguments: [
          const EsmStringLiteralIr('http://www.w3.org/2000/svg'),
          _lowerExpression(
            world,
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

  EsmExpressionIr? _lowerCoreCollectionStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final arguments = expression.arguments;
    final target = kernelReferencePath(expression.targetReference);
    final positional = arguments.positional;
    final listCopyFactory = switch (target) {
      'dart:core::List::@factories::of' ||
      'dart:core::List::@factories::from' => true,
      _ => false,
    };
    if (listCopyFactory &&
        positional.length == 1 &&
        _hasOnlyNamedArguments(arguments, {'growable'})) {
      helpers.require(EsmRuntimeHelper.listFactory);
      final growable = _lowerNamedArgument(
        world,
        helpers,
        locals,
        arguments,
        'growable',
        thisExpression: thisExpression,
      );
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
          if (growable != null) growable,
        ],
      );
    }
    if (target == 'dart:core::List::@factories::unmodifiable' &&
        positional.length == 1 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.listFactory);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartUnmodifiableList'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    final listFilledFactory = switch (target) {
      'dart:core::List::@factories::filled' ||
      'dart:core::_List::@factories::filled' ||
      'dart:core::_GrowableList::@factories::filled' => true,
      _ => false,
    };
    if (listFilledFactory &&
        positional.length == 2 &&
        _hasOnlyNamedArguments(arguments, {'growable'})) {
      helpers.require(EsmRuntimeHelper.listFactory);
      final growable =
          _lowerNamedArgument(
            world,
            helpers,
            locals,
            arguments,
            'growable',
            thisExpression: thisExpression,
          ) ??
          EsmBooleanLiteralIr(_isCoreGrowableListFactory(target));
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListFilled'),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
          growable,
        ],
      );
    }
    final listEmptyFactory = switch (target) {
      'dart:core::List::@factories::empty' ||
      'dart:core::_List::@factories::empty' ||
      'dart:core::_GrowableList::@factories::' ||
      'dart:core::_GrowableList::@factories::empty' => true,
      _ => false,
    };
    if (listEmptyFactory &&
        positional.isEmpty &&
        _hasOnlyNamedArguments(arguments, {'growable'})) {
      helpers.require(EsmRuntimeHelper.listFactory);
      final growable =
          _lowerNamedArgument(
            world,
            helpers,
            locals,
            arguments,
            'growable',
            thisExpression: thisExpression,
          ) ??
          EsmBooleanLiteralIr(_isCoreGrowableListFactory(target));
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.listFactory),
        arguments: [const EsmArrayLiteralIr([]), growable],
      );
    }
    if ((target == 'dart:core::_GrowableList::@factories::' ||
            target == 'dart:core::_List::@factories::') &&
        positional.length == 1 &&
        arguments.named.isEmpty) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmCallIr(
            callee: const EsmIdentifierIr('Array'),
            arguments: [
              _lowerExpression(
                world,
                helpers,
                locals,
                positional.single,
                thisExpression: thisExpression,
              ),
            ],
          ),
          property: 'fill',
        ),
        arguments: const [EsmNullLiteralIr()],
      );
    }
    if (_isCoreCollectionCastFrom(target) &&
        positional.length == 1 &&
        arguments.named.isEmpty) {
      return _lowerExpression(
        world,
        helpers,
        locals,
        positional.single,
        thisExpression: thisExpression,
      );
    }
    if (_isDartCollectionQueueFactory(target) && arguments.named.isEmpty) {
      if (positional.isEmpty) {
        return const EsmArrayLiteralIr([]);
      }
      if (positional.length == 1) {
        return _arrayFrom(
          helpers,
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        );
      }
    }
    if (target == 'dart:core::List::@methods::copyRange' &&
        positional.length >= 3 &&
        positional.length <= 5 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.listRangeOps);
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.listRangeOps,
        ),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ],
      );
    }
    if (target == 'dart:core::List::@methods::writeIterable' &&
        positional.length == 3 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.listRangeOps);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListWriteIterable'),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ],
      );
    }
    final listGenerateFactory = switch (target) {
      'dart:core::List::@factories::generate' ||
      'dart:core::_GrowableList::@factories::generate' ||
      'dart:core::Iterable::@factories::generate' => true,
      _ => false,
    };
    if (listGenerateFactory &&
        positional.length >= 1 &&
        positional.length <= 2 &&
        _hasOnlyNamedArguments(arguments, {'growable'})) {
      helpers.require(EsmRuntimeHelper.listFactory);
      final generator = positional.length == 1
          ? const EsmArrowFunctionIr(
              parameters: [EsmIdentifierParameterIr(name: 'index')],
              body: EsmIdentifierIr('index'),
            )
          : _lowerExpression(
              world,
              helpers,
              locals,
              positional[1],
              thisExpression: thisExpression,
            );
      final growable =
          _lowerNamedArgument(
            world,
            helpers,
            locals,
            arguments,
            'growable',
            thisExpression: thisExpression,
          ) ??
          EsmBooleanLiteralIr(_isCoreGrowableListFactory(target));
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartListGenerate'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          generator,
          growable,
        ],
      );
    }
    if (_isSplayTreeSetEmptyFactory(target) &&
        positional.length <= 2 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSplayTreeSet'),
        arguments: [
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isSplayTreeSetCopyFactory(target) &&
        positional.isNotEmpty &&
        positional.length <= 3 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSplayTreeSetFrom'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            2,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isCoreSetFactory(target) &&
        positional.length == 1 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSetFrom'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isCoreSetIdentityFactory(target) &&
        positional.isEmpty &&
        arguments.named.isEmpty) {
      return EsmNewIr(
        callee: const EsmIdentifierIr('Set'),
        arguments: const [],
      );
    }
    if (_isCoreSetEmptyFactory(target) &&
        positional.isEmpty &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.setAddAll);
      return const EsmCallIr(
        callee: EsmIdentifierIr('__dartSetFrom'),
        arguments: [EsmArrayLiteralIr([])],
      );
    }
    if (_isCoreMapFromIterableFactory(target) &&
        positional.length == 1 &&
        _hasOnlyNamedArguments(arguments, {'key', 'value'})) {
      helpers.require(EsmRuntimeHelper.mapFactories);
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.mapFactories,
        ),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
          _lowerNamedArgument(
                world,
                helpers,
                locals,
                arguments,
                'key',
                thisExpression: thisExpression,
              ) ??
              const EsmNullLiteralIr(),
          _lowerNamedArgument(
                world,
                helpers,
                locals,
                arguments,
                'value',
                thisExpression: thisExpression,
              ) ??
              const EsmNullLiteralIr(),
        ],
      );
    }
    if (_isCoreMapFromIterablesFactory(target) &&
        positional.length == 2 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.mapFactories);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapFromIterables'),
        arguments: [
          for (final argument in positional)
            _lowerExpression(
              world,
              helpers,
              locals,
              argument,
              thisExpression: thisExpression,
            ),
        ],
      );
    }
    if (_isSplayTreeMapEmptyFactory(target) &&
        positional.length <= 2 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSplayTreeMap'),
        arguments: [
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            0,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isSplayTreeMapCopyFactory(target) &&
        positional.isNotEmpty &&
        positional.length <= 3 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.splayTree);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartSplayTreeMapFromEntries'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.first,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            1,
            thisExpression: thisExpression,
          ),
          _lowerOptionalPositionalArgument(
            world,
            helpers,
            locals,
            positional,
            2,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isCoreMapFactory(target) &&
        positional.length == 1 &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.mapGet);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartMapFromEntries'),
        arguments: [
          _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
        ],
      );
    }
    if (_isCoreMapIdentityFactory(target) &&
        positional.isEmpty &&
        arguments.named.isEmpty) {
      return EsmNewIr(
        callee: const EsmIdentifierIr('Map'),
        arguments: const [],
      );
    }
    if (_isCustomHashMapFactory(target) &&
        positional.isEmpty &&
        _hasOnlyNamedArguments(arguments, {
          'equals',
          'hashCode',
          'isValidKey',
        })) {
      helpers.require(EsmRuntimeHelper.customHashMap);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartCustomHashMap'),
        arguments: [
          _lowerNamedArgument(
                world,
                helpers,
                locals,
                arguments,
                'equals',
                thisExpression: thisExpression,
              ) ??
              const EsmNullLiteralIr(),
          _lowerNamedArgument(
                world,
                helpers,
                locals,
                arguments,
                'hashCode',
                thisExpression: thisExpression,
              ) ??
              const EsmNullLiteralIr(),
          _lowerNamedArgument(
                world,
                helpers,
                locals,
                arguments,
                'isValidKey',
                thisExpression: thisExpression,
              ) ??
              const EsmNullLiteralIr(),
        ],
      );
    }
    if (_isCoreMapEmptyFactory(target) &&
        positional.isEmpty &&
        arguments.named.isEmpty) {
      helpers.require(EsmRuntimeHelper.mapGet);
      return const EsmCallIr(
        callee: EsmIdentifierIr('__dartMapFromEntries'),
        arguments: [EsmArrayLiteralIr([])],
      );
    }
    return null;
  }

  bool _isCoreGrowableListFactory(String target) {
    return target.startsWith('dart:core::_GrowableList::@factories::');
  }

  bool _isCoreSetFactory(String target) {
    return target == 'dart:core::Set::@factories::of' ||
        target == 'dart:core::Set::@factories::from' ||
        target == 'dart:core::Set::@factories::unmodifiable' ||
        target == 'dart:collection::LinkedHashSet::@factories::of' ||
        target == 'dart:collection::LinkedHashSet::@factories::from';
  }

  bool _isSplayTreeSetEmptyFactory(String target) {
    return target == 'dart:collection::SplayTreeSet::@factories::';
  }

  bool _isSplayTreeSetCopyFactory(String target) {
    return target == 'dart:collection::SplayTreeSet::@factories::of' ||
        target == 'dart:collection::SplayTreeSet::@factories::from';
  }

  bool _isCoreSetIdentityFactory(String target) {
    return target == 'dart:core::Set::@factories::identity' ||
        target == 'dart:collection::LinkedHashSet::@factories::identity';
  }

  bool _isCoreSetEmptyFactory(String target) {
    return target == 'dart:collection::HashSet::@factories::' ||
        target == 'dart:collection::LinkedHashSet::@factories::';
  }

  bool _isCoreCollectionCastFrom(String target) {
    return target == 'dart:core::List::@methods::castFrom' ||
        target == 'dart:core::Set::@methods::castFrom' ||
        target == 'dart:core::Map::@methods::castFrom';
  }

  bool _isDartCollectionQueueFactory(String target) {
    return target.startsWith('dart:collection::Queue::@factories::') ||
        target.startsWith('dart:collection::ListQueue::@factories::') ||
        target.startsWith('dart:collection::DoubleLinkedQueue::@factories::');
  }

  bool _isCoreMapFactory(String target) {
    return target == 'dart:core::Map::@factories::of' ||
        target == 'dart:core::Map::@factories::from' ||
        target == 'dart:core::Map::@factories::fromEntries' ||
        target == 'dart:core::Map::@factories::unmodifiable' ||
        target == 'dart:collection::LinkedHashMap::@factories::of' ||
        target == 'dart:collection::LinkedHashMap::@factories::from';
  }

  bool _isSplayTreeMapEmptyFactory(String target) {
    return target == 'dart:collection::SplayTreeMap::@factories::';
  }

  bool _isSplayTreeMapCopyFactory(String target) {
    return target == 'dart:collection::SplayTreeMap::@factories::of' ||
        target == 'dart:collection::SplayTreeMap::@factories::from';
  }

  bool _isCoreMapFromIterableFactory(String target) {
    return target == 'dart:core::Map::@factories::fromIterable' ||
        target == 'dart:collection::LinkedHashMap::@factories::fromIterable';
  }

  bool _isCoreMapFromIterablesFactory(String target) {
    return target == 'dart:core::Map::@factories::fromIterables' ||
        target == 'dart:collection::LinkedHashMap::@factories::fromIterables';
  }

  bool _isCoreMapIdentityFactory(String target) {
    return target == 'dart:core::Map::@factories::identity' ||
        target == 'dart:collection::LinkedHashMap::@factories::identity';
  }

  bool _isCustomHashMapFactory(String target) {
    return target == 'dart:collection::HashMap::@factories::' ||
        target == 'dart:collection::LinkedHashMap::@factories::';
  }

  bool _isCoreMapEmptyFactory(String target) {
    return target == 'dart:collection::HashMap::@factories::' ||
        target == 'dart:collection::LinkedHashMap::@factories::';
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

  EsmExpressionIr? _lowerNamedArgument(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Arguments arguments,
    String name, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    for (final argument in arguments.named) {
      if (argument.name == name) {
        return _lowerExpression(
          world,
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

  EsmExpressionIr? _lowerCoreNumberStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.types.isNotEmpty) {
      return null;
    }
    final target = kernelReferencePath(expression.targetReference);
    final bigIntStatic = _lowerBigIntStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      target,
      thisExpression: thisExpression,
    );
    if (bigIntStatic != null) {
      return bigIntStatic;
    }
    final isTryParse = switch (target) {
      'dart:core::int::@methods::parse' => false,
      'dart:core::int::@methods::tryParse' => true,
      _ => null,
    };
    if (isTryParse == null) {
      return _lowerCoreDoubleStaticInvocation(
        world,
        helpers,
        locals,
        expression,
        target,
        thisExpression: thisExpression,
      );
    }
    final positional = expression.arguments.positional;
    if (positional.length != 1 ||
        expression.arguments.named.any(
          (argument) => argument.name != 'radix',
        )) {
      return null;
    }
    final radixArguments = [
      for (final argument in expression.arguments.named)
        if (argument.name == 'radix') argument.value,
    ];
    if (radixArguments.length > 1) {
      return null;
    }
    final radix = radixArguments.isEmpty ? null : radixArguments.single;
    helpers.require(EsmRuntimeHelper.intParse);
    return EsmCallIr(
      callee: isTryParse
          ? const EsmIdentifierIr('__dartIntTryParse')
          : helpers.reference(runtimeHelpers, EsmRuntimeHelper.intParse),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
        if (radix != null)
          _lowerExpression(
            world,
            helpers,
            locals,
            radix,
            thisExpression: thisExpression,
          ),
      ],
    );
  }

  EsmExpressionIr? _lowerCoreDoubleStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final callee = switch (target) {
      'dart:core::double::@methods::parse' => helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.doubleParse,
      ),
      'dart:core::double::@methods::tryParse' => const EsmIdentifierIr(
        '__dartDoubleTryParse',
      ),
      'dart:core::num::@methods::parse' => const EsmIdentifierIr(
        '__dartNumParse',
      ),
      'dart:core::num::@methods::tryParse' => const EsmIdentifierIr(
        '__dartNumTryParse',
      ),
      _ => null,
    };
    if (callee == null) {
      return null;
    }
    final positional = expression.arguments.positional;
    if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
      return null;
    }
    helpers.require(EsmRuntimeHelper.doubleParse);
    return EsmCallIr(
      callee: callee,
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
      ],
    );
  }

  EsmExpressionIr? _lowerBigIntStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression,
    String target, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (target == 'dart:core::BigInt::@factories::from' ||
        target == 'dart:core::BigInt::@methods::from') {
      if (expression.arguments.positional.length != 1 ||
          expression.arguments.named.isNotEmpty) {
        return null;
      }
      return EsmCallIr(
        callee: const EsmIdentifierIr('BigInt'),
        arguments: [
          EsmCallIr(
            callee: const EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('Math'),
              property: 'trunc',
            ),
            arguments: [
              _lowerExpression(
                world,
                helpers,
                locals,
                expression.arguments.positional.single,
                thisExpression: thisExpression,
              ),
            ],
          ),
        ],
      );
    }
    final tryParse = switch (target) {
      'dart:core::BigInt::@methods::parse' => false,
      'dart:core::BigInt::@methods::tryParse' => true,
      _ => null,
    };
    if (tryParse == null) {
      return null;
    }
    final positional = expression.arguments.positional;
    if (positional.length != 1 ||
        expression.arguments.named.any(
          (argument) => argument.name != 'radix',
        )) {
      return null;
    }
    final radixArguments = [
      for (final argument in expression.arguments.named)
        if (argument.name == 'radix') argument.value,
    ];
    if (radixArguments.length > 1) {
      return null;
    }
    final radix = radixArguments.isEmpty ? null : radixArguments.single;
    helpers.require(EsmRuntimeHelper.bigIntParse);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.bigIntParse),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          positional.single,
          thisExpression: thisExpression,
        ),
        if (radix == null)
          const EsmNullLiteralIr()
        else
          _lowerExpression(
            world,
            helpers,
            locals,
            radix,
            thisExpression: thisExpression,
          ),
        EsmBooleanLiteralIr(tryParse),
      ],
    );
  }

  EsmCallIr _arrayFrom(EsmRuntimeHelperUseSet helpers, EsmExpressionIr value) {
    helpers.require(EsmRuntimeHelper.iterableToArray);
    return EsmCallIr(
      callee: helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.iterableToArray,
      ),
      arguments: [value],
    );
  }

  EsmCallIr _stringRunes(EsmExpressionIr value) {
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('Array'),
        property: 'from',
      ),
      arguments: [
        EsmCallIr(callee: const EsmIdentifierIr('String'), arguments: [value]),
        const EsmArrowFunctionIr(
          parameters: [EsmIdentifierParameterIr(name: 'char')],
          body: EsmCallIr(
            callee: EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('char'),
              property: 'codePointAt',
            ),
            arguments: [EsmNumberLiteralIr(0)],
          ),
        ),
      ],
    );
  }

  EsmExpressionIr _lowerCoreGrowableListLiteral(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      throw NewCompilerUnsupported(expression, 'GrowableList literal shape');
    }
    return EsmArrayLiteralIr([
      for (final argument in expression.arguments.positional)
        _lowerExpression(
          world,
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

  String _instanceMemberName(EsmSemanticWorld world, k.Member member) {
    if (member is k.Field) {
      return _instanceFieldName(world, member);
    }
    if (member is k.Procedure) {
      final symbol = world.instanceProcedureSymbolFor(member);
      if (symbol != null) {
        return symbol.name;
      }
    }
    throw NewCompilerUnsupported(
      member,
      'instance member lowering ${kernelReferencePath(member.reference)}',
    );
  }

  EsmExpressionIr _memberAccess(EsmExpressionIr receiver, String memberName) {
    if (isJsIdentifierName(memberName)) {
      return EsmPropertyAccessIr(receiver: receiver, property: memberName);
    }
    return EsmComputedPropertyAccessIr(
      receiver: receiver,
      property: EsmStringLiteralIr(memberName),
    );
  }

  String _instanceFieldName(EsmSemanticWorld world, k.Field field) {
    final symbol = world.instanceFieldSymbolFor(field);
    if (symbol == null) {
      throw NewCompilerUnsupported(field, 'instance field lowering');
    }
    return symbol.name;
  }

  EsmExpressionIr _lowerVariableGet(
    Map<k.VariableDeclaration, String> locals,
    k.VariableGet expression,
  ) {
    final name = locals[expression.variable];
    if (name == null) {
      throw NewCompilerUnsupported(
        expression,
        'unbound variable get ${expression.variable.name ?? '<unnamed>'} '
        'in ${expression.variable.parent.runtimeType}',
      );
    }
    if (expression.variable.isLate) {
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr(name),
          property: 'get',
        ),
        arguments: const [],
      );
    }
    return EsmIdentifierIr(name);
  }

  String _freshParameterName(
    EsmSemanticWorld world,
    Set<String> usedParameters,
    String original,
  ) {
    final name = _freshLocalName(world, usedParameters, original);
    usedParameters.add(name);
    return name;
  }

  String _freshLocalName(
    EsmSemanticWorld world,
    Iterable<String> usedNames,
    String original, {
    Iterable<String> reservedNames = const [],
  }) {
    return _freshIn({
      ...world.globalBindingNames,
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
  '+': EsmBinaryOperatorIr.add,
  '-': EsmBinaryOperatorIr.subtract,
  '*': EsmBinaryOperatorIr.multiply,
  '/': EsmBinaryOperatorIr.divide,
  '%': EsmBinaryOperatorIr.remainder,
  '<': EsmBinaryOperatorIr.lessThan,
  '<=': EsmBinaryOperatorIr.lessThanOrEqual,
  '>': EsmBinaryOperatorIr.greaterThan,
  '>=': EsmBinaryOperatorIr.greaterThanOrEqual,
  '&': EsmBinaryOperatorIr.bitAnd,
  '|': EsmBinaryOperatorIr.bitOr,
  '^': EsmBinaryOperatorIr.bitXor,
  '<<': EsmBinaryOperatorIr.leftShift,
  '>>': EsmBinaryOperatorIr.signedRightShift,
  '>>>': EsmBinaryOperatorIr.unsignedRightShift,
};
