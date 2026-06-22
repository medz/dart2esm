import 'dart:math' as math;

dynamic hide(Object? value) => value;

void main() {
  print('min ${math.min(2, 3)}');
  print('max ${math.max(2, 3)}');
  print('pow ${math.pow(2, 3)}');
  print('atan2 ${math.atan2(0, 1) == 0}');
  print('pi ${math.pi > 3}');
  print('sqrt2 ${math.sqrt2 > 1}');

  final seededA = math.Random(1);
  final seededB = math.Random(1);
  final firstA = seededA.nextInt(1000);
  final firstB = seededB.nextInt(1000);
  final doubleValue = seededA.nextDouble();
  final boolValue = seededA.nextBool();
  print(
    'random ${firstA == firstB} ${firstA >= 0 && firstA < 1000} '
    '${doubleValue >= 0 && doubleValue < 1} ${hide(boolValue) is bool}',
  );

  final secure = math.Random.secure().nextInt(10);
  print('secure ${secure >= 0 && secure < 10}');
}
