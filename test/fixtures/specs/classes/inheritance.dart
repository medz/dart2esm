class Animal {
  String name;

  Animal(this.name);

  String describe() {
    return 'animal $name';
  }
}

class Dog extends Animal {
  int age;

  Dog(String name, this.age) : super(name);

  @override
  String describe() {
    return 'dog $name $age';
  }

  String birthday() {
    age = age + 1;
    return describe();
  }
}

Object identity(Object value) {
  return value;
}

void main() {
  final dog = Dog('Rex', 4);
  final value = identity(dog);
  print(dog.describe());
  print(dog.birthday());
  print('animal ${value is Animal}');
  print('dog ${value is Dog}');
}
