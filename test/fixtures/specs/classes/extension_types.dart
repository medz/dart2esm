extension type UserId(int value) {
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
  print('${UserId.parse('9').value} ${UserId.zeroValue} ${(id + 3).value}');
  final make = UserId.new;
  final parse = UserId.parse;
  final plus = id.plus;
  print('${id.doubled} ${make(4).value} ${parse('10').value} ${plus(6)}');
}
