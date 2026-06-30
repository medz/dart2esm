import '../ir/esm_ir.dart';

enum EsmRuntimeHelper { functionApply, lazyField, print, typeCast }

final class EsmRuntimeHelperRegistry {
  const EsmRuntimeHelperRegistry();

  static const generatedGlobalNames = {
    '__dartAs',
    '__dartFunctionApply',
    '__dartLazyField',
    '__dartPrint',
  };

  String name(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.functionApply => '__dartFunctionApply',
      EsmRuntimeHelper.lazyField => '__dartLazyField',
      EsmRuntimeHelper.print => '__dartPrint',
      EsmRuntimeHelper.typeCast => '__dartAs',
    };
  }

  EsmIdentifierIr reference(EsmRuntimeHelper helper) {
    return EsmIdentifierIr(name(helper));
  }

  EsmModuleItemIr declaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.functionApply => EsmRawModuleItemIr('''
function __dartFunctionApply(fn, positionalArguments, namedArguments = null) {
  const args = Array.from(positionalArguments);
  if (namedArguments != null) {
    const options = {};
    let hasNamed = false;
    const entries = namedArguments instanceof Map ? namedArguments.entries() : Object.entries(namedArguments);
    for (const [key, value] of entries) {
      const name = typeof key === "string" ? key : (typeof key === "symbol" ? key.description : key?.name);
      if (typeof name !== "string") throw new TypeError("Function.apply named argument keys must be Symbols");
      options[name] = value;
      hasNamed = true;
    }
    if (hasNamed) args.push(options);
  }
  return fn(...args);
}
'''),
      EsmRuntimeHelper.lazyField => EsmRawModuleItemIr('''
function __dartLazyField(name, initialize, writable, publish = null) {
  let state = 0;
  let value;
  function get() {
    if (state === 2) return value;
    if (state === 1) {
      throw new Error("Cyclic initialization of field " + name);
    }
    if (initialize == null) {
      throw new Error("Late field " + name + " has not been initialized");
    }
    state = 1;
    try {
      value = initialize();
      if (publish) publish(value);
      state = 2;
      return value;
    } catch (error) {
      state = 0;
      throw error;
    }
  }
  function set(next) {
    if (writable === false || (writable === "once" && state === 2)) {
      throw new TypeError("Cannot assign to final field " + name);
    }
    value = next;
    if (publish) publish(value);
    state = 2;
    return next;
  }
  return { get, set };
}
'''),
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
      EsmRuntimeHelper.typeCast => EsmFunctionIr(
        name: name(helper),
        export: false,
        parameters: const [
          EsmIdentifierParameterIr(name: 'value'),
          EsmIdentifierParameterIr(name: 'test'),
          EsmIdentifierParameterIr(name: 'typeName'),
        ],
        body: const [
          EsmIfStatementIr(
            condition: EsmCallIr(
              callee: EsmIdentifierIr('test'),
              arguments: [EsmIdentifierIr('value')],
            ),
            thenBody: [EsmReturnStatementIr(EsmIdentifierIr('value'))],
            otherwiseBody: null,
          ),
          EsmThrowStatementIr(
            EsmNewIr(
              callee: EsmIdentifierIr('TypeError'),
              arguments: [
                EsmBinaryIr(
                  left: EsmStringLiteralIr('Type cast failed: expected '),
                  operator: '+',
                  right: EsmIdentifierIr('typeName'),
                ),
              ],
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
