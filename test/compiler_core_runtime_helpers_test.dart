import 'package:dart2esm/src/compiler_core/runtime/runtime_helpers.dart';
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
}
