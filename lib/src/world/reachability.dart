import 'package:kernel/kernel.dart' as k;

typedef EmittableTopLevelProcedurePredicate =
    bool Function(k.Procedure procedure);

EsmProgramPlan computeEsmProgramPlan(
  k.Component component, {
  required k.Procedure main,
  required Map<k.Library, Set<String>> exportNamesByLibrary,
  required EmittableTopLevelProcedurePredicate isEmittableTopLevelProcedure,
}) {
  return _EsmReachability(
    component,
    main: main,
    exportNamesByLibrary: exportNamesByLibrary,
    isEmittableTopLevelProcedure: isEmittableTopLevelProcedure,
  ).compute();
}

final class EsmProgramPlan {
  const EsmProgramPlan({
    required this.libraries,
    required this.classes,
    required this.extensionTypes,
    required this.topLevelFields,
    required this.topLevelProcedures,
  });

  final Set<k.Library> libraries;
  final Set<k.Class> classes;
  final Set<k.ExtensionTypeDeclaration> extensionTypes;
  final Set<k.Field> topLevelFields;
  final Set<k.Procedure> topLevelProcedures;
}

final class _EsmReachability {
  _EsmReachability(
    this.component, {
    required this.main,
    required this.exportNamesByLibrary,
    required this.isEmittableTopLevelProcedure,
  });

  final k.Component component;
  final k.Procedure main;
  final Map<k.Library, Set<String>> exportNamesByLibrary;
  final EmittableTopLevelProcedurePredicate isEmittableTopLevelProcedure;

  final _libraries = <k.Library>{};
  final _classes = <k.Class>{};
  final _extensionTypes = <k.ExtensionTypeDeclaration>{};
  final _topLevelFields = <k.Field>{};
  final _topLevelProcedures = <k.Procedure>{};
  final _extensionTypeByMember = <k.Member, k.ExtensionTypeDeclaration>{};
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
        _markClass(member.enclosingClass);
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
      _markClass(klass);
      return;
    }
    if (!isEmittableTopLevelProcedure(procedure) ||
        !_isEmittableLibrary(procedure.enclosingLibrary)) {
      return;
    }
    if (_topLevelProcedures.add(procedure)) {
      _markLibrary(procedure.enclosingLibrary);
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
      _markClass(klass);
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
    for (final field in klass.fields) {
      _markType(field.type);
      _enqueueNode(field.initializer);
      final initializer = field.initializer;
      if (initializer is k.ConstantExpression) {
        _markConstant(initializer.constant);
      }
    }
    for (final constructor in klass.constructors) {
      if (!constructor.isExternal) {
        _enqueueNode(constructor);
      }
    }
    for (final procedure in klass.procedures) {
      if (!procedure.isExternal &&
          !procedure.isAbstract &&
          !procedure.isNoSuchMethodForwarder) {
        _enqueueNode(procedure.function);
      }
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
          _markClass(node);
        }
        for (final argument in constant.typeArguments) {
          _markType(argument);
        }
        for (final value in constant.fieldValues.values) {
          _markConstant(value);
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
          _markMember(target);
        }
      case k.RedirectingFactoryTearOffConstant():
        final target = constant.targetReference.node;
        if (target is k.Member) {
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
      reachability._markClass(target);
    }
    for (final value in node.fieldValues.values) {
      value.accept(this);
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
    reachability._markMember(node.target);
  }

  @override
  void visitRedirectingFactoryTearOff(k.RedirectingFactoryTearOff node) {
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
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitInstanceGetterInvocation(k.InstanceGetterInvocation node) {
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitInstanceGet(k.InstanceGet node) {
    node.receiver.accept(this);
  }

  @override
  void visitInstanceSet(k.InstanceSet node) {
    node.receiver.accept(this);
    node.value.accept(this);
  }

  @override
  void visitInstanceTearOff(k.InstanceTearOff node) {
    node.receiver.accept(this);
  }

  @override
  void visitSuperMethodInvocation(k.SuperMethodInvocation node) {
    _visitArguments(node.arguments);
  }

  @override
  void visitAbstractSuperMethodInvocation(
    k.AbstractSuperMethodInvocation node,
  ) {
    _visitArguments(node.arguments);
  }

  @override
  void visitSuperPropertySet(k.SuperPropertySet node) {
    node.value.accept(this);
  }

  @override
  void visitAbstractSuperPropertySet(k.AbstractSuperPropertySet node) {
    node.value.accept(this);
  }

  @override
  void visitSuperPropertyGet(k.SuperPropertyGet node) {}

  @override
  void visitAbstractSuperPropertyGet(k.AbstractSuperPropertyGet node) {}

  @override
  void visitEqualsCall(k.EqualsCall node) {
    node.left.accept(this);
    node.right.accept(this);
  }

  @override
  void visitFunctionInvocation(k.FunctionInvocation node) {
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitDynamicInvocation(k.DynamicInvocation node) {
    node.receiver.accept(this);
    _visitArguments(node.arguments);
  }

  @override
  void visitDynamicGet(k.DynamicGet node) {
    node.receiver.accept(this);
  }

  @override
  void visitDynamicSet(k.DynamicSet node) {
    node.receiver.accept(this);
    node.value.accept(this);
  }

  @override
  void visitLocalFunctionInvocation(k.LocalFunctionInvocation node) {
    _visitArguments(node.arguments);
  }

  @override
  void visitRedirectingFactoryInvocation(k.RedirectingFactoryInvocation node) {
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
}
