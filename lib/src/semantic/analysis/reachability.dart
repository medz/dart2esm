import 'dart:collection';

import 'package:dart2esm/src/third_party/kernel/kernel.dart' as k;

import '../model/program_roots.dart';

EsmProgramPlan computeEsmProgramPlan(
  k.Component component, {
  required k.Procedure main,
  required Map<k.Library, Set<String>> exportNamesByLibrary,
  required EmittableTopLevelProcedurePredicate isEmittableTopLevelProcedure,
  bool treeShakeMembers = false,
}) {
  return _EsmReachability(
    component,
    main: main,
    exportNamesByLibrary: exportNamesByLibrary,
    isEmittableTopLevelProcedure: isEmittableTopLevelProcedure,
    treeShakeMembers: treeShakeMembers,
  ).compute();
}

final class EsmProgramPlan {
  const EsmProgramPlan({
    required this.libraries,
    required this.classes,
    required this.extensionTypes,
    required this.topLevelFields,
    required this.topLevelProcedures,
    this.constructors = const {},
    this.instanceFields = const {},
    this.staticFields = const {},
    this.instanceProcedures = const {},
    this.staticProcedures = const {},
    this.constructorTearOffTargets = const {},
  });

  final Set<k.Library> libraries;
  final Set<k.Class> classes;
  final Set<k.ExtensionTypeDeclaration> extensionTypes;
  final Set<k.Field> topLevelFields;
  final Set<k.Procedure> topLevelProcedures;
  final Set<k.Constructor> constructors;
  final Set<k.Field> instanceFields;
  final Set<k.Field> staticFields;
  final Set<k.Procedure> instanceProcedures;
  final Set<k.Procedure> staticProcedures;
  final Set<k.Member> constructorTearOffTargets;
}

final class _EsmReachability {
  _EsmReachability(
    this.component, {
    required this.main,
    required this.exportNamesByLibrary,
    required this.isEmittableTopLevelProcedure,
    required this.treeShakeMembers,
  });

  final k.Component component;
  final k.Procedure main;
  final Map<k.Library, Set<String>> exportNamesByLibrary;
  final EmittableTopLevelProcedurePredicate isEmittableTopLevelProcedure;
  final bool treeShakeMembers;

  final _libraries = <k.Library>{};
  final _classes = <k.Class>{};
  final _extensionTypes = <k.ExtensionTypeDeclaration>{};
  final _topLevelFields = <k.Field>{};
  final _topLevelProcedures = <k.Procedure>{};
  final _constructors = <k.Constructor>{};
  final _instanceFields = <k.Field>{};
  final _staticFields = <k.Field>{};
  final _instanceProcedures = <k.Procedure>{};
  final _staticProcedures = <k.Procedure>{};
  final _constructorTearOffTargets = <k.Member>{};
  final _extensionTypeByMember = <k.Member, k.ExtensionTypeDeclaration>{};
  final _instanceSelectors = <_InstanceSelector>{};
  final _markedTypes = HashSet<k.DartType>.identity();
  final _pendingNodes = <k.TreeNode>[];
  final _queuedNodes = <k.TreeNode>{};

  late final _visitor = _ReachabilityVisitor(this);

  EsmProgramPlan compute() {
    _indexExtensionTypeMembers();
    _markProcedure(main);

    for (final entry in exportNamesByLibrary.entries) {
      _markExportedDeclarations(entry.key, entry.value);
    }

    _drain();
    return EsmProgramPlan(
      libraries: Set.unmodifiable(_libraries),
      classes: Set.unmodifiable(_classes),
      extensionTypes: Set.unmodifiable(_extensionTypes),
      topLevelFields: Set.unmodifiable(_topLevelFields),
      topLevelProcedures: Set.unmodifiable(_topLevelProcedures),
      constructors: Set.unmodifiable(_constructors),
      instanceFields: Set.unmodifiable(_instanceFields),
      staticFields: Set.unmodifiable(_staticFields),
      instanceProcedures: Set.unmodifiable(_instanceProcedures),
      staticProcedures: Set.unmodifiable(_staticProcedures),
      constructorTearOffTargets: Set.unmodifiable(_constructorTearOffTargets),
    );
  }

