import 'package:kernel/kernel.dart' as k;

String kernelReferencePath(k.Reference reference) {
  return reference.canonicalName?.toStringInternal() ??
      reference.node?.toStringInternal() ??
      '<unbound>';
}

bool isKernelCoreClassReference(k.Reference reference, String name) {
  if (kernelReferencePath(reference) == 'dart:core::$name') {
    return true;
  }
  final node = reference.node;
  return node is k.Class &&
      node.name == name &&
      node.enclosingLibrary.importUri.toString() == 'dart:core';
}

bool isDartSdkReference(k.Reference reference) {
  if (kernelReferencePath(reference).startsWith('dart:')) {
    return true;
  }
  final node = reference.node;
  return switch (node) {
    k.Class() => node.enclosingLibrary.importUri.scheme == 'dart',
    k.Member() => node.enclosingLibrary.importUri.scheme == 'dart',
    k.ExtensionTypeDeclaration() =>
      node.enclosingLibrary.importUri.scheme == 'dart',
    k.Library() => node.importUri.scheme == 'dart',
    _ => false,
  };
}

k.Class? localClassFromSupertype(
  k.Supertype? supertype,
  Set<k.Class> localClasses,
) {
  if (supertype == null ||
      isKernelCoreClassReference(supertype.className, 'Object') ||
      isDartSdkReference(supertype.className)) {
    return null;
  }
  final klass = supertype.classNode;
  return localClasses.contains(klass) ? klass : null;
}
