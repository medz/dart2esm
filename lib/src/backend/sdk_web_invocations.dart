import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkWebInvocationEmitter {
  DartSdkWebInvocationEmitter({
    required this.helpers,
    required this.namedArgument,
    required this.hasOnlyNamedArguments,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String? Function(k.Arguments arguments, String name) namedArgument;
  final bool Function(k.Arguments arguments, Set<String> names)
  hasOnlyNamedArguments;

  String? emitStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    return _emitSvgStaticInvocation(expression, positionalArgs) ??
        _emitHtmlStaticInvocation(expression, positionalArgs) ??
        _emitWebAudioStaticInvocation(expression, positionalArgs) ??
        _emitIndexedDbStaticInvocation(expression, positionalArgs);
  }

  String? emitInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    return _emitWebAudioInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitIndexedDbInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitHtmlInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitSvgInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        );
  }

  String? emitGet(k.Reference target, String name, String receiver) {
    if (_isHtmlClassMember(target, 'Node', name) && name == 'text') {
      return '$receiver.textContent';
    }
    if (_isSvgClassMember(target, 'Node', name) && name == 'text') {
      return '$receiver.textContent';
    }
    return null;
  }

  String? emitSet(
    k.Reference target,
    String name,
    String receiver,
    String value,
  ) {
    if (_isHtmlClassMember(target, 'Node', name) && name == 'text') {
      return '$receiver.textContent = $value';
    }
    if (_isSvgClassMember(target, 'Node', name) && name == 'text') {
      return '$receiver.textContent = $value';
    }
    return null;
  }

  String? nullAwareInstancePropertyName(k.Reference target, String name) {
    if (_isHtmlClassMember(target, 'Node', name) && name == 'text') {
      return 'textContent';
    }
    if (_isSvgClassMember(target, 'Node', name) && name == 'text') {
      return 'textContent';
    }
    return null;
  }

  String? _emitHtmlInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (_isHtmlClassMember(target, 'CanvasElement', name)) {
      if (name == 'getContext3d' &&
          positionalArgs.isEmpty &&
          hasOnlyNamedArguments(arguments, {
            'alpha',
            'depth',
            'stencil',
            'antialias',
            'premultipliedAlpha',
            'preserveDrawingBuffer',
          })) {
        helpers.add('__dartCanvasGetContext3d');
        final options = {
          'alpha': namedArgument(arguments, 'alpha') ?? 'true',
          'depth': namedArgument(arguments, 'depth') ?? 'true',
          'stencil': namedArgument(arguments, 'stencil') ?? 'false',
          'antialias': namedArgument(arguments, 'antialias') ?? 'true',
          'premultipliedAlpha':
              namedArgument(arguments, 'premultipliedAlpha') ?? 'true',
          'preserveDrawingBuffer':
              namedArgument(arguments, 'preserveDrawingBuffer') ?? 'false',
        };
        final optionsLiteral = options.entries
            .map((entry) => '${entry.key}: ${entry.value}')
            .join(', ');
        return '__dartCanvasGetContext3d($receiver, { $optionsLiteral })';
      }
      return null;
    }
    if (_isHtmlClassMember(target, 'Node', name) &&
        name == 'append' &&
        positionalArgs.length == 1 &&
        arguments.named.isEmpty) {
      return '$receiver.appendChild(${positionalArgs.single})';
    }
    if (!_isHtmlClassMember(target, 'Storage', name) ||
        arguments.named.isNotEmpty) {
      return null;
    }
    if (name == '[]' && positionalArgs.length == 1) {
      return '(typeof $receiver.getItem === "function" ? $receiver.getItem(${positionalArgs.single}) : $receiver[${positionalArgs.single}])';
    }
    if (name == '[]=' && positionalArgs.length == 2) {
      return '(typeof $receiver.setItem === "function" ? ($receiver.setItem(${positionalArgs[0]}, ${positionalArgs[1]}), null) : ($receiver[${positionalArgs[0]}] = ${positionalArgs[1]}, null))';
    }
    if (name == 'containsKey' && positionalArgs.length == 1) {
      return '(typeof $receiver.getItem === "function" ? $receiver.getItem(${positionalArgs.single}) != null : ${positionalArgs.single} in $receiver)';
    }
    if (name == 'remove' && positionalArgs.length == 1) {
      return '(typeof $receiver.removeItem === "function" ? ($receiver.removeItem(${positionalArgs.single}), null) : (delete $receiver[${positionalArgs.single}], null))';
    }
    if (name == 'clear' && positionalArgs.isEmpty) {
      return '(typeof $receiver.clear === "function" ? ($receiver.clear(), null) : (Object.keys($receiver).forEach((key) => delete $receiver[key]), null))';
    }
    return null;
  }

  String? _emitHtmlStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if ((path == 'dart:html::Element::@factories::tag' ||
            path ==
                'dart:html::_ElementFactoryProvider::@methods::createElement_tag') &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      return positionalArgs.length == 1 || positionalArgs[1] == 'null'
          ? 'globalThis.document.createElement(${positionalArgs[0]})'
          : 'globalThis.document.createElement(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (path == 'dart:html::CanvasElement::@factories::' &&
        positionalArgs.isEmpty &&
        hasOnlyNamedArguments(expression.arguments, {'width', 'height'})) {
      helpers.add('__dartCanvasElement');
      final width = namedArgument(expression.arguments, 'width') ?? 'null';
      final height = namedArgument(expression.arguments, 'height') ?? 'null';
      return '__dartCanvasElement($width, $height)';
    }
    return null;
  }

  String? _emitSvgStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (path == 'dart:svg::SvgElement::@factories::tag' &&
        positionalArgs.length == 1) {
      return 'globalThis.document.createElementNS("http://www.w3.org/2000/svg", ${positionalArgs.single})';
    }
    return null;
  }

  String? _emitSvgInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (_isSvgClassMember(target, 'Node', name) &&
        name == 'append' &&
        positionalArgs.length == 1 &&
        arguments.named.isEmpty) {
      return '$receiver.appendChild(${positionalArgs.single})';
    }
    return null;
  }

  String? _emitWebAudioStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (path == 'dart:web_audio::AudioContext::@factories::' &&
        positionalArgs.isEmpty &&
        expression.arguments.named.isEmpty) {
      return 'new (globalThis.window?.AudioContext ?? globalThis.window?.webkitAudioContext ?? globalThis.AudioContext ?? globalThis.webkitAudioContext)()';
    }
    return null;
  }

  String? _emitWebAudioInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (_isWebAudioClassMember(target, 'AudioNode', name) &&
        arguments.named.isEmpty) {
      if (name == 'connectNode' &&
          positionalArgs.isNotEmpty &&
          positionalArgs.length <= 3) {
        final output = positionalArgs.length >= 2 ? positionalArgs[1] : '0';
        final input = positionalArgs.length >= 3 ? positionalArgs[2] : '0';
        return '($receiver.connect(${positionalArgs[0]}, $output, $input), null)';
      }
      if (name == 'connectParam' &&
          positionalArgs.isNotEmpty &&
          positionalArgs.length <= 2) {
        final output = positionalArgs.length == 2 ? positionalArgs[1] : '0';
        return '($receiver.connect(${positionalArgs[0]}, $output), null)';
      }
    }
    if (_isWebAudioClassMember(target, 'AudioScheduledSourceNode', name) &&
        name == 'start2' &&
        arguments.named.isEmpty &&
        positionalArgs.length <= 1) {
      final args = positionalArgs.isEmpty ? '' : positionalArgs.single;
      return '($receiver.start($args), null)';
    }
    return null;
  }

  String? _emitIndexedDbStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (path == 'dart:indexed_db::KeyRange::@factories::only' &&
        positionalArgs.length == 1 &&
        expression.arguments.named.isEmpty) {
      return '(globalThis.window?.IDBKeyRange ?? globalThis.IDBKeyRange).only(${positionalArgs.single})';
    }
    return null;
  }

  String? _emitIndexedDbInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (_isIndexedDbClassMember(target, 'IdbFactory', name)) {
      if (name == 'open' &&
          positionalArgs.length == 1 &&
          hasOnlyNamedArguments(arguments, {
            'version',
            'onUpgradeNeeded',
            'onBlocked',
          })) {
        helpers.add('__dartIdbOpen');
        final version = namedArgument(arguments, 'version') ?? 'null';
        final onUpgradeNeeded =
            namedArgument(arguments, 'onUpgradeNeeded') ?? 'null';
        final onBlocked = namedArgument(arguments, 'onBlocked') ?? 'null';
        return '__dartIdbOpen($receiver, ${positionalArgs.single}, $version, $onUpgradeNeeded, $onBlocked)';
      }
      if (name == 'deleteDatabase' &&
          positionalArgs.length == 1 &&
          hasOnlyNamedArguments(arguments, {'onBlocked'})) {
        helpers.add('__dartIdbDeleteDatabase');
        final onBlocked = namedArgument(arguments, 'onBlocked') ?? 'null';
        return '__dartIdbDeleteDatabase($receiver, ${positionalArgs.single}, $onBlocked)';
      }
    }
    if (_isIndexedDbClassMember(target, 'ObjectStore', name) &&
        arguments.named.isEmpty) {
      if ((name == 'put' || name == 'add') &&
          positionalArgs.isNotEmpty &&
          positionalArgs.length <= 2) {
        helpers.add('__dartIdbStorePut');
        final key = positionalArgs.length == 2 ? positionalArgs[1] : 'null';
        return '__dartIdbStorePut($receiver, ${jsonEncode(name)}, ${positionalArgs[0]}, $key)';
      }
      if (name == 'getObject' && positionalArgs.length == 1) {
        helpers.add('__dartIdbStoreRequest');
        return '__dartIdbStoreRequest($receiver, "get", [${positionalArgs.single}])';
      }
      if (name == 'clear' && positionalArgs.isEmpty) {
        helpers.add('__dartIdbStoreRequest');
        return '__dartIdbStoreRequest($receiver, "clear", [])';
      }
      if (name == 'delete' && positionalArgs.length == 1) {
        helpers.add('__dartIdbStoreRequest');
        return '__dartIdbStoreRequest($receiver, "delete", [${positionalArgs.single}])';
      }
      if (name == 'count' && positionalArgs.length <= 1) {
        helpers.add('__dartIdbStoreRequest');
        final args = positionalArgs.isEmpty ? '' : positionalArgs.single;
        return '__dartIdbStoreRequest($receiver, "count", [$args])';
      }
    }
    return null;
  }

  bool _isHtmlClassMember(
    k.Reference reference,
    String className,
    String name,
  ) {
    return isDartSdkLibraryClassMember(reference, 'dart:html', className, name);
  }

  bool _isSvgClassMember(k.Reference reference, String className, String name) {
    return isDartSdkLibraryClassMember(reference, 'dart:svg', className, name);
  }

  bool _isWebAudioClassMember(
    k.Reference reference,
    String className,
    String name,
  ) {
    return isDartSdkLibraryClassMember(
      reference,
      'dart:web_audio',
      className,
      name,
    );
  }

  bool _isIndexedDbClassMember(
    k.Reference reference,
    String className,
    String name,
  ) {
    return isDartSdkLibraryClassMember(
      reference,
      'dart:indexed_db',
      className,
      name,
    );
  }
}
