import 'dart:math' as math;

class EqBox {
  EqBox(this.value);

  final int value;

  @override
  bool operator ==(Object other) => other is EqBox && other.value == value;

  @override
  int get hashCode => value.hashCode;
}

void main() {
  final values = List<int>.filled(3, 1, growable: true);
  values[1] = 2;
  values.add(4);
  values.addAll([5, 6]);
  print('list ${values.length} ${values.first} ${values.last}');
  print('list contains ${values.contains(3)} ${values.contains(4)}');
  print('list join ${values.join(',')}');

  final generated = List<int>.generate(4, (index) => index * index);
  print('generated ${generated.join(':')}');

  final filtered = values
      .where((value) => value % 2 == 0)
      .map((value) => value * 10)
      .toList();
  print('filtered ${filtered.join('|')}');
  print(
    'fold ${values.fold<int>(0, (total, value) => total + value)} '
    '${values.any((value) => value > 5)} ${values.every((value) => value > 0)}',
  );
  print(
    'iter ${values.skip(2).take(3).join(',')} ${values.elementAt(2)} '
    '${values.reduce((total, value) => total + value)}',
  );
  print(
    'iterMore ${values.takeWhile((value) => value < 4).join(',')} '
    '${values.skipWhile((value) => value < 4).join(',')} '
    '${values.followedBy([7]).join(',')} '
    '${values.expand((value) => [value, value * 10]).take(4).join(',')}',
  );
  print(
    'listQuery ${values.indexWhere((value) => value == 4)} '
    '${values.lastIndexWhere((value) => value == 1)} '
    '${values.getRange(1, 4).join(',')}',
  );
  final boxes = [EqBox(1), EqBox(2), EqBox(1)];
  print(
    'listEquality ${boxes.indexOf(EqBox(1))} ${boxes.indexOf(EqBox(1), 1)} '
    '${boxes.lastIndexOf(EqBox(1))} ${boxes.lastIndexOf(EqBox(1), 1)}',
  );
  print(
    'where ${values.firstWhere((value) => value > 3)} '
    '${values.lastWhere((value) => value.isOdd)} '
    '${values.singleWhere((value) => value == 4)} '
    '${values.firstWhere((value) => value > 99, orElse: () => -1)}',
  );
  final mixedValues = <Object?>[1, 'two', null, 3, 'four'];
  print(
    'typed ${mixedValues.whereType<int>().join(',')} '
    '${mixedValues.nonNulls.join('|')} '
    '${values.cast<num>().map((value) => value + 1).join(',')}',
  );
  print(
    'indexed ${values.indexed.map((entry) => '${entry.$1}:${entry.$2}').take(3).join('|')}',
  );
  final singleValue = [42];
  final emptyValues = <int>[];
  print(
    'nullableQuery ${singleValue.single} ${singleValue.singleOrNull} '
    '${values.singleOrNull} ${emptyValues.firstOrNull} '
    '${values.firstOrNull} ${emptyValues.lastOrNull} ${values.lastOrNull} '
    '${emptyValues.singleOrNull} ${values.elementAtOrNull(2)} '
    '${values.elementAtOrNull(99)}',
  );
  var visited = 0;
  values.forEach((value) {
    visited += value;
  });
  print('forEach $visited');

  final mutable = [3, 1, 2];
  mutable.sort();
  final shuffled = [1, 2, 3, 4, 5];
  shuffled.shuffle(math.Random(1));
  final removed = mutable.removeAt(1);
  mutable.insert(1, 9);
  print(
    'mutable ${mutable.join(',')} $removed ${mutable.sublist(1).join(',')} '
    '${mutable.reversed.join(',')}',
  );
  print(
    'shuffle ${shuffled.length} ${shuffled.toSet().length} '
    '${shuffled.every((value) => value >= 1 && value <= 5)}',
  );
  final indexed = mutable.asMap();
  print('asMap ${indexed.length} ${indexed[1]}');
  final removedValue = mutable.remove(9);
  final removedMissing = mutable.remove(99);
  final removedLast = mutable.removeLast();
  print(
    'list remove $removedValue $removedMissing $removedLast ${mutable.join(',')}',
  );
  mutable.insertAll(1, [8, 7]);
  mutable.setAll(0, [4, 5]);
  mutable.fillRange(1, 2, 6);
  mutable.replaceRange(2, 3, [10, 11]);
  mutable.removeRange(0, 1);
  mutable.removeWhere((value) => value > 10);
  mutable.retainWhere((value) => value >= 6);
  print('list bulk ${mutable.join(',')}');

  final names = <String>{'ada', 'bob'};
  names.add('cy');
  names.remove('bob');
  print(
    'set ${names.length} ${names.contains('ada')} ${names.contains('bob')}',
  );
  print('set lookup ${names.lookup('ada')} ${names.lookup('missing')}');
  print('set join ${names.join('/')}');
  final setBulk = <String>{'a', 'b', 'c'};
  final hasAll = setBulk.containsAll(['a', 'c']);
  setBulk.removeAll(['b', 'x']);
  setBulk.retainAll(['a', 'z']);
  print('set bulk $hasAll ${setBulk.join(',')}');
  final setWhere = <int>{1, 2, 3, 4};
  setWhere.removeWhere((value) => value.isOdd);
  setWhere.retainWhere((value) => value > 2);
  print('set where ${setWhere.join(',')}');
  final setUnion = names.union({'ada', 'zoe'});
  final setIntersection = setUnion.intersection({'ada', 'missing'});
  final setDifference = setUnion.difference({'cy'});
  final castNames = names.cast<Object>();
  print(
    'set algebra ${setUnion.join(',')} ${setIntersection.join(',')} '
    '${setDifference.join(',')} ${castNames.contains('ada')}',
  );
  final eqSet = <EqBox>{};
  final firstBoxAdd = eqSet.add(EqBox(1));
  final duplicateBoxAdd = eqSet.add(EqBox(1));
  eqSet.addAll([EqBox(2), EqBox(2)]);
  final containsBox = eqSet.contains(EqBox(1));
  final removedBox = eqSet.remove(EqBox(2));
  final eqUnion = eqSet.union({EqBox(1), EqBox(3)});
  final eqIntersection = eqUnion.intersection({EqBox(1), EqBox(4)});
  final eqDifference = eqUnion.difference({EqBox(1)});
  print(
    'setEquality $firstBoxAdd $duplicateBoxAdd ${eqSet.length} '
    '$containsBox $removedBox ${eqSet.length} ${eqUnion.length} '
    '${eqIntersection.length} ${eqDifference.length}',
  );
  final eqToSet = [EqBox(1), EqBox(1), EqBox(2)].toSet();
  print('setToSet ${eqToSet.length} ${eqToSet.contains(EqBox(1))}');

  final counts = <String, int>{'one': 1};
  counts['two'] = 2;
  print('map ${counts.length} ${counts.containsKey('two')} ${counts['one']}');
  print('map iter ${counts.keys.join(',')} ${counts.values.join(',')}');
  final countKeys = counts.keys;
  print(
    'map views ${(<String, int>{}).keys.isEmpty} ${countKeys.isNotEmpty} '
    '${countKeys.length} ${countKeys.first} ${counts.values.last} '
    '${countKeys.join('|')}',
  );
  final three = counts.putIfAbsent('three', () => 3);
  counts.update('two', (value) => value * 10);
  counts.update('missing', (value) => value, ifAbsent: () => 4);
  final mapPairs = <String>[];
  counts.forEach((key, value) {
    mapPairs.add('$key=$value');
  });
  print(
    'map ops $three ${counts['two']} ${counts['missing']} ${mapPairs.join('|')}',
  );
  final transformSource = <String, int>{'a': 1, 'b': 2};
  transformSource.addEntries([MapEntry('c', 3)]);
  final transformed = transformSource.map(
    (key, value) => MapEntry('$key$value', value + 10),
  );
  final transformedCast = transformSource.cast<String, num>();
  print(
    'map transforms ${transformSource['c']} ${transformed['b2']} '
    '${(transformedCast['a'] ?? 0) + 1}',
  );
  final eqMap = <EqBox, String>{};
  eqMap[EqBox(1)] = 'one';
  eqMap[EqBox(1)] = 'uno';
  final eqContains = eqMap.containsKey(EqBox(1));
  final eqRead = eqMap[EqBox(1)];
  final eqExisting = eqMap.putIfAbsent(EqBox(1), () => 'new');
  final eqMissing = eqMap.putIfAbsent(EqBox(2), () => 'two');
  final eqUpdated = eqMap.update(EqBox(2), (value) => '$value!');
  final eqRemoved = eqMap.remove(EqBox(1));
  eqMap.addAll({EqBox(2): 'twoAgain', EqBox(3): 'three'});
  eqMap.addEntries([MapEntry(EqBox(3), 'tres')]);
  final identityMap = Map<EqBox, String>.identity();
  identityMap[EqBox(1)] = 'one';
  print(
    'mapEquality $eqContains $eqRead $eqExisting $eqMissing $eqUpdated '
    '$eqRemoved ${eqMap[EqBox(2)]} ${eqMap[EqBox(3)]} ${eqMap.length} '
    '${identityMap.containsKey(EqBox(1))} ${identityMap.length}',
  );
  counts.remove('one');
  print('map removed ${counts.length} ${counts['one']}');
  counts.updateAll((key, value) => value + key.length);
  counts.removeWhere((key, value) => value.isEven);
  final entries = counts.entries.map((entry) => '${entry.key}:${entry.value}');
  print('map more ${counts.containsValue(27)} ${entries.join('|')}');
  counts.clear();
  print('map cleared ${counts.isEmpty}');
}
