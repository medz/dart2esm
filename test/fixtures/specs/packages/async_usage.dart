import 'package:async/async.dart';

Future<void> main() async {
  final result = await Result.capture(Future<int>.value(42));
  final queue = StreamQueue<int>(Stream<int>.fromIterable([1, 2, 3]));
  final first = await queue.next;
  await queue.skip(1);
  final last = await queue.next;
  await queue.cancel();

  final group = StreamGroup<int>();
  final groupedFuture = group.stream.toList();
  group.add(Stream<int>.fromIterable([4, 5]));
  await group.close();
  final grouped = await groupedFuture;

  final cache = AsyncCache<String>.ephemeral();
  final cached = await cache.fetch(() => Future<String>.value('cached'));

  print(
    'async ${result.asValue!.value} $first $last ${grouped.join('|')} $cached',
  );
}
