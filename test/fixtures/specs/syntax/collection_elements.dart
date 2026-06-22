bool isEnabled() => true;

void main() {
  final maybe = <int>[4, 5];
  final none = null;

  final list = [
    1,
    if (isEnabled()) 2 else 99,
    for (final value in [3]) value,
    ...maybe,
    ...?none,
  ];
  final set = {
    1,
    if (isEnabled()) 2,
    for (final value in [2, 3]) value,
    ...{3, 4},
    ...?none,
  };
  final map = {
    'a': 1,
    if (isEnabled()) 'b': 2,
    for (final value in [3, 4]) 'k$value': value,
    ...{'c': 5},
    ...?none,
  };

  print(list);
  print(set);
  print(map);
}
