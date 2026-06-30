import 'package:kernel/kernel.dart' as k;

final class EsmExtensionTypeMemberPlan {
  const EsmExtensionTypeMemberPlan(
    this.declaration,
    this.descriptor, {
    required this.isTearOff,
  });

  final k.ExtensionTypeDeclaration declaration;
  final k.ExtensionTypeMemberDescriptor descriptor;
  final bool isTearOff;
}

final class EsmExtensionTypeMemberIndex {
  const EsmExtensionTypeMemberIndex(this._members);

  static const empty = EsmExtensionTypeMemberIndex({});

  final Map<k.Member, EsmExtensionTypeMemberPlan> _members;

  EsmExtensionTypeMemberPlan? operator [](k.Member member) {
    return _members[member];
  }

  bool contains(k.Member member) {
    return _members.containsKey(member);
  }
}

EsmExtensionTypeMemberIndex buildEsmExtensionTypeMemberIndex(
  Iterable<k.ExtensionTypeDeclaration> declarations,
) {
  final members = <k.Member, EsmExtensionTypeMemberPlan>{};
  for (final declaration in declarations) {
    for (final descriptor in declaration.memberDescriptors) {
      final member = descriptor.memberReference?.asMember;
      if (member != null) {
        members[member] = EsmExtensionTypeMemberPlan(
          declaration,
          descriptor,
          isTearOff: false,
        );
      }
      final tearOff = descriptor.tearOffReference?.asMember;
      if (tearOff != null) {
        members[tearOff] = EsmExtensionTypeMemberPlan(
          declaration,
          descriptor,
          isTearOff: true,
        );
      }
    }
  }
  if (members.isEmpty) {
    return EsmExtensionTypeMemberIndex.empty;
  }
  return EsmExtensionTypeMemberIndex(Map.unmodifiable(members));
}
