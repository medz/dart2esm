import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkLegacyJsInvocationEmitter {
  DartSdkLegacyJsInvocationEmitter({
    required this.helpers,
    required this.namedArgument,
    required this.hasOnlyNamedArguments,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String? Function(k.Arguments arguments, String name) namedArgument;
  final bool Function(k.Arguments arguments, Set<String> names)
  hasOnlyNamedArguments;

  String? emitFactory(k.Procedure target, List<String> positionalArgs) {
    return switch (legacyJsFactorySymbol(target.reference)) {
      LegacyJsFactorySymbol.jsObject
          when positionalArgs.isNotEmpty && positionalArgs.length <= 2 =>
        'new ${positionalArgs[0]}(...Array.from(${positionalArgs.length == 2 ? positionalArgs[1] : '[]'} ?? []))',
      LegacyJsFactorySymbol.jsObjectFromBrowserObject
          when positionalArgs.length == 1 =>
        positionalArgs.single,
      LegacyJsFactorySymbol.jsObjectJsify when positionalArgs.length == 1 =>
        _emitJsify(positionalArgs.single),
      LegacyJsFactorySymbol.jsArray when positionalArgs.isEmpty => '[]',
      LegacyJsFactorySymbol.jsArrayFrom when positionalArgs.length == 1 =>
        'Array.from(${positionalArgs.single})',
      LegacyJsFactorySymbol.jsFunctionWithThis
          when positionalArgs.length == 1 =>
        '(function(...args) { return (${positionalArgs.single})(this, ...args); })',
      _ => null,
    };
  }

  String? emitDynamicInvocation(
    k.Expression receiverExpression,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (!_isLegacyJsExpression(receiverExpression)) {
      return null;
    }
    if (arguments.named.isEmpty &&
        name == 'callMethod' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      final args = positionalArgs.length == 2 ? positionalArgs[1] : '[]';
      return '$receiver[${positionalArgs[0]}](...Array.from($args ?? []))';
    }
    if (arguments.named.isEmpty &&
        name == 'hasProperty' &&
        positionalArgs.length == 1) {
      return '(${positionalArgs.single} in $receiver)';
    }
    if (arguments.named.isEmpty &&
        name == 'deleteProperty' &&
        positionalArgs.length == 1) {
      return '(delete $receiver[${positionalArgs.single}], null)';
    }
    if (arguments.named.isEmpty &&
        name == 'instanceof' &&
        positionalArgs.length == 1) {
      return '$receiver instanceof ${positionalArgs.single}';
    }
    if (name == 'apply' &&
        positionalArgs.length == 1 &&
        hasOnlyNamedArguments(arguments, {'thisArg'})) {
      final thisArg = namedArgument(arguments, 'thisArg') ?? 'undefined';
      return '$receiver.apply($thisArg, Array.from(${positionalArgs.single}))';
    }
    return null;
  }

  String? emitInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (!_isLegacyJsMember(target, name)) {
      return null;
    }
    if (arguments.named.isEmpty && name == '[]' && positionalArgs.length == 1) {
      return '$receiver[${positionalArgs.single}]';
    }
    if (arguments.named.isEmpty &&
        name == '[]=' &&
        positionalArgs.length == 2) {
      return '($receiver[${positionalArgs[0]}] = ${positionalArgs[1]})';
    }
    if (arguments.named.isEmpty &&
        name == 'hasProperty' &&
        positionalArgs.length == 1) {
      return '(${positionalArgs.single} in $receiver)';
    }
    if (arguments.named.isEmpty &&
        name == 'deleteProperty' &&
        positionalArgs.length == 1) {
      return '(delete $receiver[${positionalArgs.single}], null)';
    }
    if (arguments.named.isEmpty &&
        name == 'instanceof' &&
        positionalArgs.length == 1) {
      return '$receiver instanceof ${positionalArgs.single}';
    }
    if (arguments.named.isEmpty &&
        name == 'toString' &&
        positionalArgs.isEmpty) {
      return 'String($receiver)';
    }
    if (arguments.named.isEmpty &&
        name == 'callMethod' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      final args = positionalArgs.length == 2 ? positionalArgs[1] : '[]';
      return '$receiver[${positionalArgs[0]}](...Array.from($args ?? []))';
    }
    final jsArrayInvocation = _emitLegacyJsArrayInvocation(
      target,
      name,
      receiver,
      positionalArgs,
      arguments,
    );
    if (jsArrayInvocation != null) {
      return jsArrayInvocation;
    }
    if (name == 'apply' &&
        _isLegacyJsClassMember(target, 'JsFunction', name) &&
        positionalArgs.length == 1 &&
        hasOnlyNamedArguments(arguments, {'thisArg'})) {
      final thisArg = namedArgument(arguments, 'thisArg') ?? 'undefined';
      return '$receiver.apply($thisArg, Array.from(${positionalArgs.single}))';
    }
    return null;
  }

  String? _emitLegacyJsArrayInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (!_isLegacyJsClassMember(target, 'JsArray', name) ||
        arguments.named.isNotEmpty) {
      return null;
    }
    return switch (name) {
      'add' when positionalArgs.length == 1 =>
        '($receiver.push(${positionalArgs.single}), null)',
      'addAll' when positionalArgs.length == 1 =>
        '($receiver.push(...Array.from(${positionalArgs.single})), null)',
      'insert' when positionalArgs.length == 2 =>
        '($receiver.splice(${positionalArgs[0]}, 0, ${positionalArgs[1]}), null)',
      'removeAt' when positionalArgs.length == 1 =>
        '$receiver.splice(${positionalArgs.single}, 1)[0]',
      'removeLast' when positionalArgs.isEmpty => '$receiver.pop()',
      'removeRange' when positionalArgs.length == 2 =>
        '($receiver.splice(${positionalArgs[0]}, ${positionalArgs[1]} - ${positionalArgs[0]}), null)',
      'setRange'
          when positionalArgs.length >= 3 && positionalArgs.length <= 4 =>
        '($receiver.splice(${positionalArgs[0]}, ${positionalArgs[1]} - ${positionalArgs[0]}, ...Array.from(${positionalArgs[2]}).slice(${positionalArgs.length == 4 ? positionalArgs[3] : '0'}, ${positionalArgs.length == 4 ? positionalArgs[3] : '0'} + (${positionalArgs[1]} - ${positionalArgs[0]}))), null)',
      'sort' when positionalArgs.isEmpty => '($receiver.sort(), null)',
      'sort' when positionalArgs.length == 1 =>
        '($receiver.sort(${positionalArgs.single}), null)',
      _ => null,
    };
  }

  String _emitJsify(String value) {
    helpers.add('__dartJsify');
    return '__dartJsify($value)';
  }

  bool _isLegacyJsMember(k.Reference reference, String name) {
    return _isLegacyJsClassMember(reference, 'JsObject', name) ||
        _isLegacyJsClassMember(reference, 'JsFunction', name) ||
        _isLegacyJsClassMember(reference, 'JsArray', name);
  }

  bool _isLegacyJsExpression(k.Expression expression) {
    return switch (expression) {
      k.StaticGet(:final targetReference) =>
        kernelReferencePath(targetReference) == 'dart:js::@getters::context',
      k.InstanceInvocation(:final interfaceTargetReference, :final name) =>
        _isLegacyJsMember(interfaceTargetReference, name.text),
      k.AsExpression(:final operand) => _isLegacyJsExpression(operand),
      _ => false,
    };
  }

  bool _isLegacyJsClassMember(
    k.Reference reference,
    String className,
    String name,
  ) {
    return isDartSdkLibraryClassMember(reference, 'dart:js', className, name);
  }
}
