import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import 'model/class_runtime_plan.dart';
import '../../foundation/names/js_names.dart';
import 'model/program_model.dart';
import '../parser/kernel_parser.dart';
import '../unsupported.dart';

final class SemanticResult {
  const SemanticResult({required this.kernel, required this.world});

  final KernelParseResult kernel;
  final EsmSemanticWorld world;
}

final class EsmSemanticWorld {
  EsmSemanticWorld({
    required this.component,
    required this.main,
    required List<EsmClassSymbol> classes,
    required List<EsmExtensionTypeSymbol> extensionTypes,
    required List<EsmFieldSymbol> fields,
    required List<EsmProcedureSymbol> procedures,
  }) : classes = List.unmodifiable(classes),
       extensionTypes = List.unmodifiable(extensionTypes),
       fields = List.unmodifiable(fields),
       procedures = List.unmodifiable(procedures),
       _classSymbols = {for (final klass in classes) klass.node: klass},
       _extensionTypeSymbols = {
         for (final extensionType in extensionTypes)
           extensionType.node: extensionType,
       },
       _extensionTypeMemberSymbolsByReference = {
         for (final extensionType in extensionTypes)
           for (final member in extensionType.members)
             for (final path in _extensionTypeMemberReferencePaths(member))
               path: member,
       },
       _constructorSymbols = {
         for (final klass in classes)
           for (final constructor in klass.constructors)
             constructor.node: constructor,
       },
       _constructorSymbolsByReference = {
         for (final klass in classes)
           for (final constructor in klass.constructors)
             kernelReferencePath(constructor.node.reference): constructor,
       },
       _instanceFieldSymbols = {
         for (final klass in classes)
           for (final field in klass.fields) field.node: field,
       },
       _instanceFieldSymbolsByReference = {
         for (final klass in classes)
           for (final field in klass.fields)
             kernelReferencePath(field.node.fieldReference): field,
       },
       _staticFieldSymbols = {
         for (final klass in classes)
           for (final field in klass.staticFields) field.node: field,
       },
       _instanceProcedureSymbols = {
         for (final klass in classes)
           for (final procedure in klass.procedures) procedure.node: procedure,
       },
       _instanceProcedureSymbolsByReference = {
         for (final klass in classes)
           for (final procedure in klass.procedures)
             kernelReferencePath(procedure.node.reference): procedure,
       },
       _staticProcedureSymbols = {
         for (final klass in classes)
           for (final procedure in klass.staticProcedures)
             procedure.node: procedure,
       },
       _staticProcedureSymbolsByReference = {
         for (final klass in classes)
           for (final procedure in klass.staticProcedures)
             kernelReferencePath(procedure.node.reference): procedure,
       },
       _fieldSymbols = {for (final field in fields) field.node: field},
       _procedureSymbols = {
         for (final procedure in procedures) procedure.node: procedure,
       },
       _procedureSymbolsByReference = {
         for (final procedure in procedures)
           kernelReferencePath(procedure.node.reference): procedure,
       };

  final k.Component component;
  final k.Procedure main;
  final List<EsmClassSymbol> classes;
  final List<EsmExtensionTypeSymbol> extensionTypes;
  final List<EsmFieldSymbol> fields;
  final List<EsmProcedureSymbol> procedures;
  late final Set<String> globalBindingNames = Set.unmodifiable({
    for (final klass in classes) ...[
      klass.name,
      if (klass.interfaceMarkerName case final markerName?) markerName,
    ],
    for (final extensionType in extensionTypes) ...[
      extensionType.name,
      extensionType.representationName,
      for (final member in extensionType.members) member.backingName,
    ],
    for (final field in fields) ...[
      field.name,
      if (field.backingName case final backingName?) backingName,
    ],
    for (final procedure in procedures) procedure.name,
  });
  final Map<k.Class, EsmClassSymbol> _classSymbols;
  final Map<k.ExtensionTypeDeclaration, EsmExtensionTypeSymbol>
  _extensionTypeSymbols;
  final Map<String, EsmExtensionTypeMemberSymbol>
  _extensionTypeMemberSymbolsByReference;
  final Map<k.Constructor, EsmConstructorSymbol> _constructorSymbols;
  final Map<String, EsmConstructorSymbol> _constructorSymbolsByReference;
  final Map<k.Field, EsmInstanceFieldSymbol> _instanceFieldSymbols;
  final Map<String, EsmInstanceFieldSymbol> _instanceFieldSymbolsByReference;
  final Map<k.Field, EsmStaticFieldSymbol> _staticFieldSymbols;
  final Map<k.Procedure, EsmInstanceProcedureSymbol> _instanceProcedureSymbols;
  final Map<String, EsmInstanceProcedureSymbol>
  _instanceProcedureSymbolsByReference;
  final Map<k.Procedure, EsmStaticProcedureSymbol> _staticProcedureSymbols;
  final Map<String, EsmStaticProcedureSymbol>
  _staticProcedureSymbolsByReference;
  final Map<k.Field, EsmFieldSymbol> _fieldSymbols;
  final Map<k.Procedure, EsmProcedureSymbol> _procedureSymbols;
  final Map<String, EsmProcedureSymbol> _procedureSymbolsByReference;

