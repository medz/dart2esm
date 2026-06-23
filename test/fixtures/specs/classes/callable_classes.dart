class Adder {
  const Adder(this.base);

  final int base;

  int call(int value) => base + value;
}

const add2 = Adder(2);

int apply(int Function(int) fn, int value) => fn(value);

void main() {
  final add3 = Adder(3);
  dynamic dynamicAdder = add3;
  dynamic dynamicFunction = (int value) => value * 2;
  print('${add2(5)} ${add3(5)} ${apply(add2.call, 6)}');
  print('${dynamicAdder(4)} ${dynamicFunction(4)}');
}
