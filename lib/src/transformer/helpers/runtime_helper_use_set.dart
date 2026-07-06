part of 'runtime_helpers.dart';

final class EsmRuntimeHelperUseSet {
  EsmRuntimeHelperUseSet({this.platform = Dart2EsmPlatform.auto});

  final Dart2EsmPlatform platform;
  final _helpers = <EsmRuntimeHelper>{};

  bool require(EsmRuntimeHelper helper) {
    return add(helper);
  }

  EsmIdentifier reference(
    EsmRuntimeHelperRegistry registry,
    EsmRuntimeHelper helper,
  ) {
    require(helper);
    return registry.reference(helper);
  }

  bool add(EsmRuntimeHelper helper) {
    if (helper == EsmRuntimeHelper.ioNode &&
        !_platformAllowsNodeBuiltins(platform)) {
      throw UnsupportedCompilerFeature(
        helper,
        'Node-backed dart:io lowering on ${platform.cliName} platform',
      );
    }
    switch (helper) {
      case EsmRuntimeHelper.bigIntBitLength:
      case EsmRuntimeHelper.bigIntParse:
      case EsmRuntimeHelper.byteConversionSink:
      case EsmRuntimeHelper.compare:
      case EsmRuntimeHelper.concurrent:
      case EsmRuntimeHelper.coreError:
      case EsmRuntimeHelper.constValue:
      case EsmRuntimeHelper.customHashMap:
      case EsmRuntimeHelper.duration:
      case EsmRuntimeHelper.doubleParse:
      case EsmRuntimeHelper.doubleValue:
      case EsmRuntimeHelper.dynamicCall:
      case EsmRuntimeHelper.enumAsNameMap:
      case EsmRuntimeHelper.enumByName:
      case EsmRuntimeHelper.completer:
      case EsmRuntimeHelper.expando:
      case EsmRuntimeHelper.extensionTypeRep:
      case EsmRuntimeHelper.finalizer:
      case EsmRuntimeHelper.ffi:
      case EsmRuntimeHelper.intGcd:
      case EsmRuntimeHelper.intShift:
      case EsmRuntimeHelper.io:
      case EsmRuntimeHelper.iterableToArray:
      case EsmRuntimeHelper.jsInterop:
      case EsmRuntimeHelper.mathPoint:
      case EsmRuntimeHelper.mathRandom:
      case EsmRuntimeHelper.stopwatch:
      case EsmRuntimeHelper.stringFactory:
      case EsmRuntimeHelper.stringOps:
      case EsmRuntimeHelper.web:
      case EsmRuntimeHelper.weakReference:
        break;
      case EsmRuntimeHelper.argumentChecks:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.encoding:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.dateTime:
        _helpers.add(EsmRuntimeHelper.coreError);
        _helpers.add(EsmRuntimeHelper.duration);
      case EsmRuntimeHelper.pattern:
        _helpers.add(EsmRuntimeHelper.stringOps);
      case EsmRuntimeHelper.regExp:
        _helpers.add(EsmRuntimeHelper.pattern);
      case EsmRuntimeHelper.regExpEscape:
        break;
      case EsmRuntimeHelper.stringBuffer:
        _helpers.add(EsmRuntimeHelper.stringify);
        _helpers.add(EsmRuntimeHelper.iterableToArray);
      case EsmRuntimeHelper.constMap:
        _helpers.add(EsmRuntimeHelper.mapFactories);
        _helpers.add(EsmRuntimeHelper.mapAddAll);
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.constSet:
        _helpers.add(EsmRuntimeHelper.setAddAll);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.intModular:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.equals:
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.isRecord:
        _helpers.add(EsmRuntimeHelper.recordShape);
      case EsmRuntimeHelper.record:
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.objectRuntimeType:
        _helpers.add(EsmRuntimeHelper.type);
      case EsmRuntimeHelper.dynamicGet:
      case EsmRuntimeHelper.dynamicSet:
        _helpers.add(EsmRuntimeHelper.noSuchMethodDispatch);
      case EsmRuntimeHelper.isolate:
        _helpers.add(EsmRuntimeHelper.future);
      case EsmRuntimeHelper.dynamicInvoke:
        _helpers.add(EsmRuntimeHelper.iterableJoin);
        _helpers.add(EsmRuntimeHelper.listMixin);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.noSuchMethodDispatch);
      case EsmRuntimeHelper.noSuchMethodDispatch:
        _helpers.add(EsmRuntimeHelper.symbol);
      case EsmRuntimeHelper.functionApply:
      case EsmRuntimeHelper.intParse:
      case EsmRuntimeHelper.iterableJoin:
        _helpers.add(EsmRuntimeHelper.stringify);
        _helpers.add(EsmRuntimeHelper.iterableToArray);
      case EsmRuntimeHelper.ioNode:
        _helpers.add(EsmRuntimeHelper.io);
        _helpers.add(EsmRuntimeHelper.dateTime);
        _helpers.add(EsmRuntimeHelper.future);
        _helpers.add(EsmRuntimeHelper.uri);
        _helpers.add(EsmRuntimeHelper.uriToFilePath);
      case EsmRuntimeHelper.iterableSearch:
      case EsmRuntimeHelper.iterableWindow:
      case EsmRuntimeHelper.iterator:
      case EsmRuntimeHelper.listFactory:
      case EsmRuntimeHelper.listRangeOps:
        _helpers.add(EsmRuntimeHelper.iterableToArray);
      case EsmRuntimeHelper.future:
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.record);
        _helpers.add(EsmRuntimeHelper.stringify);
      case EsmRuntimeHelper.lazyField:
      case EsmRuntimeHelper.listAdd:
      case EsmRuntimeHelper.nullCheck:
        break;
      case EsmRuntimeHelper.listAddAll:
        _helpers.add(EsmRuntimeHelper.iterableToArray);
        _helpers.add(EsmRuntimeHelper.listAdd);
      case EsmRuntimeHelper.listMixin:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.print:
        _helpers.add(EsmRuntimeHelper.stringify);
      case EsmRuntimeHelper.listMutation:
        _helpers.add(EsmRuntimeHelper.iterableToArray);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.listSearch:
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapAddAll:
      case EsmRuntimeHelper.mapSet:
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapContainsKey:
      case EsmRuntimeHelper.mapGet:
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapFactories:
        _helpers.add(EsmRuntimeHelper.mapAddAll);
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapOps:
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mathRectangle:
        _helpers.add(EsmRuntimeHelper.mathPoint);
      case EsmRuntimeHelper.rangeChecks:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.recordShape:
      case EsmRuntimeHelper.objectHash:
      case EsmRuntimeHelper.safeToString:
      case EsmRuntimeHelper.stringify:
      case EsmRuntimeHelper.symbol:
      case EsmRuntimeHelper.throwWithStackTrace:
      case EsmRuntimeHelper.type:
      case EsmRuntimeHelper.typeCast:
      case EsmRuntimeHelper.typedDataSublistView:
      case EsmRuntimeHelper.unmodifiableViews:
        break;
      case EsmRuntimeHelper.uriToFilePath:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.uri:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.setAddAll:
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.setOps:
        _helpers.add(EsmRuntimeHelper.setAddAll);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.splayTree:
        _helpers.add(EsmRuntimeHelper.compare);
        _helpers.add(EsmRuntimeHelper.setAddAll);
        _helpers.add(EsmRuntimeHelper.mapAddAll);
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
    }
    return _helpers.add(helper);
  }

  bool contains(EsmRuntimeHelper helper) => _helpers.contains(helper);

  List<EsmRuntimeHelper> toList() {
    return EsmRuntimeHelper.values
        .where(_helpers.contains)
        .toList(growable: false);
  }
}

bool _platformAllowsNodeBuiltins(Dart2EsmPlatform platform) {
  return switch (platform) {
    Dart2EsmPlatform.auto || Dart2EsmPlatform.node => true,
    Dart2EsmPlatform.neutral || Dart2EsmPlatform.browser => false,
  };
}
