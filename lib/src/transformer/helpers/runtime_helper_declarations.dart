part of 'runtime_helpers.dart';

extension EsmRuntimeHelperDeclarations on EsmRuntimeHelperRegistry {
  String name(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.bigIntBitLength => '__dartBigIntBitLength',
      EsmRuntimeHelper.argumentChecks => '__dartCheckNotNull',
      EsmRuntimeHelper.bigIntParse => '__dartBigIntParse',
      EsmRuntimeHelper.byteConversionSink => '__dartByteConversionSinkFrom',
      EsmRuntimeHelper.compare => '__dartCompare',
      EsmRuntimeHelper.coreError => '__dartCoreError',
      EsmRuntimeHelper.constMap => '__dartConstMap',
      EsmRuntimeHelper.constSet => '__dartConstSet',
      EsmRuntimeHelper.constValue => '__dartConst',
      EsmRuntimeHelper.customHashMap => '__dartCustomHashMap',
      EsmRuntimeHelper.dateTime => '__dartDateTime',
      EsmRuntimeHelper.doubleParse => '__dartDoubleParse',
      EsmRuntimeHelper.doubleValue => '__dartDoubleValue',
      EsmRuntimeHelper.duration => '__dartDuration',
      EsmRuntimeHelper.dynamicCall => '__dartDynamicCall',
      EsmRuntimeHelper.dynamicGet => '__dartDynamicGet',
      EsmRuntimeHelper.dynamicInvoke => '__dartDynamicInvoke',
      EsmRuntimeHelper.dynamicSet => '__dartDynamicSet',
      EsmRuntimeHelper.encoding => '__dartLatin1Codec',
      EsmRuntimeHelper.equals => '__dartEquals',
      EsmRuntimeHelper.enumAsNameMap => '__dartEnumAsNameMap',
      EsmRuntimeHelper.enumByName => '__dartEnumByName',
      EsmRuntimeHelper.expando => '__dartExpando',
      EsmRuntimeHelper.extensionTypeRep => '__dartExtensionTypeRep',
      EsmRuntimeHelper.finalizer => '__dartFinalizer',
      EsmRuntimeHelper.functionApply => '__dartFunctionApply',
      EsmRuntimeHelper.intGcd => '__dartIntGcd',
      EsmRuntimeHelper.intModular => '__dartIntModInverse',
      EsmRuntimeHelper.intParse => '__dartIntParse',
      EsmRuntimeHelper.intShift => '__dartShr',
      EsmRuntimeHelper.iterableJoin => '__dartIterableJoin',
      EsmRuntimeHelper.iterableSearch => '__dartIterableFirstWhere',
      EsmRuntimeHelper.iterableToArray => '__dartIterableToArray',
      EsmRuntimeHelper.iterableWindow => '__dartIterableTakeWhile',
      EsmRuntimeHelper.iterator => '__dartIterator',
      EsmRuntimeHelper.isRecord => '__dartIsRecord',
      EsmRuntimeHelper.lazyField => '__dartLazyField',
      EsmRuntimeHelper.listAdd => '__dartListAdd',
      EsmRuntimeHelper.listAddAll => '__dartListAddAll',
      EsmRuntimeHelper.listFactory => '__dartListOf',
      EsmRuntimeHelper.listMixin => '__dartListMixinFirst',
      EsmRuntimeHelper.listMutation => '__dartListShuffle',
      EsmRuntimeHelper.listRangeOps => '__dartListCopyRange',
      EsmRuntimeHelper.listSearch => '__dartListIndexOf',
      EsmRuntimeHelper.mapAddAll => '__dartMapAddAll',
      EsmRuntimeHelper.mapContainsKey => '__dartMapContainsKey',
      EsmRuntimeHelper.mapFactories => '__dartMapFromIterable',
      EsmRuntimeHelper.mapGet => '__dartMapGet',
      EsmRuntimeHelper.mapOps => '__dartMapAddEntries',
      EsmRuntimeHelper.mapSet => '__dartMapSet',
      EsmRuntimeHelper.mathPoint => '__dartPoint',
      EsmRuntimeHelper.mathRandom => '__dartRandom',
      EsmRuntimeHelper.mathRectangle => '__dartRectangle',
      EsmRuntimeHelper.nullCheck => '__dartNullCheck',
      EsmRuntimeHelper.objectHash => '__dartObjectHash',
      EsmRuntimeHelper.pattern => '__dartPatternRegExp',
      EsmRuntimeHelper.print => '__dartPrint',
      EsmRuntimeHelper.rangeChecks => '__dartCheckValidRange',
      EsmRuntimeHelper.record => '__dartRecord',
      EsmRuntimeHelper.recordShape => '__dartRecordShape',
      EsmRuntimeHelper.objectRuntimeType => '__dartRuntimeType',
      EsmRuntimeHelper.regExp => '__dartRegExp',
      EsmRuntimeHelper.regExpEscape => '__dartRegExpEscape',
      EsmRuntimeHelper.safeToString => '__dartSafeToString',
      EsmRuntimeHelper.setAddAll => '__dartSetAddAll',
      EsmRuntimeHelper.setOps => '__dartSetLookup',
      EsmRuntimeHelper.splayTree => '__dartSplayTreeSet',
      EsmRuntimeHelper.stringBuffer => '__dartStringBuffer',
      EsmRuntimeHelper.stringFactory => '__dartStringFromCharCodes',
      EsmRuntimeHelper.stringOps => '__dartStringReplaceFirst',
      EsmRuntimeHelper.stringify => '__dartStr',
      EsmRuntimeHelper.symbol => '__dartSymbol',
      EsmRuntimeHelper.throwWithStackTrace => '__dartThrowWithStackTrace',
      EsmRuntimeHelper.type => '__dartType',
      EsmRuntimeHelper.typeCast => '__dartAs',
      EsmRuntimeHelper.typedDataSublistView => '__dartTypedDataSublistView',
      EsmRuntimeHelper.unmodifiableViews => '__dartUnmodifiableListView',
      EsmRuntimeHelper.uri => '__dartUriParse',
      EsmRuntimeHelper.uriToFilePath => '__dartUriToFilePath',
      EsmRuntimeHelper.weakReference => '__dartWeakReference',
    };
  }

  EsmIdentifier reference(EsmRuntimeHelper helper) {
    return EsmIdentifier(name(helper));
  }

  EsmModuleItem declaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.bigIntBitLength ||
      EsmRuntimeHelper.bigIntParse ||
      EsmRuntimeHelper.doubleParse ||
      EsmRuntimeHelper.doubleValue ||
      EsmRuntimeHelper.intGcd ||
      EsmRuntimeHelper.intShift ||
      EsmRuntimeHelper.intModular ||
      EsmRuntimeHelper.intParse => _numberHelperDeclaration(helper),
      EsmRuntimeHelper.compare ||
      EsmRuntimeHelper.coreError ||
      EsmRuntimeHelper.argumentChecks ||
      EsmRuntimeHelper.constValue ||
      EsmRuntimeHelper.constSet ||
      EsmRuntimeHelper.constMap ||
      EsmRuntimeHelper.equals ||
      EsmRuntimeHelper.extensionTypeRep ||
      EsmRuntimeHelper.functionApply ||
      EsmRuntimeHelper.nullCheck ||
      EsmRuntimeHelper.objectHash ||
      EsmRuntimeHelper.print ||
      EsmRuntimeHelper.rangeChecks ||
      EsmRuntimeHelper.safeToString ||
      EsmRuntimeHelper.stringify ||
      EsmRuntimeHelper.symbol ||
      EsmRuntimeHelper.throwWithStackTrace ||
      EsmRuntimeHelper.type ||
      EsmRuntimeHelper.typeCast ||
      EsmRuntimeHelper.objectRuntimeType ||
      EsmRuntimeHelper.enumAsNameMap ||
      EsmRuntimeHelper.enumByName => _coreHelperDeclaration(helper),
      EsmRuntimeHelper.dynamicCall ||
      EsmRuntimeHelper.dynamicGet ||
      EsmRuntimeHelper.dynamicSet ||
      EsmRuntimeHelper.dynamicInvoke ||
      EsmRuntimeHelper.expando ||
      EsmRuntimeHelper.finalizer ||
      EsmRuntimeHelper.lazyField ||
      EsmRuntimeHelper.weakReference => _dynamicHelperDeclaration(helper),
      EsmRuntimeHelper.encoding ||
      EsmRuntimeHelper.byteConversionSink => _convertHelperDeclaration(helper),
      EsmRuntimeHelper.mathPoint ||
      EsmRuntimeHelper.mathRandom ||
      EsmRuntimeHelper.mathRectangle => _mathHelperDeclaration(helper),
      EsmRuntimeHelper.iterableToArray ||
      EsmRuntimeHelper.iterableJoin ||
      EsmRuntimeHelper.iterableWindow ||
      EsmRuntimeHelper.iterableSearch ||
      EsmRuntimeHelper.iterator ||
      EsmRuntimeHelper.mapFactories ||
      EsmRuntimeHelper.mapGet ||
      EsmRuntimeHelper.customHashMap ||
      EsmRuntimeHelper.mapSet ||
      EsmRuntimeHelper.mapAddAll ||
      EsmRuntimeHelper.mapContainsKey ||
      EsmRuntimeHelper.mapOps => _iterableMapHelperDeclaration(helper),
      EsmRuntimeHelper.dateTime ||
      EsmRuntimeHelper.duration => _timeHelperDeclaration(helper),
      EsmRuntimeHelper.recordShape ||
      EsmRuntimeHelper.isRecord ||
      EsmRuntimeHelper.record ||
      EsmRuntimeHelper.pattern ||
      EsmRuntimeHelper.regExp ||
      EsmRuntimeHelper.regExpEscape => _recordRegExpHelperDeclaration(helper),
      EsmRuntimeHelper.setAddAll ||
      EsmRuntimeHelper.setOps ||
      EsmRuntimeHelper.splayTree ||
      EsmRuntimeHelper.stringBuffer ||
      EsmRuntimeHelper.stringFactory ||
      EsmRuntimeHelper.stringOps ||
      EsmRuntimeHelper.listAdd ||
      EsmRuntimeHelper.listAddAll ||
      EsmRuntimeHelper.listFactory ||
      EsmRuntimeHelper.listMixin ||
      EsmRuntimeHelper.listMutation ||
      EsmRuntimeHelper.listRangeOps ||
      EsmRuntimeHelper.listSearch ||
      EsmRuntimeHelper.unmodifiableViews ||
      EsmRuntimeHelper.typedDataSublistView => _collectionHelperDeclaration(
        helper,
      ),
      EsmRuntimeHelper.uri ||
      EsmRuntimeHelper.uriToFilePath => _uriHelperDeclaration(helper),
    };
  }
}
