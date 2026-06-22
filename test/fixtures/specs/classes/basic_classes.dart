class Counter {
  int value;

  Counter(this.value);

  void add(int amount) {
    value = value + amount;
  }

  int get doubled => value * 2;
}

void main() {
  final counter = Counter(3);
  counter.add(4);
  print('value ${counter.value}');
  print('double ${counter.doubled}');
}
