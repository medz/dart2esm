class Box<T> {
  T value;

  Box(this.value);

  T read() => value;
}

T identity<T>(T value) => value;

extension StringTools on String {
  String twice() => this + this;
}

mixin Named {
  String get name;

  String label() => 'name:$name';
}

class User with Named {
  @override
  String name;

  User(this.name);
}

void main() {
  final box = Box<int>(3);
  print('${box.read()} ${identity('x')} ${'a'.twice()} ${User('u').label()}');
}
