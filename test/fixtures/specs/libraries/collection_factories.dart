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
}
