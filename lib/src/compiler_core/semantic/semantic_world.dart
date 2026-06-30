import 'package:kernel/kernel.dart' as k;

import '../../names/js_names.dart';
import '../frontend/kernel_frontend.dart';
import '../new_compiler_unsupported.dart';
import '../runtime/runtime_helpers.dart';

final class SemanticWorldResult {
  const SemanticWorldResult({required this.kernel, required this.world});

  final KernelFrontendResult kernel;
  final EsmSemanticWorld world;
}

final class EsmSemanticWorld {
  EsmSemanticWorld({
    required this.component,
    required this.main,
    required List<EsmClassSymbol> classes,
    required List<EsmFieldSymbol> fields,
    required List<EsmProcedureSymbol> procedures,
  }) : classes = List.unmodifiable(classes),
       fields = List.unmodifiable(fields),
       procedures = List.unmodifiable(procedures),
       _classSymbols = {for (final klass in classes) klass.node: klass},
       _constructorSymbols = {
         for (final klass in classes)
           for (final constructor in klass.constructors)
             constructor.node: constructor,
       },
       _instanceFieldSymbols = {
         for (final klass in classes)
           for (final field in klass.fields) field.node: field,
       },
       _instanceProcedureSymbols = {
         for (final klass in classes)
           for (final procedure in klass.procedures) procedure.node: procedure,
       },
       _fieldSymbols = {for (final field in fields) field.node: field},
       _procedureSymbols = {
         for (final procedure in procedures) procedure.node: procedure,
       };

  final k.Component component;
  final k.Procedure main;
  final List<EsmClassSymbol> classes;
  final List<EsmFieldSymbol> fields;
  final List<EsmProcedureSymbol> procedures;
  final Map<k.Class, EsmClassSymbol> _classSymbols;
  final Map<k.Constructor, EsmConstructorSymbol> _constructorSymbols;
  final Map<k.Field, EsmInstanceFieldSymbol> _instanceFieldSymbols;
  final Map<k.Procedure, EsmInstanceProcedureSymbol> _instanceProcedureSymbols;
  final Map<k.Field, EsmFieldSymbol> _fieldSymbols;
  final Map<k.Procedure, EsmProcedureSymbol> _procedureSymbols;

  EsmClassSymbol? classSymbolFor(k.Class klass) {
    return _classSymbols[klass];
  }

  EsmConstructorSymbol? constructorSymbolFor(k.Constructor constructor) {
    return _constructorSymbols[constructor];
  }

  EsmInstanceFieldSymbol? instanceFieldSymbolFor(k.Field field) {
    return _instanceFieldSymbols[field];
  }

  EsmInstanceProcedureSymbol? instanceProcedureSymbolFor(
    k.Procedure procedure,
  ) {
    return _instanceProcedureSymbols[procedure];
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
    required this.localSuperclass,
    required List<EsmConstructorSymbol> constructors,
    required List<EsmInstanceFieldSymbol> fields,
    required List<EsmInstanceProcedureSymbol> procedures,
  }) : constructors = List.unmodifiable(constructors),
       fields = List.unmodifiable(fields),
       procedures = List.unmodifiable(procedures);

  final k.Class node;
  final String name;
  final bool export;
  final k.Class? localSuperclass;
  final List<EsmConstructorSymbol> constructors;
  final List<EsmInstanceFieldSymbol> fields;
  final List<EsmInstanceProcedureSymbol> procedures;
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

final class EsmInstanceProcedureSymbol {
  const EsmInstanceProcedureSymbol({
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
    required this.export,
    required this.mutable,
  });

  final k.Field node;
  final String name;
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

final class SemanticWorldStage {
  const SemanticWorldStage();

