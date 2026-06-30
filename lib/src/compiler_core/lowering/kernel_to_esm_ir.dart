import 'package:kernel/kernel.dart' as k;

import '../../names/js_names.dart';
import '../ir/esm_ir.dart';
import '../new_compiler_unsupported.dart';
import '../runtime/runtime_helpers.dart';
import '../semantic/semantic_world.dart';

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

final class KernelToEsmIrLoweringStage {
  const KernelToEsmIrLoweringStage({
    this.runtimeHelpers = const EsmRuntimeHelperRegistry(),
  });

  final EsmRuntimeHelperRegistry runtimeHelpers;

  LoweringResult lower(SemanticWorldResult semantic, {required bool runMain}) {
    final world = semantic.world;
    final helpers = EsmRuntimeHelperUseSet();
    final items = <EsmModuleItemIr>[
      for (final klass in world.classes)
        ..._lowerClassItems(world, helpers, klass),
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
      runtimeHelpers: helpers.toList(),
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
      _lowerClass(world, helpers, klass),
      for (final field in klass.staticFields)
        ..._lowerStaticFieldItems(world, helpers, klass, field),
      if (markerName != null) _lowerInterfaceHasInstance(klass, markerName),
    ];
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
    EsmExpressionIr thisExpression,
  ) {
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
    EsmExpressionIr thisExpression,
  ) {
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
            ),
    );
  }

  EsmWhileStatementIr _lowerWhileStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.WhileStatement statement,
    EsmExpressionIr thisExpression,
  ) {
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
      ),
    );
  }

  EsmDoStatementIr _lowerDoStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.DoStatement statement,
    EsmExpressionIr thisExpression,
  ) {
    return EsmDoStatementIr(
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.body,
        thisExpression: thisExpression,
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
    EsmExpressionIr thisExpression,
  ) {
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
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        switchCase.body,
        thisExpression: thisExpression,
      ),
    );
  }

  EsmForStatementIr _lowerForStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.ForStatement statement,
    EsmExpressionIr thisExpression,
  ) {
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
      ),
    );
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
      mutable: statement.isAssignable,
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
      k.ConstantExpression() => _lowerConstantExpression(world, expression),
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
      k.StringConcatenation() => EsmStringConcatenationIr([
        for (final part in expression.expressions)
          _lowerExpression(
            world,
            helpers,
            locals,
            part,
            thisExpression: thisExpression,
          ),
      ]),
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
      k.SymbolLiteral() => EsmCallIr(
        callee: const EsmIdentifierIr('Symbol'),
        arguments: [EsmStringLiteralIr(expression.value)],
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
    k.ConstantExpression expression,
  ) {
    final constant = expression.constant;
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
      return EsmCallIr(
        callee: const EsmIdentifierIr('Symbol'),
        arguments: [EsmStringLiteralIr(constant.name)],
      );
    }
    if (constant is k.StaticTearOffConstant) {
      final target = constant.targetReference.node;
      if (target is k.Procedure) {
        final symbol = world.symbolFor(target);
        if (symbol != null && symbol.kind == EsmProcedureKind.method) {
          return EsmIdentifierIr(symbol.name);
        }
      }
    }
    throw NewCompilerUnsupported(expression, 'constant expression lowering');
  }

  EsmExpressionIr _lowerStaticGet(
    EsmSemanticWorld world,
    k.StaticGet expression,
  ) {
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
    if (target is k.Procedure) {
      final symbol = world.symbolFor(target);
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
      final staticSymbol = world.staticProcedureSymbolFor(target);
      if (target.enclosingClass case final enclosingClass?) {
        final klass = world.classSymbolFor(enclosingClass);
        if (staticSymbol != null && klass != null) {
          return switch (staticSymbol.kind) {
            EsmProcedureKind.method => EsmPropertyAccessIr(
              receiver: EsmIdentifierIr(klass.name),
              property: staticSymbol.name,
            ),
            EsmProcedureKind.getter => EsmPropertyAccessIr(
              receiver: EsmIdentifierIr(klass.name),
              property: staticSymbol.name,
            ),
            EsmProcedureKind.setter => throw NewCompilerUnsupported(
              expression,
              'static setter get lowering',
            ),
          };
        }
      }
    }
    throw NewCompilerUnsupported(expression, 'static get lowering');
  }

  EsmExpressionIr _lowerStaticSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
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
      final target = expression.interfaceTargetReference.node;
      if (target is k.Procedure) {
        final symbol = world.instanceProcedureSymbolFor(target);
        if (symbol != null && symbol.kind == EsmProcedureKind.method) {
          return EsmCallIr(
            callee: EsmPropertyAccessIr(
              receiver: _lowerExpression(
                world,
                helpers,
                locals,
                expression.receiver,
                thisExpression: thisExpression,
              ),
              property: symbol.name,
            ),
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
    final target = expression.interfaceTargetReference.toStringInternal();
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
    if (target == 'dart:core::int::@methods::~') {
      return EsmUnaryIr(operator: '~', operand: receiver);
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

  EsmExpressionIr _lowerInstanceGet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceGet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
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

  EsmExpressionIr _lowerInstanceSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceSet expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
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
    final sdkConstructor = _lowerSdkConstructorInvocation(expression);
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
    k.ConstructorInvocation expression,
  ) {
    if (expression.arguments.positional.isNotEmpty ||
        expression.arguments.named.isNotEmpty) {
      return null;
    }
    return switch (expression.targetReference.toStringInternal()) {
      'dart:_compact_hash::_Set::@constructors::' => EsmNewIr(
        callee: const EsmIdentifierIr('Set'),
        arguments: const [],
      ),
      _ => null,
    };
  }

  bool _isSyntheticDefaultConstructor(k.Constructor constructor) {
    return constructor.isSynthetic && constructor.name.text.isEmpty;
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
    final targetNode = expression.targetReference.node;
    if (targetNode is! k.Procedure) {
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
      throw NewCompilerUnsupported(
        expression.targetReference,
        'external static target',
      );
    }
    final target = world.symbolFor(targetNode);
    if (target != null) {
      if (target.kind != EsmProcedureKind.method) {
        throw NewCompilerUnsupported(expression.target, 'static accessor call');
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
    final staticTarget = world.staticProcedureSymbolFor(targetNode);
    if (targetNode.enclosingClass case final enclosingClass?) {
      final klass = world.classSymbolFor(enclosingClass);
      if (staticTarget != null &&
          klass != null &&
          staticTarget.kind == EsmProcedureKind.method) {
        return EsmCallIr(
          callee: EsmPropertyAccessIr(
            receiver: EsmIdentifierIr(klass.name),
            property: staticTarget.name,
          ),
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
    }
    throw NewCompilerUnsupported(expression.target, 'external static target');
  }

  EsmExpressionIr? _lowerRuntimeStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression, {
    EsmExpressionIr thisExpression = const EsmThisIr(),
  }) {
    if (_isCoreFunctionApply(expression.targetReference)) {
      return _lowerCoreFunctionApply(
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
    return EsmCallIr(
      callee: runtimeHelpers.reference(EsmRuntimeHelper.print),
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
