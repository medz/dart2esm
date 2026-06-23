library parts_api;

part 'parts_impl.dart';

final rootValue = PartThing('root').label();

void main() {
  final thing = PartThing('api');
  print('${thing.label()} $rootValue ${privatePartLabel()}');
}