  EsmClassSymbol? classSymbolFor(k.Class klass) {
    return _classSymbols[klass];
  }

  EsmExtensionTypeSymbol? extensionTypeSymbolFor(
    k.ExtensionTypeDeclaration declaration,
  ) {
    return _extensionTypeSymbols[declaration];
  }

  EsmExtensionTypeMemberSymbol? extensionTypeMemberSymbolForReference(
    k.Reference reference,
  ) {
    return _extensionTypeMemberSymbolsByReference[kernelReferencePath(
      reference,
    )];
  }

  EsmConstructorSymbol? constructorSymbolFor(k.Constructor constructor) {
    return _constructorSymbols[constructor];
  }

  EsmConstructorSymbol? constructorSymbolForReference(k.Reference reference) {
    return _constructorSymbolsByReference[kernelReferencePath(reference)];
  }

  EsmInstanceFieldSymbol? instanceFieldSymbolFor(k.Field field) {
    return _instanceFieldSymbols[field];
  }

  EsmInstanceFieldSymbol? instanceFieldSymbolForReference(
    k.Reference reference,
  ) {
    return _instanceFieldSymbolsByReference[kernelReferencePath(reference)];
  }

  EsmStaticFieldSymbol? staticFieldSymbolFor(k.Field field) {
    return _staticFieldSymbols[field];
  }

  EsmInstanceProcedureSymbol? instanceProcedureSymbolFor(
    k.Procedure procedure,
  ) {
    return _instanceProcedureSymbols[procedure];
  }

  EsmInstanceProcedureSymbol? instanceProcedureSymbolForReference(
    k.Reference reference,
  ) {
    return _instanceProcedureSymbolsByReference[kernelReferencePath(reference)];
  }

  EsmStaticProcedureSymbol? staticProcedureSymbolFor(k.Procedure procedure) {
    return _staticProcedureSymbols[procedure];
  }

  EsmStaticProcedureSymbol? staticProcedureSymbolForReference(
    k.Reference reference,
  ) {
    return _staticProcedureSymbolsByReference[kernelReferencePath(reference)];
  }

  EsmFieldSymbol? fieldSymbolFor(k.Field field) {
    return _fieldSymbols[field];
  }

  EsmFieldSymbol fieldSymbolForRequired(k.Field field) {
    final symbol = fieldSymbolFor(field);
    if (symbol == null) {
      throw NewCompilerUnsupported(field, 'unbound field');
    }
    return symbol;
  }

  EsmProcedureSymbol? symbolFor(k.Procedure procedure) {
    return _procedureSymbols[procedure];
  }

  EsmProcedureSymbol? symbolForReference(k.Reference reference) {
    return _procedureSymbolsByReference[kernelReferencePath(reference)];
  }

  EsmProcedureSymbol symbolForRequired(k.Procedure procedure) {
    final symbol = symbolFor(procedure);
    if (symbol == null) {
      throw NewCompilerUnsupported(procedure, 'unbound procedure');
    }
    return symbol;
  }
}

