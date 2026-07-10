import 'package:dart2esm/src/third_party/kernel/kernel.dart' as k;

import '../../ast/esm_ast.dart';
import '../../foundation/kernel/kernel_references.dart';
import '../../transformer/helpers/runtime_helpers.dart';

EsmExpression? lowerDartIoInstanceConstant(k.InstanceConstant constant) {
  final classPath = kernelReferencePath(constant.classReference);
  switch (classPath) {
    case 'dart:io::FileMode':
      return _ioEnum(
        'FileMode',
        _fileModeName(_constantIntField(constant, '_mode') ?? 0),
        _constantIntField(constant, '_mode') ?? 0,
      );
    case 'dart:io::FileLock':
      return _ioEnum(
        'FileLock',
        _fileLockName(_constantIntField(constant, '_type') ?? 0),
        _constantIntField(constant, '_type') ?? 0,
      );
    case 'dart:io::FileSystemEntityType':
      return _ioEnum(
        'FileSystemEntityType',
        _fileSystemEntityTypeName(_constantIntField(constant, '_type') ?? 5),
        _constantIntField(constant, '_type') ?? 5,
      );
    case 'dart:io::ProcessStartMode':
      return _ioEnum(
        'ProcessStartMode',
        _processStartModeName(_constantIntField(constant, '_mode') ?? 0),
        _constantIntField(constant, '_mode') ?? 0,
      );
    case 'dart:io::ProcessSignal':
      return _ioEnum(
        'ProcessSignal',
        _constantStringField(constant, 'name') ?? 'SIGTERM',
        _constantIntField(constant, 'signalNumber') ?? 15,
      );
    case 'dart:io::SameSite' || 'dart:_http::SameSite':
      final name = _constantStringField(constant, 'name') ?? 'Lax';
      return _sameSite(name);
    case 'dart:io::HttpClientResponseCompressionState' ||
        'dart:_http::HttpClientResponseCompressionState':
      final index = _constantIntField(constant, 'index') ?? 0;
      return _ioEnum('HttpClientResponseCompressionState', switch (index) {
        1 => 'decompressed',
        2 => 'compressed',
        _ => 'notCompressed',
      }, index);
    case 'dart:io::OSError':
      return EsmCall(
        callee: const EsmIdentifier('__dartIoOSError'),
        arguments: [
          EsmStringLiteral(_constantStringField(constant, 'message') ?? ''),
          EsmNumberLiteral(_constantIntField(constant, 'errorCode') ?? -1),
        ],
      );
    case 'dart:io::FileSystemException':
    case 'dart:io::PathAccessException':
    case 'dart:io::PathExistsException':
    case 'dart:io::PathNotFoundException':
      return EsmCall(
        callee: const EsmIdentifier('__dartIoFileSystemException'),
        arguments: [
          EsmStringLiteral(_constantStringField(constant, 'message') ?? ''),
          _nullableString(_constantStringField(constant, 'path')),
          _constantOsErrorField(constant, 'osError') ?? const EsmNullLiteral(),
        ],
      );
  }
  return null;
}

EsmExpression? lowerDartIoConstructorInvocation({
  required k.ConstructorInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  final path = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if (expression.arguments.named.isNotEmpty ||
      expression.arguments.types.isNotEmpty) {
    return null;
  }
  switch (path) {
    case 'dart:io::OSError::@constructors::':
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoOSError'),
        arguments: [
          positional.isEmpty
              ? const EsmStringLiteral('')
              : lower(positional[0]),
          positional.length < 2
              ? const EsmNumberLiteral(-1)
              : lower(positional[1]),
        ],
      );
    case 'dart:io::FileSystemException::@constructors::':
    case 'dart:io::PathAccessException::@constructors::':
    case 'dart:io::PathExistsException::@constructors::':
    case 'dart:io::PathNotFoundException::@constructors::':
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoFileSystemException'),
        arguments: [
          positional.isEmpty
              ? const EsmStringLiteral('')
              : lower(positional[0]),
          positional.length < 2
              ? const EsmStringLiteral('')
              : lower(positional[1]),
          positional.length < 3 ? const EsmNullLiteral() : lower(positional[2]),
        ],
      );
    case 'dart:io::ProcessResult::@constructors::':
      if (positional.length != 4) return null;
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartProcessResult'),
        arguments: [for (final argument in positional) lower(argument)],
      );
  }
  return null;
}

