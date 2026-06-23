import 'package:collection/collection.dart';

void main() {
  final numbers = [1, 2, 3, 4, 5];
  final firstEven = numbers.firstWhereOrNull((value) => value.isEven);
  final groups = groupBy([
    'aa',
    'b',
    'cc',
    'd',
  ], (String value) => value.length);
  final deepEqual = const DeepCollectionEquality().equals(
    {
      'a': [1, 2],
    },
    {
      'a': [1, 2],
    },
  );
  final queue = PriorityQueue<int>()..addAll([3, 1, 2]);
  final ordered = [
    queue.removeFirst(),
    queue.removeFirst(),
    queue.removeFirst(),
  ];

  print(
    'collection $firstEven ${groups[2]!.join('|')} $deepEqual ${ordered.join(',')}',
  );
}