final class EsmClassSymbol {
  EsmClassSymbol({
    required this.node,
    required this.name,
    required this.export,
    required this.interfaceMarkerName,
    required this.jsSuperclass,
    required List<k.Class> interfaceMarkerClasses,
    required List<EsmConstructorSymbol> constructors,
    required List<EsmInstanceFieldSymbol> fields,
    required List<EsmStaticFieldSymbol> staticFields,
    required List<EsmInstanceProcedureSymbol> procedures,
    required List<EsmStaticProcedureSymbol> staticProcedures,
  }) : constructors = List.unmodifiable(constructors),
       interfaceMarkerClasses = List.unmodifiable(interfaceMarkerClasses),
       fields = List.unmodifiable(fields),
       staticFields = List.unmodifiable(staticFields),
       procedures = List.unmodifiable(procedures),
       staticProcedures = List.unmodifiable(staticProcedures);

  final k.Class node;
  final String name;
  final bool export;
  final String? interfaceMarkerName;
  final k.Class? jsSuperclass;
  final List<k.Class> interfaceMarkerClasses;
  final List<EsmConstructorSymbol> constructors;
  final List<EsmInstanceFieldSymbol> fields;
  final List<EsmStaticFieldSymbol> staticFields;
  final List<EsmInstanceProcedureSymbol> procedures;
  final List<EsmStaticProcedureSymbol> staticProcedures;
}

final class EsmExtensionTypeSymbol {
  EsmExtensionTypeSymbol({
    required this.node,
    required this.name,
    required this.export,
    required this.representationName,
    required List<EsmExtensionTypeMemberSymbol> members,
  }) : members = List.unmodifiable(members);

  final k.ExtensionTypeDeclaration node;
  final String name;
  final bool export;
  final String representationName;
  final List<EsmExtensionTypeMemberSymbol> members;
}

final class EsmExtensionTypeMemberSymbol {
  const EsmExtensionTypeMemberSymbol({
    required this.extensionType,
    required this.descriptor,
    required this.name,
    required this.backingName,
    required this.mutable,
  });

  final k.ExtensionTypeDeclaration extensionType;
  final k.ExtensionTypeMemberDescriptor descriptor;
  final String name;
  final String backingName;
  final bool mutable;

  k.Reference? get memberReference => descriptor.memberReference;
  k.Reference? get tearOffReference => descriptor.tearOffReference;
}

Iterable<String> _extensionTypeMemberReferencePaths(
  EsmExtensionTypeMemberSymbol member,
) sync* {
  final memberReference = member.memberReference;
  if (memberReference != null) {
    final path = kernelReferencePath(memberReference);
    yield path;
    if (member.descriptor.kind == k.ExtensionTypeMemberKind.Field) {
      yield path.replaceFirst('::@fields::', '::@getters::');
      if (member.mutable) {
        yield path.replaceFirst('::@fields::', '::@setters::');
      }
    }
  }
  final tearOffReference = member.tearOffReference;
  if (tearOffReference != null) {
    yield kernelReferencePath(tearOffReference);
  }
}

final class EsmConstructorSymbol {
  const EsmConstructorSymbol({required this.node, required this.name});

  final k.Constructor node;
  final String name;
}

final class EsmInstanceFieldSymbol {
  const EsmInstanceFieldSymbol({required this.node, required this.name});

  final k.Field node;
  final String name;
}

final class EsmStaticFieldSymbol {
  const EsmStaticFieldSymbol({
    required this.node,
    required this.name,
    required this.backingName,
    required this.mutable,
  });

  final k.Field node;
  final String name;
  final String backingName;
  final bool mutable;
}

abstract interface class EsmClassProcedureSymbol {
  k.Procedure get node;
  String get name;
  EsmProcedureKind get kind;
}

final class EsmInstanceProcedureSymbol implements EsmClassProcedureSymbol {
  const EsmInstanceProcedureSymbol({
    required this.node,
    required this.name,
    required this.kind,
    this.emit = true,
  });

  final k.Procedure node;
  final String name;
  final EsmProcedureKind kind;
  final bool emit;
}

final class EsmStaticProcedureSymbol implements EsmClassProcedureSymbol {
  const EsmStaticProcedureSymbol({
    required this.node,
    required this.name,
    required this.kind,
  });

  final k.Procedure node;
  final String name;
  final EsmProcedureKind kind;
}

final class EsmFieldSymbol {
  const EsmFieldSymbol({
    required this.node,
    required this.name,
    required this.backingName,
    required this.export,
    required this.mutable,
  });

  final k.Field node;
  final String name;
  final String? backingName;
  final bool export;
  final bool mutable;
}

