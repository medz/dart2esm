int addOne(int value) {
  return value + 1;
}

int applyTwice(int Function(int) callback, int value) {
  return callback(callback(value));
}

void main() {
  final base = 3;

  int addBase(int value) {
    return value + base;
  }

  final multiply = (int value) {
    return value * 2;
  };

  final top = addOne;

  print(addBase(4));
  print(multiply(5));
  print(applyTwice(top, 1));
  print(applyTwice((value) => value + base, 2));
}
