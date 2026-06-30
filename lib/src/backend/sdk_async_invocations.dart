import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkAsyncInvocationEmitter {
  DartSdkAsyncInvocationEmitter({
    required this.helpers,
    required this.namedArgument,
    required this.emitTypeTest,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String? Function(k.Arguments arguments, String name) namedArgument;
  final String Function(String operand, k.DartType type, Object node)
  emitTypeTest;

  String? emitStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (path == 'dart:async::Future::@factories::' &&
        positionalArgs.length == 1) {
      return 'new Promise((resolve, reject) => setTimeout(() => { try { resolve((${positionalArgs.single})()); } catch (error) { reject(error); } }, 0))';
    }
    if (path == 'dart:async::StreamIterator::@factories::' &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamIterator');
      return '__dartStreamIterator(${positionalArgs.single})';
    }
    if (path == 'dart:async::Future::@factories::value') {
      final value = positionalArgs.isEmpty ? 'null' : positionalArgs.single;
      return 'Promise.resolve($value)';
    }
    if (path == 'dart:async::Future::@factories::syncValue' &&
        positionalArgs.length == 1) {
      return 'Promise.resolve(${positionalArgs.single})';
    }
    if (path == 'dart:async::Future::@factories::error' &&
        positionalArgs.isNotEmpty) {
      return 'Promise.reject(${positionalArgs.first})';
    }
    if (path == 'dart:async::Future::@factories::sync' &&
        positionalArgs.length == 1) {
      return 'Promise.resolve().then(() => (${positionalArgs.single})())';
    }
    if (path == 'dart:async::Future::@factories::microtask' &&
        positionalArgs.length == 1) {
      return 'Promise.resolve().then(() => (${positionalArgs.single})())';
    }
    if (path == 'dart:async::AsyncError::@methods::defaultStackTrace' &&
        positionalArgs.length == 1) {
      return '(${positionalArgs.single}?.stack ?? new Error().stack ?? "<javascript stack unavailable>")';
    }
    if (path == 'dart:async::Future::@factories::delayed' &&
        positionalArgs.isNotEmpty) {
      final duration = positionalArgs.first;
      final computation = positionalArgs.length >= 2 ? positionalArgs[1] : null;
      final value = computation == null ? 'null' : '($computation)()';
      return 'new Promise((resolve, reject) => setTimeout(() => { try { resolve($value); } catch (error) { reject(error); } }, Math.max(0, $duration.inMilliseconds)))';
    }
    if (path == 'dart:async::Future::@methods::wait' &&
        positionalArgs.length == 1) {
      helpers.add('__dartFutureWait');
      final eagerError =
          namedArgument(expression.arguments, 'eagerError') ?? 'false';
      final cleanUp = namedArgument(expression.arguments, 'cleanUp') ?? 'null';
      return '__dartFutureWait(${positionalArgs.single}, $eagerError, $cleanUp)';
    }
    if (path == 'dart:async::@methods::FutureIterable|get#wait' &&
        positionalArgs.length == 1) {
      helpers.add('__dartFutureIterableWait');
      return '__dartFutureIterableWait(${positionalArgs.single})';
    }
    if (path.startsWith('dart:async::@methods::FutureRecord') &&
        path.endsWith('|get#wait') &&
        positionalArgs.length == 1) {
      helpers.add('__dartFutureRecordWait');
      helpers.add('__dartRecord');
      return '__dartFutureRecordWait(${positionalArgs.single})';
    }
    if (path == 'dart:async::Future::@methods::any' &&
        positionalArgs.length == 1) {
      return 'Promise.race(Array.from(${positionalArgs.single}))';
    }
    if (path == 'dart:async::Future::@methods::forEach' &&
        positionalArgs.length == 2) {
      helpers.add('__dartFutureForEach');
      return '__dartFutureForEach(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (path == 'dart:async::Future::@methods::doWhile' &&
        positionalArgs.length == 1) {
      helpers.add('__dartFutureDoWhile');
      return '__dartFutureDoWhile(${positionalArgs.single})';
    }
    if (path == 'dart:async::@methods::scheduleMicrotask' &&
        positionalArgs.length == 1) {
      helpers.add('__dartZone');
      helpers.add('__dartScheduleMicrotask');
      return '__dartScheduleMicrotask(${positionalArgs.single})';
    }
    if (path == 'dart:async::@methods::unawaited' &&
        positionalArgs.length == 1) {
      return '(${positionalArgs.single}, null)';
    }
    if (path == 'dart:async::@methods::runZoned' &&
        positionalArgs.length == 1) {
      helpers.add('__dartZone');
      final zoneValues = namedArgument(expression.arguments, 'zoneValues');
      final onError = namedArgument(expression.arguments, 'onError');
      return '__dartRunZoned(${positionalArgs.single}, { zoneValues: ${zoneValues ?? 'null'}, onError: ${onError ?? 'null'} })';
    }
    if (path == 'dart:async::@methods::runZonedGuarded' &&
        positionalArgs.length == 2) {
      helpers.add('__dartZone');
      final zoneValues = namedArgument(expression.arguments, 'zoneValues');
      return '__dartRunZonedGuarded(${positionalArgs[0]}, ${positionalArgs[1]}, { zoneValues: ${zoneValues ?? 'null'} })';
    }
    if (path == 'dart:async::@methods::FutureExtensions|ignore' &&
        positionalArgs.length == 1) {
      return '(${positionalArgs.single}.catch(() => null), null)';
    }
    if (path == 'dart:async::@methods::FutureExtensions|onError' &&
        positionalArgs.length == 2) {
      return '${positionalArgs[0]}.catch((error) => (${positionalArgs[1]})(error, error?.stack ?? "<javascript stack unavailable>"))';
    }
    if ((path == 'dart:async::Completer::@factories::' ||
            path == 'dart:async::Completer::@factories::sync') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartCompleter');
      return '__dartCompleter()';
    }
    if ((path == 'dart:async::StreamController::@factories::' ||
            path == 'dart:async::StreamController::@factories::broadcast') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartStreamController');
      final isBroadcast = path.endsWith('::broadcast');
      final onListen = namedArgument(expression.arguments, 'onListen');
      final onPause = namedArgument(expression.arguments, 'onPause');
      final onResume = namedArgument(expression.arguments, 'onResume');
      final onCancel = namedArgument(expression.arguments, 'onCancel');
      return '__dartStreamController(${isBroadcast ? 'true' : 'false'}, { onListen: ${onListen ?? 'null'}, onPause: ${onPause ?? 'null'}, onResume: ${onResume ?? 'null'}, onCancel: ${onCancel ?? 'null'} })';
    }
    if (path == 'dart:async::Timer::@factories::' &&
        positionalArgs.length == 2) {
      helpers.add('__dartTimer');
      return '__dartTimer(${positionalArgs[0]}, ${positionalArgs[1]}, false)';
    }
    if (path == 'dart:async::Timer::@factories::periodic' &&
        positionalArgs.length == 2) {
      helpers.add('__dartTimer');
      return '__dartTimer(${positionalArgs[0]}, ${positionalArgs[1]}, true)';
    }
    if (path == 'dart:async::Timer::@methods::run' &&
        positionalArgs.length == 1) {
      helpers.add('__dartTimer');
      return '(__dartTimer(0, ${positionalArgs.single}, false), null)';
    }
    if (path == 'dart:async::Stream::@factories::fromIterable' &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamFromIterable');
      return '__dartStreamFromIterable(${positionalArgs.single})';
    }
    if (path == 'dart:async::Stream::@factories::fromFuture' &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamFromFuture');
      return '__dartStreamFromFuture(${positionalArgs.single})';
    }
    if (path == 'dart:async::Stream::@factories::fromFutures' &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamFromFutures');
      return '__dartStreamFromFutures(${positionalArgs.single})';
    }
    if (path == 'dart:async::Stream::@factories::value' &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamFromIterable');
      return '__dartStreamFromIterable([${positionalArgs.single}])';
    }
    if (path == 'dart:async::Stream::@factories::error' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      helpers.add('__dartStreamError');
      return '__dartStreamError(${positionalArgs.single})';
    }
    if (path == 'dart:async::Stream::@factories::periodic' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      helpers.add('__dartStreamPeriodic');
      final computation = positionalArgs.length == 2
          ? positionalArgs[1]
          : 'null';
      return '__dartStreamPeriodic(${positionalArgs[0]}, $computation)';
    }
    if (path == 'dart:async::Stream::@factories::multi' &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamMulti');
      final isBroadcast =
          namedArgument(expression.arguments, 'isBroadcast') ?? 'false';
      return '__dartStreamMulti(${positionalArgs.single}, $isBroadcast)';
    }
    if (path == 'dart:async::Stream::@factories::empty') {
      helpers.add('__dartStreamFromIterable');
      final broadcast =
          namedArgument(expression.arguments, 'broadcast') ?? 'true';
      return '__dartStreamFromIterable([], $broadcast)';
    }
    if (path == 'dart:async::Stream::@factories::eventTransformed' &&
        positionalArgs.length == 2) {
      helpers.add('__dartStreamEventTransformed');
      return '__dartStreamEventTransformed(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (path == 'dart:async::StreamTransformer::@factories::fromBind' &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamTransformerFromBind');
      return '__dartStreamTransformerFromBind(${positionalArgs.single})';
    }
    if (path == 'dart:async::StreamTransformer::@factories::fromHandlers' &&
        positionalArgs.isEmpty) {
      helpers.add('__dartStreamTransformerFromHandlers');
      final handleData = namedArgument(expression.arguments, 'handleData');
      final handleError = namedArgument(expression.arguments, 'handleError');
      final handleDone = namedArgument(expression.arguments, 'handleDone');
      return '__dartStreamTransformerFromHandlers({ handleData: ${handleData ?? 'null'}, handleError: ${handleError ?? 'null'}, handleDone: ${handleDone ?? 'null'} })';
    }
    return null;
  }

  String? emitInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
    Object node,
  ) {
    return _emitStreamInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
          node,
        ) ??
        _emitStreamConsumerInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitStringConversionSinkInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitZoneInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitConverterInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitFutureInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        );
  }

  String? emitGet(k.Reference target, String name, String receiver) {
    if (!isDartAsyncStreamMember(target, name)) {
      return null;
    }
    return switch (name) {
      'first' => () {
        helpers.add('__dartStreamFirst');
        return '__dartStreamFirst($receiver)';
      }(),
      'last' => () {
        helpers.add('__dartStreamLast');
        return '__dartStreamLast($receiver)';
      }(),
      'single' => () {
        helpers.add('__dartStreamSingle');
        return '__dartStreamSingle($receiver)';
      }(),
      'length' => () {
        helpers.add('__dartStreamLength');
        return '__dartStreamLength($receiver)';
      }(),
      'isEmpty' => () {
        helpers.add('__dartStreamIsEmpty');
        return '__dartStreamIsEmpty($receiver)';
      }(),
      'isBroadcast' => '($receiver.isBroadcast === true)',
      _ => null,
    };
  }

  String? _emitStreamInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
    Object node,
  ) {
    if (arguments.named.isEmpty &&
        name == 'map' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamMap');
      return '__dartStreamMap($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'where' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamWhere');
      return '__dartStreamWhere($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'asyncMap' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamAsyncMap');
      return '__dartStreamAsyncMap($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'asyncExpand' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamAsyncExpand');
      return '__dartStreamAsyncExpand($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'expand' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamExpand');
      return '__dartStreamExpand($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'transform' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamTransform');
      return '__dartStreamTransform($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'bind' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamTransformerMember(target, name)) {
      helpers.add('__dartStreamTransformerBind');
      return '__dartStreamTransformerBind($receiver, ${positionalArgs.single})';
    }
    if (name == 'asBroadcastStream' &&
        positionalArgs.isEmpty &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamAsBroadcastStream');
      final onListen = namedArgument(arguments, 'onListen') ?? 'null';
      final onCancel = namedArgument(arguments, 'onCancel') ?? 'null';
      return '__dartStreamAsBroadcastStream($receiver, $onListen, $onCancel)';
    }
    if (arguments.named.isEmpty &&
        name == 'distinct' &&
        positionalArgs.length <= 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamDistinct');
      final equals = positionalArgs.isEmpty ? 'null' : positionalArgs.single;
      return '__dartStreamDistinct($receiver, $equals)';
    }
    if (name == 'handleError' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamHandleError');
      final test = namedArgument(arguments, 'test') ?? 'null';
      return '__dartStreamHandleError($receiver, ${positionalArgs.single}, $test)';
    }
    if (arguments.named.isEmpty &&
        (name == 'take' || name == 'skip') &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      final helper = name == 'take' ? '__dartStreamTake' : '__dartStreamSkip';
      helpers.add(helper);
      return '$helper($receiver, ${positionalArgs.single})';
    }
    if (name == 'timeout' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamTimeout');
      final onTimeout = namedArgument(arguments, 'onTimeout');
      return '__dartStreamTimeout($receiver, ${positionalArgs.single}, ${onTimeout ?? 'null'})';
    }
    if (arguments.named.isEmpty &&
        (name == 'takeWhile' || name == 'skipWhile') &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      final helper = name == 'takeWhile'
          ? '__dartStreamTakeWhile'
          : '__dartStreamSkipWhile';
      helpers.add(helper);
      return '$helper($receiver, ${positionalArgs.single})';
    }
    if ((name == 'firstWhere' ||
            name == 'lastWhere' ||
            name == 'singleWhere') &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      final helper = switch (name) {
        'firstWhere' => '__dartStreamFirstWhere',
        'lastWhere' => '__dartStreamLastWhere',
        'singleWhere' => '__dartStreamSingleWhere',
        _ => throw StateError('unreachable'),
      };
      helpers.add(helper);
      final orElse = namedArgument(arguments, 'orElse') ?? 'null';
      return '$helper($receiver, ${positionalArgs.single}, $orElse)';
    }
    if (arguments.named.isEmpty &&
        name == 'toList' &&
        positionalArgs.isEmpty &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamToList');
      return '__dartStreamToList($receiver)';
    }
    if (arguments.named.isEmpty &&
        name == 'toSet' &&
        positionalArgs.isEmpty &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartEquals');
      helpers.add('__dartIterableContains');
      helpers.add('__dartStreamToSet');
      return '__dartStreamToSet($receiver)';
    }
    if (arguments.named.isEmpty &&
        name == 'fold' &&
        positionalArgs.length == 2 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamFold');
      return '__dartStreamFold($receiver, ${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (arguments.named.isEmpty &&
        name == 'reduce' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamReduce');
      return '__dartStreamReduce($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'forEach' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamForEach');
      return '__dartStreamForEach($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'cast' &&
        positionalArgs.isEmpty &&
        arguments.types.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamCast');
      final type = arguments.types.single;
      final typeTest = emitTypeTest('value', type, node);
      return '__dartStreamCast($receiver, (value) => $typeTest, ${jsonEncode(type.toString())})';
    }
    if (arguments.named.isEmpty &&
        (name == 'any' || name == 'every') &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      final helper = name == 'any' ? '__dartStreamAny' : '__dartStreamEvery';
      helpers.add(helper);
      return '$helper($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'contains' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamContains');
      return '__dartStreamContains($receiver, ${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'join' &&
        positionalArgs.length <= 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamJoin');
      final separator = positionalArgs.isEmpty ? '""' : positionalArgs.single;
      return '__dartStreamJoin($receiver, $separator)';
    }
    if (arguments.named.isEmpty &&
        name == 'drain' &&
        positionalArgs.length <= 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamDrain');
      final futureValue = positionalArgs.isEmpty
          ? 'null'
          : positionalArgs.single;
      return '__dartStreamDrain($receiver, $futureValue)';
    }
    if (arguments.named.isEmpty &&
        name == 'pipe' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamPipe');
      return '__dartStreamPipe($receiver, ${positionalArgs.single})';
    }
    if (name == 'listen' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamMember(target, name)) {
      helpers.add('__dartStreamListen');
      final onError = namedArgument(arguments, 'onError') ?? 'null';
      final onDone = namedArgument(arguments, 'onDone') ?? 'null';
      final cancelOnError =
          namedArgument(arguments, 'cancelOnError') ?? 'false';
      return '__dartStreamListen($receiver, ${positionalArgs.single}, $onError, $onDone, $cancelOnError)';
    }
    return null;
  }

  String? _emitStreamConsumerInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (name == 'addStream' &&
        positionalArgs.length == 1 &&
        isDartAsyncStreamConsumerMember(target, name)) {
      final cancelOnError =
          namedArgument(arguments, 'cancelOnError') ?? 'false';
      return '$receiver.addStream(${positionalArgs.single}, { cancelOnError: $cancelOnError })';
    }
    return null;
  }

  String? _emitStringConversionSinkInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        name == 'asUtf8Sink' &&
        positionalArgs.length == 1 &&
        isDartConvertStringConversionSinkMember(target, name)) {
      helpers.add('__dartStringConversionSinkAsUtf8Sink');
      helpers.add('__dartUtf8Decode');
      return '$receiver.asUtf8Sink(${positionalArgs.single})';
    }
    return null;
  }

  String? _emitZoneInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        name == '[]' &&
        positionalArgs.length == 1 &&
        isDartAsyncZoneMember(target, name)) {
      return '$receiver.get(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'scheduleMicrotask' &&
        positionalArgs.length == 1 &&
        isDartAsyncZoneMember(target, name)) {
      helpers.add('__dartZone');
      helpers.add('__dartScheduleMicrotask');
      return '$receiver.scheduleMicrotask(${positionalArgs.single})';
    }
    return null;
  }

  String? _emitConverterInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        name == 'bind' &&
        positionalArgs.length == 1 &&
        isDartConvertConverterMember(target, name)) {
      if (isDartConvertLineSplitterMember(target, name)) {
        return '$receiver.bind(${positionalArgs.single})';
      }
      helpers.add('__dartConverterBind');
      return '__dartConverterBind($receiver, ${positionalArgs.single})';
    }
    return null;
  }

  String? _emitFutureInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (name == 'then' &&
        positionalArgs.length == 1 &&
        isDartAsyncFutureMember(target, name)) {
      final onError = namedArgument(arguments, 'onError');
      if (onError == null) {
        return '$receiver.then(${positionalArgs.single})';
      }
      return '$receiver.then(${positionalArgs.single}, $onError)';
    }
    if (name == 'catchError' &&
        positionalArgs.length == 1 &&
        isDartAsyncFutureMember(target, name)) {
      final test = namedArgument(arguments, 'test');
      if (test == null) {
        return '$receiver.catch(${positionalArgs.single})';
      }
      return '$receiver.catch((error) => ($test)(error) ? (${positionalArgs.single})(error) : Promise.reject(error))';
    }
    if (arguments.named.isEmpty &&
        name == 'onError' &&
        positionalArgs.length == 1 &&
        isDartAsyncFutureMember(target, name)) {
      return '$receiver.catch((error) => (${positionalArgs.single})(error, error?.stack ?? "<javascript stack unavailable>"))';
    }
    if (arguments.named.isEmpty &&
        name == 'ignore' &&
        positionalArgs.isEmpty &&
        isDartAsyncFutureMember(target, name)) {
      return '($receiver.catch(() => null), null)';
    }
    if (name == 'whenComplete' &&
        positionalArgs.length == 1 &&
        isDartAsyncFutureMember(target, name)) {
      return '$receiver.finally(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == 'asStream' &&
        positionalArgs.isEmpty &&
        isDartAsyncFutureMember(target, name)) {
      helpers.add('__dartFutureAsStream');
      return '__dartFutureAsStream($receiver)';
    }
    if (name == 'timeout' &&
        positionalArgs.length == 1 &&
        isDartAsyncFutureMember(target, name)) {
      helpers.add('__dartFutureTimeout');
      final onTimeout = namedArgument(arguments, 'onTimeout');
      return '__dartFutureTimeout($receiver, ${positionalArgs.single}, ${onTimeout ?? 'null'})';
    }
    return null;
  }
}
