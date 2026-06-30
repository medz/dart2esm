import '../ir/esm_ir.dart';

enum EsmRuntimeHelper { print }

final class EsmRuntimeHelperRegistry {
  const EsmRuntimeHelperRegistry();

  static const generatedGlobalNames = {'__dartPrint'};

  String name(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.print => '__dartPrint',
    };
  }

  EsmIdentifierIr reference(EsmRuntimeHelper helper) {
    return EsmIdentifierIr(name(helper));
  }

  EsmFunctionIr declaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.print => EsmFunctionIr(
        name: name(helper),
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
}

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
