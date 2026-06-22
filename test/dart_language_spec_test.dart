import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  test(
    'syntax fixtures are backed by dart-lang/language spec sources',
    () async {
      final repo = await _dartLanguageRepo();
      final languageSpec = await File(
        p.join(repo.path, 'specification', 'dartLangSpec.tex'),
      ).readAsLines();
      final superParametersSpec = await File(
        p.join(
          repo.path,
          'accepted',
          '2.17',
          'super-parameters',
          'feature-specification.md',
        ),
      ).readAsLines();
      final constructorTearOffsSpec = await File(
        p.join(
          repo.path,
          'accepted',
          '2.15',
          'constructor-tearoffs',
          'feature-specification.md',
        ),
      ).readAsLines();
      final classModifiersSpec = await File(
        p.join(
          repo.path,
          'accepted',
          '3.0',
          'class-modifiers',
          'feature-specification.md',
        ),
      ).readAsLines();

      expect(
        _exactLine(languageSpec, '<redirection> ::='),
        r"<redirection> ::= `:' \THIS{} (`.' <identifier>)? <arguments>",
      );
      expect(
        _exactLine(languageSpec, '<tryStatement> ::='),
        r'<tryStatement> ::= \TRY{} <block> (<onPart>+ <finallyPart>? | <finallyPart>)',
      );
      expect(
        _exactLine(languageSpec, '<switchStatement> ::='),
        r'<switchStatement> ::= \gnewline{}',
      );
      expect(
        _exactLine(languageSpec, '<switchCase> ::='),
        r"<switchCase> ::= <label>* \CASE{} <expression> `:' <statements>",
      );
      expect(
        _exactLine(languageSpec, '<continueStatement> ::='),
        r"<continueStatement> ::= \CONTINUE{} <identifier>? `;'",
      );
      expect(
        _exactLine(languageSpec, '<onPart> ::='),
        r'<onPart> ::= <catchPart> <block>',
      );
      expect(
        _exactLine(languageSpec, r'  \alt \ON{} <typeNotVoid>'),
        r'  \alt \ON{} <typeNotVoid> <catchPart>? <block>',
      );
      expect(
        _exactLine(languageSpec, '<catchPart> ::='),
        r"<catchPart> ::= \CATCH{} `(' <identifier> (`,' <identifier>)? `)'",
      );
      expect(
        _exactLine(
          languageSpec,
          '<redirectingFactoryConstructorSignature> ::=',
        ),
        r'<redirectingFactoryConstructorSignature> ::= \gnewline{}',
      );
      expect(
        _exactLine(
          languageSpec,
          r'  \CONST? \FACTORY{} <constructorName> <formalParameterList> `=',
        ),
        r"  \CONST? \FACTORY{} <constructorName> <formalParameterList> `=' \gnewline{}",
      );
      expect(
        _exactLine(languageSpec, '<constructorDesignation> ::='),
        r'<constructorDesignation> ::= <typeIdentifier>',
      );
      expect(
        _exactLine(
          languageSpec,
          'It is a compile-time error if \$k\$ explicitly specifies',
        ),
        r'It is a compile-time error if $k$ explicitly specifies',
      );
      expect(
        _exactLine(
          languageSpec,
          r'Otherwise the exception is matched against the first clause.',
        ),
        r'Otherwise the exception is matched against the first clause.',
      );
      expect(
        _exactLine(languageSpec, r'and $t_1$ is bound to the stack trace $t$,'),
        r'and $t_1$ is bound to the stack trace $t$,',
      );
      expect(
        _exactLine(languageSpec, r'The \RETHROW{} statement then throws'),
        r'The \RETHROW{} statement then throws (\ref{statementCompletion})',
      );
      expect(
        _exactLineSequence(languageSpec, [
          r'If execution of $\{s_h\}$ continues to a label',
          r'(\ref{statementCompletion}),',
          r'and the label is $label_{ij}$,',
          r'where $1 \le i \le n+1$ if the \SWITCH{} statement has a \DEFAULT,',
          r'or $1 \le i \le n$ if there is no \DEFAULT,',
          r'and where $1 \le j \le j_{i}$,',
          r'then let $h$ be the smallest number such that $h \ge i$ and $s_h$ is non-empty.',
          r'If no such $h$ exists,',
          r'let $h = n + 1$ if the \SWITCH{} statement has a \DEFAULT,',
          r'otherwise let $h = n$.',
          r'The case statements $s_h$ are then executed (\ref{case-execute}).',
        ]),
        [
          r'If execution of $\{s_h\}$ continues to a label',
          r'(\ref{statementCompletion}),',
          r'and the label is $label_{ij}$,',
          r'where $1 \le i \le n+1$ if the \SWITCH{} statement has a \DEFAULT,',
          r'or $1 \le i \le n$ if there is no \DEFAULT,',
          r'and where $1 \le j \le j_{i}$,',
          r'then let $h$ be the smallest number such that $h \ge i$ and $s_h$ is non-empty.',
          r'If no such $h$ exists,',
          r'let $h = n + 1$ if the \SWITCH{} statement has a \DEFAULT,',
          r'otherwise let $h = n$.',
          r'The case statements $s_h$ are then executed (\ref{case-execute}).',
        ],
      );
      expect(
        _exactLine(
          superParametersSpec,
          'This document specifies a language feature',
        ),
        'This document specifies a language feature which allows concise propagation of parameters of a non-redirecting generative constructor to the superclass constructor it invokes.',
      );
      expect(
        _exactLine(
          constructorTearOffsSpec,
          'We effectively desugar constructor tear-off',
        ),
        '_We effectively desugar constructor tear-off into static method tear-off of a corresponding static function, which ensures that the behavior of constructor tear-offs is consistent with the behavior of static method tear-offs._',
      );
      expect(
        _exactLine(
          constructorTearOffsSpec,
          'We allow `TypeName.new` and `TypeName<typeArgs>.new`',
        ),
        'We allow `TypeName.new` and `TypeName<typeArgs>.new` everywhere we allow a reference to a named constructor. It instead refers to the unnamed constructor. We allow tear-offs of the unnamed constructor by using `.new` and then treating it as a named constructor tear-off. Examples:',
      );
      expect(
        _exactLine(constructorTearOffsSpec, 'factory C.d(T x) = D<T>.new'),
        '  factory C.d(T x) = D<T>.new;  // same as: `= D<T>;`',
      );
      expect(
        _exactLine(
          constructorTearOffsSpec,
          'const filledIntList = List<int>.filled',
        ),
        'const filledIntList = List<int>.filled;  // List<int> Function(int, int)',
      );
      expect(
        _exactLine(classModifiersSpec, 'Is not a redirecting constructor'),
        '*   Is not a redirecting constructor _(`Foo(...) : this.other(...);`)_,',
      );
      expect(
        _exactLine(classModifiersSpec, 'factory C.f = C;'),
        '  factory C.f = C;',
      );

      final generativeFixture = await File(
        p.join(
          'test',
          'fixtures',
          'specs',
          'classes',
          'redirecting_constructors.dart',
        ),
      ).readAsLines();
      expect(_redirectingGenerativeDeclarations(generativeFixture), [
        "Point.zero() : this(0, 0);",
        "Point.alias(int value) : this.named(value, value + 1, 'alias');",
        "Pair() : this.named(0, 1, 'default');",
        "Pair.mirror(int value) : this.named(value, value, 'mirror');",
        "Range.start([int start = 0]) : this.between(start, start + 10);",
        "Options.defaults() : this.named(count: 1);",
        "Options.from({required int count, String label = 'from'}) : this.named(count: count, label: label);",
        "Options.disabled(int count) : this.named(count: count, label: 'off', enabled: false);",
        "Dog.named(String name, int age) : this.full(name, age, 'dog');",
        "Puppy.named(String name) : this.full(name, 1, 'ball');",
      ]);

      final factoryFixture = await File(
        p.join(
          'test',
          'fixtures',
          'specs',
          'classes',
          'redirecting_factory_constructors.dart',
        ),
      ).readAsLines();
      expect(_redirectingFactoryDeclarations(factoryFixture), [
        'factory Shape(int size) = Square;',
        'factory Shape.named(int size) = Square.named;',
        'factory Shape.alias(int size) = Shape.named;',
        'factory Shape.newAlias(int size) = Square.new;',
        'factory Shape.withDefault([int size]) = Square.withDefault;',
        'factory Shape.options({int size, String label}) = Square.options;',
        'factory Widget.d() = Button;',
        'factory Widget.named(String label) = Button.named;',
      ]);

      final tearOffFixture = await File(
        p.join(
          'test',
          'fixtures',
          'specs',
          'classes',
          'constructor_tearoffs.dart',
        ),
      ).readAsLines();
      expect(_constructorTearOffDeclarations(tearOffFixture), [
        'final unnamed = Box.new;',
        'final unnamedAgain = Box.new;',
        'final named = Box.named;',
        'final alias = Box.alias;',
        'final aliasType = AliasBox.new;',
        'final options = Options.new;',
        'final intHolder = Holder<int>.new;',
        'const constMakers = <BoxMaker>[Box.new, Box.named, Box.alias];',
      ]);

      final exceptionsFixture = await File(
        p.join('test', 'fixtures', 'specs', 'control_flow', 'exceptions.dart'),
      ).readAsLines();
      expect(_exceptionHandlerLines(exceptionsFixture), [
        '} on ParseIssue catch (error) {',
        '} on NotFound catch (error, stack) {',
        '} on String catch (error) {',
        '} catch (error) {',
        '} catch (error) {',
        '} finally {',
        '} on ParseIssue {',
        '} catch (error) {',
        'rethrow;',
        '} on NotFound catch (error) {',
      ]);

      final switchContinueFixture = await File(
        p.join(
          'test',
          'fixtures',
          'specs',
          'control_flow',
          'switch_continue.dart',
        ),
      ).readAsLines();
      expect(_switchContinueLines(switchContinueFixture), [
        'first:',
        'continue second;',
        'second:',
        'grouped:',
        'skip:',
        'continue;',
        'jump:',
        'continue done;',
        'done:',
      ]);
    },
    timeout: const Timeout(Duration(minutes: 2)),
  );
}

