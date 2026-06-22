void main() {
  final list = List<int>.of({1, 2, 3});
  final listFrom = List<int>.from(list);
  final listFixed = List<int>.unmodifiable(listFrom);
  print('list ${listFixed.length} ${listFixed.join(',')}');

  final set = Set<String>.from(['a', 'b', 'a']);
  final setOf = Set<String>.of(set);
  final setFixed = Set<String>.unmodifiable(setOf);
  print(
    'set ${setFixed.length} ${setFixed.contains('a')} ${setFixed.join('|')}',
  );

  final map = Map<String, int>.from({'one': 1, 'two': 2});
  final mapOf = Map<String, int>.of(map);
  final mapFixed = Map<String, int>.unmodifiable(mapOf);
  print('map ${mapFixed.length} ${mapFixed['one']} ${mapFixed.keys.join(',')}');

  final entries = Map<String, int>.fromEntries([
    MapEntry('three', 3),
    MapEntry('four', 4),
  ]);
  final iterable = Map<int, String>.fromIterable(
    ['aa', 'bbb'],
    key: (value) => value.length,
    value: (value) => value.toUpperCase(),
  );
  final iterables = Map<String, int>.fromIterables(['x', 'y'], [10, 20]);
  final identity = Map<List<int>, String>.identity();
  final identityKey = [1];
  identity[identityKey] = 'same';
  print(
    'mapFactories ${entries['four']} ${iterable[3]} ${iterables['y']} '
    '${identity.containsKey(identityKey)}',
  );
}
