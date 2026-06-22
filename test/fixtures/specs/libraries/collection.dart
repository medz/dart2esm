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
}
