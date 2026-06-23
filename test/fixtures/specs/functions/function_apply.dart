int add(int left, int right) => left + right;

String describe(String name, {int count = 1, bool loud = false}) {
  final value = '$name:$count';
  return loud ? value.toUpperCase() : value;
}

String invokeDescribe(
  Function function,
  List<Object?> positional,
  Map<Symbol, Object?> named,
) {
  return Function.apply(function, positional, named) as String;
}

void main() {
  final local = (int value, {int add = 0}) => value + add;

  print('positional ${Function.apply(add, [2, 3])}');
  print('named ${Function.apply(describe, ['ada'], {#count: 3, #loud: true})}');
  print('local ${Function.apply(local, [4], {#add: 5})}');
  print('forward ${invokeDescribe(describe, ['dart'], {#count: 2})}');
}
