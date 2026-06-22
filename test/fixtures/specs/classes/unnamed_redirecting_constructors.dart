class Pair {
  int left;
  int right;
  String label;

  Pair() : this.named(0, 1, 'default');

  Pair.named(this.left, this.right, this.label);

  String describe() => '$label:$left,$right';
}

class Animal {
  String name;

  Animal.named(this.name);

  String describe() => 'animal $name';
}

class Dog extends Animal {
  int age;
  String label;

  Dog() : this.named('Rex', 4);

  Dog.named(String name, this.age) : label = 'dog', super.named(name) {
    label = '$label!';
  }

  String describe() => '${super.describe()} $label $age';
}

void main() {
  final pair = Pair();
  final dog = Dog();

  print(pair.describe());
  print(dog.describe());
}
