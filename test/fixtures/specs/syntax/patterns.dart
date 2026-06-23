String classify(Object value) {
  if (value case int n when n.isEven) {
    return 'even $n';
  }
  return switch (value) {
    String s => 'string $s',
    (int a, int b) => 'record ${a + b}',
    _ => 'other',
  };
}

class Pair {
  const Pair(this.left, this.right);

  final int left;
  final int right;
}

String shape(Object? value) {
  return switch (value) {
    [int first, int second] => 'list ${first + second}',
    {'name': String name, 'age': int age} => 'map $name $age',
    Pair(left: final left, right: final right) when left < right =>
      'pair $left $right',
    int() && > 0 && < 10 => 'small number $value',
    null => 'null',
    _ => 'unknown',
  };
}

void main() {
  final (first, second) = (1, 2);
  print('destructure $first $second');
  print(classify(4));
  print(classify('dart'));
  print(classify((2, 3)));
  print(classify(true));
  print(shape([3, 4]));
  print(shape({'name': 'Ada', 'age': 37}));
  print(shape(const Pair(1, 2)));
  print(shape(5));
  print(shape(null));
  print(shape('x'));
}
