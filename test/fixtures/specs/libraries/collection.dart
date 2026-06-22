import 'dart:collection';

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
}
