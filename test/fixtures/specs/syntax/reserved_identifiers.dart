String describe(int arguments, int eval) {
  final value = arguments + eval;
  return '$value ${arguments * eval}';
}

void main() {
  print(describe(2, 3));
}