EsmExpression? lowerDartIoStaticGet({
  required k.StaticGet expression,
  required EsmRuntimeHelperUseSet helpers,
}) {
  final path = kernelReferencePath(expression.targetReference);
  final ioEnum = _staticIoEnum(path);
  if (ioEnum != null) {
    helpers.require(EsmRuntimeHelper.io);
    return ioEnum;
  }
  final sameSite = _staticSameSite(path);
  if (sameSite != null) {
    helpers.require(EsmRuntimeHelper.io);
    return sameSite;
  }
  final contentType = _staticContentType(path);
  if (contentType != null) {
    helpers.require(EsmRuntimeHelper.io);
    return contentType;
  }
  if (path == 'dart:io::@getters::stdout') {
    helpers.require(EsmRuntimeHelper.ioNode);
    return const EsmCall(callee: EsmIdentifier('__dartStdout'), arguments: []);
  }
  if (path == 'dart:io::@getters::stderr') {
    helpers.require(EsmRuntimeHelper.ioNode);
    return const EsmCall(callee: EsmIdentifier('__dartStderr'), arguments: []);
  }
  if (path == 'dart:io::@getters::stdin') {
    helpers.require(EsmRuntimeHelper.ioNode);
    return const EsmCall(callee: EsmIdentifier('__dartStdin'), arguments: []);
  }
  final platformGetter = _platformGetterName(path);
  if (platformGetter != null) {
    helpers.require(EsmRuntimeHelper.io);
    return EsmCall(
      callee: const EsmIdentifier('__dartIoPlatform'),
      arguments: [EsmStringLiteral(platformGetter)],
    );
  }
  if (path == 'dart:io::Platform::@getters::script') {
    helpers.require(EsmRuntimeHelper.uri);
    return const EsmCall(
      callee: EsmIdentifier('__dartUriParse'),
      arguments: [
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
  if (path == 'dart:io::Directory::@getters::current') {
    helpers.require(EsmRuntimeHelper.ioNode);
    return const EsmCall(
      callee: EsmIdentifier('__dartDirectory'),
      arguments: [
        EsmCall(
          callee: EsmPropertyAccess(
            receiver: EsmPropertyAccess(
              receiver: EsmIdentifier('globalThis'),
              property: 'process',
            ),
            property: 'cwd',
          ),
          arguments: [],
        ),
      ],
    );
  }
  if (path == 'dart:io::Directory::@getters::systemTemp') {
    helpers.require(EsmRuntimeHelper.ioNode);
    return const EsmCall(
      callee: EsmIdentifier('__dartDirectory'),
      arguments: [
        EsmCall(
          callee: EsmPropertyAccess(
            receiver: EsmIdentifier('__dartNodeOs'),
            property: 'tmpdir',
          ),
          arguments: [],
        ),
      ],
    );
  }
  return null;
}

EsmExpression? lowerDartIoStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
  required EsmExpression Function(EsmExpression value) arrayFrom,
}) {
  if (expression.arguments.types.isNotEmpty) {
    return null;
  }
  final path = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  switch (path) {
    case 'dart:io::HttpClient::@factories::' ||
        'dart:_http::HttpClient::@factories::':
      if (positional.isNotEmpty ||
          !_hasOnlyNamedArguments(expression.arguments, const {'context'})) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.ioWeb);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoHttpClient'),
        arguments: [
          _namedIoOptions(expression.arguments, lowerNamedArgument, const [
            'context',
          ]),
        ],
      );
    case 'dart:io::HeaderValue::@factories::' ||
        'dart:_http::HeaderValue::@factories::':
      if (positional.length > 2 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoHeaderValue'),
        arguments: [for (final argument in positional) lower(argument)],
      );
    case 'dart:io::HeaderValue::@methods::parse' ||
        'dart:_http::HeaderValue::@methods::parse':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoHeaderValueParse'),
        arguments: [
          lower(positional.single),
          _namedIoOptions(expression.arguments, lowerNamedArgument, const [
            'parameterSeparator',
            'valueSeparator',
            'preserveBackslash',
          ]),
        ],
      );
    case 'dart:io::ContentType::@factories::' ||
        'dart:_http::ContentType::@factories::':
      if (positional.length != 2 ||
          !_hasOnlyNamedArguments(expression.arguments, const {
            'charset',
            'parameters',
          })) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoContentType'),
        arguments: [
          lower(positional[0]),
          lower(positional[1]),
          _namedIoOptions(expression.arguments, lowerNamedArgument, const [
            'charset',
            'parameters',
          ]),
        ],
      );
    case 'dart:io::ContentType::@methods::parse' ||
        'dart:_http::ContentType::@methods::parse':
      if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoContentTypeParse'),
        arguments: [lower(positional.single)],
      );
    case 'dart:io::Cookie::@factories::' || 'dart:_http::Cookie::@factories::':
      if (positional.length != 2 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.io);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoCookie'),
        arguments: [lower(positional[0]), lower(positional[1])],
      );
    case 'dart:io::Cookie::@factories::fromSetCookieValue' ||
        'dart:_http::Cookie::@factories::fromSetCookieValue':
      if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.io);
      helpers.require(EsmRuntimeHelper.dateTime);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoCookieParse'),
        arguments: [lower(positional.single)],
      );
    case 'dart:io::WebSocket::@methods::connect' ||
        'dart:_http::WebSocket::@methods::connect':
      if (positional.length != 1 ||
          !_hasOnlyNamedArguments(expression.arguments, const {
            'protocols',
            'headers',
            'compression',
            'customClient',
          })) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.ioWeb);
      return EsmCall(
        callee: const EsmIdentifier('__dartIoWebSocketConnect'),
        arguments: [
          lower(positional.single),
          _namedIoOptions(expression.arguments, lowerNamedArgument, const [
            'protocols',
            'headers',
            'compression',
            'customClient',
          ]),
        ],
      );
    case 'dart:io::File::@factories::':
      if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.ioNode);
      return EsmCall(
        callee: const EsmIdentifier('__dartFile'),
        arguments: [lower(positional.single)],
      );
    case 'dart:io::File::@factories::fromUri':
      if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.ioNode);
      return EsmCall(
        callee: const EsmIdentifier('__dartFile'),
        arguments: [
          EsmCall(
            callee: const EsmIdentifier('__dartUriToFilePath'),
            arguments: [lower(positional.single)],
          ),
        ],
      );
    case 'dart:io::Directory::@factories::':
      if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.ioNode);
      return EsmCall(
        callee: const EsmIdentifier('__dartDirectory'),
        arguments: [lower(positional.single)],
      );
    case 'dart:io::Directory::@factories::fromUri':
      if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.ioNode);
      return EsmCall(
        callee: const EsmIdentifier('__dartDirectory'),
        arguments: [
          EsmCall(
            callee: const EsmIdentifier('__dartUriToFilePath'),
            arguments: [lower(positional.single)],
          ),
        ],
      );
    case 'dart:io::Link::@factories::':
      if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
        return null;
      }
      helpers.require(EsmRuntimeHelper.ioNode);
      return EsmCall(
        callee: const EsmIdentifier('__dartLink'),
        arguments: [lower(positional.single)],
      );
    case 'dart:io::FileSystemEntity::@methods::typeSync':
    case 'dart:io::FileSystemEntity::@methods::type':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.ioNode);
      final typeCall = EsmCall(
        callee: const EsmIdentifier('__dartFileSystemEntityType'),
        arguments: [
          lower(positional.single),
          lowerNamedArgument(expression.arguments, 'followLinks') ??
              const EsmBooleanLiteral(true),
        ],
      );
      return path.endsWith('typeSync') ? typeCall : _promiseResolve(typeCall);
    case 'dart:io::FileSystemEntity::@methods::isFileSync':
    case 'dart:io::FileSystemEntity::@methods::isDirectorySync':
    case 'dart:io::FileSystemEntity::@methods::isLinkSync':
    case 'dart:io::FileSystemEntity::@methods::isFile':
    case 'dart:io::FileSystemEntity::@methods::isDirectory':
    case 'dart:io::FileSystemEntity::@methods::isLink':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.ioNode);
      final expectedType =
          path.endsWith('isFileSync') || path.endsWith('isFile')
          ? 0
          : path.endsWith('isDirectorySync') || path.endsWith('isDirectory')
          ? 1
          : 2;
      final test = EsmBinary(
        left: EsmPropertyAccess(
          receiver: EsmCall(
            callee: const EsmIdentifier('__dartFileSystemEntityType'),
            arguments: [
              lower(positional.single),
              lowerNamedArgument(expression.arguments, 'followLinks') ??
                  const EsmBooleanLiteral(true),
            ],
          ),
          property: 'index',
        ),
        operator: EsmBinaryOperator.strictEquals,
        right: EsmNumberLiteral(expectedType),
      );
      return path.endsWith('Sync') ? test : _promiseResolve(test);
    case 'dart:io::Process::@methods::runSync':
      if (positional.length != 2) return null;
      helpers.require(EsmRuntimeHelper.ioNode);
      return EsmCall(
        callee: const EsmIdentifier('__dartProcessRunSync'),
        arguments: [
          lower(positional[0]),
          arrayFrom(lower(positional[1])),
          _ioOptions(expression.arguments, lowerNamedArgument),
        ],
      );
    case 'dart:io::Process::@methods::run':
      if (positional.length != 2) return null;
      helpers.require(EsmRuntimeHelper.ioNode);
      return EsmCall(
        callee: const EsmIdentifier('__dartProcessRun'),
        arguments: [
          lower(positional[0]),
          arrayFrom(lower(positional[1])),
          _ioOptions(expression.arguments, lowerNamedArgument),
        ],
      );
  }
  return null;
}

