import 'package:args/args.dart';

void main() {
  final command = ArgParser()
    ..addFlag('watch', defaultsTo: true)
    ..addOption('host', defaultsTo: 'localhost');
  final parser = ArgParser(allowTrailingOptions: false)
    ..addFlag('verbose', abbr: 'v', negatable: false)
    ..addOption('mode', allowed: ['debug', 'release'], defaultsTo: 'debug')
    ..addMultiOption('define', abbr: 'D')
    ..addCommand('serve', command);

  final results = parser.parse([
    '--mode',
    'release',
    '-v',
    '-Dfoo=bar',
    '-D',
    'answer=42',
    'serve',
    '--no-watch',
    '--host',
    '0.0.0.0',
    'web',
  ]);
  final subcommand = results.command!;

  print(
    'args ${results['mode']} ${results['verbose']} '
    '${(results['define'] as List<String>).join('|')} '
    '${subcommand.name} ${subcommand['watch']} ${subcommand['host']} '
    '${subcommand.rest.join(',')} ${results.wasParsed('mode')}',
  );

  try {
    parser.parse(['--mode', 'profile']);
  } on FormatException catch (error) {
    print('args-error ${error.message.split('\n').first}');
  }

  print(
    'usage ${parser.usage.contains('--mode')} ${parser.commands.keys.join(',')}',
  );
}
