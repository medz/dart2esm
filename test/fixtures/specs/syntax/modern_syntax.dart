class Bag {
  int value;

  Bag(this.value);

  int add(int x) => value + x;
}

String describe(Object? input) {
  final list = [
    0,
    ...[1, 2],
    if (input != null) 3,
    for (final x in [4, 5]) x,
  ];
  final set = {
    0,
    ...{1, 2},
    if (input != null) 3,
    for (final x in [4, 5]) x,
  };
  final map = {
    'a': 1,
    ...{'b': 2},
    if (input != null) 'c': 3,
    for (final x in [4, 5]) '$x': x,
  };

  var (a, b) = (1, 2);
  (a, b) = (b, a);

  final result = switch (input) {
    int value when value > 2 => 'big $value',
    String value => 'string $value',
    _ => 'other',
  };

  dynamic d = Bag(10);
  d.value = d.add(1);
  final tear = d.add;
  final sure = input!;

  return '$list $set $map $a $b $result ${d.value} ${tear(2)} $sure';
}

void main() {
  print(describe(4));
  print(describe('x'));
}
