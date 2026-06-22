Iterable<int> syncValues() sync* {
  yield 1;
  yield* [2, 3];
}

Stream<int> asyncValues() async* {
  yield 4;
  yield 5;
}

Future<void> main() async {
  for (final value in syncValues()) {
    print('sync $value');
  }
  await for (final value in asyncValues()) {
    print('async $value');
  }
}
