import 'package:kernel/kernel.dart' as k;

import '../../ast/esm_ast.dart';
import '../../foundation/kernel/kernel_references.dart';
import '../../foundation/kernel/sdk_symbols.dart';
import '../../transformer/helpers/runtime_helpers.dart';

EsmExpression? lowerDartAsyncStaticGet({
  required k.StaticGet expression,
  required EsmRuntimeHelperUseSet helpers,
}) {
  if (kernelReferencePath(expression.targetReference) ==
      'dart:async::Zone::@getters::current') {
    helpers.require(EsmRuntimeHelper.future);
    return const EsmIdentifier('__dartCurrentZone');
  }
  return null;
}

EsmExpression? lowerDartAsyncConstructorInvocation({
  required k.ConstructorInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  final path = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if (path == 'dart:async::_EmptyStream::@constructors::' &&
      positional.isEmpty) {
    helpers.require(EsmRuntimeHelper.future);
    return EsmCall(
      callee: const EsmIdentifier('__dartStreamFromIterable'),
      arguments: const [EsmArrayLiteral([]), EsmBooleanLiteral(true)],
    );
  }
  if (path == 'dart:async::_StreamHandlerTransformer::@constructors::' &&
      positional.isEmpty) {
    helpers.require(EsmRuntimeHelper.future);
    return EsmCall(
      callee: const EsmIdentifier('__dartStreamTransformerFromHandlers'),
      arguments: [
        EsmObjectLiteral([
          for (final name in ['handleData', 'handleError', 'handleDone'])
            if (lowerNamedArgument(expression.arguments, name)
                case final callback?)
              EsmObjectLiteralProperty.static(key: name, value: callback),
        ]),
      ],
    );
  }
  if (path == 'dart:async::_StreamBindTransformer::@constructors::' &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.future);
    return EsmCall(
      callee: const EsmIdentifier('__dartStreamTransformerFromBind'),
      arguments: [lower(positional.single)],
    );
  }
  if (path == 'dart:async::AsyncError::@constructors::' &&
      expression.arguments.named.isEmpty &&
      expression.arguments.types.isEmpty &&
      positional.length == 2) {
    helpers.require(EsmRuntimeHelper.future);
    return EsmCall(
      callee: const EsmIdentifier('__dartAsyncError'),
      arguments: [lower(positional[0]), lower(positional[1])],
    );
  }
  if (isDartAsyncStreamIteratorConstructorReference(
        expression.targetReference,
      ) &&
      expression.arguments.named.isEmpty &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.future);
    return EsmCall(
      callee: const EsmIdentifier('__dartStreamIterator'),
      arguments: [lower(positional.single)],
    );
  }
  return null;
}

