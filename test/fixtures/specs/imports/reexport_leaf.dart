const leafValue = 3;
const hiddenLeafValue = 4;

class LeafThing {
  LeafThing(this.name);

  final String name;

  String label() => '$name:$leafValue';
}

class HiddenLeafThing {
  String label() => 'hidden:$hiddenLeafValue';
}