EsmCall _promiseResolve(EsmExpression value) {
  return EsmCall(
    callee: const EsmPropertyAccess(
      receiver: EsmIdentifier('Promise'),
      property: 'resolve',
    ),
    arguments: [value],
  );
}

EsmExpression? lowerDartIoInstanceInvocation({
  required k.Reference reference,
  required String name,
  required k.Arguments arguments,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function() lowerReceiver,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  final path = kernelReferencePath(reference);
  if (!_isDartIoPath(path) ||
      arguments.types.isNotEmpty ||
      !_supportsIoInstanceMethod(path, name)) {
    return null;
  }
  helpers.require(_ioHelperForInstancePath(path));
  final methodName = _ioClassPath(path, const ['HttpHeaders']) && name == '[]'
      ? 'valuesFor'
      : name;
  return EsmCall(
    callee: EsmPropertyAccess(receiver: lowerReceiver(), property: methodName),
    arguments: [
      for (final argument in arguments.positional) lower(argument),
      if (arguments.named.isNotEmpty)
        EsmObjectLiteral([
          for (final argument in arguments.named)
            EsmObjectLiteralProperty.static(
              key: argument.name,
              value: lower(argument.value),
            ),
        ]),
    ],
  );
}

bool _supportsIoInstanceMethod(String path, String name) {
  if (_pureIoInstancePath(path)) {
    return name == 'toString';
  }
  if (_ioClassPath(path, const ['HttpClient', '_HttpClient'])) {
    return const {
      'open',
      'openUrl',
      'get',
      'getUrl',
      'post',
      'postUrl',
      'put',
      'putUrl',
      'patch',
      'patchUrl',
      'delete',
      'deleteUrl',
      'head',
      'headUrl',
      'close',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['HttpHeaders', '_HttpHeaders'])) {
    return const {
      '[]',
      'value',
      'add',
      'set',
      'remove',
      'removeAll',
      'forEach',
      'noFolding',
      'clear',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['HttpClientRequest', '_HttpClientRequest'])) {
    return const {
      'write',
      'writeln',
      'writeAll',
      'writeCharCode',
      'add',
      'addError',
      'addStream',
      'flush',
      'close',
      'abort',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['WebSocket', '_WebSocketImpl'])) {
    return const {
      'add',
      'addUtf8Text',
      'addStream',
      'addError',
      'close',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['FileSystemEntity'])) {
    return const {
      'exists',
      'existsSync',
      'delete',
      'deleteSync',
      'rename',
      'renameSync',
      'resolveSymbolicLinks',
      'resolveSymbolicLinksSync',
      'stat',
      'statSync',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['File', '_File'])) {
    return const {
      'exists',
      'existsSync',
      'create',
      'createSync',
      'delete',
      'deleteSync',
      'rename',
      'renameSync',
      'copy',
      'copySync',
      'length',
      'lengthSync',
      'lastModified',
      'lastModifiedSync',
      'stat',
      'statSync',
      'readAsBytes',
      'readAsBytesSync',
      'readAsString',
      'readAsStringSync',
      'readAsLines',
      'readAsLinesSync',
      'writeAsBytes',
      'writeAsBytesSync',
      'writeAsString',
      'writeAsStringSync',
      'open',
      'openSync',
      'openWrite',
      'resolveSymbolicLinks',
      'resolveSymbolicLinksSync',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['Directory', '_Directory'])) {
    return const {
      'exists',
      'existsSync',
      'create',
      'createSync',
      'createTemp',
      'createTempSync',
      'delete',
      'deleteSync',
      'rename',
      'renameSync',
      'list',
      'listSync',
      'stat',
      'statSync',
      'resolveSymbolicLinks',
      'resolveSymbolicLinksSync',
      'childFile',
      'childDirectory',
      'childLink',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['Link', '_Link'])) {
    return const {
      'exists',
      'existsSync',
      'create',
      'createSync',
      'update',
      'updateSync',
      'delete',
      'deleteSync',
      'rename',
      'renameSync',
      'target',
      'targetSync',
      'stat',
      'statSync',
      'resolveSymbolicLinks',
      'resolveSymbolicLinksSync',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['RandomAccessFile', '_RandomAccessFile'])) {
    return const {
      'close',
      'closeSync',
      'readByte',
      'readByteSync',
      'read',
      'readSync',
      'readInto',
      'readIntoSync',
      'writeByte',
      'writeByteSync',
      'writeFrom',
      'writeFromSync',
      'writeString',
      'writeStringSync',
      'position',
      'positionSync',
      'setPosition',
      'setPositionSync',
      'length',
      'lengthSync',
      'truncate',
      'truncateSync',
      'flush',
      'flushSync',
      'lock',
      'lockSync',
      'unlock',
      'unlockSync',
      'toString',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['IOSink'])) {
    return const {
      'write',
      'writeln',
      'writeAll',
      'writeCharCode',
      'add',
      'addError',
      'addStream',
      'flush',
      'close',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['Stdout', '_Stdout', '_StdSink'])) {
    return const {
      'write',
      'writeln',
      'writeAll',
      'writeCharCode',
      'add',
      'addError',
      'addStream',
      'flush',
      'close',
    }.contains(name);
  }
  if (_ioClassPath(path, const ['Stdin', '_Stdin'])) {
    return name == 'readLineSync';
  }
  return false;
}

bool _ioClassPath(String path, List<String> classNames) {
  return classNames.any((name) => path.contains('::$name::'));
}

EsmExpression? lowerDartIoInstanceGet({
  required k.Reference reference,
  required String name,
  required EsmExpression Function() lowerReceiver,
}) {
  final path = kernelReferencePath(reference);
  if (!_isDartIoPath(path)) return null;
  final property = switch (name) {
    'path' ||
    'uri' ||
    'method' ||
    'headers' ||
    'cookies' ||
    'contentLength' ||
    'bufferOutput' ||
    'persistentConnection' ||
    'followRedirects' ||
    'maxRedirects' ||
    'connectionInfo' ||
    'statusCode' ||
    'reasonPhrase' ||
    'compressionState' ||
    'isRedirect' ||
    'redirects' ||
    'certificate' ||
    'readyState' ||
    'extensions' ||
    'protocol' ||
    'closeCode' ||
    'closeReason' ||
    'pingInterval' ||
    'idleTimeout' ||
    'connectionTimeout' ||
    'maxConnectionsPerHost' ||
    'autoUncompress' ||
    'userAgent' ||
    'value' ||
    'parameters' ||
    'mimeType' ||
    'primaryType' ||
    'subType' ||
    'charset' ||
    'name' ||
    'expires' ||
    'maxAge' ||
    'domain' ||
    'secure' ||
    'httpOnly' ||
    'sameSite' ||
    'absolute' ||
    'parent' ||
    'exitCode' ||
    'stdout' ||
    'stderr' ||
    'pid' ||
    'message' ||
    'errorCode' ||
    'osError' ||
    'type' ||
    'size' ||
    'mode' ||
    'modified' ||
    'changed' ||
    'accessed' ||
    'hasTerminal' ||
    'terminalColumns' ||
    'terminalLines' ||
    'supportsAnsiEscapes' ||
    'nonBlocking' ||
    'done' => name,
    _ => null,
  };
  if (property == null) return null;
  return EsmPropertyAccess(receiver: lowerReceiver(), property: property);
}

EsmExpression? lowerDartIoInstanceSet({
  required k.Reference reference,
  required String name,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function() lowerReceiver,
  required EsmExpression Function() lowerValue,
}) {
  final path = kernelReferencePath(reference);
  if (!_isDartIoPath(path)) return null;
  final supported =
      (_ioClassPath(path, const ['Cookie', '_Cookie']) &&
          const {
            'name',
            'value',
            'expires',
            'maxAge',
            'domain',
            'path',
            'secure',
            'httpOnly',
            'sameSite',
          }.contains(name)) ||
      (_ioClassPath(path, const ['HttpClient', '_HttpClient']) &&
          const {
            'idleTimeout',
            'connectionTimeout',
            'maxConnectionsPerHost',
            'autoUncompress',
            'userAgent',
          }.contains(name)) ||
      (_ioClassPath(path, const ['HttpClientRequest', '_HttpClientRequest']) &&
          const {
            'contentLength',
            'bufferOutput',
            'persistentConnection',
            'followRedirects',
            'maxRedirects',
          }.contains(name)) ||
      (_ioClassPath(path, const ['HttpHeaders', '_HttpHeaders']) &&
          const {'contentLength', 'contentType'}.contains(name)) ||
      (_ioClassPath(path, const ['WebSocket', '_WebSocketImpl']) &&
          name == 'pingInterval');
  if (!supported) return null;
  helpers.require(_ioHelperForInstancePath(path));
  return EsmAssignment(
    target: EsmPropertyAccess(receiver: lowerReceiver(), property: name),
    value: lowerValue(),
  );
}

EsmExpression _ioOptions(
  k.Arguments arguments,
  EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
) {
  const names = [
    'workingDirectory',
    'environment',
    'includeParentEnvironment',
    'runInShell',
    'stdoutEncoding',
    'stderrEncoding',
  ];
  return EsmObjectLiteral([
    for (final name in names)
      if (lowerNamedArgument(arguments, name) case final value?)
        EsmObjectLiteralProperty.static(key: name, value: value),
  ]);
}

EsmExpression? _staticIoEnum(String path) {
  final field = _staticFieldName(path);
  if (field == null) return null;
  if (path.startsWith('dart:io::FileMode::')) {
    return switch (field) {
      'read' => _ioEnum('FileMode', 'read', 0),
      'write' => _ioEnum('FileMode', 'write', 1),
      'append' => _ioEnum('FileMode', 'append', 2),
      'writeOnly' => _ioEnum('FileMode', 'writeOnly', 3),
      'writeOnlyAppend' => _ioEnum('FileMode', 'writeOnlyAppend', 4),
      _ => null,
    };
  }
  if (path.startsWith('dart:io::FileLock::')) {
    return switch (field) {
      'shared' => _ioEnum('FileLock', 'shared', 1),
      'exclusive' => _ioEnum('FileLock', 'exclusive', 2),
      'blockingShared' => _ioEnum('FileLock', 'blockingShared', 3),
      'blockingExclusive' => _ioEnum('FileLock', 'blockingExclusive', 4),
      _ => null,
    };
  }
  if (path.startsWith('dart:io::FileSystemEntityType::')) {
    return switch (field) {
      'file' => _ioEnum('FileSystemEntityType', 'file', 0),
      'directory' => _ioEnum('FileSystemEntityType', 'directory', 1),
      'link' => _ioEnum('FileSystemEntityType', 'link', 2),
      'unixDomainSock' => _ioEnum('FileSystemEntityType', 'unixDomainSock', 3),
      'pipe' => _ioEnum('FileSystemEntityType', 'pipe', 4),
      'notFound' ||
      'NOT_FOUND' => _ioEnum('FileSystemEntityType', 'notFound', 5),
      _ => null,
    };
  }
  if (path.startsWith('dart:io::ProcessStartMode::')) {
    return switch (field) {
      'normal' => _ioEnum('ProcessStartMode', 'normal', 0),
      'inheritStdio' => _ioEnum('ProcessStartMode', 'inheritStdio', 1),
      'detached' => _ioEnum('ProcessStartMode', 'detached', 2),
      'detachedWithStdio' => _ioEnum(
        'ProcessStartMode',
        'detachedWithStdio',
        3,
      ),
      _ => null,
    };
  }
  return null;
}

EsmExpression? _staticSameSite(String path) {
  if (!_ioClassPath(path, const ['SameSite'])) return null;
  return switch (_staticFieldName(path)) {
    'lax' => _sameSite('Lax'),
    'strict' => _sameSite('Strict'),
    'none' => _sameSite('None'),
    _ => null,
  };
}

EsmExpression? _staticContentType(String path) {
  if (!_ioClassPath(path, const ['ContentType'])) return null;
  final (primaryType, subType, charset) = switch (_staticFieldName(path)) {
    'text' => ('text', 'plain', 'utf-8'),
    'html' => ('text', 'html', 'utf-8'),
    'json' => ('application', 'json', 'utf-8'),
    'binary' => ('application', 'octet-stream', null),
    _ => (null, null, null),
  };
  if (primaryType == null || subType == null) return null;
  return EsmCall(
    callee: const EsmIdentifier('__dartIoContentType'),
    arguments: [
      EsmStringLiteral(primaryType),
      EsmStringLiteral(subType),
      if (charset != null)
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'charset',
            value: EsmStringLiteral(charset),
          ),
        ]),
    ],
  );
}

