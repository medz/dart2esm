const exportedValue = 7;
const hiddenValue = 9;

class ExportedThing {
  ExportedThing(this.name);

  final String name;

  String label() => '$name:$exportedValue';
}

class HiddenThing {
  String label() => 'hidden:$hiddenValue';
}
