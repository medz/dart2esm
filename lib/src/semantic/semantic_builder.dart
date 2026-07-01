import 'package:kernel/kernel.dart' as k;

import '../foundation/diagnostics/unsupported_compiler_feature.dart';
import '../foundation/names/js_names.dart';
import '../parser/kernel_parser.dart';
import 'model/class_runtime_plan.dart';
import 'model/program_model.dart';
import 'semantic.dart';

final class SemanticBuilderReturn {
  const SemanticBuilderReturn({required this.kernel, required this.semantic});

  final ParserReturn kernel;
  final Semantic semantic;
}

final class SemanticBuilder {
  const SemanticBuilder({this.generatedGlobalNames = const {}});

  final Set<String> generatedGlobalNames;

  SemanticBuilderReturn build(ParserReturn kernel) {
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
      throw UnsupportedCompilerFeature(
        kernel.main,
        'entrypoint procedure shape',
      );
    }
    return SemanticBuilderReturn(
      kernel: kernel,
      semantic: Semantic(
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
        throw UnsupportedCompilerFeature(
          klass,
          'cyclic anonymous mixin hierarchy',
        );
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
