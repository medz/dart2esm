import '../ir/esm_ir.dart';

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

EsmFunctionIr esmRuntimeHelperDeclaration(EsmRuntimeHelper helper) {
  return switch (helper) {
    EsmRuntimeHelper.print => EsmFunctionIr(
      name: esmRuntimeHelperName(helper),
      export: false,
      parameters: const [EsmIdentifierParameterIr(name: 'value')],
      body: const [
        EsmExpressionStatementIr(
          EsmCallIr(
            callee: EsmPropertyAccessIr(
              receiver: EsmIdentifierIr('console'),
              property: 'log',
            ),
            arguments: [EsmIdentifierIr('value')],
          ),
        ),
      ],
    ),
  };
}