EsmExpression? lowerDartAsyncStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
  required EsmExpression Function(EsmExpression value) arrayFrom,
}) {
  if (expression.arguments.named.isNotEmpty &&
      !_hasOnlyNamedArguments(expression.arguments, {
        'cleanUp',
        'eagerError',
        'onError',
        'test',
        'handleData',
        'handleError',
        'handleDone',
        'broadcast',
        'isBroadcast',
        'onCancel',
        'onListen',
        'onPause',
        'onResume',
        'onTimeout',
        'orElse',
        'sync',
        'zoneValues',
      })) {
    return null;
  }
  final path = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if (path == 'dart:async::@methods::FutureIterable|get#wait' &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.future);
    return EsmCall(
      callee: const EsmIdentifier('__dartFutureIterableWait'),
      arguments: [arrayFrom(lower(positional.single))],
    );
  }
  if (path.startsWith('dart:async::@methods::FutureRecord') &&
      path.endsWith('|get#wait') &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.future);
    return EsmCall(
      callee: const EsmIdentifier('__dartFutureRecordWait'),
      arguments: [lower(positional.single)],
    );
  }
  switch (path) {
    case 'dart:async::Future::@factories::value':
      return _promiseResolve(
        positional.isEmpty ? const EsmNullLiteral() : lower(positional.single),
      );
    case 'dart:async::Future::@factories::syncValue':
      return _promiseResolve(
        positional.isEmpty ? const EsmNullLiteral() : lower(positional.single),
      );
    case 'dart:async::Future::@factories::error':
      if (positional.isEmpty || positional.length > 2) return null;
      return _promiseReject(lower(positional.first));
    case 'dart:async::Future::@factories::' ||
        'dart:async::Future::@factories::sync' ||
        'dart:async::Future::@factories::microtask':
      if (positional.length != 1) return null;
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmCall(
            callee: EsmPropertyAccess(
              receiver: EsmIdentifier('Promise'),
              property: 'resolve',
            ),
            arguments: [],
          ),
          property: 'then',
        ),
        arguments: [lower(positional.single)],
      );
    case 'dart:async::Future::@factories::delayed':
      if (positional.isEmpty || positional.length > 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.future),
        arguments: [
          lower(positional[0]),
          positional.length == 2
              ? lower(positional[1])
              : const EsmNullLiteral(),
        ],
      );
    case 'dart:async::Future::@methods::wait':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartFutureWait'),
        arguments: [
          arrayFrom(lower(positional.single)),
          lowerNamedArgument(expression.arguments, 'eagerError') ??
              const EsmBooleanLiteral(false),
          lowerNamedArgument(expression.arguments, 'cleanUp') ??
              const EsmNullLiteral(),
        ],
      );
    case 'dart:async::Future::@methods::any':
      if (positional.length != 1) return null;
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Promise'),
          property: 'race',
        ),
        arguments: [arrayFrom(lower(positional.single))],
      );
    case 'dart:async::Future::@methods::forEach':
      if (positional.length != 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartFutureForEach'),
        arguments: [arrayFrom(lower(positional[0])), lower(positional[1])],
      );
    case 'dart:async::Future::@methods::doWhile':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartFutureDoWhile'),
        arguments: [lower(positional.single)],
      );
    case 'dart:async::AsyncError::@methods::defaultStackTrace':
      if (positional.length != 1) return null;
      return EsmNullishCoalesce(
        left: EsmOptionalPropertyAccess(
          receiver: lower(positional.single),
          property: 'stack',
        ),
        right: const EsmNullLiteral(),
      );
    case 'dart:async::Completer::@factories::' ||
        'dart:async::Completer::@factories::sync':
      if (positional.isNotEmpty) return null;
      helpers.require(EsmRuntimeHelper.completer);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.completer),
        arguments: const [],
      );
    case 'dart:async::Timer::@factories::':
      if (positional.length != 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartTimer'),
        arguments: [
          lower(positional[0]),
          lower(positional[1]),
          const EsmBooleanLiteral(false),
        ],
      );
    case 'dart:async::Timer::@factories::periodic':
      if (positional.length != 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartTimer'),
        arguments: [
          lower(positional[0]),
          lower(positional[1]),
          const EsmBooleanLiteral(true),
        ],
      );
    case 'dart:async::Timer::@methods::run':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartScheduleMicrotask'),
        arguments: [lower(positional.single)],
      );
    case 'dart:async::Stream::@factories::fromIterable':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamFromIterable'),
        arguments: [arrayFrom(lower(positional.single))],
      );
    case 'dart:async::Stream::@factories::empty':
      if (positional.isNotEmpty) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamFromIterable'),
        arguments: [
          const EsmArrayLiteral([]),
          lowerNamedArgument(expression.arguments, 'broadcast') ??
              const EsmBooleanLiteral(true),
        ],
      );
    case 'dart:async::Stream::@factories::fromFuture':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamFromFuture'),
        arguments: [lower(positional.single)],
      );
    case 'dart:async::Stream::@factories::fromFutures':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamFromFutures'),
        arguments: [arrayFrom(lower(positional.single))],
      );
    case 'dart:async::Stream::@factories::value':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamFromIterable'),
        arguments: [
          EsmArrayLiteral([lower(positional.single)]),
        ],
      );
    case 'dart:async::Stream::@factories::error':
      if (positional.isEmpty || positional.length > 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamError'),
        arguments: [lower(positional.first)],
      );
    case 'dart:async::Stream::@factories::periodic':
      if (positional.isEmpty || positional.length > 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamPeriodic'),
        arguments: [
          lower(positional[0]),
          positional.length == 2
              ? lower(positional[1])
              : const EsmNullLiteral(),
        ],
      );
    case 'dart:async::Stream::@factories::multi':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamMulti'),
        arguments: [
          lower(positional.single),
          lowerNamedArgument(expression.arguments, 'isBroadcast') ??
              const EsmBooleanLiteral(false),
        ],
      );
    case 'dart:async::Stream::@factories::eventTransformed':
      if (positional.length != 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamEventTransformed'),
        arguments: [lower(positional[0]), lower(positional[1])],
      );
    case 'dart:async::StreamTransformer::@factories::fromBind':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamTransformerFromBind'),
        arguments: [lower(positional.single)],
      );
    case 'dart:async::StreamTransformer::@factories::fromHandlers':
      if (positional.isNotEmpty) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamTransformerFromHandlers'),
        arguments: [
          EsmObjectLiteral([
            for (final name in ['handleData', 'handleError', 'handleDone'])
              if (lowerNamedArgument(expression.arguments, name)
                  case final callback?)
                EsmObjectLiteralProperty.static(key: name, value: callback),
          ]),
        ],
      );
    case 'dart:async::StreamController::@factories::':
      if (positional.isNotEmpty) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamController'),
        arguments: [
          const EsmBooleanLiteral(false),
          _streamControllerOptions(expression.arguments, lowerNamedArgument),
        ],
      );
    case 'dart:async::StreamController::@factories::broadcast':
      if (positional.isNotEmpty) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartStreamController'),
        arguments: [
          const EsmBooleanLiteral(true),
          _streamControllerOptions(expression.arguments, lowerNamedArgument),
        ],
      );
    case 'dart:async::@methods::FutureExtensions|ignore':
    case 'dart:async::@methods::unawaited':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartFutureIgnore'),
        arguments: [lower(positional.single)],
      );
    case 'dart:async::@methods::FutureExtensions|onError':
      if (positional.length != 2) return null;
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: _promiseResolve(lower(positional[0])),
          property: 'catch',
        ),
        arguments: [
          EsmArrowFunction(
            parameters: const [EsmIdentifierParameter(name: 'error')],
            body: EsmCall(
              callee: lower(positional[1]),
              arguments: const [EsmIdentifier('error'), EsmNullLiteral()],
            ),
          ),
        ],
      );
    case 'dart:async::@methods::scheduleMicrotask':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartScheduleMicrotask'),
        arguments: [lower(positional.single)],
      );
    case 'dart:async::@methods::runZoned':
      if (positional.length != 1) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartRunZoned'),
        arguments: [
          lower(positional.single),
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(
              key: 'zoneValues',
              value:
                  lowerNamedArgument(expression.arguments, 'zoneValues') ??
                  const EsmNullLiteral(),
            ),
          ]),
        ],
      );
    case 'dart:async::@methods::runZonedGuarded':
      if (positional.length != 2) return null;
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartRunZonedGuarded'),
        arguments: [
          lower(positional[0]),
          lower(positional[1]),
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(
              key: 'zoneValues',
              value:
                  lowerNamedArgument(expression.arguments, 'zoneValues') ??
                  const EsmNullLiteral(),
            ),
          ]),
        ],
      );
    default:
      return null;
  }
}

