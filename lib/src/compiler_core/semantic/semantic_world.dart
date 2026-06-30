import 'package:kernel/kernel.dart' as k;

import '../../names/js_names.dart';
import '../frontend/kernel_frontend.dart';
import '../new_compiler_unsupported.dart';

final class SemanticWorldResult {
  const SemanticWorldResult({required this.kernel, required this.world});

  final KernelFrontendResult kernel;
  final EsmSemanticWorld world;
}

final class EsmSemanticWorld {
  EsmSemanticWorld({
    required this.component,
    required this.main,
    required List<EsmProcedureSymbol> procedures,
  }) : procedures = List.unmodifiable(procedures),
       _procedureSymbols = {
         for (final procedure in procedures) procedure.node: procedure,
       };

  final k.Component component;
  final k.Procedure main;
  final List<EsmProcedureSymbol> procedures;
  final Map<k.Procedure, EsmProcedureSymbol> _procedureSymbols;

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
    final allocator = JsNameAllocator();
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
        procedures: procedures,
      ),
    );
  }

  bool _isTopLevelMethod(k.Procedure procedure) {
    return procedure.isStatic &&
        !procedure.isExternal &&
        !procedure.isExtensionTypeMember &&
        procedure.kind == k.ProcedureKind.Method;
  }

  bool _isPublic(String name) => !name.startsWith('_');
}
