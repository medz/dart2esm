import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpression? lowerDartCoreUriStaticGet({
  required k.StaticGet expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
}) {
  if (kernelReferencePath(expression.targetReference) !=
      'dart:core::Uri::@getters::base') {
    return null;
  }
  helpers.require(EsmRuntimeHelper.uri);
  return EsmCall(
    callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.uri),
    arguments: const [
      EsmNullishCoalesce(
        left: EsmOptionalPropertyAccess(
          receiver: EsmPropertyAccess(
            receiver: EsmIdentifier('globalThis'),
            property: 'location',
          ),
          property: 'href',
        ),
        right: EsmPropertyAccess(receiver: EsmImportMeta(), property: 'url'),
      ),
      EsmBooleanLiteral(false),
    ],
  );
}

EsmExpression? lowerDartCoreUriInstanceInvocation({
  required k.Reference reference,
  required String name,
  required k.Arguments arguments,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function() lowerReceiver,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  if (!isDartCoreUriMember(reference, name) || arguments.types.isNotEmpty) {
    return null;
  }
  final positional = arguments.positional;
  if ((name == 'resolve' || name == 'resolveUri') &&
      positional.length == 1 &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriResolve'),
      arguments: [lowerReceiver(), lower(positional.single)],
    );
  }
  if (name == 'removeFragment' &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriReplace'),
      arguments: [
        lowerReceiver(),
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: '__removeFragment',
            value: EsmBooleanLiteral(true),
          ),
        ]),
      ],
    );
  }
  if (name == 'replace' && positional.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriReplace'),
      arguments: [
        lowerReceiver(),
        _lowerUriOptionsObject(arguments, lowerNamedArgument),
      ],
    );
  }
  if (name == 'normalizePath' &&
      positional.isEmpty &&
      arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriNormalizePath'),
      arguments: [lowerReceiver()],
    );
  }
  if (name == 'toFilePath' &&
      positional.isEmpty &&
      _hasOnlyNamedArguments(arguments, {'windows'})) {
    helpers.require(EsmRuntimeHelper.uriToFilePath);
    final windows =
        lowerNamedArgument(arguments, 'windows') ??
        const EsmBooleanLiteral(false);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriToFilePath'),
      arguments: [lowerReceiver(), windows],
    );
  }
  return null;
}

EsmExpression? lowerDartCoreUriInstanceGet({
  required k.Reference reference,
  required String name,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function() lowerReceiver,
}) {
  if (!isDartCoreUriMember(reference, name)) {
    return null;
  }
  if (name == 'hashCode') {
    helpers.require(EsmRuntimeHelper.objectHash);
    final receiver = lowerReceiver();
    return EsmCall(
      callee: const EsmIdentifier('__dartHashValue'),
      arguments: [
        EsmCall(callee: const EsmIdentifier('String'), arguments: [receiver]),
      ],
    );
  }
  final allowed = switch (name) {
    'scheme' ||
    'host' ||
    'authority' ||
    'userInfo' ||
    'port' ||
    'path' ||
    'pathSegments' ||
    'query' ||
    'queryParameters' ||
    'queryParametersAll' ||
    'fragment' ||
    'hasScheme' ||
    'hasAuthority' ||
    'hasPort' ||
    'hasQuery' ||
    'hasFragment' ||
    'isAbsolute' => true,
    _ => false,
  };
  if (!allowed) {
    return null;
  }
  return EsmPropertyAccess(receiver: lowerReceiver(), property: name);
}

