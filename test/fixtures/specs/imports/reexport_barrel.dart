export 'reexport_leaf.dart' show LeafThing, leafValue;

const barrelValue = 5;
const _privateBarrelValue = 6;

class BarrelThing {
  String label() => 'barrel:$barrelValue';
}

String privateBarrelLabel() => _PrivateBarrelThing().label();

class _PrivateBarrelThing {
  String label() => 'private:$_privateBarrelValue';
}
