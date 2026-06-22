String castList(Object? value) {
  try {
    final list = value as List;
    return 'list ${list.length}';
  } catch (_) {
    return 'list blocked';
  }
}

String castNullableString(Object? value) {
  try {
    final text = value as String?;
    return 'string $text';
  } catch (_) {
    return 'string blocked';
  }
}

String castRecord(Object? value) {
  try {
    final record = value as (int, {String label});
    return 'record ${record.$1} ${record.label}';
  } catch (_) {
    return 'record blocked';
  }
}

void main() {
  print(castList([1, 2]));
  print(castList({'a': 1}));
  print(castNullableString(null));
  print(castNullableString('x'));
  print(castNullableString(1));
  print(castRecord((3, label: 'three')));
  print(castRecord((label: 'three', value: 3)));
}
