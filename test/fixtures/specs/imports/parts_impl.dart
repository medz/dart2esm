part of parts_api;

class PartThing {
  PartThing(this.name);

  final String name;

  String label() => '$name:$partValue';
}

const partValue = 11;
const _privatePartValue = 12;

String privatePartLabel() => _PrivatePartThing().label();

class _PrivatePartThing {
  String label() => 'private:$_privatePartValue';
}
