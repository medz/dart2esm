dynamic hide(Object? value) => value;

void main() {
  final parsed = BigInt.parse('42');
  final prefixed = BigInt.parse('0xff');
  final hex = BigInt.parse('ff', radix: 16);
  final maybe = BigInt.tryParse('nope') ?? BigInt.from(-1);
  final fromDouble = BigInt.from(5.9);
  print('parse $parsed $prefixed $hex $maybe $fromDouble');

  final sum = parsed + BigInt.two;
  final product = sum * BigInt.from(2);
  final divided = product ~/ BigInt.from(3);
  final mod = product % BigInt.from(5);
  final negated = -BigInt.from(7);
  print(
    'ops $sum $product $divided $mod ${negated.abs()} ${negated.isNegative}',
  );

  print(
    'meta ${parsed.toInt()} ${hex.toRadixString(16)} ${parsed.isEven} '
    '${parsed.isOdd} ${BigInt.zero.sign} ${prefixed.bitLength} '
    '${hide(parsed) is BigInt}',
  );
  print('compare ${parsed > BigInt.one} ${parsed == BigInt.from(42)}');
}
