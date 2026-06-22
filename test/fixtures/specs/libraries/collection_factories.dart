class EqBox {
  EqBox(this.value);

  final int value;

  @override
  bool operator ==(Object other) => other is EqBox && other.value == value;

  @override
  int get hashCode => value.hashCode;
}

void main() {
  final list = List<int>.of({1, 2, 3});
  final listFrom = List<int>.from(list);
  final listFixed = List<int>.unmodifiable(listFrom);
  print('list ${listFixed.length} ${listFixed.join(',')}');

  final fixedFilled = List<int>.filled(2, 7);
  fixedFilled[0] = 8;
  var fixedAddFailed = false;
  try {
    fixedFilled.add(9);
  } catch (_) {
    fixedAddFailed = true;
  }
  final growableEmpty = List<int>.empty(growable: true);
  growableEmpty.add(1);
  final fixedCopy = [1, 2, 3].toList(growable: false);
  fixedCopy[0] = 4;
  var fixedCopyAddFailed = false;
  try {
    fixedCopy.add(5);
  } catch (_) {
    fixedCopyAddFailed = true;
  }
  final fixedFrom = List<int>.of([5, 6], growable: false);
  print(
    'fixedList ${fixedFilled.join(',')} $fixedAddFailed '
    '${growableEmpty.join(',')} ${fixedCopy.join(',')} '
    '$fixedCopyAddFailed ${fixedFrom.length}',
  );

  final set = Set<String>.from(['a', 'b', 'a']);
  final setOf = Set<String>.of(set);
  final setFixed = Set<String>.unmodifiable(setOf);
  print(
    'set ${setFixed.length} ${setFixed.contains('a')} ${setFixed.join('|')}',
  );
  final eqSetFrom = Set<EqBox>.from([EqBox(1), EqBox(1), EqBox(2)]);
  final eqSetOf = Set<EqBox>.of([...eqSetFrom, EqBox(2), EqBox(3)]);
  final eqSetFixed = Set<EqBox>.unmodifiable([EqBox(1), EqBox(1)]);
  print(
    'setFactories ${eqSetFrom.length} ${eqSetFrom.contains(EqBox(1))} '
    '${eqSetOf.length} ${eqSetFixed.length} ${eqSetFixed.contains(EqBox(1))}',
  );
  final identitySet = Set<EqBox>.identity();
  final identityBox = EqBox(1);
  identitySet.add(identityBox);
  identitySet.add(EqBox(1));
  print(
    'setIdentity ${identitySet.contains(identityBox)} '
    '${identitySet.contains(EqBox(1))} ${identitySet.length}',
  );

  final map = Map<String, int>.from({'one': 1, 'two': 2});
  final mapOf = Map<String, int>.of(map);
  final mapFixed = Map<String, int>.unmodifiable(mapOf);
  print('map ${mapFixed.length} ${mapFixed['one']} ${mapFixed.keys.join(',')}');
  final eqMapSource = <EqBox, String>{};
  eqMapSource[EqBox(1)] = 'one';
  eqMapSource[EqBox(1)] = 'uno';
  final eqMapFixed = Map<EqBox, String>.unmodifiable(eqMapSource);
  print(
    'mapFixed ${eqMapFixed.length} ${eqMapFixed[EqBox(1)]} '
    '${eqMapFixed.containsKey(EqBox(1))}',
  );

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