  void _indexExtensionTypeMembers() {
    for (final library in component.libraries) {
      for (final declaration in library.extensionTypeDeclarations) {
        for (final descriptor in declaration.memberDescriptors) {
          final member = descriptor.memberReference?.asMember;
          if (member != null) {
            _extensionTypeByMember[member] = declaration;
          }
          final tearOff = descriptor.tearOffReference?.asMember;
          if (tearOff != null) {
            _extensionTypeByMember[tearOff] = declaration;
          }
        }
      }
    }
  }

  void _markExportedDeclarations(k.Library library, Set<String> names) {
    if (names.isEmpty || !_isEmittableLibrary(library)) {
      return;
    }
    for (final klass in library.classes) {
      if (names.contains(klass.name)) {
        _markClass(klass);
      }
    }
    for (final declaration in library.extensionTypeDeclarations) {
      if (names.contains(declaration.name)) {
        _markExtensionType(declaration);
      }
    }
    for (final field in library.fields) {
      if (!field.isExtensionTypeMember && names.contains(field.name.text)) {
        _markField(field);
      }
    }
    for (final procedure in library.procedures) {
      if (procedure.kind != k.ProcedureKind.Setter &&
          isEmittableTopLevelProcedure(procedure) &&
          names.contains(procedure.name.text)) {
        _markProcedure(procedure);
      }
    }
  }

  void _drain() {
    var index = 0;
    while (index < _pendingNodes.length) {
      _pendingNodes[index++].accept(_visitor);
    }
  }

  bool _isEmittableLibrary(k.Library library) {
    return identical(library, main.enclosingLibrary) ||
        library.importUri.scheme != 'dart';
  }

  void _markLibrary(k.Library library) {
    if (_isEmittableLibrary(library)) {
      _libraries.add(library);
    }
  }

  void _enqueueNode(k.TreeNode? node) {
    if (node != null && _queuedNodes.add(node)) {
      _pendingNodes.add(node);
    }
  }

  void _markMember(k.Member member) {
    switch (member) {
      case k.Procedure():
        _markProcedure(member);
      case k.Constructor():
        _markConstructor(member);
      case k.Field():
        _markField(member);
    }
  }

  void _markProcedure(k.Procedure procedure) {
    final extensionType = _extensionTypeByMember[procedure];
    if (extensionType != null) {
      _markExtensionType(extensionType);
      return;
    }
    final klass = procedure.enclosingClass;
    if (klass != null) {
      if (procedure.isStatic) {
        _markStaticProcedure(procedure);
      } else {
        _markInstanceProcedure(procedure);
      }
      return;
    }
    if (!isEmittableTopLevelProcedure(procedure) ||
        !_isEmittableLibrary(procedure.enclosingLibrary)) {
      return;
    }
    if (_topLevelProcedures.add(procedure)) {
      _markLibrary(procedure.enclosingLibrary);
      _markFunctionTypes(procedure.function);
      _enqueueNode(procedure.function);
    }
  }

  void _markField(k.Field field) {
    final extensionType = _extensionTypeByMember[field];
    if (extensionType != null) {
      _markExtensionType(extensionType);
      return;
    }
    final klass = field.enclosingClass;
    if (klass != null) {
      if (field.isStatic) {
        _markStaticField(field);
      } else {
        _markInstanceField(field);
      }
      return;
    }
    if (!_isEmittableLibrary(field.enclosingLibrary)) {
      return;
    }
    if (_topLevelFields.add(field)) {
      _markLibrary(field.enclosingLibrary);
      _enqueueNode(field.initializer);
      final initializer = field.initializer;
      if (initializer is k.ConstantExpression) {
        _markConstant(initializer.constant);
      }
    }
  }

  void _markClass(k.Class klass) {
    if (!_isEmittableLibrary(klass.enclosingLibrary)) {
      return;
    }
    if (!_classes.add(klass)) {
      return;
    }
    _markLibrary(klass.enclosingLibrary);
    _markSupertype(klass.supertype);
    _markSupertype(klass.mixedInType);
    for (final supertype in klass.implementedTypes) {
      _markSupertype(supertype);
    }
    if (!treeShakeMembers || _isExportedClass(klass)) {
      _markAllClassMembers(klass);
      return;
    }
    _applyInstanceSelectors(klass);
  }

  bool _isExportedClass(k.Class klass) {
    return exportNamesByLibrary[klass.enclosingLibrary]?.contains(klass.name) ??
        false;
  }