String? _staticFieldName(String path) {
  const markers = ['::@getters::', '::@fields::'];
  for (final marker in markers) {
    final index = path.lastIndexOf(marker);
    if (index == -1) continue;
    final name = path.substring(index + marker.length);
    final separator = name.lastIndexOf('::');
    return separator == -1 ? name : name.substring(separator + 2);
  }
  return null;
}

String? _platformGetterName(String path) {
  if (!path.startsWith('dart:io::Platform::')) return null;
  final name = _staticFieldName(path);
  return switch (name) {
    'numberOfProcessors' ||
    'pathSeparator' ||
    'operatingSystem' ||
    'operatingSystemVersion' ||
    'localHostname' ||
    'version' ||
    'localeName' ||
    'isLinux' ||
    'isMacOS' ||
    'isWindows' ||
    'isAndroid' ||
    'isIOS' ||
    'isFuchsia' ||
    'environment' ||
    'executable' ||
    'resolvedExecutable' ||
    'executableArguments' ||
    'packageConfig' ||
    'lineTerminator' => name,
    _ => null,
  };
}

EsmCall _ioEnum(String typeName, String name, int index) {
  return EsmCall(
    callee: const EsmIdentifier('__dartIoEnum'),
    arguments: [
      EsmStringLiteral(typeName),
      EsmStringLiteral(name),
      EsmNumberLiteral(index),
    ],
  );
}