Future<Directory> _dartLanguageRepo() async {
  final existing = Platform.environment['DART_LANGUAGE_REPO'];
  if (existing != null &&
      File(
        p.join(existing, 'specification', 'dartLangSpec.tex'),
      ).existsSync()) {
    return Directory(existing);
  }

  final tempDir = await Directory.systemTemp.createTemp('dart-language-spec-');
  addTearDown(() {
    if (tempDir.existsSync()) {
      tempDir.deleteSync(recursive: true);
    }
  });
  final result = await Process.run('git', [
    'clone',
    '--depth',
    '1',
    'https://github.com/dart-lang/language.git',
    tempDir.path,
  ]);
  expect(result.exitCode, 0, reason: '${result.stdout}\n${result.stderr}');
  return tempDir;
}

String _exactLine(List<String> lines, String needle) {
  final matches = lines.where((line) => line.contains(needle)).toList();
  expect(matches, hasLength(1), reason: needle);
  return matches.single;
}

List<String> _exactLineSequence(List<String> lines, List<String> expected) {
  final matches = <List<String>>[];
  for (var i = 0; i <= lines.length - expected.length; i++) {
    final candidate = lines.sublist(i, i + expected.length);
    if (_sameLines(candidate, expected)) {
      matches.add(candidate);
    }
  }
  expect(matches, hasLength(1), reason: expected.join('\n'));
  return matches.single;
}