  void _markAllClassMembers(k.Class klass) {
    for (final field in klass.fields) {
      field.isStatic ? _markStaticField(field) : _markInstanceField(field);
    }
    for (final constructor in klass.constructors) {
      _markConstructor(constructor);
    }
    for (final procedure in klass.procedures) {
      procedure.isStatic
          ? _markStaticProcedure(procedure)
          : _markInstanceProcedure(procedure);
    }
  }

  void _markConstructor(k.Constructor constructor) {
    final klass = constructor.enclosingClass;
    _markClass(klass);
    if (constructor.isExternal || !_constructors.add(constructor)) return;
    _markInstantiatedClass(klass);
    _markFunctionTypes(constructor.function);
    _enqueueNode(constructor);
  }

  void _markInstantiatedClass(k.Class klass) {
    _markClass(klass);
    for (final field in klass.fields) {
      if (!field.isStatic) _markInstanceField(field);
    }
  }

  void _markInstanceField(k.Field field) {
    _markClass(field.enclosingClass!);
    if (field.isExternal || !_instanceFields.add(field)) return;
    _markType(field.type);
    _enqueueNode(field.initializer);
    final initializer = field.initializer;
    if (initializer is k.ConstantExpression) {
      _markConstant(initializer.constant);
    }
  }

  void _markStaticField(k.Field field) {
    _markClass(field.enclosingClass!);
    if (field.isExternal || !_staticFields.add(field)) return;
    _markType(field.type);
    _enqueueNode(field.initializer);
    final initializer = field.initializer;
    if (initializer is k.ConstantExpression) {
      _markConstant(initializer.constant);
    }
  }

  void _markInstanceProcedure(k.Procedure procedure) {
    _markClass(procedure.enclosingClass!);
    if (procedure.isExternal || !_instanceProcedures.add(procedure)) return;
    _markFunctionTypes(procedure.function);
    if (procedure.isNoSuchMethodForwarder) {
      _markInstanceSelector(k.Name('noSuchMethod'), _InstanceSelectorKind.call);
    }
    if (!procedure.isAbstract && !procedure.isNoSuchMethodForwarder) {
      _enqueueNode(procedure.function);
    }
  }

  void _markStaticProcedure(k.Procedure procedure) {
    _markClass(procedure.enclosingClass!);
    if (procedure.isExternal || !_staticProcedures.add(procedure)) return;
    _markFunctionTypes(procedure.function);
    if (!procedure.isAbstract && !procedure.isNoSuchMethodForwarder) {
      _enqueueNode(procedure.function);
    }
  }

  void _markInstanceSelector(k.Name name, _InstanceSelectorKind kind) {
    final selector = (name: _selectorName(name), kind: kind);
    if (!_instanceSelectors.add(selector)) return;
    for (final klass in _classes.toList(growable: false)) {
      _applyInstanceSelector(klass, selector);
    }
  }

  void _applyInstanceSelectors(k.Class klass) {
    for (final selector in _instanceSelectors) {
      _applyInstanceSelector(klass, selector);
    }
  }

  void _applyInstanceSelector(k.Class klass, _InstanceSelector selector) {
    for (final field in klass.fields) {
      if (field.isStatic || _selectorName(field.name) != selector.name) {
        continue;
      }
      if (selector.kind != _InstanceSelectorKind.set || field.hasSetter) {
        _markInstanceField(field);
      }
    }
    for (final procedure in klass.procedures) {
      if (procedure.isStatic ||
          _selectorName(procedure.name) != selector.name) {
        continue;
      }
      if (_procedureMatchesSelector(procedure, selector.kind)) {
        _markInstanceProcedure(procedure);
      }
    }
  }

  void _markFunctionTypes(k.FunctionNode function) {
    _markType(function.returnType);
    for (final parameter in function.positionalParameters) {
      _markType(parameter.type);
    }
    for (final parameter in function.namedParameters) {
      _markType(parameter.type);
    }
    for (final parameter in function.typeParameters) {
      _markType(parameter.bound);
    }
  }

  void _markExtensionType(k.ExtensionTypeDeclaration declaration) {
    if (!_isEmittableLibrary(declaration.enclosingLibrary)) {
      return;
    }
    if (!_extensionTypes.add(declaration)) {
      return;
    }
    _markLibrary(declaration.enclosingLibrary);
    _markType(declaration.declaredRepresentationType);
    for (final descriptor in declaration.memberDescriptors) {
      final member = descriptor.memberReference?.asMember;
      if (member is k.Procedure && !member.isExternal) {
        _markFunctionTypes(member.function);
        _enqueueNode(member.function);
      } else if (member is k.Field) {
        _markType(member.type);
        _enqueueNode(member.initializer);
        final initializer = member.initializer;
        if (initializer is k.ConstantExpression) {
          _markConstant(initializer.constant);
        }
      }
      final tearOff = descriptor.tearOffReference?.asMember;
      if (tearOff is k.Procedure && !tearOff.isExternal) {
        _markFunctionTypes(tearOff.function);
        _enqueueNode(tearOff.function);
      }
    }
  }

