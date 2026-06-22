const fixedRecord = (4, label: 'four');

({String label, int value}) makeNamed(int value) {
  return (label: 'v$value', value: value);
}

(int, {String label}) makeMixed(int value) {
  return (value, label: 'v$value');
}

void main() {
  final pair = (1, 'two');
  print('pair ${pair.$1} ${pair.$2}');

  final named = makeNamed(2);
  print('named ${named.label} ${named.value}');

  final mixed = makeMixed(3);
  print('mixed ${mixed.$1} ${mixed.label}');
  print('record $mixed');
  print('equals ${mixed == (3, label: 'v3')}');

  final ordered = (z: 1, a: 2);
  print('ordered $ordered');
  print('ordered equals ${ordered == (a: 2, z: 1)}');
}
