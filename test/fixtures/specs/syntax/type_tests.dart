String flags(Object? value) {
  return '${value is Object} '
      '${value is Iterable} '
      '${value is List} '
      '${value is Set} '
      '${value is Map} '
      '${value is Function} '
      '${value is Record} '
      '${value is String?} '
      '${value is! String}';
}

String recordFlags(Object? value) {
  return '${value is (int, {String label})} '
      '${value is (String, {String label})} '
      '${value is (int, {String other})} '
      '${value is (int, int)} '
      '${value is Record?}';
}

void main() {
  print(flags([1, 2]));
  print(flags({1, 2}));
  print(flags({'a': 1}));
  print(flags(() => 1));
  print(flags((1, label: 'one')));
  print(flags('x'));
  print(flags(null));
  print(recordFlags((1, label: 'one')));
  print(recordFlags(null));
  print(recordFlags([1]));
}
