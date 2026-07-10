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
    if (helper == EsmRuntimeHelper.ioNode && !platform.allowsNodeIo) {
      throw UnsupportedCompilerFeature(
        helper,
        'Node-backed dart:io lowering on ${platform.cliName} platform',
      );
    }
    if (helper == EsmRuntimeHelper.ioWeb && !platform.allowsWebIo) {
      throw UnsupportedCompilerFeature(
        helper,
        'Web-backed dart:io lowering on ${platform.cliName} platform',
      );
    }
    if (helper == EsmRuntimeHelper.isolate && !platform.allowsWebIo) {
      throw UnsupportedCompilerFeature(
        helper,
        'Worker-backed dart:isolate lowering on ${platform.cliName} platform',
      );
    }
    if (helper == EsmRuntimeHelper.isolateNode && !platform.allowsNodeIo) {
      throw UnsupportedCompilerFeature(
        helper,
        'Node Worker-backed dart:isolate lowering on ${platform.cliName} platform',
      );
    }
    if (!_helpers.add(helper)) return false;
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
      case EsmRuntimeHelper.ioWeb:
        add(EsmRuntimeHelper.io);
        add(EsmRuntimeHelper.uri);
      case EsmRuntimeHelper.argumentChecks:
        add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.encoding:
        add(EsmRuntimeHelper.coreError);
        add(EsmRuntimeHelper.byteConversionSink);
        add(EsmRuntimeHelper.future);
      case EsmRuntimeHelper.dateTime:
        add(EsmRuntimeHelper.coreError);
        add(EsmRuntimeHelper.duration);
      case EsmRuntimeHelper.pattern:
        add(EsmRuntimeHelper.stringOps);
      case EsmRuntimeHelper.regExp:
        add(EsmRuntimeHelper.pattern);
      case EsmRuntimeHelper.regExpEscape:
        break;
      case EsmRuntimeHelper.stringBuffer:
        add(EsmRuntimeHelper.stringify);
        add(EsmRuntimeHelper.iterableToArray);
      case EsmRuntimeHelper.constMap:
        add(EsmRuntimeHelper.mapFactories);
        add(EsmRuntimeHelper.mapAddAll);
        add(EsmRuntimeHelper.mapSet);
        add(EsmRuntimeHelper.mapGet);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.constSet:
        add(EsmRuntimeHelper.setAddAll);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.intModular:
        add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.equals:
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.isRecord:
        add(EsmRuntimeHelper.recordShape);
      case EsmRuntimeHelper.record:
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.objectRuntimeType:
        add(EsmRuntimeHelper.type);
      case EsmRuntimeHelper.dynamicGet:
      case EsmRuntimeHelper.dynamicSet:
        add(EsmRuntimeHelper.noSuchMethodDispatch);
      case EsmRuntimeHelper.isolate:
        add(EsmRuntimeHelper.future);
      case EsmRuntimeHelper.isolateWeb:
      case EsmRuntimeHelper.isolateNode:
        add(EsmRuntimeHelper.isolate);
      case EsmRuntimeHelper.dynamicInvoke:
        add(EsmRuntimeHelper.iterableJoin);
        add(EsmRuntimeHelper.listMixin);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.noSuchMethodDispatch);
      case EsmRuntimeHelper.noSuchMethodDispatch:
        add(EsmRuntimeHelper.symbol);
      case EsmRuntimeHelper.functionApply:
      case EsmRuntimeHelper.intParse:
      case EsmRuntimeHelper.iterableJoin:
        add(EsmRuntimeHelper.stringify);
        add(EsmRuntimeHelper.iterableToArray);
      case EsmRuntimeHelper.ioNode:
        add(EsmRuntimeHelper.io);
        add(EsmRuntimeHelper.dateTime);
        add(EsmRuntimeHelper.future);
        add(EsmRuntimeHelper.uri);
        add(EsmRuntimeHelper.uriToFilePath);
      case EsmRuntimeHelper.iterableSearch:
      case EsmRuntimeHelper.iterableWindow:
      case EsmRuntimeHelper.iterator:
      case EsmRuntimeHelper.listFactory:
      case EsmRuntimeHelper.listRangeOps:
        add(EsmRuntimeHelper.iterableToArray);
      case EsmRuntimeHelper.future:
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.record);
        add(EsmRuntimeHelper.stringify);
      case EsmRuntimeHelper.lazyField:
      case EsmRuntimeHelper.nullCheck:
        break;
      case EsmRuntimeHelper.listAdd:
        add(EsmRuntimeHelper.listMixin);
      case EsmRuntimeHelper.listAddAll:
        add(EsmRuntimeHelper.iterableToArray);
        add(EsmRuntimeHelper.listAdd);
      case EsmRuntimeHelper.listMixin:
        add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.print:
        add(EsmRuntimeHelper.stringify);
      case EsmRuntimeHelper.listMutation:
        add(EsmRuntimeHelper.iterableToArray);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.listSearch:
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapAddAll:
      case EsmRuntimeHelper.mapSet:
        add(EsmRuntimeHelper.mapGet);
        add(EsmRuntimeHelper.splayTree);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapContainsKey:
      case EsmRuntimeHelper.mapGet:
        add(EsmRuntimeHelper.mapGet);
        add(EsmRuntimeHelper.compare);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapFactories:
        add(EsmRuntimeHelper.mapAddAll);
        add(EsmRuntimeHelper.mapSet);
        add(EsmRuntimeHelper.mapGet);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapOps:
        add(EsmRuntimeHelper.mapSet);
        add(EsmRuntimeHelper.mapGet);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mathRectangle:
        add(EsmRuntimeHelper.mathPoint);
      case EsmRuntimeHelper.rangeChecks:
        add(EsmRuntimeHelper.coreError);
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
        add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.uri:
        add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.setAddAll:
        add(EsmRuntimeHelper.splayTree);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.setOps:
        add(EsmRuntimeHelper.setAddAll);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.splayTree:
        add(EsmRuntimeHelper.compare);
        add(EsmRuntimeHelper.setAddAll);
        add(EsmRuntimeHelper.mapAddAll);
        add(EsmRuntimeHelper.mapSet);
        add(EsmRuntimeHelper.mapGet);
        add(EsmRuntimeHelper.equals);
        add(EsmRuntimeHelper.recordShape);
        add(EsmRuntimeHelper.isRecord);
    }
    return true;
  }

  bool contains(EsmRuntimeHelper helper) => _helpers.contains(helper);

  List<EsmRuntimeHelper> toList() {
    return EsmRuntimeHelper.values
        .where(_helpers.contains)
        .toList(growable: false);
  }
}
