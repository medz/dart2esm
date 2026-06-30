import 'package:kernel/kernel.dart' as k;

import '../module/esm_module_plan.dart';
import 'js_names.dart';

final class EsmNamePlan {
  EsmNamePlan({Iterable<String> generatedGlobalNames = const []})
    : _allocator = JsNameAllocator(generatedGlobalNames: generatedGlobalNames);

  factory EsmNamePlan.forModule(
    EsmModulePlan module, {
    Iterable<String> generatedGlobalNames = const [],
  }) {
    final plan = EsmNamePlan(generatedGlobalNames: generatedGlobalNames);
    plan.declareModule(module);
    return plan;
  }

  final JsNameAllocator _allocator;
  final _procedureNames = <k.Procedure, String>{};
  final _classNames = <k.Class, String>{};
  final _namedConstructorBodyNames = <k.Constructor, String>{};
  final _constructorTearOffNames = <k.Member, String>{};
  final _extensionConstructorTearOffNames = <k.Procedure, String>{};
  final _fieldNames = <k.Field, EsmTopLevelFieldNames>{};
  final _staticFieldCellNames = <k.Field, String>{};
  final _extensionTypeNames = <k.ExtensionTypeDeclaration, String>{};
  final _variableNames = <k.VariableDeclaration, String>{};
  final _labelNames = <k.LabeledStatement, String>{};
  final _interfaceMarkerNames = <k.Class, String>{};

  void declareModule(EsmModulePlan module) {
    for (final library in module.libraries) {
      for (final field in library.fields) {
        _fieldNames[field.node] = _freshTopLevelFieldNames(
          field.node.name.text,
        );
      }
      for (final klass in library.classes) {
        _classNames[klass.node] = freshGlobal(klass.node.name);
        for (final constructor in klass.node.constructors) {
          if (constructor.name.text.isNotEmpty) {
            _namedConstructorBodyNames[constructor] = freshGlobal(
              '\$${klass.node.name}_${constructor.name.text}',
            );
          }
        }
      }
      for (final extensionType in library.extensionTypes) {
        _extensionTypeNames[extensionType.node] = freshGlobal(
          extensionType.node.name,
        );
      }
      for (final procedure in library.procedures) {
        _procedureNames[procedure.node] = freshGlobal(procedure.node.name.text);
      }
    }
    _declareClassRuntime(module);
  }

  void _declareClassRuntime(EsmModulePlan module) {
    final sortedClasses = module.classRuntime.classes.toList()
      ..sort((left, right) => className(left).compareTo(className(right)));
    for (final klass in sortedClasses) {
      for (final interface in module.classRuntime.interfaceMarkersFor(klass)) {
        interfaceMarkerName(interface);
      }
    }
  }

  T withFunctionScope<T>(T Function() body) {
    return _allocator.withFunctionScope(body);
  }

  String freshGlobal(String original) {
    return _allocator.freshGlobal(original);
  }

  String freshLocal(String original) {
    return _allocator.freshLocal(original);
  }

  String freshIn(Set<String> usedNames, String original) {
    return _allocator.freshIn(usedNames, original);
  }

  void declareVariable(k.VariableDeclaration variable) {
    final name = _variableNames.putIfAbsent(
      variable,
      () => freshLocal(variable.name ?? 'v'),
    );
    _allocator.reserveLocal(name);
  }

  String? declaredVariableName(k.VariableDeclaration variable) {
    return _variableNames[variable];
  }

  String variableName(k.VariableDeclaration variable) {
    return _variableNames.putIfAbsent(
      variable,
      () => freshLocal(variable.name ?? 'v'),
    );
  }

  String labelName(k.LabeledStatement statement) {
    return _labelNames.putIfAbsent(statement, () => freshLocal('L'));
  }

  bool hasProcedure(k.Procedure procedure) {
    return _procedureNames.containsKey(procedure);
  }

  String procedureName(k.Procedure procedure) {
    return _procedureNames.putIfAbsent(
      procedure,
      () => freshGlobal(procedure.name.text),
    );
  }

  bool hasClass(k.Class klass) {
    return _classNames.containsKey(klass);
  }

  String className(k.Class klass) {
    return _classNames.putIfAbsent(klass, () => freshGlobal(klass.name));
  }

  String interfaceMarkerName(k.Class klass) {
    return _interfaceMarkerNames.putIfAbsent(
      klass,
      () => freshGlobal('\$${klass.name}_interface'),
    );
  }

  String extensionTypeName(k.ExtensionTypeDeclaration declaration) {
    return _extensionTypeNames.putIfAbsent(
      declaration,
      () => freshGlobal(declaration.name),
    );
  }

  String namedConstructorBodyName(k.Constructor constructor) {
    return _namedConstructorBodyNames.putIfAbsent(constructor, () {
      final klass = constructor.enclosingClass;
      return freshGlobal('\$${klass.name}_${constructor.name.text}');
    });
  }

  String constructorTearOffName(k.Member target) {
    return _constructorTearOffNames.putIfAbsent(target, () {
      final klass = target.enclosingClass;
      if (klass == null) {
        throw EsmNamePlanError(target, 'constructor tear-off name');
      }
      final name = target.name.text.isEmpty ? 'new' : target.name.text;
      return freshGlobal('\$${klass.name}_${name}_tearoff');
    });
  }

  String extensionConstructorTearOffName(
    k.Procedure target, {
    required String extensionTypeName,
    required String constructorName,
  }) {
    return _extensionConstructorTearOffNames.putIfAbsent(target, () {
      return freshGlobal('\$${extensionTypeName}_${constructorName}_tearoff');
    });
  }

  Iterable<k.Member> get constructorTearOffTargets {
    return _constructorTearOffNames.keys;
  }

  Iterable<k.Procedure> get extensionConstructorTearOffTargets {
    return _extensionConstructorTearOffNames.keys;
  }

  bool hasExtensionConstructorTearOff(k.Procedure target) {
    return _extensionConstructorTearOffNames.containsKey(target);
  }

  String constructorTearOffNameFor(k.Member target) {
    final extensionName = target is k.Procedure
        ? _extensionConstructorTearOffNames[target]
        : null;
    final name = extensionName ?? _constructorTearOffNames[target];
    if (name == null) {
      throw EsmNamePlanError(target, 'unknown constructor tear-off name');
    }
    return name;
  }

  bool hasField(k.Field field) {
    return _fieldNames.containsKey(field);
  }

  EsmTopLevelFieldNames fieldName(k.Field field) {
    return _fieldNames[field] ??= _freshTopLevelFieldNames(field.name.text);
  }

  String staticFieldCellName(k.Field field) {
    return _staticFieldCellNames.putIfAbsent(field, () {
      final klass = field.enclosingClass;
      final className = klass == null ? 'static' : klass.name;
      return freshGlobal('\$${className}_${field.name.text}');
    });
  }

  EsmTopLevelFieldNames _freshTopLevelFieldNames(String name) {
    final base = sanitizeJsIdentifier(name);
    return EsmTopLevelFieldNames(value: freshGlobal(base));
  }
}

final class EsmTopLevelFieldNames {
  const EsmTopLevelFieldNames({required this.value});

  final String value;
}

final class EsmNamePlanError implements Exception {
  const EsmNamePlanError(this.node, this.context);

  final Object node;
  final String context;

  @override
  String toString() => 'Cannot plan ESM names for $context: $node';
}