EsmCall _sameSite(String name) {
  return EsmCall(
    callee: const EsmIdentifier('__dartIoSameSite'),
    arguments: [
      EsmStringLiteral(name),
      EsmNumberLiteral(switch (name) {
        'Strict' => 1,
        'None' => 2,
        _ => 0,
      }),
    ],
  );
}

EsmRuntimeHelper _ioHelperForInstancePath(String path) {
  if (_pureIoInstancePath(path) || _ioClassPath(path, const ['IOSink'])) {
    return EsmRuntimeHelper.io;
  }
  if (_ioClassPath(path, const [
    'HttpClient',
    '_HttpClient',
    'HttpHeaders',
    '_HttpHeaders',
    'HttpClientRequest',
    '_HttpClientRequest',
    'HttpClientResponse',
    '_HttpClientResponse',
    'WebSocket',
    '_WebSocketImpl',
  ])) {
    return EsmRuntimeHelper.ioWeb;
  }
  return EsmRuntimeHelper.ioNode;
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}

EsmExpression _namedIoOptions(
  k.Arguments arguments,
  EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
  List<String> names,
) {
  return EsmObjectLiteral([
    for (final name in names)
      if (lowerNamedArgument(arguments, name) case final value?)
        EsmObjectLiteralProperty.static(key: name, value: value),
  ]);
}

