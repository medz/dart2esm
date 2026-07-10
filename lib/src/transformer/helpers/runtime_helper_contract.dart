part of 'runtime_helpers.dart';

enum EsmRuntimeHostRequirement { portable, web, node }

enum EsmRuntimeEffect { unknown, async, io, worker, mutatesGlobal }

final class EsmRuntimeHelperContract {
  const EsmRuntimeHelperContract({
    required this.helper,
    required this.name,
    required this.dependencies,
    required this.host,
    required this.effects,
    this.unsupportedFeature,
  });

  final EsmRuntimeHelper helper;
  final String name;
  final List<EsmRuntimeHelper> dependencies;
  final EsmRuntimeHostRequirement host;
  final Set<EsmRuntimeEffect> effects;
  final String? unsupportedFeature;

  bool supports(Dart2EsmPlatform platform) {
    return switch (host) {
      EsmRuntimeHostRequirement.portable => true,
      EsmRuntimeHostRequirement.web => platform.allowsWebIo,
      EsmRuntimeHostRequirement.node => platform.allowsNodeIo,
    };
  }
}

extension EsmRuntimeHelperContracts on EsmRuntimeHelperRegistry {
  EsmRuntimeHelperContract contract(EsmRuntimeHelper helper) {
    return EsmRuntimeHelperContract(
      helper: helper,
      name: name(helper),
      dependencies: _runtimeHelperDependencies(helper),
      host: _runtimeHelperHost(helper),
      effects: _runtimeHelperEffects(helper),
      unsupportedFeature: _runtimeUnsupportedFeature(helper),
    );
  }
}

EsmRuntimeHostRequirement _runtimeHelperHost(EsmRuntimeHelper helper) {
  return switch (helper) {
    EsmRuntimeHelper.ioNode ||
    EsmRuntimeHelper.isolateNode => EsmRuntimeHostRequirement.node,
    EsmRuntimeHelper.ioWeb ||
    EsmRuntimeHelper.isolate ||
    EsmRuntimeHelper.isolateWeb => EsmRuntimeHostRequirement.web,
    _ => EsmRuntimeHostRequirement.portable,
  };
}

Set<EsmRuntimeEffect> _runtimeHelperEffects(EsmRuntimeHelper helper) {
  return switch (helper) {
    EsmRuntimeHelper.io ||
    EsmRuntimeHelper.ioWeb ||
    EsmRuntimeHelper.ioNode ||
    EsmRuntimeHelper.web => const {EsmRuntimeEffect.io},
    EsmRuntimeHelper.isolate ||
    EsmRuntimeHelper.isolateWeb ||
    EsmRuntimeHelper.isolateNode => const {
      EsmRuntimeEffect.async,
      EsmRuntimeEffect.worker,
    },
    EsmRuntimeHelper.completer ||
    EsmRuntimeHelper.future ||
    EsmRuntimeHelper.concurrent => const {EsmRuntimeEffect.async},
    EsmRuntimeHelper.print => const {EsmRuntimeEffect.mutatesGlobal},
    _ => const {EsmRuntimeEffect.unknown},
  };
}

String? _runtimeUnsupportedFeature(EsmRuntimeHelper helper) {
  return switch (helper) {
    EsmRuntimeHelper.ioNode => 'Node-backed dart:io lowering',
    EsmRuntimeHelper.ioWeb => 'Web-backed dart:io lowering',
    EsmRuntimeHelper.isolate ||
    EsmRuntimeHelper.isolateWeb => 'Worker-backed dart:isolate lowering',
    EsmRuntimeHelper.isolateNode => 'Node Worker-backed dart:isolate lowering',
    _ => null,
  };
}

