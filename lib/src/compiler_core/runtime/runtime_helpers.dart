enum EsmRuntimeHelper { print }

final class EsmRuntimeHelperUseSet {
  final _helpers = <EsmRuntimeHelper>{};

  bool add(EsmRuntimeHelper helper) => _helpers.add(helper);

  bool contains(EsmRuntimeHelper helper) => _helpers.contains(helper);

  List<EsmRuntimeHelper> toList() {
    return EsmRuntimeHelper.values
        .where(_helpers.contains)
        .toList(growable: false);
  }
}

const esmRuntimeHelperGlobalNames = {'__dartPrint'};

String esmRuntimeHelperName(EsmRuntimeHelper helper) {
  return switch (helper) {
    EsmRuntimeHelper.print => '__dartPrint',
  };
}

String esmRuntimeHelperSource(EsmRuntimeHelper helper) {
  return switch (helper) {
    EsmRuntimeHelper.print =>
      '''
function __dartPrint(value) {
  console.log(value);
}
''',
  };
}
