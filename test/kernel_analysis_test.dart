import 'package:dart2esm/src/compiler/semantic/analysis/kernel_analysis.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('detects continue-to-case targets inside a switch', () {
    final target = _case(1, k.Block([]));
    final source = _case(2, k.Block([k.ContinueSwitchStatement(target)]));
    final statement = k.SwitchStatement(k.IntLiteral(0), [target, source]);

    expect(switchCanContinueToCase(statement), isTrue);
  });

  test('ignores continue-to-case targets outside the switch', () {
    final externalTarget = _case(1, k.Block([]));
    final source = _case(
      2,
      k.Block([k.ContinueSwitchStatement(externalTarget)]),
    );
    final statement = k.SwitchStatement(k.IntLiteral(0), [source]);

    expect(switchCanContinueToCase(statement), isFalse);
  });

  test('detects lexical receiver uses in function bodies', () {
    final body = k.Block([k.ExpressionStatement(k.ThisExpression())]);

    expect(functionBodyUsesLexicalReceiver(body), isTrue);
  });

  test('ignores lexical receiver uses in nested functions', () {
    final body = k.Block([
      k.ExpressionStatement(
        k.FunctionExpression(
          k.FunctionNode(k.Block([k.ExpressionStatement(k.ThisExpression())])),
        ),
      ),
    ]);

    expect(functionBodyUsesLexicalReceiver(body), isFalse);
  });
}

k.SwitchCase _case(int value, k.Statement body) {
  return k.SwitchCase([k.IntLiteral(value)], [0], body);
}