  void _markSupertype(k.Supertype? supertype) {
    if (supertype == null) {
      return;
    }
    final node = supertype.className.node;
    if (node is k.Class) {
      _markClass(node);
    }
    for (final argument in supertype.typeArguments) {
      _markType(argument);
    }
  }

  void _markType(k.DartType type) {
    type = type.unalias;
    if (!_markedTypes.add(type)) return;
    switch (type) {
      case k.InterfaceType():
        final node = type.classReference.node;
        if (node is k.Class) {
          _markClass(node);
        }
        for (final argument in type.typeArguments) {
          _markType(argument);
        }
      case k.ExtensionType():
        _markExtensionType(type.extensionTypeDeclaration);
        _markType(type.extensionTypeErasure);
        for (final argument in type.typeArguments) {
          _markType(argument);
        }
      case k.FutureOrType():
        _markType(type.typeArgument);
      case k.FunctionType():
        _markType(type.returnType);
        for (final parameter in type.positionalParameters) {
          _markType(parameter);
        }
        for (final parameter in type.namedParameters) {
          _markType(parameter.type);
        }
        for (final parameter in type.typeParameters) {
          _markType(parameter.bound);
        }
      case k.RecordType():
        for (final field in type.positional) {
          _markType(field);
        }
        for (final field in type.named) {
          _markType(field.type);
        }
      case k.TypeParameterType():
        _markType(type.bound);
      case k.TypedefType():
        for (final argument in type.typeArguments) {
          _markType(argument);
        }
      case k.NullType() ||
          k.NeverType() ||
          k.DynamicType() ||
          k.VoidType() ||
          k.InvalidType():
        break;
      default:
        break;
    }
  }

  void _markConstant(k.Constant constant) {
    switch (constant) {
      case k.TypeLiteralConstant():
        _markType(constant.type);
      case k.InstanceConstant():
        final node = constant.classReference.node;
        if (node is k.Class) {
          _markInstantiatedClass(node);
        }
        for (final argument in constant.typeArguments) {
          _markType(argument);
        }
        for (final entry in constant.fieldValues.entries) {
          final field = entry.key.node;
          if (field is k.Field && field.enclosingClass != null) {
            _markInstanceField(field);
          }
          _markConstant(entry.value);
        }
      case k.RecordConstant():
        for (final value in constant.positional) {
          _markConstant(value);
        }
        for (final value in constant.named.values) {
          _markConstant(value);
        }
      case k.StaticTearOffConstant():
        final target = constant.targetReference.node;
        if (target is k.Procedure) {
          _markProcedure(target);
        }
      case k.ConstructorTearOffConstant():
        final target = constant.targetReference.node;
        if (target is k.Member) {
          _constructorTearOffTargets.add(target);
          _markMember(target);
        }
      case k.RedirectingFactoryTearOffConstant():
        final target = constant.targetReference.node;
        if (target is k.Member) {
          _constructorTearOffTargets.add(target);
          _markMember(target);
        }
      case k.InstantiationConstant():
        _markConstant(constant.tearOffConstant);
      case k.TypedefTearOffConstant():
        _markConstant(constant.tearOffConstant);
      case k.ListConstant():
        _markType(constant.typeArgument);
        for (final value in constant.entries) {
          _markConstant(value);
        }
      case k.SetConstant():
        _markType(constant.typeArgument);
        for (final value in constant.entries) {
          _markConstant(value);
        }
      case k.MapConstant():
        _markType(constant.keyType);
        _markType(constant.valueType);
        for (final entry in constant.entries) {
          _markConstant(entry.key);
          _markConstant(entry.value);
        }
      case k.UnevaluatedConstant():
        _enqueueNode(constant.expression);
      case k.NullConstant() ||
          k.BoolConstant() ||
          k.IntConstant() ||
          k.DoubleConstant() ||
          k.StringConstant() ||
          k.SymbolConstant() ||
          k.AuxiliaryConstant():
        break;
      default:
        break;
    }
  }
}

