import 'package:kernel/kernel.dart' as k;

String kernelReferencePath(k.Reference reference) {
  return reference.canonicalName?.toStringInternal() ??
      reference.node?.toStringInternal() ??
      '<unbound>';
}

bool isKernelCoreClassReference(k.Reference reference, String name) {
  final node = reference.node;
  return node is k.Class &&
      node.name == name &&
      node.enclosingLibrary.importUri.toString() == 'dart:core';
}

bool isDartSdkReference(k.Reference reference) {
  return kernelReferencePath(reference).startsWith('dart:');
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
