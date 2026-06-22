class Animal {
  String name;

  Animal(this.name);

  String describe() => 'animal $name';
}

class Dog extends Animal {
  int age;
  String label;

  Dog(this.age, String name) : label = 'dog', super(name);

  Dog.named(String name, this.age) : label = 'named dog', super(name) {
    label = '$label!';
  }

  String describe() => '${super.describe()} $label $age';
}

class Cat extends Animal {
  int lives;

  Cat.named(String name) : lives = 9, super(name);

  String describe() => '${super.describe()} cat $lives';
}

void main() {
  final dog = Dog.named('Rex', 4);
  final regular = Dog(2, 'Ada');
  final cat = Cat.named('Mia');

  print(dog.describe());
  print(regular.describe());
  print(cat.describe());
}
