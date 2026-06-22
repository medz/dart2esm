class Point {
  int x;
  int y;
  String label;

  Point(this.x, this.y) : label = 'point';

  Point.zero() : this(0, 0);

  Point.named(this.x, this.y, this.label);

  Point.alias(int value) : this.named(value, value + 1, 'alias');

  String describe() => '$label:$x,$y';
}

class Pair {
  int left;
  int right;
  String label;

  Pair() : this.named(0, 1, 'default');

  Pair.named(this.left, this.right, this.label);

  Pair.mirror(int value) : this.named(value, value, 'mirror');

  String describe() => '$label:$left,$right';
}

class Range {
  int start;
  int end;

  Range.start([int start = 0]) : this.between(start, start + 10);

  Range.between(this.start, this.end);

  String describe() => '$start..$end';
}

class Options {
  int count;
  String label;
  bool enabled;

  Options.named({
    required this.count,
    this.label = 'default',
    this.enabled = true,
  });

  Options.defaults() : this.named(count: 1);

  Options.from({required int count, String label = 'from'})
    : this.named(count: count, label: label);

  Options.disabled(int count)
    : this.named(count: count, label: 'off', enabled: false);

  String describe() => '$label:$count:$enabled';
}

class Animal {
  String name;
  String source;

  Animal.named(this.name) : source = 'animal';

  String describe() => '$source $name';
}

class Dog extends Animal {
  int age;
  String label;

  Dog.named(String name, int age) : this.full(name, age, 'dog');

  Dog.full(String name, this.age, this.label) : super.named(name) {
    label = '$label!';
  }

  String describe() => '${super.describe()} $label $age';
}

class Puppy extends Dog {
  String toy;

  Puppy.named(String name) : this.full(name, 1, 'ball');

  Puppy.full(String name, int age, this.toy) : super.named(name, age);

  String describe() => '${super.describe()} toy $toy';
}

class ColoredPoint extends Point {
  String color;

  ColoredPoint.zero(this.color) : super.zero();

  String describe() => '${super.describe()} $color';
}

class WrappedPair extends Pair {
  String wrapper;

  WrappedPair(this.wrapper) : super();

  String describe() => '${super.describe()} $wrapper';
}

void main() {
  final zero = Point.zero();
  final alias = Point.alias(4);
  final pair = Pair();
  final mirror = Pair.mirror(5);
  final defaultRange = Range.start();
  final shiftedRange = Range.start(5);
  final defaults = Options.defaults();
  final from = Options.from(count: 2);
  final disabled = Options.disabled(3);
  final dog = Dog.named('Rex', 4);
  final puppy = Puppy.named('Tiny');
  final colored = ColoredPoint.zero('red');
  final wrapped = WrappedPair('wrapped');

  print(zero.describe());
  print(alias.describe());
  print(pair.describe());
  print(mirror.describe());
  print(defaultRange.describe());
  print(shiftedRange.describe());
  print(defaults.describe());
  print(from.describe());
  print(disabled.describe());
  print(dog.describe());
  print(puppy.describe());
  print(colored.describe());
  print(wrapped.describe());
}
