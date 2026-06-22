abstract interface class NamedThing {
  String get name;

  String describe();
}

class Person implements NamedThing {
  @override
  String name;

  Person(this.name);

  @override
  String describe() => 'person:$name';
}

dynamic hide(dynamic value) => value;

void main() {
  NamedThing thing = Person('ada');
  final maybeThing = hide(thing);
  print('${thing.name} ${thing.describe()} ${maybeThing is NamedThing}');
}
