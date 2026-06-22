String describe(String name, [String punctuation = '!', int repeat = 1]) {
  var out = '';
  for (var i = 0; i < repeat; i = i + 1) {
    out = '$out$name$punctuation';
  }
  return out;
}

String tag(String value, {String prefix = 'item', required int index}) {
  return '$prefix:$index:$value';
}

class Formatter {
  String wrap(String value, {String left = '[', String right = ']'}) {
    return '$left$value$right';
  }
}

void main() {
  print(describe('a'));
  print(describe('b', '?', 2));
  print(tag('x', index: 3));
  print(tag('y', prefix: 'custom', index: 4));
  final formatter = Formatter();
  print(formatter.wrap('z'));
  print(formatter.wrap('z', right: ')', left: '('));
}
