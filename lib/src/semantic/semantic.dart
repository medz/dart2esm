import 'package:kernel/kernel.dart' as k;

import '../foundation/diagnostics/unsupported_compiler_feature.dart';
import '../foundation/kernel/kernel_references.dart';

final class Semantic {
  Semantic({
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
      throw UnsupportedCompilerFeature(field, 'unbound field');
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
      throw UnsupportedCompilerFeature(procedure, 'unbound procedure');
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
