extension type UserId(int value) {
  int plus(int amount) => value + amount;
}

dynamic hide(dynamic value) => value;

void main() {
  final id = UserId(5);
  final maybeId = hide(id);
  print('${id.value} ${id.plus(2)} ${maybeId is UserId}');
}
