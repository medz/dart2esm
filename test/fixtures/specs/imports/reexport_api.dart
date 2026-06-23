import 'reexport_barrel.dart';
import 'reexport_leaf.dart';

export 'reexport_barrel.dart' hide barrelValue, privateBarrelLabel;

void main() {
  final leaf = LeafThing('api');
  print(
    '${leaf.label()} ${BarrelThing().label()} '
    '$hiddenLeafValue ${HiddenLeafThing().label()}',
  );
}
