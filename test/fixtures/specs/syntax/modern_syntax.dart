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
  dynamic dynList = [1, 2];
  dynList.add(3);
  dynList[1] = 4;
  final dynListText =
      '${dynList[0]}:${dynList[1]}:${dynList.join('|')}:${dynList.contains(3)}';
  dynamic dynMap = {'a': 1};
  dynMap['b'] = 2;
  final dynMapText =
      '${dynMap['a']}:${dynMap.containsKey('b')}:${dynMap.remove('a')}:'
      '${dynMap['a']}';
  dynamic dynSet = {'a'};
  final dynSetAdded = dynSet.add('b');
  final dynSetDuplicate = dynSet.add('b');
  final dynSetText =
      '$dynSetAdded:$dynSetDuplicate:${dynSet.contains('a')}:'
      '${dynSet.remove('a')}:${dynSet.length}';
  dynamic dynString = ' Hello,Dart ';
  final dynStringText =
      '${dynString.trim().toUpperCase()}:${dynString.contains('Dart')}:'
      '${dynString.split(',')[1].trim()}';
  final sure = input!;

  return '$list $set $map $a $b $result ${d.value} ${tear(2)} '
      '$dynListText $dynMapText $dynSetText $dynStringText $sure';
}

void main() {
  print(describe(4));
  print(describe('x'));
}
