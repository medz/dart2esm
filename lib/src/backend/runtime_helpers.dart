enum EsmRuntimeHelperCategory {
  core,
  async,
  stream,
  convert,
  collection,
  jsInterop,
  sdk,
}

final class EsmRuntimeHelperSpec {
  const EsmRuntimeHelperSpec({
    required this.name,
    required this.category,
    this.dependencies = const [],
    this.description = '',
  });

  final String name;
  final EsmRuntimeHelperCategory category;
  final List<String> dependencies;
  final String description;
}

const _helperSpecs = <String, EsmRuntimeHelperSpec>{
  '__dartPrint': EsmRuntimeHelperSpec(
    name: '__dartPrint',
    category: EsmRuntimeHelperCategory.core,
    dependencies: ['__dartStr'],
    description: 'Dart print() sink backed by console.log.',
  ),
  '__dartScheduleMicrotask': EsmRuntimeHelperSpec(
    name: '__dartScheduleMicrotask',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartZone'],
  ),
  '__dartFutureIterableWait': EsmRuntimeHelperSpec(
    name: '__dartFutureIterableWait',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartAsyncError', '__dartFutureWaitAllSettled'],
  ),
  '__dartFutureRecordWait': EsmRuntimeHelperSpec(
    name: '__dartFutureRecordWait',
    category: EsmRuntimeHelperCategory.async,
    dependencies: [
      '__dartAsyncError',
      '__dartFutureWaitAllSettled',
      '__dartRecord',
    ],
  ),
  '__dartBoundSubscriptionStream': EsmRuntimeHelperSpec(
    name: '__dartBoundSubscriptionStream',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartReceivePort': EsmRuntimeHelperSpec(
    name: '__dartReceivePort',
    category: EsmRuntimeHelperCategory.async,
    dependencies: [
      '__dartSendPort',
      '__dartStreamController',
      '__dartStreamListen',
    ],
  ),
  '__dartRawReceivePort': EsmRuntimeHelperSpec(
    name: '__dartRawReceivePort',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartSendPort'],
  ),
  '__dartIsolateSpawn': EsmRuntimeHelperSpec(
    name: '__dartIsolateSpawn',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartIsolate'],
  ),
  '__dartStreamFromFutures': EsmRuntimeHelperSpec(
    name: '__dartStreamFromFutures',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartStreamFromIterable': EsmRuntimeHelperSpec(
    name: '__dartStreamFromIterable',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamFromFuture': EsmRuntimeHelperSpec(
    name: '__dartStreamFromFuture',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamMulti': EsmRuntimeHelperSpec(
    name: '__dartStreamMulti',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartStreamError': EsmRuntimeHelperSpec(
    name: '__dartStreamError',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamPeriodic': EsmRuntimeHelperSpec(
    name: '__dartStreamPeriodic',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamAsBroadcastStream': EsmRuntimeHelperSpec(
    name: '__dartStreamAsBroadcastStream',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamMap': EsmRuntimeHelperSpec(
    name: '__dartStreamMap',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAsyncMap': EsmRuntimeHelperSpec(
    name: '__dartStreamAsyncMap',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAsyncExpand': EsmRuntimeHelperSpec(
    name: '__dartStreamAsyncExpand',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamExpand': EsmRuntimeHelperSpec(
    name: '__dartStreamExpand',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTransformerFromHandlers': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerFromHandlers',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamTransformerFromBind': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerFromBind',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamTransformerBind': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerBind',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartConverterBind'],
  ),
  '__dartStreamTransform': EsmRuntimeHelperSpec(
    name: '__dartStreamTransform',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamTransformerBind'],
  ),
  '__dartStreamEventTransformed': EsmRuntimeHelperSpec(
    name: '__dartStreamEventTransformed',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamDistinct': EsmRuntimeHelperSpec(
    name: '__dartStreamDistinct',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartEquals', '__dartStreamIterable'],
  ),
  '__dartStreamHandleError': EsmRuntimeHelperSpec(
    name: '__dartStreamHandleError',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTake': EsmRuntimeHelperSpec(
    name: '__dartStreamTake',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSkip': EsmRuntimeHelperSpec(
    name: '__dartStreamSkip',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTimeout': EsmRuntimeHelperSpec(
    name: '__dartStreamTimeout',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamTakeWhile': EsmRuntimeHelperSpec(
    name: '__dartStreamTakeWhile',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSkipWhile': EsmRuntimeHelperSpec(
    name: '__dartStreamSkipWhile',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamToList': EsmRuntimeHelperSpec(
    name: '__dartStreamToList',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamToSet': EsmRuntimeHelperSpec(
    name: '__dartStreamToSet',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartSetAdd', '__dartStreamIterable'],
  ),
  '__dartStreamFold': EsmRuntimeHelperSpec(
    name: '__dartStreamFold',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamReduce': EsmRuntimeHelperSpec(
    name: '__dartStreamReduce',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamForEach': EsmRuntimeHelperSpec(
    name: '__dartStreamForEach',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamCast': EsmRuntimeHelperSpec(
    name: '__dartStreamCast',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartAs', '__dartStreamIterable'],
  ),
  '__dartStreamFirst': EsmRuntimeHelperSpec(
    name: '__dartStreamFirst',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLast': EsmRuntimeHelperSpec(
    name: '__dartStreamLast',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSingle': EsmRuntimeHelperSpec(
    name: '__dartStreamSingle',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLength': EsmRuntimeHelperSpec(
    name: '__dartStreamLength',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamIsEmpty': EsmRuntimeHelperSpec(
    name: '__dartStreamIsEmpty',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAny': EsmRuntimeHelperSpec(
    name: '__dartStreamAny',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamEvery': EsmRuntimeHelperSpec(
    name: '__dartStreamEvery',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamFirstWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamFirstWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLastWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamLastWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSingleWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamSingleWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamContains': EsmRuntimeHelperSpec(
    name: '__dartStreamContains',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartEquals', '__dartStreamIterable'],
  ),
  '__dartStreamJoin': EsmRuntimeHelperSpec(
    name: '__dartStreamJoin',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStr', '__dartStreamIterable'],
  ),
  '__dartStreamDrain': EsmRuntimeHelperSpec(
    name: '__dartStreamDrain',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamPipe': EsmRuntimeHelperSpec(
    name: '__dartStreamPipe',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamListen': EsmRuntimeHelperSpec(
    name: '__dartStreamListen',
    category: EsmRuntimeHelperCategory.stream,
  ),
};

