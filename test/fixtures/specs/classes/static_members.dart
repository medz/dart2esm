int initCount = 0;

int init(String name, int value) {
  print('init $name');
  initCount = initCount + 1;
  return value;
}

class Accumulator {
  static const offset = 3;
  static int total = init('total', 10);
  static final readonly = init('readonly', 40);

  int value;

  Accumulator(this.value);

  static int bump(int amount) {
    total = total + amount + offset;
    return total;
  }

  static int get doubledTotal => total * 2;

  int addToTotal() {
    return bump(value);
  }
}

void main() {
  print('offset ${Accumulator.offset}');
  print('first ${Accumulator.total}');
  print('bump ${Accumulator.bump(4)}');
  final accumulator = Accumulator(5);
  print('instance ${accumulator.addToTotal()}');
  print('double ${Accumulator.doubledTotal}');
  print('readonly ${Accumulator.readonly}');
  print('count $initCount');
}