  SemanticWorldResult build(KernelFrontendResult kernel) {
    final mainLibrary = kernel.main.enclosingLibrary;
    final allocator = JsNameAllocator(
      generatedGlobalNames: esmRuntimeHelperGlobalNames,
    );
    final classes = <EsmClassSymbol>[];
    for (final klass in mainLibrary.classes) {
      if (!_isTopLevelClass(klass)) {
        continue;
      }
      classes.add(_buildClassSymbol(allocator, klass));
    }
    final fields = <EsmFieldSymbol>[];
    for (final field in mainLibrary.fields) {
      if (!_isTopLevelField(field)) {
        continue;
      }
      fields.add(
        EsmFieldSymbol(
          node: field,
          name: allocator.freshGlobal(field.name.text),
          export: _isPublic(field.name.text),
          mutable: field.hasSetter,
        ),
      );
    }
    final procedures = <EsmProcedureSymbol>[];
    for (final procedure in mainLibrary.procedures) {
      final kind = _topLevelProcedureKind(procedure);
      if (kind == null) {
        continue;
      }
      procedures.add(
        EsmProcedureSymbol(
          node: procedure,
          name: allocator.freshGlobal(procedure.name.text),
          export: _isPublic(procedure.name.text),
          kind: kind,
        ),
      );
    }
    if (!procedures.any(
      (procedure) =>
          procedure.node == kernel.main &&
          procedure.kind == EsmProcedureKind.method,
    )) {
      throw NewCompilerUnsupported(kernel.main, 'entrypoint procedure shape');
    }
    return SemanticWorldResult(
      kernel: kernel,
      world: EsmSemanticWorld(
        component: kernel.component,
        main: kernel.main,
        classes: classes,
        fields: fields,
        procedures: procedures,
      ),
    );
  }

  EsmClassSymbol _buildClassSymbol(JsNameAllocator allocator, k.Class klass) {
    final usedNames = <String>{};
    final accessorNames = <String, String>{};
    final localSuperclass = klass.supertype?.className.node;
    return EsmClassSymbol(
      node: klass,
      name: allocator.freshGlobal(klass.name),
      export: _isPublic(klass.name),
      localSuperclass:
          localSuperclass is k.Class &&
              localSuperclass.enclosingLibrary == klass.enclosingLibrary
          ? localSuperclass
          : null,
      constructors: [
        for (final constructor in klass.constructors)
          if (!constructor.isExternal && !constructor.isSynthetic)
            EsmConstructorSymbol(
              node: constructor,
              name: constructor.name.text,
            ),
      ],
      fields: [
        for (final field in klass.fields)
          if (!field.isStatic && !field.isExternal)
            EsmInstanceFieldSymbol(
              node: field,
              name: _freshMemberName(usedNames, field.name.text),
            ),
      ],
      procedures: [
        for (final procedure in klass.procedures)
          if (_instanceProcedureKind(procedure) case final kind?)
            EsmInstanceProcedureSymbol(
              node: procedure,
              name: _freshProcedureMemberName(
                usedNames,
                accessorNames,
                procedure.name.text,
                kind,
              ),
              kind: kind,
            ),
      ],
    );
  }

  bool _isTopLevelClass(k.Class klass) {
    return !klass.isAbstract && !klass.isEnum && _isPublic(klass.name);
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
      k.ProcedureKind.Method => EsmProcedureKind.method,
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
      k.ProcedureKind.Method => EsmProcedureKind.method,
      k.ProcedureKind.Getter => EsmProcedureKind.getter,
      k.ProcedureKind.Setter => EsmProcedureKind.setter,
      _ => null,
    };
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

  String _freshProcedureMemberName(
    Set<String> usedNames,
    Map<String, String> accessorNames,
    String original,
    EsmProcedureKind kind,
  ) {
    return switch (kind) {
      EsmProcedureKind.method => _freshMemberName(usedNames, original),
      EsmProcedureKind.getter ||
      EsmProcedureKind.setter => accessorNames.putIfAbsent(
        original,
        () => _freshMemberName(usedNames, original),
      ),
    };
  }

  bool _isPublic(String name) => !name.startsWith('_');
}
