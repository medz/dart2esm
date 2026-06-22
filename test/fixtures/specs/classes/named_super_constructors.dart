class Animal {
  String name;
  String source;

  Animal.named(this.name) : source = 'named animal' {
    source = '$source!';
  }

  String describe() => '$source $name';
}

class Dog extends Animal {
  int age;
  String label;

  Dog.named(String name, this.age) : label = 'dog', super.named(name) {
    label = '$label!';
  }

  String describe() => '${super.describe()} $label $age';
}

class Puppy extends Dog {
  String toy;

  Puppy.named(String name, int age, this.toy) : super.named(name, age);

  String describe() => '${super.describe()} toy $toy';
}

void main() {
  final dog = Dog.named('Rex', 4);
  final puppy = Puppy.named('Tiny', 1, 'ball');

  print(dog.describe());
  print(puppy.describe());
}
