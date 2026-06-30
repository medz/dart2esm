import 'package:kernel/kernel.dart' as k;

import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkTextInstanceEmitter {
  DartSdkTextInstanceEmitter({
    required this.helpers,
    required this.isStringLiteralArgument,
    required this.namedArgument,
    required this.emitUriReplaceOptions,
  });

  final EsmRuntimeHelperUseSet helpers;
  final bool Function(k.Arguments arguments, int index) isStringLiteralArgument;
  final String? Function(k.Arguments arguments, String name) namedArgument;
  final String Function(k.Arguments arguments) emitUriReplaceOptions;

  String? emitInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    return _emitStringPatternInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitUriInvocation(target, name, receiver, positionalArgs, arguments);
  }

  String? emitGet(k.Reference target, String name, String receiver) {
    if (!isDartCoreMember(target, 'String', name)) {
      return null;
    }
    return switch (name) {
      'isEmpty' => '$receiver.length === 0',
      'isNotEmpty' => '$receiver.length !== 0',
      'codeUnits' =>
        'Array.from({ length: $receiver.length }, (_, index) => $receiver.charCodeAt(index))',
      'runes' => 'Array.from($receiver, (char) => char.codePointAt(0))',
      _ => null,
    };
  }

  String? _emitStringPatternInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        name == 'contains' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isDartCoreMember(target, 'String', 'contains')) {
      if (isStringLiteralArgument(arguments, 0)) {
        if (positionalArgs.length == 1) {
          return '$receiver.includes(${positionalArgs.single})';
        }
        return '$receiver.includes(${positionalArgs[0]}, ${positionalArgs[1]})';
      }
      helpers.add('__dartStringPattern');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : '0';
      return '__dartStringContains($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'startsWith' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isDartCoreMember(target, 'String', 'startsWith')) {
      if (isStringLiteralArgument(arguments, 0)) {
        if (positionalArgs.length == 1) {
          return '$receiver.startsWith(${positionalArgs.single})';
        }
        return '$receiver.startsWith(${positionalArgs[0]}, ${positionalArgs[1]})';
      }
      helpers.add('__dartStringPattern');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : '0';
      return '__dartStringStartsWith($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'indexOf' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isDartCoreMember(target, 'String', 'indexOf')) {
      if (isStringLiteralArgument(arguments, 0)) {
        if (positionalArgs.length == 1) {
          return '$receiver.indexOf(${positionalArgs.single})';
        }
        return '$receiver.indexOf(${positionalArgs[0]}, ${positionalArgs[1]})';
      }
      helpers.add('__dartStringPattern');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : '0';
      return '__dartStringIndexOf($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'lastIndexOf' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isDartCoreMember(target, 'String', 'lastIndexOf')) {
      if (isStringLiteralArgument(arguments, 0)) {
        if (positionalArgs.length == 1) {
          return '$receiver.lastIndexOf(${positionalArgs.single})';
        }
        return '$receiver.lastIndexOf(${positionalArgs[0]}, ${positionalArgs[1]})';
      }
      helpers.add('__dartStringPattern');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : 'null';
      return '__dartStringLastIndexOf($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'allMatches' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        (isDartCoreMember(target, 'String', 'allMatches') ||
            isDartCoreMember(target, 'Pattern', 'allMatches'))) {
      helpers.add('__dartStringPattern');
      helpers.add('__dartPatternAllMatches');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : '0';
      return '__dartPatternAllMatches($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'matchAsPrefix' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        (isDartCoreMember(target, 'String', 'matchAsPrefix') ||
            isDartCoreMember(target, 'Pattern', 'matchAsPrefix'))) {
      helpers.add('__dartStringPattern');
      helpers.add('__dartPatternMatchAsPrefix');
      final start = positionalArgs.length == 2 ? positionalArgs[1] : '0';
      return '__dartPatternMatchAsPrefix($receiver, ${positionalArgs[0]}, $start)';
    }
    if (arguments.named.isEmpty &&
        name == 'split' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'String', 'split')) {
      if (isStringLiteralArgument(arguments, 0)) {
        return '$receiver.split(${positionalArgs.single})';
      }
      helpers.add('__dartStringPattern');
      return '__dartStringSplit($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'codeUnitAt' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'String', 'codeUnitAt')) {
      return '$receiver.charCodeAt(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        (name == 'padLeft' || name == 'padRight') &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2 &&
        isDartCoreMember(target, 'String', name)) {
      final padding = positionalArgs.length == 2 ? positionalArgs[1] : '" "';
      final method = name == 'padLeft' ? 'padStart' : 'padEnd';
      return '$receiver.$method(${positionalArgs[0]}, $padding)';
    }
    if (arguments.named.isEmpty &&
        (name == 'trimLeft' || name == 'trimRight') &&
        positionalArgs.isEmpty &&
        isDartCoreMember(target, 'String', name)) {
      final method = name == 'trimLeft' ? 'trimStart' : 'trimEnd';
      return '$receiver.$method()';
    }
    if (arguments.named.isEmpty &&
        name == 'compareTo' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'String', name)) {
      return '($receiver < ${positionalArgs.single} ? -1 : ($receiver > ${positionalArgs.single} ? 1 : 0))';
    }
    if (arguments.named.isEmpty &&
        name == 'replaceAll' &&
        positionalArgs.length == 2 &&
        isDartCoreMember(target, 'String', name)) {
      if (isStringLiteralArgument(arguments, 0)) {
        return '$receiver.replaceAll(${positionalArgs[0]}, ${positionalArgs[1]})';
      }
      helpers.add('__dartStringPattern');
      return '__dartStringReplaceAll($receiver, ${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (arguments.named.isEmpty &&
        name == 'replaceAllMapped' &&
        positionalArgs.length == 2 &&
        isDartCoreMember(target, 'String', name)) {
      helpers.add('__dartStringPattern');
      return '__dartStringReplaceAllMapped($receiver, ${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (arguments.named.isEmpty &&
        name == 'replaceFirst' &&
        positionalArgs.length >= 2 &&
        positionalArgs.length <= 3 &&
        isDartCoreMember(target, 'String', name)) {
      final startIndex = positionalArgs.length == 3 ? positionalArgs[2] : '0';
      if (isStringLiteralArgument(arguments, 0)) {
        helpers.add('__dartStringReplaceFirst');
        return '__dartStringReplaceFirst($receiver, ${positionalArgs[0]}, ${positionalArgs[1]}, $startIndex)';
      }
      helpers.add('__dartStringPattern');
      helpers.add('__dartStringReplaceFirst');
      helpers.add('__dartStringReplaceFirstPattern');
      return '__dartStringReplaceFirstPattern($receiver, ${positionalArgs[0]}, ${positionalArgs[1]}, $startIndex)';
    }
    if (arguments.named.isEmpty &&
        name == 'replaceFirstMapped' &&
        positionalArgs.length >= 2 &&
        positionalArgs.length <= 3 &&
        isDartCoreMember(target, 'String', name)) {
      helpers.add('__dartStringPattern');
      final startIndex = positionalArgs.length == 3 ? positionalArgs[2] : '0';
      return '__dartStringReplaceFirstMapped($receiver, ${positionalArgs[0]}, ${positionalArgs[1]}, $startIndex)';
    }
    if (name == 'splitMapJoin' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'String', name)) {
      helpers.add('__dartStringPattern');
      final onMatch = namedArgument(arguments, 'onMatch') ?? 'null';
      final onNonMatch = namedArgument(arguments, 'onNonMatch') ?? 'null';
      return '__dartStringSplitMapJoin($receiver, ${positionalArgs[0]}, $onMatch, $onNonMatch)';
    }
    if (arguments.named.isEmpty &&
        name == 'replaceRange' &&
        positionalArgs.length == 3 &&
        isDartCoreMember(target, 'String', name)) {
      helpers.add('__dartStringReplaceRange');
      return '__dartStringReplaceRange($receiver, ${positionalArgs[0]}, ${positionalArgs[1]}, ${positionalArgs[2]})';
    }
    return null;
  }

  String? _emitUriInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        (name == 'resolve' || name == 'resolveUri') &&
        positionalArgs.length == 1 &&
        isDartCoreUriMember(target, name)) {
      helpers.add('__dartUriParse');
      helpers.add('__dartUriResolve');
      return '__dartUriResolve($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'removeFragment' &&
        positionalArgs.isEmpty &&
        isDartCoreUriMember(target, name)) {
      helpers.add('__dartUriParse');
      helpers.add('__dartUriReplace');
      return '__dartUriReplace($receiver, { __removeFragment: true })';
    }
    if (name == 'replace' &&
        positionalArgs.isEmpty &&
        isDartCoreUriMember(target, name)) {
      helpers.add('__dartUriParse');
      helpers.add('__dartUriReplace');
      return '__dartUriReplace($receiver, ${emitUriReplaceOptions(arguments)})';
    }
    if (arguments.named.isEmpty &&
        name == 'normalizePath' &&
        positionalArgs.isEmpty &&
        isDartCoreUriMember(target, name)) {
      helpers.add('__dartUriParse');
      helpers.add('__dartUriNormalizePath');
      return '__dartUriNormalizePath($receiver)';
    }
    return null;
  }
}
