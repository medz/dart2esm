import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';

final class EsmClassRuntimePlan {
  const EsmClassRuntimePlan({
    required this.classes,
    required this.jsInterfaceSuperclasses,
    required this.interfaceMarkersByClass,
    required this.interfaceBaseClasses,
  });

  final Set<k.Class> classes;
  final Map<k.Class, k.Class> jsInterfaceSuperclasses;
  final Map<k.Class, Set<k.Class>> interfaceMarkersByClass;
  final Set<k.Class> interfaceBaseClasses;

  k.Class? jsInterfaceSuperclassFor(k.Class klass) {
    return jsInterfaceSuperclasses[klass];
  }

  Set<k.Class> interfaceMarkersFor(k.Class klass) {
    return interfaceMarkersByClass[klass] ?? const <k.Class>{};
  }

  bool isInterfaceBaseClass(k.Class klass) {
    return interfaceBaseClasses.contains(klass);
  }
}

EsmClassRuntimePlan buildEsmClassRuntimePlan(Iterable<k.Class> classes) {
  final classSet = Set<k.Class>.unmodifiable(classes);
  final jsInterfaceSuperclasses = <k.Class, k.Class>{};
  final interfaceMarkersByClass = <k.Class, Set<k.Class>>{};
  final interfaceBaseClasses = <k.Class>{};

  for (final klass in classSet) {
    final superclass = _jsInterfaceSuperclassFor(klass, classSet);
    if (superclass != null) {
      jsInterfaceSuperclasses[klass] = superclass;
    }
    final interfaces = _implementedInterfaceClasses(klass, classSet);
    if (interfaces.isNotEmpty) {
      interfaceMarkersByClass[klass] = Set.unmodifiable(interfaces);
      interfaceBaseClasses.addAll(interfaces);
    }
  }

  return EsmClassRuntimePlan(
    classes: classSet,
    jsInterfaceSuperclasses: Map.unmodifiable(jsInterfaceSuperclasses),
    interfaceMarkersByClass: Map.unmodifiable(interfaceMarkersByClass),
    interfaceBaseClasses: Set.unmodifiable(interfaceBaseClasses),
  );
}

k.Class? _jsInterfaceSuperclassFor(k.Class klass, Set<k.Class> classes) {
  if (_hasNonObjectSuperclass(klass)) {
    return null;
  }
  return localClassFromSupertype(klass.mixedInType, classes);
}

Set<k.Class> _implementedInterfaceClasses(k.Class klass, Set<k.Class> classes) {
  final result = <k.Class>{};
  void visit(k.Supertype? supertype) {
    final interface = localClassFromSupertype(supertype, classes);
    if (interface == null || !result.add(interface)) {
      return;
    }
    for (final inherited in interface.implementedTypes) {
      visit(inherited);
    }
  }

  for (final supertype in klass.implementedTypes) {
    visit(supertype);
  }
  return result;
}

bool _hasNonObjectSuperclass(k.Class klass) {
  final supertype = klass.supertype;
  return supertype != null &&
      !isKernelCoreClassReference(supertype.className, 'Object');
}