EsmExpression? lowerDartCoreUriStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  if (expression.arguments.types.isNotEmpty) {
    return null;
  }
  final target = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if (target == 'dart:core::Uri::@methods::parse' &&
      positional.length == 1 &&
      expression.arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.uri),
      arguments: [lower(positional.single), const EsmBooleanLiteral(false)],
    );
  }
  if (target == 'dart:core::Uri::@methods::tryParse' &&
      positional.length == 1 &&
      expression.arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.uri),
      arguments: [lower(positional.single), const EsmBooleanLiteral(true)],
    );
  }
  if ((target == 'dart:core::_Uri::@factories::' ||
          target == 'dart:core::Uri::@factories::') &&
      positional.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUri'),
      arguments: [
        _lowerUriOptionsObject(expression.arguments, lowerNamedArgument),
      ],
    );
  }
  if ((target == 'dart:core::_Uri::@factories::http' ||
          target == 'dart:core::Uri::@factories::http' ||
          target == 'dart:core::_Uri::@factories::https' ||
          target == 'dart:core::Uri::@factories::https') &&
      positional.length >= 2 &&
      positional.length <= 3 &&
      expression.arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.uri);
    final scheme = target.endsWith('::https') ? 'https' : 'http';
    return EsmCall(
      callee: const EsmIdentifier('__dartUriBuild'),
      arguments: [
        EsmStringLiteral(scheme),
        lower(positional[0]),
        lower(positional[1]),
        positional.length == 3 ? lower(positional[2]) : const EsmNullLiteral(),
      ],
    );
  }
  if ((target == 'dart:core::_Uri::@factories::file' ||
          target == 'dart:core::Uri::@factories::file' ||
          target == 'dart:core::_Uri::@factories::directory' ||
          target == 'dart:core::Uri::@factories::directory') &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(expression.arguments, {'windows'})) {
    helpers.require(EsmRuntimeHelper.uri);
    final windows =
        lowerNamedArgument(expression.arguments, 'windows') ??
        const EsmBooleanLiteral(false);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriFile'),
      arguments: [
        lower(positional.single),
        windows,
        EsmBooleanLiteral(target.endsWith('::directory')),
      ],
    );
  }
  if ((target == 'dart:core::_Uri::@factories::dataFromString' ||
          target == 'dart:core::Uri::@factories::dataFromString') &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(expression.arguments, {
        'mimeType',
        'encoding',
        'parameters',
        'base64',
      })) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriDataFromString'),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(expression.arguments, 'mimeType') ??
            const EsmNullLiteral(),
        lowerNamedArgument(expression.arguments, 'encoding') ??
            const EsmNullLiteral(),
        lowerNamedArgument(expression.arguments, 'parameters') ??
            const EsmNullLiteral(),
        lowerNamedArgument(expression.arguments, 'base64') ??
            const EsmBooleanLiteral(false),
      ],
    );
  }
  if ((target == 'dart:core::_Uri::@factories::dataFromBytes' ||
          target == 'dart:core::Uri::@factories::dataFromBytes') &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(expression.arguments, {
        'mimeType',
        'parameters',
        'percentEncoded',
      })) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriDataFromBytes'),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(expression.arguments, 'mimeType') ??
            const EsmNullLiteral(),
        lowerNamedArgument(expression.arguments, 'parameters') ??
            const EsmNullLiteral(),
        lowerNamedArgument(expression.arguments, 'percentEncoded') ??
            const EsmBooleanLiteral(false),
      ],
    );
  }
  if (!target.startsWith('dart:core::Uri::@methods::')) {
    return null;
  }
  final name = target.split('::@methods::').last;
  if (name == 'encodeQueryComponent' &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(expression.arguments, {'encoding'})) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriEncodeQueryComponent'),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(expression.arguments, 'encoding') ??
            const EsmNullLiteral(),
      ],
    );
  }
  if (name == 'decodeQueryComponent' &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(expression.arguments, {'encoding'})) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriDecodeQueryComponent'),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(expression.arguments, 'encoding') ??
            const EsmNullLiteral(),
      ],
    );
  }
  if (name == 'splitQueryString' &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(expression.arguments, {'encoding'})) {
    helpers.require(EsmRuntimeHelper.uri);
    return EsmCall(
      callee: const EsmIdentifier('__dartUriSplitQueryString'),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(expression.arguments, 'encoding') ??
            const EsmNullLiteral(),
      ],
    );
  }
  if (expression.arguments.named.isEmpty && positional.length == 1) {
    final jsFunction = switch (name) {
      'encodeComponent' => 'encodeURIComponent',
      'decodeComponent' => 'decodeURIComponent',
      'encodeFull' => 'encodeURI',
      'decodeFull' => 'decodeURI',
      _ => null,
    };
    if (jsFunction != null) {
      return EsmCall(
        callee: EsmIdentifier(jsFunction),
        arguments: [lower(positional.single)],
      );
    }
  }
  return null;
}

EsmObjectLiteral _lowerUriOptionsObject(
  k.Arguments arguments,
  EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
) {
  return EsmObjectLiteral([
    for (final argument in arguments.named)
      EsmObjectLiteralProperty.static(
        key: argument.name,
        value: lowerNamedArgument(arguments, argument.name)!,
      ),
  ]);
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}
