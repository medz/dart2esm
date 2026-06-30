import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import '../kernel/sdk_symbols.dart';

String? directDartCoreExceptionSuperclassName(k.Class klass) {
  return dartCoreExceptionSupertypeName(klass.supertype);
}

String? directDartCoreExceptionInterfaceName(k.Class klass) {
  for (final interface in klass.implementedTypes) {
    final interfaceName = dartCoreExceptionSupertypeName(interface);
    if (interfaceName != null) {
      return interfaceName;
    }
  }
  return null;
}

String? dartCoreExceptionSupertypeName(k.Supertype? supertype) {
  if (supertype == null) {
    return null;
  }
  return dartCoreExceptionReferenceName(supertype.className) ??
      _dartSdkClassName(
        supertype.className,
        'dart:core',
        dartCoreExceptionTypeNames,
      );
}

bool hasDartConvertBase(k.Class klass, Set<String> names) {
  bool matches(k.Supertype? supertype) {
    if (supertype == null) {
      return false;
    }
    final path = kernelReferencePath(supertype.className);
    return names.any((name) => path == 'dart:convert::$name') ||
        _dartSdkClassName(supertype.className, 'dart:convert', names) != null;
  }

  if (matches(klass.supertype) || matches(klass.mixedInType)) {
    return true;
  }
  return klass.implementedTypes.any(matches);
}

String? _dartSdkClassName(
  k.Reference reference,
  String libraryUri,
  Set<String> names,
) {
  final node = reference.node;
  if (node is k.Class &&
      node.enclosingLibrary.importUri.toString() == libraryUri &&
      names.contains(node.name)) {
    return node.name;
  }
  return null;
}
