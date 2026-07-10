import 'package:dart2esm/src/transformer/helpers/runtime_helpers.dart';
import 'package:test/test.dart';

void main() {
  test('helper references record the required runtime helper', () {
    final helpers = EsmRuntimeHelperUseSet();

    final identifier = helpers.reference(
      const EsmRuntimeHelperRegistry(),
      EsmRuntimeHelper.print,
    );

    expect(identifier.name, '__dartPrint');
    expect(helpers.toList(), [
      EsmRuntimeHelper.print,
      EsmRuntimeHelper.stringify,
    ]);
  });

  test('helper requirements own transitive helper closure', () {
    final helpers = EsmRuntimeHelperUseSet();

    helpers.require(EsmRuntimeHelper.mapSet);

    expect(
      helpers.toList(),
      containsAll([
        EsmRuntimeHelper.mapSet,
        EsmRuntimeHelper.mapGet,
        EsmRuntimeHelper.equals,
        EsmRuntimeHelper.recordShape,
        EsmRuntimeHelper.isRecord,
      ]),
    );
  });

  test('runtime contracts expose ABI name dependencies host and effects', () {
    const registry = EsmRuntimeHelperRegistry();
    final file = registry.contract(EsmRuntimeHelper.ioNode);
    final worker = registry.contract(EsmRuntimeHelper.isolateNode);
    final map = registry.contract(EsmRuntimeHelper.mapSet);

    expect(file.name, '__dartFile');
    expect(file.host, EsmRuntimeHostRequirement.node);
    expect(file.effects, contains(EsmRuntimeEffect.io));
    expect(file.dependencies, contains(EsmRuntimeHelper.future));
    expect(worker.effects, contains(EsmRuntimeEffect.worker));
    expect(map.dependencies, contains(EsmRuntimeHelper.mapGet));
  });

  test('iterable materialization helper is shared across runtime helpers', () {
    final helpers = EsmRuntimeHelperUseSet();

    helpers
      ..require(EsmRuntimeHelper.iterableJoin)
      ..require(EsmRuntimeHelper.iterator)
      ..require(EsmRuntimeHelper.listFactory);

    expect(
      helpers.toList(),
      containsAll([
        EsmRuntimeHelper.iterableToArray,
        EsmRuntimeHelper.iterableJoin,
        EsmRuntimeHelper.iterator,
        EsmRuntimeHelper.listFactory,
        EsmRuntimeHelper.stringify,
      ]),
    );
  });
}
