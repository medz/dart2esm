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
    '${mixed.startsWith(RegExp(r'a\d'))} ${mixed.indexOf(digits, 2)} '
    '${mixed.lastIndexOf(digits)} ${mixed.lastIndexOf(digits, 2)}',
  );
  print(
    'stringReplace ${mixed.split(digits).join('|')} '
    '${mixed.replaceAll(digits, '#')} ${mixed.replaceFirst(digits, '#')}',
  );
  print(
    'mapped ${mixed.replaceAllMapped(digits, (match) => '[${match.group(0)}:${match.start}]')} '
    '${mixed.replaceFirstMapped(digits, (match) => '[${match[0]}]', 2)}',
  );
  print(
    'splitMap ${mixed.splitMapJoin(digits, onMatch: (match) => '<${match[0]}>', onNonMatch: (part) => part.toUpperCase())}',
  );
  print(
    'stringMapped ${'aa bb aa'.replaceAllMapped('aa', (match) => '${match.start}:${match.group(0)}')} '
    '${'aa bb aa'.splitMapJoin('bb', onMatch: (match) => '<${match.group(0)}>', onNonMatch: (part) => part.trim())}',
  );
  final stringPatternMatches = 'aa'.allMatches('aa bb aa', 1);
  final stringPrefix = 'bb'.matchAsPrefix('aa bb aa', 3)!;
  print(
    'stringPatternDirect ${stringPatternMatches.map((match) => match.start).join(',')} '
    '${stringPrefix.group(0)} ${stringPrefix.start} ${stringPrefix.end}',
  );

  final prefix = digits.matchAsPrefix(mixed, 1)!;
  print(
    'meta ${pattern.pattern} ${pattern.isCaseSensitive} '
    '${pattern.isMultiLine} ${pattern.isUnicode} ${pattern.isDotAll}',
  );
  print('prefix ${prefix.group(0)} ${prefix.start} ${prefix.end}');
  print('groups ${first.groups([0, 1, 2]).join('|')}');

  final named = RegExp(r'(?<word>[a-z]+)(?<digits>\d+)');
  final namedMatch = named.firstMatch('ab12')!;
  print(
    'named ${namedMatch.namedGroup('word')} '
    '${namedMatch.namedGroup('digits')} ${namedMatch.groupNames.join(',')}',
  );

  final escaped = RegExp.escape('[a-z]+');
  print(
    'escape ${RegExp(escaped).hasMatch('[a-z]+')} '
    '${RegExp(escaped).hasMatch('abc')}',
  );
}
