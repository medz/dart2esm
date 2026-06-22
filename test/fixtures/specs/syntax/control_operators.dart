class Box {
  int value;

  Box(this.value);

  int bump(int amount) {
    value = value + amount;
    return value;
  }

  String describe() => 'box:$value';
}

String describe(Box? maybe) {
  final first = maybe?.value ?? -1;
  final second = maybe?.bump(2) ?? -2;
  var assigned = maybe;
  assigned ??= Box(7);
  final cascaded = Box(1)
    ..value = 3
    ..bump(4);
  final bits = ~first;
  final truth = !(second < 0);
  return '$first $second ${assigned.describe()} ${cascaded.describe()} $bits $truth';
}

void main() {
  print(describe(Box(5)));
  print(describe(null));
}
