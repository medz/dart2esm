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

  final names = <String>{'ada', 'bob'};
  names.add('cy');
  names.remove('bob');
  print(
    'set ${names.length} ${names.contains('ada')} ${names.contains('bob')}',
  );
  print('set join ${names.join('/')}');

  final counts = <String, int>{'one': 1};
  counts['two'] = 2;
  print('map ${counts.length} ${counts.containsKey('two')} ${counts['one']}');
  print('map iter ${counts.keys.join(',')} ${counts.values.join(',')}');
  counts.remove('one');
  print('map removed ${counts.length} ${counts['one']}');
}
