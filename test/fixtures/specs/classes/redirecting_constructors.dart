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

void main() {
  final zero = Point.zero();
  final alias = Point.alias(4);
  final dog = Dog.named('Rex', 4);
  final puppy = Puppy.named('Tiny');

  print(zero.describe());
  print(alias.describe());
  print(dog.describe());
  print(puppy.describe());
}