EsmExpression _nullableString(String? value) {
  return value == null ? const EsmNullLiteral() : EsmStringLiteral(value);
}

String _fileModeName(int value) {
  return switch (value) {
    0 => 'read',
    1 => 'write',
    2 => 'append',
    3 => 'writeOnly',
    4 => 'writeOnlyAppend',
    _ => 'read',
  };
}

String _fileLockName(int value) {
  return switch (value) {
    1 => 'shared',
    2 => 'exclusive',
    3 => 'blockingShared',
    4 => 'blockingExclusive',
    _ => 'exclusive',
  };
}

String _fileSystemEntityTypeName(int value) {
  return switch (value) {
    0 => 'file',
    1 => 'directory',
    2 => 'link',
    3 => 'unixDomainSock',
    4 => 'pipe',
    _ => 'notFound',
  };
}

String _processStartModeName(int value) {
  return switch (value) {
    0 => 'normal',
    1 => 'inheritStdio',
    2 => 'detached',
    3 => 'detachedWithStdio',
    _ => 'normal',
  };
}

int? _constantIntField(k.InstanceConstant constant, String name) {
  for (final entry in constant.fieldValues.entries) {
    if (!_fieldReferenceMatches(entry.key, name)) continue;
    final value = entry.value;
    if (value is k.IntConstant) return value.value;
  }
  return null;
}