EsmExpression? lowerDartAsyncInstanceInvocation({
  required k.Reference reference,
  required String name,
  required k.Arguments arguments,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function() lowerReceiver,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  final positional = arguments.positional;
  if (isDartAsyncFutureMember(reference, name)) {
    final receiver = _promiseResolve(lowerReceiver());
    if (name == 'then' && positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'then'),
        arguments: [
          lower(positional.single),
          if (lowerNamedArgument(arguments, 'onError') case final onError?)
            onError,
        ],
      );
    }
    if (name == 'catchError' && positional.length == 1) {
      final onError = lower(positional.single);
      final test = lowerNamedArgument(arguments, 'test');
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'catch'),
        arguments: [
          test == null
              ? onError
              : EsmArrowFunction(
                  parameters: const [EsmIdentifierParameter(name: 'error')],
                  body: EsmConditional(
                    condition: EsmCall(
                      callee: test,
                      arguments: const [EsmIdentifier('error')],
                    ),
                    thenExpression: EsmCall(
                      callee: onError,
                      arguments: const [EsmIdentifier('error')],
                    ),
                    otherwiseExpression: _promiseReject(
                      const EsmIdentifier('error'),
                    ),
                  ),
                ),
        ],
      );
    }
    if (name == 'whenComplete' && positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'finally'),
        arguments: [lower(positional.single)],
      );
    }
    if (name == 'onError' && positional.length == 1) {
      final callback = lower(positional.single);
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'catch'),
        arguments: [
          EsmArrowFunction(
            parameters: const [EsmIdentifierParameter(name: 'error')],
            body: EsmCall(
              callee: callback,
              arguments: const [EsmIdentifier('error'), EsmNullLiteral()],
            ),
          ),
        ],
      );
    }
    if (name == 'ignore' && positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartFutureIgnore'),
        arguments: [lowerReceiver()],
      );
    }
    if (name == 'asStream' && positional.isEmpty) {
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartFutureAsStream'),
        arguments: [lowerReceiver()],
      );
    }
    if (name == 'timeout' && positional.length == 1) {
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: const EsmIdentifier('__dartFutureTimeout'),
        arguments: [
          lowerReceiver(),
          lower(positional.single),
          lowerNamedArgument(arguments, 'onTimeout') ?? const EsmNullLiteral(),
        ],
      );
    }
  }
  if (isDartSdkLibraryClassMember(reference, 'dart:async', 'Completer', name)) {
    final receiver = lowerReceiver();
    if ((name == 'complete' || name == 'completeError') &&
        positional.length <= 2) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: name),
        arguments: [for (final argument in positional) lower(argument)],
      );
    }
  }
  if (isDartAsyncZoneMember(reference, name)) {
    final receiver = lowerReceiver();
    return switch (name) {
      '[]' when positional.length == 1 => EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'get'),
        arguments: [lower(positional.single)],
      ),
      'run' ||
      'runGuarded' ||
      'bindCallback' ||
      'bindCallbackGuarded' when positional.length == 1 => EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: name),
        arguments: [lower(positional.single)],
      ),
      'runUnary' ||
      'runUnaryGuarded' ||
      'bindUnaryCallback' ||
      'bindUnaryCallbackGuarded' ||
      'scheduleMicrotask'
          when positional.length >= 1 && positional.length <= 2 =>
        EsmCall(
          callee: EsmPropertyAccess(receiver: receiver, property: name),
          arguments: [for (final argument in positional) lower(argument)],
        ),
      'runBinary' ||
      'runBinaryGuarded' ||
      'bindBinaryCallback' ||
      'bindBinaryCallbackGuarded'
          when positional.length >= 1 && positional.length <= 3 =>
        EsmCall(
          callee: EsmPropertyAccess(receiver: receiver, property: name),
          arguments: [for (final argument in positional) lower(argument)],
        ),
      'fork' => EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'fork'),
        arguments: [
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(
              key: 'zoneValues',
              value:
                  lowerNamedArgument(arguments, 'zoneValues') ??
                  const EsmNullLiteral(),
            ),
          ]),
        ],
      ),
      _ => null,
    };
  }
  if (isDartSdkLibraryClassMember(reference, 'dart:async', 'Timer', name)) {
    final receiver = lowerReceiver();
    if (name == 'cancel' && positional.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'cancel'),
        arguments: const [],
      );
    }
  }
  if (isDartAsyncStreamMember(reference, name)) {
    helpers.require(EsmRuntimeHelper.future);
    final receiver = lowerReceiver();
    return switch (name) {
      'toList' when positional.isEmpty => EsmCall(
        callee: const EsmIdentifier('__dartStreamToList'),
        arguments: [receiver],
      ),
      'toSet' when positional.isEmpty => EsmCall(
        callee: const EsmIdentifier('__dartStreamToSet'),
        arguments: [receiver],
      ),
      'join' when positional.length <= 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamJoin'),
        arguments: [
          receiver,
          positional.isEmpty
              ? const EsmStringLiteral('')
              : lower(positional[0]),
        ],
      ),
      'any' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamAny'),
        arguments: [receiver, lower(positional.single)],
      ),
      'every' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamEvery'),
        arguments: [receiver, lower(positional.single)],
      ),
      'contains' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamContains'),
        arguments: [receiver, lower(positional.single)],
      ),
      'drain' when positional.length <= 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamDrain'),
        arguments: [
          receiver,
          positional.isEmpty ? const EsmNullLiteral() : lower(positional[0]),
        ],
      ),
      'skip' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamSkip'),
        arguments: [receiver, lower(positional.single)],
      ),
      'take' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamTake'),
        arguments: [receiver, lower(positional.single)],
      ),
      'takeWhile' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamTakeWhile'),
        arguments: [receiver, lower(positional.single)],
      ),
      'skipWhile' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamSkipWhile'),
        arguments: [receiver, lower(positional.single)],
      ),
      'firstWhere' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamFirstWhere'),
        arguments: [
          receiver,
          lower(positional.single),
          lowerNamedArgument(arguments, 'orElse') ?? const EsmNullLiteral(),
        ],
      ),
      'lastWhere' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamLastWhere'),
        arguments: [
          receiver,
          lower(positional.single),
          lowerNamedArgument(arguments, 'orElse') ?? const EsmNullLiteral(),
        ],
      ),
      'singleWhere' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamSingleWhere'),
        arguments: [
          receiver,
          lower(positional.single),
          lowerNamedArgument(arguments, 'orElse') ?? const EsmNullLiteral(),
        ],
      ),
      'map' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamMap'),
        arguments: [receiver, lower(positional.single)],
      ),
      'asyncMap' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamAsyncMap'),
        arguments: [receiver, lower(positional.single)],
      ),
      'where' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamWhere'),
        arguments: [receiver, lower(positional.single)],
      ),
      'expand' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamExpand'),
        arguments: [receiver, lower(positional.single)],
      ),
      'asyncExpand' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamAsyncExpand'),
        arguments: [receiver, lower(positional.single)],
      ),
      'distinct' when positional.length <= 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamDistinct'),
        arguments: [
          receiver,
          positional.isEmpty ? const EsmNullLiteral() : lower(positional[0]),
        ],
      ),
      'handleError' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamHandleError'),
        arguments: [
          receiver,
          lower(positional.single),
          lowerNamedArgument(arguments, 'test') ?? const EsmNullLiteral(),
        ],
      ),
      'fold' when positional.length == 2 => EsmCall(
        callee: const EsmIdentifier('__dartStreamFold'),
        arguments: [receiver, lower(positional[0]), lower(positional[1])],
      ),
      'reduce' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamReduce'),
        arguments: [receiver, lower(positional.single)],
      ),
      'forEach' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamForEach'),
        arguments: [receiver, lower(positional.single)],
      ),
      'cast' when positional.isEmpty => receiver,
      'asBroadcastStream' when positional.isEmpty => EsmCall(
        callee: const EsmIdentifier('__dartStreamAsBroadcast'),
        arguments: [
          receiver,
          lowerNamedArgument(arguments, 'onListen') ?? const EsmNullLiteral(),
          lowerNamedArgument(arguments, 'onCancel') ?? const EsmNullLiteral(),
        ],
      ),
      'timeout' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamTimeout'),
        arguments: [
          receiver,
          lower(positional.single),
          lowerNamedArgument(arguments, 'onTimeout') ?? const EsmNullLiteral(),
        ],
      ),
      'pipe' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamPipe'),
        arguments: [receiver, lower(positional.single)],
      ),
      'transform' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamTransform'),
        arguments: [receiver, lower(positional.single)],
      ),
      'listen' when positional.length == 1 => EsmCall(
        callee: const EsmIdentifier('__dartStreamListen'),
        arguments: [
          receiver,
          lower(positional.single),
          lowerNamedArgument(arguments, 'onError') ?? const EsmNullLiteral(),
          lowerNamedArgument(arguments, 'onDone') ?? const EsmNullLiteral(),
          lowerNamedArgument(arguments, 'cancelOnError') ??
              const EsmBooleanLiteral(false),
        ],
      ),
      _ => null,
    };
  }
  if (isDartSdkLibraryClassMember(
    reference,
    'dart:async',
    'StreamTransformer',
    name,
  )) {
    if (name == 'bind' && positional.length == 1) {
      helpers.require(EsmRuntimeHelper.future);
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: 'bind'),
        arguments: [lower(positional.single)],
      );
    }
  }
  if (isDartAsyncStreamConsumerMember(reference, name)) {
    final receiver = lowerReceiver();
    if (name == 'addStream' && positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: name),
        arguments: [
          lower(positional.single),
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(
              key: 'cancelOnError',
              value:
                  lowerNamedArgument(arguments, 'cancelOnError') ??
                  const EsmBooleanLiteral(false),
            ),
          ]),
        ],
      );
    }
    if ((name == 'add' || name == 'addError') && positional.isNotEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: name),
        arguments: [for (final argument in positional) lower(argument)],
      );
    }
    if (name == 'close' && positional.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: receiver, property: 'close'),
        arguments: const [],
      );
    }
  }
  if (isDartSdkLibraryClassMember(
    reference,
    'dart:async',
    'StreamSubscription',
    name,
  )) {
    if ((name == 'cancel' || name == 'pause' || name == 'resume') &&
        positional.length <= 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: name),
        arguments: [for (final argument in positional) lower(argument)],
      );
    }
    if ((name == 'onData' || name == 'onError' || name == 'onDone') &&
        positional.length == 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: name),
        arguments: [lower(positional.single)],
      );
    }
    if (name == 'asFuture' && positional.length <= 1) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: name),
        arguments: [
          positional.isEmpty ? const EsmNullLiteral() : lower(positional[0]),
        ],
      );
    }
  }
  if (_isDartAsyncStreamIteratorMember(reference, name)) {
    if ((name == 'moveNext' || name == 'cancel') && positional.isEmpty) {
      return EsmCall(
        callee: EsmPropertyAccess(receiver: lowerReceiver(), property: name),
        arguments: const [],
      );
    }
  }
  return null;
}

