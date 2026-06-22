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

void main() {
  final (first, second) = (1, 2);
  print('destructure $first $second');
  print(classify(4));
  print(classify('dart'));
  print(classify((2, 3)));
  print(classify(true));
}