bool _sameLines(List<String> left, List<String> right) {
  if (left.length != right.length) {
    return false;
  }
  for (var i = 0; i < left.length; i++) {
    if (left[i] != right[i]) {
      return false;
    }
  }
  return true;
}

List<String> _redirectingGenerativeDeclarations(List<String> lines) {
  final source = _singleLineDeclarations(lines);
  final pattern = RegExp(
    r'^(?:[A-Z]\w*)(?:\.\w+)?\([^;]*\) : this(?:\.\w+)?\([^;]*\);$',
  );
  return source.where((line) => pattern.hasMatch(line)).toList();
}

List<String> _redirectingFactoryDeclarations(List<String> lines) {
  final source = _singleLineDeclarations(lines);
  final pattern = RegExp(r'^factory [A-Z]\w*(?:\.\w+)?\([^;]*\) = .+;$');
  return source.where((line) => pattern.hasMatch(line)).toList();
}

List<String> _constructorTearOffDeclarations(List<String> lines) {
  final source = _singleLineDeclarations(lines);
  final pattern = RegExp(
    r'^(?:final|const) \w+ = (?:[A-Z]\w*(?:<[^>]+>)?|AliasBox)\.(?:new|named|alias)|const constMakers = ',
  );
  return source.where((line) => pattern.hasMatch(line)).toList();
}

List<String> _exceptionHandlerLines(List<String> lines) {
  return [
    for (final line in lines.map((line) => line.trim()))
      if (line.startsWith('} on ') ||
          line.startsWith('} catch ') ||
          line == '} finally {' ||
          line == 'rethrow;')
        line,
  ];
}

List<String> _switchContinueLines(List<String> lines) {
  return [
    for (final line in lines.map((line) => line.trim()))
      if (_isExplicitSwitchLabel(line) || line.startsWith('continue')) line,
  ];
}

bool _isExplicitSwitchLabel(String line) {
  return line.endsWith(':') && !line.startsWith('case ') && line != 'default:';
}

List<String> _singleLineDeclarations(List<String> lines) {
  final declarations = <String>[];
  final buffer = StringBuffer();
  for (final rawLine in lines) {
    final line = rawLine.trim();
    if (line.isEmpty) {
      continue;
    }
    if (line.endsWith('{') || line == '}') {
      buffer.clear();
      continue;
    }
    if (buffer.isEmpty) {
      buffer.write(line);
    } else {
      buffer.write(' ');
      buffer.write(line);
    }
    if (line.endsWith(';')) {
      declarations.add(buffer.toString());
      buffer.clear();
    }
  }
  return declarations;
}
