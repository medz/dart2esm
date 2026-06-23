import 'dart:collection';

int descendingInt(int left, int right) => right.compareTo(left);

int descendingString(String left, String right) => right.compareTo(left);

void main() {
  final map = HashMap<String, int>();
  map['one'] = 1;
  map['two'] = 2;
  print('hashMap ${map.length} ${map.containsKey('two')} ${map['one']}');

  final set = HashSet<String>();
  set.add('a');
  set.add('b');
  set.add('a');
  print('hashSet ${set.length} ${set.contains('a')} ${set.join(',')}');

  final queue = Queue<int>();
  queue.add(1);
  queue.addFirst(0);
  queue.addLast(2);
  print(
    'queue ${queue.length} ${queue.first} ${queue.last} ${queue.join(',')}',
  );
  print(
    'remove ${queue.removeFirst()} ${queue.removeLast()} ${queue.join(',')}',
  );

  final linked = DoubleLinkedQueue<String>();
  linked.addAll(['b', 'c']);
  linked.addFirst('a');
  print(
    'linkedQueue ${linked.length} ${linked.remove('b')} ${linked.join(',')}',
  );

  final copied = ListQueue<int>.from([1, 2, 3, 4]);
  copied.removeWhere((value) => value.isOdd);
  copied.retainWhere((value) => value > 2);
  copied.addAll(Queue<int>.of([5, 6]));
  print(
    'listQueue ${copied.first} ${copied.last} ${copied.isNotEmpty} '
    '${copied.join(',')}',
  );
  print(
    'queueIter ${copied.elementAt(1)} ${copied.toList().join('|')} '
    '${copied.any((value) => value == 5)} '
    '${copied.every((value) => value > 0)}',
  );
  copied.clear();
  print('queueClear ${copied.length} ${copied.isEmpty}');

  final sortedSet = SplayTreeSet<int>();
  sortedSet.addAll([3, 1, 2]);
  print('splaySet ${sortedSet.join(',')} ${sortedSet.contains(2)}');

  final sortedMap = SplayTreeMap<String, int>();
  sortedMap['b'] = 2;
  sortedMap['a'] = 1;
  print(
    'splayMap ${sortedMap.keys.join(',')} ${sortedMap.values.join(',')} '
    '${sortedMap['b']}',
  );

  final reversedSet = SplayTreeSet<int>.of([1, 3, 2], descendingInt);
  final duplicateAdded = reversedSet.add(2);
  final newAdded = reversedSet.add(0);
  print('splaySetOf ${reversedSet.join(',')} $duplicateAdded $newAdded');

  final reversedMap = SplayTreeMap<String, int>.of({
    'a': 1,
    'c': 3,
    'b': 2,
  }, descendingString);
  reversedMap['d'] = 4;
  reversedMap['a'] = 10;
  print(
    'splayMapOf ${reversedMap.keys.join(',')} '
    '${reversedMap.values.join(',')} ${reversedMap['a']}',
  );
}