const _legacyStreamRuntimeHelpers = {
  '__dartStreamFromIterable',
  '__dartStreamFromFuture',
  '__dartStreamIterable',
  '__dartStreamFromFutures',
  '__dartStreamMulti',
  '__dartStreamError',
  '__dartStreamPeriodic',
  '__dartStreamAsBroadcastStream',
  '__dartStreamMap',
  '__dartStreamWhere',
  '__dartStreamAsyncMap',
  '__dartStreamAsyncExpand',
  '__dartStreamExpand',
  '__dartStreamTransformerFromBind',
  '__dartStreamTransformerFromHandlers',
  '__dartStreamTransformerBind',
  '__dartStreamTransform',
  '__dartStreamEventTransformed',
  '__dartStreamDistinct',
  '__dartStreamHandleError',
  '__dartStreamTake',
  '__dartStreamSkip',
  '__dartStreamTimeout',
  '__dartStreamTakeWhile',
  '__dartStreamSkipWhile',
  '__dartStreamToList',
  '__dartStreamToSet',
  '__dartStreamFold',
  '__dartStreamReduce',
  '__dartStreamForEach',
  '__dartStreamCast',
  '__dartStreamFirst',
  '__dartStreamLast',
  '__dartStreamSingle',
  '__dartStreamLength',
  '__dartStreamIsEmpty',
  '__dartStreamAny',
  '__dartStreamEvery',
  '__dartStreamFirstWhere',
  '__dartStreamLastWhere',
  '__dartStreamSingleWhere',
  '__dartStreamContains',
  '__dartStreamJoin',
  '__dartStreamDrain',
  '__dartStreamPipe',
  '__dartStreamListen',
};

Set<String> resolveEsmRuntimeHelperDependencies(Iterable<String> helpers) {
  final resolved = <String>{};

  void visit(String name) {
    if (!resolved.add(name)) {
      return;
    }
    final spec = _helperSpecs[name];
    if (spec == null) {
      return;
    }
    for (final dependency in spec.dependencies) {
      visit(dependency);
    }
  }

  for (final helper in helpers) {
    visit(helper);
  }
  return resolved;
}

bool isEsmLegacyStreamRuntimeHelper(String name) =>
    _legacyStreamRuntimeHelpers.contains(name);