EsmExpression? lowerDartAsyncInstanceGet({
  required k.Reference reference,
  required String name,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function() lowerReceiver,
}) {
  if (isDartSdkLibraryClassMember(reference, 'dart:async', 'Completer', name)) {
    return switch (name) {
      'future' || 'isCompleted' => EsmPropertyAccess(
        receiver: lowerReceiver(),
        property: name,
      ),
      _ => null,
    };
  }
  if (isDartSdkLibraryClassMember(
        reference,
        'dart:async',
        'ParallelWaitError',
        name,
      ) ||
      isDartSdkLibraryClassMember(
        reference,
        'dart:async',
        'AsyncError',
        name,
      )) {
    return switch (name) {
      'values' ||
      'errors' ||
      'errorCount' ||
      'defaultError' ||
      'stackTrace' ||
      'error' => EsmPropertyAccess(receiver: lowerReceiver(), property: name),
      _ => null,
    };
  }
  if (isDartAsyncZoneMember(reference, name)) {
    return switch (name) {
      'parent' || 'errorZone' => EsmPropertyAccess(
        receiver: lowerReceiver(),
        property: name,
      ),
      _ => null,
    };
  }
  if (isDartSdkLibraryClassMember(reference, 'dart:async', 'Timer', name)) {
    return switch (name) {
      'isActive' ||
      'tick' => EsmPropertyAccess(receiver: lowerReceiver(), property: name),
      _ => null,
    };
  }
  if (isDartAsyncStreamMember(reference, name)) {
    helpers.require(EsmRuntimeHelper.future);
    return switch (name) {
      'first' => EsmCall(
        callee: const EsmIdentifier('__dartStreamFirst'),
        arguments: [lowerReceiver()],
      ),
      'length' => EsmCall(
        callee: const EsmIdentifier('__dartStreamLength'),
        arguments: [lowerReceiver()],
      ),
      'isEmpty' => EsmCall(
        callee: const EsmIdentifier('__dartStreamIsEmpty'),
        arguments: [lowerReceiver()],
      ),
      'last' => EsmCall(
        callee: const EsmIdentifier('__dartStreamLast'),
        arguments: [lowerReceiver()],
      ),
      'single' => EsmCall(
        callee: const EsmIdentifier('__dartStreamSingle'),
        arguments: [lowerReceiver()],
      ),
      'isBroadcast' => EsmPropertyAccess(
        receiver: lowerReceiver(),
        property: 'isBroadcast',
      ),
      _ => null,
    };
  }
  if (isDartAsyncStreamConsumerMember(reference, name)) {
    return switch (name) {
      'stream' ||
      'sink' ||
      'done' ||
      'isClosed' ||
      'isPaused' ||
      'hasListener' => EsmPropertyAccess(
        receiver: lowerReceiver(),
        property: name,
      ),
      _ => null,
    };
  }
  if (isDartSdkLibraryClassMember(
    reference,
    'dart:async',
    'StreamSubscription',
    name,
  )) {
    return switch (name) {
      'isPaused' => EsmPropertyAccess(
        receiver: lowerReceiver(),
        property: name,
      ),
      _ => null,
    };
  }
  if (_isDartAsyncStreamIteratorMember(reference, name)) {
    return switch (name) {
      'current' || '_subscription' => EsmPropertyAccess(
        receiver: lowerReceiver(),
        property: name,
      ),
      _ => null,
    };
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

EsmCall _promiseReject(EsmExpression value) {
  return EsmCall(
    callee: const EsmPropertyAccess(
      receiver: EsmIdentifier('Promise'),
      property: 'reject',
    ),
    arguments: [value],
  );
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}

bool _isDartAsyncStreamIteratorMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:async::') &&
      path.contains('StreamIterator::') &&
      kernelPathHasMember(path, name);
}

EsmObjectLiteral _streamControllerOptions(
  k.Arguments arguments,
  EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
) {
  return EsmObjectLiteral([
    for (final name in ['onListen', 'onPause', 'onResume', 'onCancel'])
      EsmObjectLiteralProperty.static(
        key: name,
        value: lowerNamedArgument(arguments, name) ?? const EsmNullLiteral(),
      ),
  ]);
}