String? _constantStringField(k.InstanceConstant constant, String name) {
  for (final entry in constant.fieldValues.entries) {
    if (!_fieldReferenceMatches(entry.key, name)) continue;
    final value = entry.value;
    if (value is k.StringConstant) return value.value;
  }
  return null;
}

EsmExpression? _constantOsErrorField(k.InstanceConstant constant, String name) {
  for (final entry in constant.fieldValues.entries) {
    if (!_fieldReferenceMatches(entry.key, name)) continue;
    final value = entry.value;
    if (value is k.NullConstant) return const EsmNullLiteral();
    if (value is k.InstanceConstant &&
        kernelReferencePath(value.classReference) == 'dart:io::OSError') {
      return EsmCall(
        callee: const EsmIdentifier('__dartIoOSError'),
        arguments: [
          EsmStringLiteral(_constantStringField(value, 'message') ?? ''),
          EsmNumberLiteral(_constantIntField(value, 'errorCode') ?? -1),
        ],
      );
    }
  }
  return null;
}

bool _fieldReferenceMatches(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return path.endsWith('::$name') || path.endsWith('::$name#get');
}

bool _pureIoInstancePath(String path) {
  if (!_isDartIoPath(path)) return false;
  return path.startsWith('dart:io::OSError::') ||
      path.startsWith('dart:io::FileSystemException::') ||
      path.startsWith('dart:io::PathAccessException::') ||
      path.startsWith('dart:io::PathExistsException::') ||
      path.startsWith('dart:io::PathNotFoundException::') ||
      path.startsWith('dart:io::FileMode::') ||
      path.startsWith('dart:io::FileLock::') ||
      path.startsWith('dart:io::FileSystemEntityType::') ||
      path.startsWith('dart:io::ProcessResult::') ||
      path.startsWith('dart:io::ProcessStartMode::') ||
      path.startsWith('dart:io::ProcessSignal::') ||
      path.startsWith('dart:io::HeaderValue::') ||
      path.startsWith('dart:io::ContentType::') ||
      path.startsWith('dart:io::Cookie::') ||
      path.startsWith('dart:io::SameSite::') ||
      path.startsWith('dart:io::HttpClientResponseCompressionState::') ||
      _ioClassPath(path, const [
        'HeaderValue',
        'ContentType',
        'Cookie',
        'SameSite',
        'HttpClientResponseCompressionState',
      ]);
}

bool _isDartIoPath(String path) {
  return path.startsWith('dart:io::') || path.startsWith('dart:_http::');
}
