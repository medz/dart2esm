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
    required List<EsmFieldSymbol> fields,
    required List<EsmProcedureSymbol> procedures,
  }) : fields = List.unmodifiable(fields),
       procedures = List.unmodifiable(procedures),
       _fieldSymbols = {
         for (final field in fields) field.node: field,
       },
       _procedureSymbols = {
         for (final procedure in procedures) procedure.node: procedure,
       };

  final k.Component component;
  final k.Procedure main;
  final List<EsmFieldSymbol> fields;
  final List<EsmProcedureSymbol> procedures;
  final Map<k.Field, EsmFieldSymbol> _fieldSymbols;
  final Map<k.Procedure, EsmProcedureSymbol> _procedureSymbols;

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
  });

  final k.Procedure node;
  final String name;
  final bool export;
}

final class SemanticWorldStage {
  const SemanticWorldStage();

  SemanticWorldResult build(KernelFrontendResult kernel) {
    final mainLibrary = kernel.main.enclosingLibrary;
    final allocator = JsNameAllocator(
      generatedGlobalNames: esmRuntimeHelperGlobalNames,
    );
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
      if (!_isTopLevelMethod(procedure)) {
        continue;
      }
      procedures.add(
        EsmProcedureSymbol(
          node: procedure,
          name: allocator.freshGlobal(procedure.name.text),
          export: _isPublic(procedure.name.text),
        ),
      );
    }
    if (!procedures.any((procedure) => procedure.node == kernel.main)) {
      throw NewCompilerUnsupported(kernel.main, 'entrypoint procedure shape');
    }
    return SemanticWorldResult(
      kernel: kernel,
      world: EsmSemanticWorld(
        component: kernel.component,
        main: kernel.main,
        fields: fields,
        procedures: procedures,
      ),
    );
  }

  bool _isTopLevelField(k.Field field) {
    return field.isStatic && !field.isExternal && !field.isExtensionTypeMember;
  }

  bool _isTopLevelMethod(k.Procedure procedure) {
    return procedure.isStatic &&
        !procedure.isExternal &&
        !procedure.isExtensionTypeMember &&
        procedure.kind == k.ProcedureKind.Method;
  }

  bool _isPublic(String name) => !name.startsWith('_');
}
