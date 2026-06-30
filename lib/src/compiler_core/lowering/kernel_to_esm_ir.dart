import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../../kernel/kernel_references.dart';
import '../../kernel/sdk_symbols.dart';
import '../../names/js_names.dart';
import '../compiler_stage.dart';
import '../ir/esm_ir.dart';
import '../new_compiler_unsupported.dart';
import '../runtime/runtime_helpers.dart';
import '../semantic/semantic_world.dart';
import 'lowering_context.dart';

final class LoweringResult {
  LoweringResult({
    required this.semantic,
    required this.module,
    required Iterable<EsmRuntimeHelper> runtimeHelpers,
  }) : runtimeHelpers = List.unmodifiable(runtimeHelpers);

  final SemanticWorldResult semantic;
  final EsmModuleIr module;
  final List<EsmRuntimeHelper> runtimeHelpers;
}

final class KernelToEsmIrLoweringStage
    implements Dart2EsmCompilerStage<SemanticWorldResult, LoweringResult> {
  const KernelToEsmIrLoweringStage({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;

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
      for (final field in world.fields) _lowerField(world, helpers, field),
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
      module: EsmModuleIr(items: items),
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
          name: markerName,
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
          if (procedure.node.name.text != '_enumToString')
            _lowerClassProcedure(world, helpers, klass, procedure),
        if (!_hasInstanceProcedure(klass, 'toString'))
          _lowerEnumToString(klass),
      ],
    );
  }

  EsmClassMethodIr _lowerEnumToString(EsmClassSymbol klass) {
    return EsmClassMethodIr(
      name: 'toString',
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
      (procedure) => procedure.node.name.text == name,
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
            EsmObjectLiteralPropertyIr(name: 'value', value: value),
            EsmObjectLiteralPropertyIr(
              name: 'enumerable',
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
    final superclass = klass.localSuperclass == null
        ? null
        : world.classSymbolFor(klass.localSuperclass!);
    if (klass.localSuperclass != null && superclass == null) {
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
        : interfaceMarkers.isNotEmpty
        ? EsmClassConstructorIr(
            parameters: const [],
            body: _lowerInterfaceMarkerDefinitions(
              const EsmThisIr(),
              interfaceMarkers,
            ),
          )
        : null;
    return EsmClassIr(
      name: klass.name,
      export: klass.export,
      superclass: superclass?.name,
      constructor: constructor,
      methods: [
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
          _lowerClassProcedure(world, helpers, klass, procedure),
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
          name: member.name,
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
            name: member.name,
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
      name: member.name,
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
      name: member.backingName,
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
    helpers.add(EsmRuntimeHelper.extensionTypeRep);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.extensionTypeRep),
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
    helpers.add(EsmRuntimeHelper.lazyField);
    final initializer = field.node.initializer;
    return [
      EsmVariableDeclarationIr(
        name: field.backingName,
        initializer: EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.lazyField),
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
            EsmBooleanLiteralIr(field.mutable),
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
              EsmObjectLiteralPropertyIr(
                name: 'get',
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
              EsmObjectLiteralPropertyIr(
                name: 'set',
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
              const EsmObjectLiteralPropertyIr(
                name: 'enumerable',
                value: EsmBooleanLiteralIr(true),
              ),
            ]),
          ],
        ),
      ),
    ];
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
            EsmObjectLiteralPropertyIr(
              name: 'value',
              value: EsmFunctionExpressionIr(
                parameters: const [EsmIdentifierParameterIr(name: 'value')],
                body: [
                  EsmReturnStatementIr(
                    EsmBinaryIr(
                      left: EsmBinaryIr(
                        left: const EsmIdentifierIr('value'),
                        operator: '!=',
                        right: const EsmNullLiteralIr(),
                      ),
                      operator: '&&',
                      right: EsmBinaryIr(
                        left: EsmComputedPropertyAccessIr(
                          receiver: const EsmIdentifierIr('value'),
                          property: EsmIdentifierIr(markerName),
                        ),
                        operator: '===',
                        right: const EsmBooleanLiteralIr(true),
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
      for (final interfaceType in klass.node.implementedTypes)
        if (interfaceType.className.node case final k.Class interfaceClass)
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
              const EsmObjectLiteralIr([
                EsmObjectLiteralPropertyIr(
                  name: 'value',
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
      final selfName = _freshIn(usedParameters, r'$self');
      final self = EsmIdentifierIr(selfName);
      final body = <EsmStatementIr>[
        EsmVariableDeclarationIr(
          name: selfName,
          initializer: _lowerSuperFactoryAllocation(
            world,
            helpers,
            locals,
            superInitializer,
            const EsmNewTargetIr(),
          ),
          mutable: false,
        ),
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
    final body = <EsmStatementIr>[
      for (final initializer in superInitializers)
        ..._lowerSuperInitializer(world, helpers, locals, initializer),
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
        name: constructor.name,
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
        name: selfName,
        initializer: allocation,
        mutable: false,
      ),
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
      name: constructor.name,
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
    return target is k.Constructor &&
        world.constructorSymbolFor(target)?.name.isNotEmpty == true;
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
      throw NewCompilerUnsupported(initializer, 'super initializer target');
    }
    final constructor = world.constructorSymbolFor(target);
    final klass = world.classSymbolFor(target.enclosingClass);
    if (constructor == null || klass == null) {
      if (initializer.arguments.positional.isEmpty &&
          initializer.arguments.named.isEmpty) {
        return _lowerObjectCreate(newTarget);
      }
      throw NewCompilerUnsupported(initializer, 'super initializer target');
    }
    return _lowerConstructorAllocation(
      world,
      helpers,
      locals,
      target,
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
    final constructor = world.constructorSymbolFor(target);
    final klass = world.classSymbolFor(target.enclosingClass);
    if (constructor == null || klass == null) {
      throw NewCompilerUnsupported(contextNode, context);
    }
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
        EsmExpressionStatementIr(
          EsmAssignmentIr(
            target: EsmPropertyAccessIr(
              receiver: receiver,
              property: _instanceFieldName(world, initializer.field),
            ),
            value: _lowerExpression(
              world,
              helpers,
              locals,
              initializer.value,
              thisExpression: receiver,
            ),
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
    final target = initializer.targetReference.node;
    if (target is k.Constructor && world.constructorSymbolFor(target) != null) {
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
      name: procedure.name,
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

  EsmVariableDeclarationIr _lowerField(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmFieldSymbol field,
  ) {
    final initializer = field.node.initializer;
    return EsmVariableDeclarationIr(
      name: field.name,
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
    );
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
    final name = _freshIn(usedParameters, original);
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
    final name = _freshIn(usedParameters, original);
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
    if (arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(contextNode, context);
    }
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
            EsmObjectLiteralPropertyIr(
              name: argument.name,
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

  List<EsmStatementIr> _lowerStatementList(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Statement statement, {
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
          rethrowName: rethrowName,
        ),
      ],
      k.BreakStatement() => [_lowerBreakStatement(labels, statement)],
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
    String? rethrowName,
  }) {
    final label = _freshIn(labels.values.toSet(), 'label');
    labels[statement] = label;
    return EsmLabeledStatementIr(
      label: label,
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.body,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
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
    String? rethrowName,
  }) {
    return EsmDoStatementIr(
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.body,
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

  EsmSwitchStatementIr _lowerSwitchStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.SwitchStatement statement,
    EsmExpressionIr thisExpression, {
    String? rethrowName,
  }) {
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
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
    );
  }

  EsmForStatementIr _lowerForStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.ForStatement statement,
    EsmExpressionIr thisExpression, {
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
    String? rethrowName,
  ) {
    final errorName = _freshIn(locals.values.toSet(), r'$error');
    return EsmTryStatementIr(
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.body,
        thisExpression: thisExpression,
        rethrowName: rethrowName,
      ),
      catchParameter: errorName,
      catchBody: _lowerCatchChain(
        world,
        helpers,
        locals,
        labels,
        statement.catches,
        errorName,
        thisExpression,
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
    String? rethrowName,
  ) {
    return EsmTryStatementIr(
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.body,
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
    EsmExpressionIr thisExpression,
  ) {
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
    EsmExpressionIr thisExpression,
  ) {
    final catchLocals = Map<k.VariableDeclaration, String>.of(locals);
    final statements = <EsmStatementIr>[];
    final error = EsmIdentifierIr(errorName);
    final exception = catchClause.exception;
    if (exception != null) {
      final name = _freshIn(catchLocals.values.toSet(), exception.name ?? 'e');
      catchLocals[exception] = name;
      statements.add(
        EsmVariableDeclarationIr(
          name: name,
          initializer: error,
          mutable: exception.isAssignable,
        ),
      );
    }
    final stackTrace = catchClause.stackTrace;
    if (stackTrace != null) {
      final name = _freshIn(
        catchLocals.values.toSet(),
        stackTrace.name ?? 'stack',
      );
      catchLocals[stackTrace] = name;
      statements.add(
        EsmVariableDeclarationIr(
          name: name,
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
    final name = _freshIn(locals.values.toSet(), statement.name ?? 'v');
    locals[statement] = name;
    final initializer = statement.initializer;
    return EsmVariableDeclarationIr(
      name: name,
      initializer: initializer == null
          ? null
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
    final name = _freshIn(
      locals.values.toSet(),
      statement.variable.name ?? 'f',
    );
    locals[statement.variable] = name;
    return EsmVariableDeclarationIr(
      name: name,
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
      k.StaticGet() => _lowerStaticGet(world, expression),
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
        operator: '!',
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
              ? '&&'
              : '||',
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
        operator: '===',
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
      k.SetLiteral() => EsmNewIr(
        callee: const EsmIdentifierIr('Set'),
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
      ),
      k.MapLiteral() => EsmNewIr(
        callee: const EsmIdentifierIr('Map'),
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
      ),
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
    helpers.add(EsmRuntimeHelper.dynamicGet);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.dynamicGet),
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
    helpers.add(EsmRuntimeHelper.dynamicSet);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.dynamicSet),
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
    helpers.add(EsmRuntimeHelper.nullCheck);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.nullCheck),
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
    helpers.add(EsmRuntimeHelper.record);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.record),
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
            EsmObjectLiteralPropertyIr(
              name: field.name,
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
    helpers.add(EsmRuntimeHelper.stringify);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.stringify),
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
        EsmFunctionExpressionIr(
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
          property: _instanceMemberName(world, target),
        );
      }
    }
    if (otherwise is k.InstanceInvocation &&
        _isVariableGet(otherwise.receiver, variable)) {
      final target = otherwise.interfaceTargetReference.node;
      if (target is k.Member) {
        return EsmOptionalMethodCallIr(
          receiver: receiver,
          property: _instanceMemberName(world, target),
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
        EsmFunctionExpressionIr(
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
    return EsmFunctionExpressionIr(
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
      helpers.add(EsmRuntimeHelper.constSet);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.constSet),
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
      helpers.add(EsmRuntimeHelper.constMap);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.constMap),
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
      helpers.add(EsmRuntimeHelper.record);
      return _lowerCanonicalConstant(
        helpers,
        constant,
        EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.record),
          arguments: [
            EsmArrayLiteralIr([
              for (final entry in constant.positional)
                _lowerConstant(world, helpers, entry, context),
            ]),
            EsmObjectLiteralIr([
              for (final entry in constant.named.entries)
                EsmObjectLiteralPropertyIr(
                  name: entry.key,
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
      final target = constant.targetReference.node;
      if (target is k.Procedure) {
        final symbol = world.symbolFor(target);
        if (symbol != null && symbol.kind == EsmProcedureKind.method) {
          return EsmIdentifierIr(symbol.name);
        }
      }
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
      final instance = _lowerInstanceConstant(
        world,
        helpers,
        constant,
        context,
      );
      return _lowerCanonicalConstant(helpers, constant, instance);
    }
    throw NewCompilerUnsupported(context, 'constant expression lowering');
  }

  EsmExpressionIr _lowerSymbolLiteral(
    EsmRuntimeHelperUseSet helpers,
    String name, {
    k.Reference? libraryReference,
  }) {
    helpers.add(EsmRuntimeHelper.symbol);
    final key = libraryReference == null
        ? name
        : '${kernelReferencePath(libraryReference)}::$name';
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.symbol),
      arguments: [EsmStringLiteralIr(key), EsmStringLiteralIr(name)],
    );
  }

  EsmExpressionIr _lowerTypeLiteral(
    EsmRuntimeHelperUseSet helpers,
    k.DartType type,
  ) {
    helpers.add(EsmRuntimeHelper.type);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.type),
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
    if (klass is! k.Class ||
        klass.enclosingLibrary.importUri.scheme == 'dart') {
      throw NewCompilerUnsupported(context, 'constant expression lowering');
    }
    final symbol = world.classSymbolFor(klass);
    if (symbol == null) {
      throw NewCompilerUnsupported(context, 'constant expression lowering');
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
              EsmObjectLiteralPropertyIr(name: 'index', value: loweredValue),
            );
          case '_name':
            enumName = entry.value is k.StringConstant
                ? (entry.value as k.StringConstant).value
                : null;
            fields.add(
              EsmObjectLiteralPropertyIr(
                name: '__dartEnumName',
                value: loweredValue,
              ),
            );
            fields.add(
              EsmObjectLiteralPropertyIr(name: 'name', value: loweredValue),
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
        EsmObjectLiteralPropertyIr(
          name: fieldSymbol.name,
          value: _lowerConstant(world, helpers, entry.value, context),
        ),
      );
    }
    if (klass.isEnum && enumName != null) {
      fields.add(
        EsmObjectLiteralPropertyIr(
          name: 'toString',
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
            property: 'assign',
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
              ],
            ),
            EsmObjectLiteralIr(fields),
          ],
        ),
      ],
    );
  }

  EsmExpressionIr? _lowerDartMathInstanceConstant(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    k.InstanceConstant constant,
    Object context,
  ) {
    final classPath = kernelReferencePath(constant.classReference);
    if (classPath == 'dart:math::Point') {
      helpers.add(EsmRuntimeHelper.mathPoint);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.mathPoint),
        arguments: [
          _lowerConstantField(world, helpers, constant, 'x', context),
          _lowerConstantField(world, helpers, constant, 'y', context),
        ],
      );
    }
    if (classPath == 'dart:math::Rectangle') {
      helpers.add(EsmRuntimeHelper.mathRectangle);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.mathRectangle),
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
            EsmObjectLiteralPropertyIr(
              name: parameter.name ?? 'arg',
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
    helpers.add(EsmRuntimeHelper.constValue);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.constValue),
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
    k.StaticGet expression,
  ) {
    final runtimeStaticGet = _lowerRuntimeStaticGet(expression);
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
    throw NewCompilerUnsupported(expression, 'static get lowering');
  }

  EsmExpressionIr? _lowerRuntimeStaticGet(k.StaticGet expression) {
    final mathGet = _lowerMathStaticGet(expression);
    if (mathGet != null) {
      return mathGet;
    }
    final developerGet = _lowerDeveloperStaticGet(expression);
    if (developerGet != null) {
      return developerGet;
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

  EsmExpressionIr? _lowerMathStaticGet(k.StaticGet expression) {
    final property = switch (dartMathStaticGetSymbol(
      expression.targetReference,
    )) {
      DartMathStaticGetSymbol.pi => 'PI',
      DartMathStaticGetSymbol.e => 'E',
      DartMathStaticGetSymbol.ln2 => 'LN2',
      DartMathStaticGetSymbol.ln10 => 'LN10',
      DartMathStaticGetSymbol.log2e => 'LOG2E',
      DartMathStaticGetSymbol.log10e => 'LOG10E',
      DartMathStaticGetSymbol.sqrt1_2 => 'SQRT1_2',
      DartMathStaticGetSymbol.sqrt2 => 'SQRT2',
      null => null,
    };
    return property == null
        ? null
        : EsmPropertyAccessIr(
            receiver: const EsmIdentifierIr('Math'),
            property: property,
          );
  }

  EsmExpressionIr? _lowerDeveloperStaticGet(k.StaticGet expression) {
    switch (dartDeveloperStaticGetSymbol(expression.targetReference)) {
      case DartDeveloperStaticGetSymbol.timelineNow:
        return const EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Math'),
            property: 'trunc',
          ),
          arguments: [
            EsmBinaryIr(
              left: EsmCallIr(
                callee: EsmPropertyAccessIr(
                  receiver: EsmIdentifierIr('Date'),
                  property: 'now',
                ),
                arguments: [],
              ),
              operator: '*',
              right: EsmNumberLiteralIr(1000),
            ),
          ],
        );
      case DartDeveloperStaticGetSymbol.extensionStreamHasListener:
        return const EsmBooleanLiteralIr(false);
      case DartDeveloperStaticGetSymbol.reachabilityBarrier:
        return const EsmNumberLiteralIr(0);
      case DartDeveloperStaticGetSymbol.nativeRuntimeBuildId:
        return const EsmNullLiteralIr();
      case DartDeveloperStaticGetSymbol.userTagDefaultTag:
        return const EsmObjectLiteralIr([
          EsmObjectLiteralPropertyIr(
            name: 'label',
            value: EsmStringLiteralIr('Default'),
          ),
        ]);
      case null:
        return null;
    }
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
        if (!symbol.mutable) {
          throw NewCompilerUnsupported(expression, 'write to final field');
        }
        return EsmAssignmentIr(
          target: EsmIdentifierIr(symbol.name),
          value: _lowerExpression(
            world,
            helpers,
            locals,
            expression.value,
            thisExpression: thisExpression,
          ),
        );
      }
      final staticSymbol = world.staticFieldSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = world.classSymbolFor(enclosingClass);
        if (staticSymbol != null && klass != null) {
          if (!staticSymbol.mutable) {
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
    return EsmAssignmentIr(
      target: EsmIdentifierIr(name),
      value: _lowerExpression(
        world,
        helpers,
        locals,
        expression.value,
        thisExpression: thisExpression,
      ),
    );
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
    if (!_binaryOperators.contains(operator) ||
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
      throw NewCompilerUnsupported(expression, 'instance invocation lowering');
    }
    return EsmBinaryIr(
      left: _lowerExpression(
        world,
        helpers,
        locals,
        expression.receiver,
        thisExpression: thisExpression,
      ),
      operator: operator,
      right: _lowerExpression(
        world,
        helpers,
        locals,
        expression.arguments.positional.single,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmExpressionIr? _lowerSdkInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    return _lowerMathInstanceInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
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
    helpers.add(
      isCall ? EsmRuntimeHelper.dynamicCall : EsmRuntimeHelper.dynamicInvoke,
    );
    return EsmCallIr(
      callee: runtimeHelpers.reference(
        isCall ? EsmRuntimeHelper.dynamicCall : EsmRuntimeHelper.dynamicInvoke,
      ),
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
              EsmObjectLiteralPropertyIr(
                name: argument.name,
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
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final target = kernelReferencePath(expression.interfaceTargetReference);
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
    if (expression.name.text == '[]' &&
        expression.arguments.positional.length == 1) {
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
      if (target == 'dart:core::Map::@methods::[]' ||
          target == 'dart:_compact_hash::_ConstMap::@methods::[]' ||
          target == 'dart:_compact_hash::_Map::@methods::[]') {
        return EsmCallIr(
          callee: EsmPropertyAccessIr(receiver: receiver, property: 'get'),
          arguments: [property],
        );
      }
      return EsmComputedPropertyAccessIr(
        receiver: receiver,
        property: property,
      );
    }
    if (expression.name.text == '[]=' &&
        expression.arguments.positional.length == 2 &&
        (target == 'dart:core::Map::@methods::[]=' ||
            target == 'dart:_compact_hash::_Map::@methods::[]=')) {
      helpers.add(EsmRuntimeHelper.mapSet);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.mapSet),
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
    if (target == 'dart:core::Map::@methods::addAll' &&
        expression.arguments.positional.length == 1) {
      helpers.add(EsmRuntimeHelper.mapAddAll);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.mapAddAll),
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
    if ((target == 'dart:core::Map::@methods::containsKey' ||
            target == 'dart:_compact_hash::_ConstMap::@methods::containsKey' ||
            target == 'dart:_compact_hash::_Map::@methods::containsKey') &&
        expression.arguments.positional.length == 1) {
      helpers.add(EsmRuntimeHelper.mapContainsKey);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.mapContainsKey),
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
    if (target == 'dart:core::Set::@methods::add' &&
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
          property: 'add',
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
    if (target == 'dart:core::Set::@methods::addAll' &&
        expression.arguments.positional.length == 1) {
      helpers.add(EsmRuntimeHelper.setAddAll);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.setAddAll),
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
    if (target == 'dart:core::List::@methods::add' &&
        expression.arguments.positional.length == 1) {
      helpers.add(EsmRuntimeHelper.listAdd);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.listAdd),
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
    if (target == 'dart:core::List::@methods::addAll' &&
        expression.arguments.positional.length == 1) {
      helpers.add(EsmRuntimeHelper.listAddAll);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.listAddAll),
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
      return EsmUnaryIr(operator: '-', operand: receiver);
    }
    if (target == 'dart:core::BigInt::@methods::unary-') {
      return EsmUnaryIr(operator: '-', operand: receiver);
    }
    if (target == 'dart:core::int::@methods::~') {
      return EsmUnaryIr(operator: '~', operand: receiver);
    }
    if (target.startsWith('dart:') && expression.name.text == 'toString') {
      return EsmCallIr(
        callee: const EsmIdentifierIr('String'),
        arguments: [receiver],
      );
    }
    final property = switch (target) {
      'dart:core::String::@methods::toUpperCase' => 'toUpperCase',
      _ => null,
    };
    if (property == null) {
      return null;
    }
    return EsmCallIr(
      callee: EsmPropertyAccessIr(receiver: receiver, property: property),
      arguments: const [],
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
    if (!_isCoreCompareToTarget(target) || positional.length != 1) {
      return null;
    }
    helpers.add(EsmRuntimeHelper.compare);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.compare),
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
          operator: '<',
          right: _bigIntLiteral(0),
        ),
        thenExpression: EsmUnaryIr(operator: '-', operand: receiver),
        otherwiseExpression: receiver,
      );
    }
    if (target == 'dart:core::BigInt::@methods::remainder' &&
        positional.length == 1) {
      return EsmBinaryIr(
        left: receiver,
        operator: '%',
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
        operator: '/',
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
      throw NewCompilerUnsupported(expression, 'instance get lowering');
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
    return _lowerMathInstanceGet(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
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
    if (target == 'dart:core::List::@getters::length' ||
        target == 'dart:core::String::@getters::length') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'length');
    }
    if (target == 'dart:core::_Enum::@getters::index') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'index');
    }
    if (target == 'dart:core::_Enum::@getters::name') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'name');
    }
    if (target == 'dart:core::Iterable::@getters::iterator') {
      helpers.add(EsmRuntimeHelper.iterator);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.iterator),
        arguments: [receiver],
      );
    }
    if (target == 'dart:core::Iterator::@getters::current') {
      return EsmPropertyAccessIr(receiver: receiver, property: 'current');
    }
    if (target == 'dart:core::String::@getters::isEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: '===',
        right: const EsmNumberLiteralIr(0),
      );
    }
    if (target == 'dart:core::String::@getters::isNotEmpty') {
      return EsmBinaryIr(
        left: EsmPropertyAccessIr(receiver: receiver, property: 'length'),
        operator: '>',
        right: const EsmNumberLiteralIr(0),
      );
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

  EsmExpressionIr? _lowerCoreNumberInstanceGet(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr receiver,
    String target,
  ) {
    return switch (target) {
      'dart:core::int::@getters::isEven' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: _mathTrunc(receiver),
          operator: '%',
          right: const EsmNumberLiteralIr(2),
        ),
        operator: '===',
        right: const EsmNumberLiteralIr(0),
      ),
      'dart:core::int::@getters::isOdd' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: _mathTrunc(receiver),
          operator: '%',
          right: const EsmNumberLiteralIr(2),
        ),
        operator: '!==',
        right: const EsmNumberLiteralIr(0),
      ),
      'dart:core::num::@getters::hashCode' ||
      'dart:core::int::@getters::hashCode' ||
      'dart:core::double::@getters::hashCode' => () {
        helpers.add(EsmRuntimeHelper.objectHash);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartHashValue'),
          arguments: [receiver],
        );
      }(),
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
        operator: '<',
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::isEven' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: receiver,
          operator: '%',
          right: _bigIntLiteral(2),
        ),
        operator: '===',
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::isOdd' => EsmBinaryIr(
        left: EsmBinaryIr(
          left: receiver,
          operator: '%',
          right: _bigIntLiteral(2),
        ),
        operator: '!==',
        right: _bigIntLiteral(0),
      ),
      'dart:core::BigInt::@getters::sign' => EsmConditionalIr(
        condition: EsmBinaryIr(
          left: receiver,
          operator: '<',
          right: _bigIntLiteral(0),
        ),
        thenExpression: const EsmNumberLiteralIr(-1),
        otherwiseExpression: EsmConditionalIr(
          condition: EsmBinaryIr(
            left: receiver,
            operator: '>',
            right: _bigIntLiteral(0),
          ),
          thenExpression: const EsmNumberLiteralIr(1),
          otherwiseExpression: const EsmNumberLiteralIr(0),
        ),
      ),
      'dart:core::BigInt::@getters::bitLength' => () {
        helpers.add(EsmRuntimeHelper.bigIntBitLength);
        return EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.bigIntBitLength),
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
    final target = expression.interfaceTargetReference.node;
    if (target is! k.Member) {
      throw NewCompilerUnsupported(expression, 'instance set lowering');
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
          callee: EsmPropertyAccessIr(
            receiver: const EsmSuperIr(),
            property: symbol.name,
          ),
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
    return EsmPropertyAccessIr(
      receiver: const EsmSuperIr(),
      property: _instanceMemberName(world, target),
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
      target: EsmPropertyAccessIr(
        receiver: const EsmSuperIr(),
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
    final target = expression.targetReference.node;
    if (target is! k.Constructor) {
      throw NewCompilerUnsupported(expression, 'constructor invocation');
    }
    final constructor = world.constructorSymbolFor(target);
    final klass = world.classSymbolFor(target.enclosingClass);
    if (klass == null) {
      throw NewCompilerUnsupported(expression, 'constructor invocation');
    }
    if (constructor == null) {
      if (!_isSyntheticDefaultConstructor(target) ||
          expression.arguments.positional.isNotEmpty ||
          expression.arguments.named.isNotEmpty ||
          expression.arguments.types.isNotEmpty) {
        throw NewCompilerUnsupported(expression, 'constructor invocation');
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
    if (expression.arguments.named.isNotEmpty) {
      return null;
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
    final target = kernelReferencePath(expression.targetReference);
    if (target == 'dart:_compact_hash::_Set::@constructors::' &&
        expression.arguments.positional.isEmpty) {
      return EsmNewIr(
        callee: const EsmIdentifierIr('Set'),
        arguments: const [],
      );
    }
    if ((target.startsWith('dart:core::Symbol::') ||
            target.startsWith('dart:_internal::Symbol::')) &&
        expression.arguments.positional.length == 1) {
      final argument = expression.arguments.positional.single;
      if (argument is k.StringLiteral) {
        return _lowerSymbolLiteral(helpers, argument.value);
      }
      helpers.add(EsmRuntimeHelper.symbol);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.symbol),
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
      helpers.add(EsmRuntimeHelper.mathPoint);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.mathPoint),
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
      helpers.add(EsmRuntimeHelper.mathRectangle);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.mathRectangle),
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
    helpers.add(EsmRuntimeHelper.coreError);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.coreError),
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
    helpers.add(EsmRuntimeHelper.equals);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.equals),
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
    if (target is! k.Procedure) {
      throw NewCompilerUnsupported(expression, 'instance tear-off target');
    }
    final symbol = world.instanceProcedureSymbolFor(target);
    if (symbol == null || symbol.kind != EsmProcedureKind.method) {
      throw NewCompilerUnsupported(expression, 'instance tear-off target');
    }
    final function = target.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(expression, 'instance tear-off target');
    }
    const receiverName = r'$receiver';
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
            name: receiverName,
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
                    callee: EsmPropertyAccessIr(
                      receiver: const EsmIdentifierIr(receiverName),
                      property: symbol.name,
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
    helpers.add(EsmRuntimeHelper.typeCast);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.typeCast),
      arguments: [
        operand,
        EsmArrowFunctionIr(
          parameters: const ['value'],
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
            operator: 'instanceof',
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
      return switch (typeName) {
        'String' => _typeofEquals(value, 'string'),
        'BigInt' => _typeofEquals(value, 'bigint'),
        'int' || 'double' || 'num' => _typeofEquals(value, 'number'),
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
              operator: '!',
              operand: EsmParenthesizedIr(
                EsmBinaryIr(
                  left: value,
                  operator: 'instanceof',
                  right: const EsmIdentifierIr('DataView'),
                ),
              ),
            ),
          ]),
        ),
        'Set' => EsmBinaryIr(
          left: value,
          operator: 'instanceof',
          right: const EsmIdentifierIr('Set'),
        ),
        'Map' => EsmBinaryIr(
          left: value,
          operator: 'instanceof',
          right: const EsmIdentifierIr('Map'),
        ),
        'Iterable' => _andAll([
          _notNull(value),
          EsmBinaryIr(
            left: EsmUnaryIr(operator: 'typeof', operand: value),
            operator: '!==',
            right: const EsmStringLiteralIr('string'),
          ),
          EsmUnaryIr(
            operator: '!',
            operand: EsmParenthesizedIr(
              EsmBinaryIr(
                left: value,
                operator: 'instanceof',
                right: const EsmIdentifierIr('Map'),
              ),
            ),
          ),
          EsmBinaryIr(
            left: EsmUnaryIr(
              operator: 'typeof',
              operand: EsmComputedPropertyAccessIr(
                receiver: value,
                property: const EsmPropertyAccessIr(
                  receiver: EsmIdentifierIr('Symbol'),
                  property: 'iterator',
                ),
              ),
            ),
            operator: '===',
            right: const EsmStringLiteralIr('function'),
          ),
        ]),
        'Function' => _typeofEquals(value, 'function'),
        'Record' => _lowerRecordObjectTest(helpers, value),
        _ => throw NewCompilerUnsupported(type, 'type test lowering'),
      };
    }
    throw NewCompilerUnsupported(type, 'type test lowering');
  }

  EsmExpressionIr _lowerCoreErrorTypeTest(
    EsmRuntimeHelperUseSet helpers,
    EsmExpressionIr value,
    String typeName,
  ) {
    helpers.add(EsmRuntimeHelper.coreError);
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
      property: runtimeHelpers.reference(EsmRuntimeHelper.recordShape),
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
    helpers.add(EsmRuntimeHelper.isRecord);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.isRecord),
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
      EsmUnaryIr(operator: 'typeof', operand: value),
      EsmStringLiteralIr(name),
    );
  }

  EsmExpressionIr _notNull(EsmExpressionIr value) {
    return EsmBinaryIr(
      left: value,
      operator: '!=',
      right: const EsmNullLiteralIr(),
    );
  }

  EsmExpressionIr _strictEquals(EsmExpressionIr left, EsmExpressionIr right) {
    return EsmBinaryIr(left: left, operator: '===', right: right);
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

  bool _isCoreCompareToTarget(String target) {
    return target == 'dart:core::Comparable::@methods::compareTo' ||
        target == 'dart:core::num::@methods::compareTo' ||
        target == 'dart:core::int::@methods::compareTo' ||
        target == 'dart:core::double::@methods::compareTo' ||
        target == 'dart:core::String::@methods::compareTo';
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
            EsmBinaryIr(left: left, operator: '&&', right: right),
          ),
        );
  }

  EsmExpressionIr _or(EsmExpressionIr left, EsmExpressionIr right) {
    return EsmParenthesizedIr(
      EsmBinaryIr(left: left, operator: '||', right: right),
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
      expression.targetReference,
      'external static target',
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
    final enumStatic = _lowerCoreEnumStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (enumStatic != null) {
      return enumStatic;
    }
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
    final coreErrorStatic = _lowerCoreErrorStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreErrorStatic != null) {
      return coreErrorStatic;
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
    final coreObjectStatic = _lowerCoreObjectStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (coreObjectStatic != null) {
      return coreObjectStatic;
    }
    final mathStatic = _lowerMathStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (mathStatic != null) {
      return mathStatic;
    }
    final developerStatic = _lowerDeveloperStaticInvocation(
      world,
      helpers,
      locals,
      expression,
      thisExpression: thisExpression,
    );
    if (developerStatic != null) {
      return developerStatic;
    }
    if (_isCoreFunctionApply(expression.targetReference)) {
      return _lowerCoreFunctionApply(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
    }
    if (_isCoreIdentical(expression.targetReference)) {
      return _lowerCoreIdentical(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
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
    if (_isCorePrint(expression.targetReference)) {
      return _lowerCorePrint(
        world,
        helpers,
        locals,
        expression,
        thisExpression: thisExpression,
      );
    }
    return null;
  }

  EsmExpressionIr? _lowerMathStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final symbol = dartMathStaticInvocationSymbol(expression.targetReference);
    if (symbol == null) {
      return null;
    }
    final positional = expression.arguments.positional;
    switch (symbol) {
      case DartMathStaticInvocationSymbol.random:
      case DartMathStaticInvocationSymbol.randomSecure:
        if (positional.length > 1) {
          return null;
        }
        helpers.add(EsmRuntimeHelper.mathRandom);
        return EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.mathRandom),
          arguments: [
            positional.isEmpty
                ? const EsmNullLiteralIr()
                : _lowerExpression(
                    world,
                    helpers,
                    locals,
                    positional.single,
                    thisExpression: thisExpression,
                  ),
            EsmBooleanLiteralIr(
              symbol == DartMathStaticInvocationSymbol.randomSecure,
            ),
          ],
        );
      case DartMathStaticInvocationSymbol.rectangleFromPoints:
        if (positional.length != 2) {
          return null;
        }
        helpers.add(EsmRuntimeHelper.mathRectangle);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartRectangleFromPoints'),
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
      case DartMathStaticInvocationSymbol.min:
      case DartMathStaticInvocationSymbol.max:
      case DartMathStaticInvocationSymbol.pow:
      case DartMathStaticInvocationSymbol.atan2:
        if (positional.length != 2) {
          return null;
        }
      case DartMathStaticInvocationSymbol.sqrt:
      case DartMathStaticInvocationSymbol.sin:
      case DartMathStaticInvocationSymbol.cos:
      case DartMathStaticInvocationSymbol.tan:
      case DartMathStaticInvocationSymbol.asin:
      case DartMathStaticInvocationSymbol.acos:
      case DartMathStaticInvocationSymbol.atan:
      case DartMathStaticInvocationSymbol.exp:
      case DartMathStaticInvocationSymbol.log:
        if (positional.length != 1) {
          return null;
        }
    }
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: const EsmIdentifierIr('Math'),
        property: switch (symbol) {
          DartMathStaticInvocationSymbol.min => 'min',
          DartMathStaticInvocationSymbol.max => 'max',
          DartMathStaticInvocationSymbol.pow => 'pow',
          DartMathStaticInvocationSymbol.sqrt => 'sqrt',
          DartMathStaticInvocationSymbol.sin => 'sin',
          DartMathStaticInvocationSymbol.cos => 'cos',
          DartMathStaticInvocationSymbol.tan => 'tan',
          DartMathStaticInvocationSymbol.asin => 'asin',
          DartMathStaticInvocationSymbol.acos => 'acos',
          DartMathStaticInvocationSymbol.atan => 'atan',
          DartMathStaticInvocationSymbol.atan2 => 'atan2',
          DartMathStaticInvocationSymbol.exp => 'exp',
          DartMathStaticInvocationSymbol.log => 'log',
          DartMathStaticInvocationSymbol.random ||
          DartMathStaticInvocationSymbol.randomSecure ||
          DartMathStaticInvocationSymbol.rectangleFromPoints =>
            throw StateError('not a Math static method'),
        },
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

  EsmExpressionIr? _lowerDeveloperStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    switch (dartDeveloperStaticInvocationSymbol(expression.targetReference)) {
      case DartDeveloperStaticInvocationSymbol.debugger:
        return _lowerNamedArgument(
              world,
              helpers,
              locals,
              expression.arguments,
              'when',
              thisExpression: thisExpression,
            ) ??
            const EsmBooleanLiteralIr(true);
      case DartDeveloperStaticInvocationSymbol.inspect:
        final positional = expression.arguments.positional;
        if (positional.isEmpty) {
          return const EsmNullLiteralIr();
        }
        return _lowerExpression(
          world,
          helpers,
          locals,
          positional.first,
          thisExpression: thisExpression,
        );
      case DartDeveloperStaticInvocationSymbol.timelineTimeSync:
        final positional = expression.arguments.positional;
        if (positional.length < 2) {
          return const EsmNullLiteralIr();
        }
        return EsmCallIr(
          callee: EsmParenthesizedIr(
            _lowerExpression(
              world,
              helpers,
              locals,
              positional[1],
              thisExpression: thisExpression,
            ),
          ),
          arguments: const [],
        );
      case DartDeveloperStaticInvocationSymbol.flowBegin:
        return EsmObjectLiteralIr([
          EsmObjectLiteralPropertyIr(
            name: 'id',
            value:
                _lowerNamedArgument(
                  world,
                  helpers,
                  locals,
                  expression.arguments,
                  'id',
                  thisExpression: thisExpression,
                ) ??
                const EsmNumberLiteralIr(0),
          ),
        ]);
      case DartDeveloperStaticInvocationSymbol.flowStep:
      case DartDeveloperStaticInvocationSymbol.flowEnd:
        return EsmObjectLiteralIr([
          EsmObjectLiteralPropertyIr(
            name: 'id',
            value: expression.arguments.positional.isEmpty
                ? const EsmNumberLiteralIr(0)
                : _lowerExpression(
                    world,
                    helpers,
                    locals,
                    expression.arguments.positional.first,
                    thisExpression: thisExpression,
                  ),
          ),
        ]);
      case DartDeveloperStaticInvocationSymbol.serviceGetInfo:
      case DartDeveloperStaticInvocationSymbol.serviceControlWebServer:
        return const EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Promise'),
            property: 'resolve',
          ),
          arguments: [
            EsmObjectLiteralIr([
              EsmObjectLiteralPropertyIr(
                name: 'type',
                value: EsmStringLiteralIr('VM'),
              ),
            ]),
          ],
        );
      case DartDeveloperStaticInvocationSymbol.serviceGetIsolateId:
      case DartDeveloperStaticInvocationSymbol.serviceGetObjectId:
      case DartDeveloperStaticInvocationSymbol.log:
      case DartDeveloperStaticInvocationSymbol.postEvent:
      case DartDeveloperStaticInvocationSymbol.registerExtension:
      case DartDeveloperStaticInvocationSymbol.timelineStartSync:
      case DartDeveloperStaticInvocationSymbol.timelineFinishSync:
      case DartDeveloperStaticInvocationSymbol.timelineInstantSync:
        return const EsmNullLiteralIr();
      case null:
        return null;
    }
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
    if (isTryParse == null) return null;
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
    helpers.add(EsmRuntimeHelper.intParse);
    return EsmCallIr(
      callee: isTryParse
          ? const EsmIdentifierIr('__dartIntTryParse')
          : runtimeHelpers.reference(EsmRuntimeHelper.intParse),
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
    helpers.add(EsmRuntimeHelper.bigIntParse);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.bigIntParse),
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

  EsmExpressionIr? _lowerCoreObjectStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final positional = expression.arguments.positional;
    switch (dartCoreObjectStaticInvocationSymbol(expression.targetReference)) {
      case DartCoreObjectStaticInvocationSymbol.hash
          when positional.length >= 2:
        helpers.add(EsmRuntimeHelper.objectHash);
        return EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.objectHash),
          arguments: [
            EsmArrayLiteralIr([
              for (final argument in positional)
                _lowerExpression(
                  world,
                  helpers,
                  locals,
                  argument,
                  thisExpression: thisExpression,
                ),
            ]),
          ],
        );
      case DartCoreObjectStaticInvocationSymbol.hashAll
          when positional.length == 1:
        helpers.add(EsmRuntimeHelper.objectHash);
        return EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.objectHash),
          arguments: [
            _arrayFrom(
              _lowerExpression(
                world,
                helpers,
                locals,
                positional.single,
                thisExpression: thisExpression,
              ),
            ),
          ],
        );
      case DartCoreObjectStaticInvocationSymbol.hashAllUnordered
          when positional.length == 1:
        helpers.add(EsmRuntimeHelper.objectHash);
        return EsmCallIr(
          callee: const EsmIdentifierIr('__dartObjectHashUnordered'),
          arguments: [
            _arrayFrom(
              _lowerExpression(
                world,
                helpers,
                locals,
                positional.single,
                thisExpression: thisExpression,
              ),
            ),
          ],
        );
      default:
        return null;
    }
  }

  EsmCallIr _arrayFrom(EsmExpressionIr value) {
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('Array'),
        property: 'from',
      ),
      arguments: [value],
    );
  }

  EsmExpressionIr? _lowerCoreEnumStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.named.isNotEmpty) {
      return null;
    }
    final positional = expression.arguments.positional;
    switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
      case DartSdkStaticInvocationSymbol.coreEnumName
          when positional.length == 1:
        return EsmPropertyAccessIr(
          receiver: _lowerExpression(
            world,
            helpers,
            locals,
            positional.single,
            thisExpression: thisExpression,
          ),
          property: 'name',
        );
      case DartSdkStaticInvocationSymbol.coreEnumByName
          when positional.length == 2:
        helpers.add(EsmRuntimeHelper.enumByName);
        return EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.enumByName),
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
      case DartSdkStaticInvocationSymbol.coreEnumAsNameMap
          when positional.length == 1:
        helpers.add(EsmRuntimeHelper.enumAsNameMap);
        return EsmCallIr(
          callee: runtimeHelpers.reference(EsmRuntimeHelper.enumAsNameMap),
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
      default:
        return null;
    }
  }

  EsmExpressionIr? _lowerCoreErrorStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      return null;
    }
    final target = kernelReferencePath(expression.targetReference);
    if (target == 'dart:core::Error::@methods::safeToString' &&
        expression.arguments.positional.length == 1) {
      helpers.add(EsmRuntimeHelper.safeToString);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.safeToString),
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
    if (target == 'dart:core::Error::@methods::throwWithStackTrace' &&
        expression.arguments.positional.length == 2) {
      helpers.add(EsmRuntimeHelper.throwWithStackTrace);
      return EsmCallIr(
        callee: runtimeHelpers.reference(EsmRuntimeHelper.throwWithStackTrace),
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
    return null;
  }

  EsmExpressionIr _lowerCoreIdentical(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.positional.length != 2 ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(expression, 'identical argument shape');
    }
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('Object'),
        property: 'is',
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

  EsmExpressionIr _lowerCorePrint(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (expression.arguments.positional.length != 1 ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(expression, 'print argument shape');
    }
    helpers.add(EsmRuntimeHelper.print);
    final argument = expression.arguments.positional.single;
    final loweredArgument = _lowerExpression(
      world,
      helpers,
      locals,
      argument,
      thisExpression: thisExpression,
    );
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.print),
      arguments: [loweredArgument],
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

  EsmExpressionIr _lowerCoreFunctionApply(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    final positional = expression.arguments.positional;
    if (positional.length < 2 ||
        positional.length > 3 ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(expression, 'Function.apply argument shape');
    }
    helpers.add(EsmRuntimeHelper.functionApply);
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.functionApply),
      arguments: [
        for (final argument in positional)
          _lowerExpression(
            world,
            helpers,
            locals,
            argument,
            thisExpression: thisExpression,
          ),
        if (positional.length == 2) const EsmNullLiteralIr(),
      ],
    );
  }

  bool _isCoreFunctionApply(k.Reference reference) {
    return reference.toStringInternal() ==
        'dart:core::Function::@methods::apply';
  }

  bool _isCoreIdentical(k.Reference reference) {
    return reference.toStringInternal() == 'dart:core::@methods::identical';
  }

  bool _isCorePrint(k.Reference reference) {
    return reference.toStringInternal() == 'dart:core::@methods::print';
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
    throw NewCompilerUnsupported(member, 'instance member lowering');
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
      throw NewCompilerUnsupported(expression, 'unbound variable get');
    }
    return EsmIdentifierIr(name);
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

const _binaryOperators = {'+', '-', '*', '/', '%', '<', '<=', '>', '>='};