final class EsmProcedureSymbol {
  const EsmProcedureSymbol({
    required this.node,
    required this.name,
    required this.export,
    required this.kind,
  });

  final k.Procedure node;
  final String name;
  final bool export;
  final EsmProcedureKind kind;
}

enum EsmProcedureKind { method, getter, setter }

final class SemanticBuilder {
  const SemanticBuilder({this.generatedGlobalNames = const {}});

  final Set<String> generatedGlobalNames;

  SemanticResult build(KernelParseResult kernel) {
    final model = buildEsmProgramModel(kernel.component);
    final allocator = JsNameAllocator(
      generatedGlobalNames: generatedGlobalNames,
    );
    final classes = <EsmClassSymbol>[];
    for (final klass in model.module.classes) {
      if (!_isTopLevelClass(klass.node)) {
        continue;
      }
      classes.add(
        _buildClassSymbol(
          allocator,
          klass.node,
          export: klass.export,
          jsSuperclass: _emittableJsSuperclass(
            model.module.classRuntime,
            klass.node,
          ),
          requiresInterfaceMarker: model.module.classRuntime
              .isInterfaceBaseClass(klass.node),
          interfaceMarkerClasses: model.module.classRuntime
              .interfaceMarkersFor(klass.node)
              .toList(growable: false),
        ),
      );
    }
    final extensionTypes = <EsmExtensionTypeSymbol>[];
    for (final library in model.module.libraries) {
      for (final extensionType in library.extensionTypes) {
        extensionTypes.add(
          _buildExtensionTypeSymbol(
            allocator,
            extensionType.node,
            export: extensionType.export,
          ),
        );
      }
    }
    final fields = <EsmFieldSymbol>[];
    for (final library in model.module.libraries) {
      for (final field in library.fields) {
        if (!_isTopLevelField(field.node)) {
          continue;
        }
        fields.add(
          EsmFieldSymbol(
            node: field.node,
            name: allocator.freshGlobal(field.node.name.text),
            backingName: field.node.isLate
                ? allocator.freshGlobal('\$static_${field.node.name.text}')
                : null,
            export: field.export,
            mutable: field.node.hasSetter,
          ),
        );
      }
    }
    final procedures = <EsmProcedureSymbol>[];
    for (final library in model.module.libraries) {
      for (final procedure in library.procedures) {
        final kind = _topLevelProcedureKind(procedure.node);
        if (kind == null) {
          continue;
        }
        procedures.add(
          EsmProcedureSymbol(
            node: procedure.node,
            name: allocator.freshGlobal(procedure.node.name.text),
            export: procedure.export,
            kind: kind,
          ),
        );
      }
    }
    if (!procedures.any(
      (procedure) =>
          procedure.node == kernel.main &&
          procedure.kind == EsmProcedureKind.method,
    )) {
      throw NewCompilerUnsupported(kernel.main, 'entrypoint procedure shape');
    }
    return SemanticResult(
      kernel: kernel,
      world: EsmSemanticWorld(
        component: kernel.component,
        main: model.main,
        classes: classes,
        extensionTypes: extensionTypes,
        fields: fields,
        procedures: procedures,
      ),
    );
  }

