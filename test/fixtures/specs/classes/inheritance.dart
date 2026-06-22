class Animal {
  String name;

  Animal(this.name);

  String get label => 'animal $name';

  set label(String value) {
    name = value;
  }

  String describe() {
    return 'animal $name';
  }
}

class Dog extends Animal {
  int age;

  Dog(String name, this.age) : super(name);

  @override
  String describe() {
    return '${super.describe()} dog $age';
  }

  String birthday() {
    age = age + 1;
    return describe();
  }

  String rename(String value) {
    super.label = value;
    return super.label;
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
  print(dog.rename('Ada'));
  print(dog.describe());
  print('animal ${value is Animal}');
  print('dog ${value is Dog}');
}
