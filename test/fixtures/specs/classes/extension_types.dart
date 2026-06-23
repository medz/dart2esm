extension type UserId(int value) {
  factory UserId.zero() => UserId(0);

  static UserId parse(String text) => UserId(int.parse(text));

  static int get zeroValue => 0;

  int get doubled => value * 2;

  int plus(int amount) => value + amount;

  UserId operator +(int amount) => UserId(value + amount);
}

dynamic hide(dynamic value) => value;

void main() {
  final id = UserId(5);
  final maybeId = hide(id);
  print('${id.value} ${id.plus(2)} ${maybeId is UserId}');
  print(
    '${UserId.parse('9').value} ${UserId.zeroValue} ${(id + 3).value} '
    '${UserId.zero().value}',
  );
  final make = UserId.new;
  final parse = UserId.parse;
  final zero = UserId.zero;
  final plus = id.plus;
  print(
    '${id.doubled} ${make(4).value} ${parse('10').value} '
    '${zero().value} ${plus(6)}',
  );
}
