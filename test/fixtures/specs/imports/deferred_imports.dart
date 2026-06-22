import 'math_helpers.dart' deferred as helpers;

Future<void> main() async {
  await helpers.loadLibrary();
  print('deferred add ${helpers.add(3, 4)}');
  print('deferred counter ${helpers.helperCounter}');
}
