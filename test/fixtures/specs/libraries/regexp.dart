void main() {
  final pattern = RegExp(r'([a-z]+)-(\d+)', caseSensitive: false);
  final input = 'Item-42 next-7';
  final first = pattern.firstMatch(input)!;

  print('has ${pattern.hasMatch(input)} ${pattern.hasMatch('none')}');
  print(
    'first ${first.group(0)} ${first.group(1)} ${first[2]} ${first.groupCount}',
  );
  print('span ${first.start} ${first.end}');
  print('string ${pattern.stringMatch(input)}');

  final parts = <String>[];
  for (final match in pattern.allMatches(input)) {
    parts.add(match.group(0)!);
  }
  print('all $parts');

  final digits = RegExp(r'\d+');
  final mixed = 'a1 b22';
  print(
    'stringPattern ${mixed.contains(digits)} ${mixed.contains(digits, 2)} '
    '${mixed.startsWith(RegExp(r'a\d'))} ${mixed.indexOf(digits, 2)}',
  );
  print(
    'stringReplace ${mixed.split(digits).join('|')} '
    '${mixed.replaceAll(digits, '#')} ${mixed.replaceFirst(digits, '#')}',
  );
}