enum _InstanceSelectorKind { get, set, call }

typedef _InstanceSelector = ({
  _InstanceSelectorName name,
  _InstanceSelectorKind kind,
});

typedef _InstanceSelectorName = ({String text, String? library});

_InstanceSelectorName _selectorName(k.Name name) {
  return (
    text: name.text,
    library: name.isPrivate
        ? name.libraryReference?.canonicalName.toString()
        : null,
  );
}

bool _procedureMatchesSelector(
  k.Procedure procedure,
  _InstanceSelectorKind selector,
) {
  return switch (selector) {
    _InstanceSelectorKind.get =>
      procedure.kind == k.ProcedureKind.Getter ||
          procedure.kind == k.ProcedureKind.Method ||
          procedure.kind == k.ProcedureKind.Operator,
    _InstanceSelectorKind.set => procedure.kind == k.ProcedureKind.Setter,
    _InstanceSelectorKind.call =>
      procedure.kind == k.ProcedureKind.Method ||
          procedure.kind == k.ProcedureKind.Operator ||
          procedure.kind == k.ProcedureKind.Getter,
  };
}

final class _ReachabilityVisitor extends k.RecursiveVisitor {
  _ReachabilityVisitor(this.reachability);

  final _EsmReachability reachability;

  @override
  void defaultDartType(k.DartType node) {}

  @override
  void visitStaticInvocation(k.StaticInvocation node) {
    final target = node.targetReference.node;
    if (target is k.Member) {
      reachability._markMember(target);
    }
    _visitArguments(node.arguments);
  }

  @override
  void visitConstructorInvocation(k.ConstructorInvocation node) {
    final target = node.targetReference.node;
    if (target is k.Member) {
      reachability._markMember(target);
    }
    _visitArguments(node.arguments);
  }

  @override
  void visitInstanceCreation(k.InstanceCreation node) {
    final target = node.classReference.node;
    if (target is k.Class) {
      reachability._markInstantiatedClass(target);
    }
    for (final entry in node.fieldValues.entries) {
      final field = entry.key.node;
      if (field is k.Field && field.enclosingClass != null) {
        reachability._markInstanceField(field);
      }
      entry.value.accept(this);
    }
    for (final assertStatement in node.asserts) {
      assertStatement.accept(this);
    }
  }

  @override
  void visitStaticGet(k.StaticGet node) {
    final target = node.targetReference.node;
    if (target is k.Member) {
      reachability._markMember(target);
    }
  }

  @override
  void visitStaticSet(k.StaticSet node) {
    final target = node.targetReference.node;
    if (target is k.Member) {
      reachability._markMember(target);
    }
    node.value.accept(this);
  }

  @override
  void visitStaticTearOff(k.StaticTearOff node) {
    final target = node.targetReference.node;
    if (target is k.Member) {
      reachability._markMember(target);
    }
  }

  @override
  void visitConstructorTearOff(k.ConstructorTearOff node) {
    reachability._constructorTearOffTargets.add(node.target);
    reachability._markMember(node.target);
  }

  @override
  void visitRedirectingFactoryTearOff(k.RedirectingFactoryTearOff node) {
    reachability._constructorTearOffTargets.add(node.target);
    reachability._markMember(node.target);
  }

  @override
  void visitConstantExpression(k.ConstantExpression node) {
    reachability._markConstant(node.constant);
  }

  @override
  void visitIsExpression(k.IsExpression node) {
    reachability._markType(node.type);
    node.operand.accept(this);
  }

  @override
  void visitAsExpression(k.AsExpression node) {
    reachability._markType(node.type);
    node.operand.accept(this);
  }

  @override
  void visitTypeLiteral(k.TypeLiteral node) {
    reachability._markType(node.type);
  }

