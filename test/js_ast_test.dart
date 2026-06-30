import 'package:dart2esm/src/js_ast/js_ast.dart';
import 'package:test/test.dart';

void main() {
  test('generates expression statements', () {
    expect(
      generateJs(
        const JsExpressionStatement(
          JsCallExpression(callee: JsIdentifier('main')),
        ),
      ),
      'main();\n',
    );
  });

  test('generates top-level await calls', () {
    expect(
      generateJs(
        const JsExpressionStatement(
          JsAwaitExpression(JsCallExpression(callee: JsIdentifier('main'))),
        ),
      ),
      'await main();\n',
    );
  });

  test('generates stable program statement order', () {
    expect(
      generateJs(
        const JsProgram([
          JsExpressionStatement(
            JsCallExpression(callee: JsIdentifier('first')),
          ),
          JsExpressionStatement(
            JsCallExpression(callee: JsIdentifier('second')),
          ),
        ]),
      ),
      'first();\nsecond();\n',
    );
  });

  test('generates literals and object keys', () {
    expect(
      generateJs(
        const JsObjectExpression([
          JsObjectProperty(key: 'name', value: JsStringLiteral('dart2esm')),
          JsObjectProperty(key: 'not-id', value: JsNumberLiteral(42)),
          JsObjectProperty(
            key: r'$items',
            value: JsArrayExpression([JsBooleanLiteral(true), JsNullLiteral()]),
          ),
        ]),
      ),
      r'{ name: "dart2esm", "not-id": 42, $items: [true, null] }',
    );
  });
}