  EsmClassSymbol _buildClassSymbol(
    JsNameAllocator allocator,
    k.Class klass, {
    required bool export,
    required k.Class? jsSuperclass,
    required bool requiresInterfaceMarker,
    required List<k.Class> interfaceMarkerClasses,
  }) {
    final usedNames = <String>{};
    final usedStaticNames = <String>{};
    final accessorNames = <String, String>{};
    final staticAccessorNames = <String, String>{};
    final inheritedMixinProcedures = _anonymousMixinApplicationProcedures(
      klass,
    ).toList(growable: false);
    return EsmClassSymbol(
      node: klass,
      name: allocator.freshGlobal(klass.name),
      export: export,
      interfaceMarkerName:
          requiresInterfaceMarker ||
              klass.isAbstract ||
              klass.isInterface ||
              klass.isMixinDeclaration
          ? allocator.freshGlobal('\$${klass.name}_interface')
          : null,
      jsSuperclass: jsSuperclass,
      interfaceMarkerClasses: interfaceMarkerClasses,
      constructors: [
        for (final constructor in klass.constructors)
          if (!constructor.isExternal && !constructor.isSynthetic)
            EsmConstructorSymbol(
              node: constructor,
              name: constructor.name.text.isEmpty
                  ? ''
                  : _freshMemberName(
                      usedStaticNames,
                      _memberJsBaseName(constructor.name),
                    ),
            ),
      ],
      fields: [
        for (final field in klass.fields)
          if (!field.isStatic && !field.isExternal)
            EsmInstanceFieldSymbol(
              node: field,
              name: _freshMemberName(usedNames, _memberJsBaseName(field.name)),
            ),
      ],
      staticFields: [
        for (final field in klass.fields)
          if (field.isStatic && !field.isExternal)
            EsmStaticFieldSymbol(
              node: field,
              name: _freshMemberName(
                usedStaticNames,
                _memberJsBaseName(field.name),
              ),
              backingName: allocator.freshGlobal(
                '\$${klass.name}_${field.name.text}',
              ),
              mutable: field.hasSetter,
            ),
      ],
      procedures: [
        for (final procedure in inheritedMixinProcedures)
          if (_instanceProcedureKind(procedure) case final kind?)
            EsmInstanceProcedureSymbol(
              node: procedure,
              name: _freshProcedureMemberName(
                usedNames,
                accessorNames,
                _memberJsBaseName(procedure.name),
                kind,
              ),
              kind: kind,
              emit: procedure.function.body != null,
            ),
        for (final procedure in klass.procedures)
          if (_instanceProcedureKind(procedure) case final kind?)
            EsmInstanceProcedureSymbol(
              node: procedure,
              name: _freshProcedureMemberName(
                usedNames,
                accessorNames,
                _memberJsBaseName(procedure.name),
                kind,
              ),
              kind: kind,
            ),
      ],
      staticProcedures: [
        for (final procedure in klass.procedures)
          if (_staticProcedureKind(procedure) case final kind?)
            EsmStaticProcedureSymbol(
              node: procedure,
              name: _freshProcedureMemberName(
                usedStaticNames,
                staticAccessorNames,
                _memberJsBaseName(procedure.name),
                kind,
              ),
              kind: kind,
            ),
      ],
    );
  }

  EsmExtensionTypeSymbol _buildExtensionTypeSymbol(
    JsNameAllocator allocator,
    k.ExtensionTypeDeclaration extensionType, {
    required bool export,
  }) {
    final usedNames = <String>{};
    final accessorNames = <String, String>{};
    return EsmExtensionTypeSymbol(
      node: extensionType,
      name: allocator.freshGlobal(extensionType.name),
      export: export,
      representationName: _freshMemberName(
        usedNames,
        extensionType.representationName,
      ),
      members: [
        for (final descriptor in extensionType.memberDescriptors)
          if (_extensionTypeMemberKind(descriptor) case final kind?)
            EsmExtensionTypeMemberSymbol(
              extensionType: extensionType,
              descriptor: descriptor,
              name: _freshProcedureMemberName(
                usedNames,
                accessorNames,
                descriptor.name.text,
                kind,
              ),
              backingName: allocator.freshGlobal(
                '\$${extensionType.name}_${descriptor.name.text.isEmpty ? 'new' : descriptor.name.text}',
              ),
              mutable: _extensionTypeMemberIsMutable(descriptor),
            ),
      ],
    );
  }

  bool _isTopLevelClass(k.Class klass) => !klass.isAnonymousMixin;

  Iterable<k.Procedure> _anonymousMixinApplicationProcedures(k.Class klass) {
    final mixinApplications = <k.Class>[];
    var superclass = _supertypeClassNode(klass.supertype);
    while (superclass != null && superclass.isAnonymousMixin) {
      mixinApplications.add(superclass);
      superclass = _supertypeClassNode(superclass.supertype);
    }
    return mixinApplications.reversed.expand((klass) => klass.procedures);
  }

  k.Class? _supertypeClassNode(k.Supertype? supertype) {
    if (supertype == null) {
      return null;
    }
    final node = supertype.className.node;
    return node is k.Class ? node : null;
  }

  k.Class? _emittableJsSuperclass(
    EsmClassRuntimePlan classRuntime,
    k.Class klass,
  ) {
    final visiting = <k.Class>{};
    var superclass = classRuntime.jsSuperclassFor(klass);
    while (superclass != null && !_isTopLevelClass(superclass)) {
      if (!visiting.add(superclass)) {
        throw NewCompilerUnsupported(klass, 'cyclic anonymous mixin hierarchy');
      }
      superclass = classRuntime.jsSuperclassFor(superclass);
    }
    return superclass;
  }