  @override
  void visitInstanceInvocation(k.InstanceInvocation node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Procedure) reachability._markInstanceProcedure(target);
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.call);
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitInstanceGetterInvocation(k.InstanceGetterInvocation node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Member) reachability._markMember(target);
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.get);
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitInstanceGet(k.InstanceGet node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Member) reachability._markMember(target);
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.get);
    node.receiver.accept(this);
  }

  @override
  void visitInstanceSet(k.InstanceSet node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Member) reachability._markMember(target);
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.set);
    node.receiver.accept(this);
    node.value.accept(this);
  }

  @override
  void visitInstanceTearOff(k.InstanceTearOff node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Procedure) reachability._markInstanceProcedure(target);
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.call);
    node.receiver.accept(this);
  }

  @override
  void visitSuperMethodInvocation(k.SuperMethodInvocation node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Procedure) reachability._markInstanceProcedure(target);
    _visitArguments(node.arguments);
  }

  @override
  void visitAbstractSuperMethodInvocation(
    k.AbstractSuperMethodInvocation node,
  ) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Procedure) reachability._markInstanceProcedure(target);
    _visitArguments(node.arguments);
  }

  @override
  void visitSuperPropertySet(k.SuperPropertySet node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Member) reachability._markMember(target);
    node.value.accept(this);
  }

  @override
  void visitAbstractSuperPropertySet(k.AbstractSuperPropertySet node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Member) reachability._markMember(target);
    node.value.accept(this);
  }

  @override
  void visitSuperPropertyGet(k.SuperPropertyGet node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Member) reachability._markMember(target);
  }

  @override
  void visitAbstractSuperPropertyGet(k.AbstractSuperPropertyGet node) {
    final target = node.interfaceTargetReference.node;
    if (target is k.Member) reachability._markMember(target);
  }

  @override
  void visitEqualsCall(k.EqualsCall node) {
    reachability._markInstanceSelector(
      k.Name.equalsName,
      _InstanceSelectorKind.call,
    );
    node.left.accept(this);
    node.right.accept(this);
  }

  @override
  void visitFunctionInvocation(k.FunctionInvocation node) {
    reachability._markInstanceSelector(
      k.Name.callName,
      _InstanceSelectorKind.call,
    );
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitDynamicInvocation(k.DynamicInvocation node) {
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.call);
    _markNoSuchMethod();
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitDynamicGet(k.DynamicGet node) {
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.get);
    _markNoSuchMethod();
    node.receiver.accept(this);
  }

  @override
  void visitDynamicSet(k.DynamicSet node) {
    reachability._markInstanceSelector(node.name, _InstanceSelectorKind.set);
    _markNoSuchMethod();
    node.receiver.accept(this);
    node.value.accept(this);
  }

  @override
  void visitLocalFunctionInvocation(k.LocalFunctionInvocation node) {
    _visitArguments(node.arguments);
  }

  @override
  void visitRedirectingFactoryInvocation(k.RedirectingFactoryInvocation node) {
    final target = node.redirectingFactoryTargetReference.node;
    if (target is k.Procedure) reachability._markProcedure(target);
    node.expression.accept(this);
  }

  @override
  void visitInstantiation(k.Instantiation node) {
    node.expression.accept(this);
    for (final argument in node.typeArguments) {
      reachability._markType(argument);
    }
  }

  @override
  void visitTypedefTearOff(k.TypedefTearOff node) {
    node.expression.accept(this);
  }

  @override
  void visitFunctionTearOff(k.FunctionTearOff node) {
    node.receiver.accept(this);
  }

  @override
  void visitConstructor(k.Constructor node) {
    for (final initializer in node.initializers) {
      initializer.accept(this);
    }
    node.function.accept(this);
  }

  @override
  void visitFieldInitializer(k.FieldInitializer node) {
    final field = node.fieldReference.node;
    if (field is k.Field) {
      reachability._markField(field);
    }
    node.value.accept(this);
  }

  @override
  void visitLocalInitializer(k.LocalInitializer node) {
    node.variable.accept(this);
  }

  @override
  void visitAssertInitializer(k.AssertInitializer node) {
    node.statement.accept(this);
  }

  @override
  void visitSuperInitializer(k.SuperInitializer node) {
    final target = node.targetReference.node;
    if (target is k.Member) {
      reachability._markMember(target);
    }
    _visitArguments(node.arguments);
  }

  @override
  void visitRedirectingInitializer(k.RedirectingInitializer node) {
    final target = node.targetReference.node;
    if (target is k.Member) {
      reachability._markMember(target);
    }
    _visitArguments(node.arguments);
  }

  void _visitArguments(k.Arguments arguments) {
    for (final positional in arguments.positional) {
      positional.accept(this);
    }
    for (final named in arguments.named) {
      named.value.accept(this);
    }
    for (final type in arguments.types) {
      reachability._markType(type);
    }
  }

  void _markNoSuchMethod() {
    reachability._markInstanceSelector(
      k.Name('noSuchMethod'),
      _InstanceSelectorKind.call,
    );
  }
}
