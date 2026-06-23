import 'exported_members.dart';

export 'exported_members.dart' show ExportedThing, exportedValue;

void main() {
  final thing = ExportedThing('api');
  print('${thing.label()} $hiddenValue ${HiddenThing().label()}');
}