  bool _isTopLevelField(k.Field field) {
    return field.isStatic && !field.isExternal && !field.isExtensionTypeMember;
  }

  EsmProcedureKind? _topLevelProcedureKind(k.Procedure procedure) {
    if (!procedure.isStatic ||
        procedure.isExternal ||
        procedure.isExtensionTypeMember) {
      return null;
    }
    return switch (procedure.kind) {
      k.ProcedureKind.Method ||
      k.ProcedureKind.Operator => EsmProcedureKind.method,
      k.ProcedureKind.Getter => EsmProcedureKind.getter,
      k.ProcedureKind.Setter => EsmProcedureKind.setter,
      _ => null,
    };
  }

  EsmProcedureKind? _instanceProcedureKind(k.Procedure procedure) {
    if (procedure.isStatic ||
        procedure.isExternal ||
        procedure.isExtensionTypeMember) {
      return null;
    }
    return switch (procedure.kind) {
      k.ProcedureKind.Method ||
      k.ProcedureKind.Operator => EsmProcedureKind.method,
      k.ProcedureKind.Getter => EsmProcedureKind.getter,
      k.ProcedureKind.Setter => EsmProcedureKind.setter,
      _ => null,
    };
  }

  EsmProcedureKind? _staticProcedureKind(k.Procedure procedure) {
    if (!procedure.isStatic ||
        procedure.isExternal ||
        procedure.isExtensionTypeMember) {
      return null;
    }
    return switch (procedure.kind) {
      k.ProcedureKind.Method => EsmProcedureKind.method,
      k.ProcedureKind.Factory => EsmProcedureKind.method,
      k.ProcedureKind.Getter => EsmProcedureKind.getter,
      k.ProcedureKind.Setter => EsmProcedureKind.setter,
      _ => null,
    };
  }

  EsmProcedureKind? _extensionTypeMemberKind(
    k.ExtensionTypeMemberDescriptor descriptor,
  ) {
    return switch (descriptor.kind) {
      k.ExtensionTypeMemberKind.Constructor ||
      k.ExtensionTypeMemberKind.Factory ||
      k.ExtensionTypeMemberKind.RedirectingFactory ||
      k.ExtensionTypeMemberKind.Method ||
      k.ExtensionTypeMemberKind.Operator => EsmProcedureKind.method,
      k.ExtensionTypeMemberKind.Getter => EsmProcedureKind.getter,
      k.ExtensionTypeMemberKind.Setter => EsmProcedureKind.setter,
      k.ExtensionTypeMemberKind.Field => EsmProcedureKind.getter,
    };
  }

  bool _extensionTypeMemberIsMutable(
    k.ExtensionTypeMemberDescriptor descriptor,
  ) {
    final node = descriptor.memberReference?.node;
    return node is k.Field && node.hasSetter;
  }

  String _freshMemberName(Set<String> usedNames, String original) {
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

  String _memberJsBaseName(k.Name name) {
    if (!name.isPrivate) {
      return name.text;
    }
    final libraryKey = name.libraryReference?.toStringInternal();
    if (libraryKey == null || libraryKey.isEmpty) {
      return name.text;
    }
    return '${name.text}_${sanitizeJsIdentifier(libraryKey)}';
  }

  String _freshProcedureMemberName(
    Set<String> usedNames,
    Map<String, String> accessorNames,
    String original,
    EsmProcedureKind kind,
  ) {
    return switch (kind) {
      EsmProcedureKind.method =>
        isJsIdentifierName(original)
            ? _freshMemberName(usedNames, original)
            : _freshPropertyName(usedNames, original),
      EsmProcedureKind.getter ||
      EsmProcedureKind.setter => accessorNames.putIfAbsent(
        original,
        () => _freshMemberName(usedNames, original),
      ),
    };
  }

  String _freshPropertyName(Set<String> usedNames, String original) {
    var candidate = original.isEmpty ? 'v' : original;
    var suffix = 1;
    while (!usedNames.add(candidate)) {
      candidate = '${original}_$suffix';
      suffix++;
    }
    return candidate;
  }
}