List<EsmRuntimeHelper> _runtimeHelperDependencies(EsmRuntimeHelper helper) {
  return switch (helper) {
    EsmRuntimeHelper.ioWeb => const [EsmRuntimeHelper.io, EsmRuntimeHelper.uri],
    EsmRuntimeHelper.argumentChecks => const [EsmRuntimeHelper.coreError],
    EsmRuntimeHelper.encoding => const [
      EsmRuntimeHelper.coreError,
      EsmRuntimeHelper.byteConversionSink,
      EsmRuntimeHelper.future,
    ],
    EsmRuntimeHelper.dateTime => const [
      EsmRuntimeHelper.coreError,
      EsmRuntimeHelper.duration,
    ],
    EsmRuntimeHelper.pattern => const [EsmRuntimeHelper.stringOps],
    EsmRuntimeHelper.regExp => const [EsmRuntimeHelper.pattern],
    EsmRuntimeHelper.stringBuffer => const [
      EsmRuntimeHelper.stringify,
      EsmRuntimeHelper.iterableToArray,
    ],
    EsmRuntimeHelper.constMap => const [
      EsmRuntimeHelper.mapFactories,
      EsmRuntimeHelper.mapAddAll,
      EsmRuntimeHelper.mapSet,
      EsmRuntimeHelper.mapGet,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.constSet => const [
      EsmRuntimeHelper.setAddAll,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.intModular => const [EsmRuntimeHelper.coreError],
    EsmRuntimeHelper.equals => const [
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.isRecord => const [EsmRuntimeHelper.recordShape],
    EsmRuntimeHelper.record => const [
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.objectRuntimeType => const [EsmRuntimeHelper.type],
    EsmRuntimeHelper.dynamicGet || EsmRuntimeHelper.dynamicSet => const [
      EsmRuntimeHelper.noSuchMethodDispatch,
    ],
    EsmRuntimeHelper.isolate => const [EsmRuntimeHelper.future],
    EsmRuntimeHelper.isolateWeb ||
    EsmRuntimeHelper.isolateNode => const [EsmRuntimeHelper.isolate],
    EsmRuntimeHelper.dynamicInvoke => const [
      EsmRuntimeHelper.iterableJoin,
      EsmRuntimeHelper.listMixin,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.noSuchMethodDispatch,
    ],
    EsmRuntimeHelper.noSuchMethodDispatch => const [EsmRuntimeHelper.symbol],
    EsmRuntimeHelper.functionApply ||
    EsmRuntimeHelper.intParse ||
    EsmRuntimeHelper.iterableJoin => const [
      EsmRuntimeHelper.stringify,
      EsmRuntimeHelper.iterableToArray,
    ],
    EsmRuntimeHelper.ioNode => const [
      EsmRuntimeHelper.io,
      EsmRuntimeHelper.dateTime,
      EsmRuntimeHelper.future,
      EsmRuntimeHelper.uri,
      EsmRuntimeHelper.uriToFilePath,
    ],
    EsmRuntimeHelper.iterableSearch ||
    EsmRuntimeHelper.iterableWindow ||
    EsmRuntimeHelper.iterator ||
    EsmRuntimeHelper.listFactory ||
    EsmRuntimeHelper.listRangeOps => const [EsmRuntimeHelper.iterableToArray],
    EsmRuntimeHelper.future => const [
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.record,
      EsmRuntimeHelper.stringify,
    ],
    EsmRuntimeHelper.listAdd => const [EsmRuntimeHelper.listMixin],
    EsmRuntimeHelper.listAddAll => const [
      EsmRuntimeHelper.iterableToArray,
      EsmRuntimeHelper.listAdd,
    ],
    EsmRuntimeHelper.listMixin => const [EsmRuntimeHelper.coreError],
    EsmRuntimeHelper.print => const [EsmRuntimeHelper.stringify],
    EsmRuntimeHelper.listMutation => const [
      EsmRuntimeHelper.iterableToArray,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.listSearch => const [
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.mapAddAll || EsmRuntimeHelper.mapSet => const [
      EsmRuntimeHelper.mapGet,
      EsmRuntimeHelper.splayTree,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.mapContainsKey || EsmRuntimeHelper.mapGet => const [
      EsmRuntimeHelper.mapGet,
      EsmRuntimeHelper.compare,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.mapFactories => const [
      EsmRuntimeHelper.mapAddAll,
      EsmRuntimeHelper.mapSet,
      EsmRuntimeHelper.mapGet,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.mapOps => const [
      EsmRuntimeHelper.mapSet,
      EsmRuntimeHelper.mapGet,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.mathRectangle => const [EsmRuntimeHelper.mathPoint],
    EsmRuntimeHelper.rangeChecks => const [EsmRuntimeHelper.coreError],
    EsmRuntimeHelper.uriToFilePath ||
    EsmRuntimeHelper.uri => const [EsmRuntimeHelper.coreError],
    EsmRuntimeHelper.setAddAll => const [
      EsmRuntimeHelper.splayTree,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.setOps => const [
      EsmRuntimeHelper.setAddAll,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.splayTree => const [
      EsmRuntimeHelper.compare,
      EsmRuntimeHelper.setAddAll,
      EsmRuntimeHelper.mapAddAll,
      EsmRuntimeHelper.mapSet,
      EsmRuntimeHelper.mapGet,
      EsmRuntimeHelper.equals,
      EsmRuntimeHelper.recordShape,
      EsmRuntimeHelper.isRecord,
    ],
    EsmRuntimeHelper.bigIntBitLength ||
    EsmRuntimeHelper.bigIntParse ||
    EsmRuntimeHelper.byteConversionSink ||
    EsmRuntimeHelper.compare ||
    EsmRuntimeHelper.concurrent ||
    EsmRuntimeHelper.coreError ||
    EsmRuntimeHelper.constValue ||
    EsmRuntimeHelper.customHashMap ||
    EsmRuntimeHelper.duration ||
    EsmRuntimeHelper.doubleParse ||
    EsmRuntimeHelper.doubleValue ||
    EsmRuntimeHelper.dynamicCall ||
    EsmRuntimeHelper.enumAsNameMap ||
    EsmRuntimeHelper.enumByName ||
    EsmRuntimeHelper.completer ||
    EsmRuntimeHelper.expando ||
    EsmRuntimeHelper.extensionTypeRep ||
    EsmRuntimeHelper.finalizer ||
    EsmRuntimeHelper.intGcd ||
    EsmRuntimeHelper.intShift ||
    EsmRuntimeHelper.io ||
    EsmRuntimeHelper.iterableToArray ||
    EsmRuntimeHelper.jsInterop ||
    EsmRuntimeHelper.lazyField ||
    EsmRuntimeHelper.mathPoint ||
    EsmRuntimeHelper.mathRandom ||
    EsmRuntimeHelper.nullCheck ||
    EsmRuntimeHelper.objectHash ||
    EsmRuntimeHelper.recordShape ||
    EsmRuntimeHelper.regExpEscape ||
    EsmRuntimeHelper.safeToString ||
    EsmRuntimeHelper.stopwatch ||
    EsmRuntimeHelper.stringFactory ||
    EsmRuntimeHelper.stringOps ||
    EsmRuntimeHelper.stringify ||
    EsmRuntimeHelper.symbol ||
    EsmRuntimeHelper.throwWithStackTrace ||
    EsmRuntimeHelper.type ||
    EsmRuntimeHelper.typeCast ||
    EsmRuntimeHelper.typedDataSublistView ||
    EsmRuntimeHelper.unmodifiableViews ||
    EsmRuntimeHelper.web ||
    EsmRuntimeHelper.weakReference => const [],
  };
}
