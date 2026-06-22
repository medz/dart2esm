dynamic hide(Object? value) => value;

void main() {
  final ordered = Object.hash(1, 'a');
  final orderedAgain = Object.hash(1, 'a');
  final fromIterable = Object.hashAll([1, 'a']);
  final reversed = Object.hashAll(['a', 1]);
  final unorderedA = Object.hashAllUnordered({'a', 'b'});
  final unorderedB = Object.hashAllUnordered({'b', 'a'});

  print(hide(ordered) is int);
  print('${ordered == orderedAgain} ${ordered == fromIterable}');
  print(ordered == reversed);
  print(unorderedA == unorderedB);
}
