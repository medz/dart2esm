import 'dart:io';

import 'package:dart2esm/src/component.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  test('application compiler composes the core components', () {
    final compiler = _read('lib/src/app/compiler.dart');

    expect(compiler, contains("import 'package:dart2esm/src/compiler.dart';"));
    expect(compiler, contains('Compiler('));
    expect(compiler, isNot(contains("src/pipeline/pipeline.dart")));
    expect(Directory('lib/src/pipeline').existsSync(), isFalse);
  });

  test('source tree follows Oxc-style application foundation core layers', () {
    expect(Directory('lib/src/app').existsSync(), isTrue);
    expect(Directory('lib/src/foundation').existsSync(), isTrue);
    for (final coreDirectory in [
      'ast',
      'parser',
      'semantic',
      'lowering',
      'transformer',
      'runtime',
      'codegen',
    ]) {
      expect(
        Directory('lib/src/$coreDirectory').existsSync(),
        isTrue,
        reason: coreDirectory,
      );
    }

    for (final removedTopLevel in [
      'backend',
      'compiler',
      'compiler_core',
      'diagnostics',
      'js_ast',
      'kernel',
      'module',
      'module_builder',
      'names',
      'optimizer',
      'program',
      'world',
    ]) {
      expect(
        Directory('lib/src/$removedTopLevel').existsSync(),
        isFalse,
        reason: removedTopLevel,
      );
    }
  });

  test('compiler components have explicit Oxc-style return boundaries', () {
    final compiler = _read('lib/src/compiler.dart');
    final components = _read('lib/src/component.dart');
    final parser = _read('lib/src/parser/kernel_parser.dart');
    final semantic = _read('lib/src/semantic/semantic_world.dart');
    final lowerer = _read('lib/src/lowering/kernel_to_esm_ast.dart');
    final transformer = _read('lib/src/transformer/module_transformer.dart');
    final runtime = _read('lib/src/runtime/runtime_linker.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');

    expect(components, contains('enum CompilerComponentId'));
    expect(components, contains('enum CompilerComponentCapability'));
    expect(components, contains('final class CompilerComponentContract'));
    expect(components, contains('compilerComponentContracts'));
    expect(components, contains('compilerComponentOrder'));
    expect(components, isNot(contains('abstract interface class')));
    expect(components, isNot(contains('CompilerContext')));
    expect(parser, contains('ParserReturn parse(k.Component'));
    expect(semantic, contains('SemanticBuilderReturn build(ParserReturn'));
    expect(lowerer, contains('LowererReturn lower('));
    expect(lowerer, contains('SemanticBuilderReturn semanticReturn'));
    expect(transformer, contains('TransformerReturn transform(LowererReturn'));
    expect(runtime, contains('RuntimeLinkerReturn link(TransformerReturn'));
    expect(codegen, contains('CodegenReturn generate(EsmModule'));
    expect(compiler, contains('final class CompilerReturn'));
    expect(compiler, contains('final ParserReturn kernel'));
    expect(compiler, contains('final List<CompilerComponentId>'));
    expect(compiler, contains('final SemanticBuilderReturn? semantic'));
    expect(compiler, contains('final LowererReturn? lowering'));
    expect(compiler, contains('final TransformerReturn? transform'));
    expect(compiler, contains('final RuntimeLinkerReturn? runtime'));
    expect(compiler, contains('final CodegenReturn? codegen'));
    expect(transformer, contains('invalidatesSemantic'));
    expect(compiler, isNot(contains('File(')));
    expect(compiler, isNot(contains('Directory(')));
    expect(compiler, isNot(contains('Process.run')));
    expect(compiler, isNot(contains('writeAsStringSync')));
  });

  test('compiler component contracts own source capabilities', () {
    final compilerCoreRoot = p.join(Directory.current.path, 'lib/src');
    final contractsByOwnerDirectory = {
      for (final contract in compilerComponentContracts)
        contract.ownerDirectory: contract,
    };

    expect(contractsByOwnerDirectory.keys, hasLength(6));
    for (final contract in compilerComponentContracts) {
      final owner = Directory(
        p.join(compilerCoreRoot, contract.ownerDirectory),
      );
      expect(owner.existsSync(), isTrue, reason: contract.ownerDirectory);
      expect(
        owner
            .listSync(recursive: true)
            .whereType<File>()
            .where((file) => file.path.endsWith('.dart')),
        isNotEmpty,
        reason: contract.ownerDirectory,
      );
    }

    for (final file in _dartFiles('lib/src')) {
      final relative = p.relative(file.path, from: compilerCoreRoot);
      final ownerDirectory = p.split(relative).first;
      final contract = contractsByOwnerDirectory[ownerDirectory];
      if (contract == null) {
        continue;
      }
      final source = file.readAsStringSync();

      if (!contract.allowsKernelAccess) {
        expect(
          source,
          isNot(contains("package:kernel/kernel.dart")),
          reason: '${contract.id} must not read Kernel in ${file.path}',
        );
      }
      if (!contract.allowsRuntimeHelperReference &&
          !contract.allowsRuntimeHelperDeclaration) {
        expect(
          source,
          isNot(contains('runtime_helpers.dart')),
          reason:
              '${contract.id} must not discover runtime helpers in ${file.path}',
        );
        expect(
          source,
          isNot(contains('EsmRuntimeHelper')),
          reason:
              '${contract.id} must not depend on runtime helpers in ${file.path}',
        );
      }
      if (!contract.isCodePrinter) {
        expect(
          source,
          isNot(contains('CodegenReturn')),
          reason: '${contract.id} must not print ESM in ${file.path}',
        );
        expect(
          source,
          isNot(contains('_EsmPrinter')),
          reason: '${contract.id} must not print ESM in ${file.path}',
        );
      }
      expect(
        source,
        isNot(contains('backend/esm_backend.dart')),
        reason:
            '${contract.id} must not call the legacy backend in ${file.path}',
      );
    }
  });

  test('codegen only consumes prepared ESM AST', () {
    final codegen = _read('lib/src/codegen/esm_codegen.dart');

    expect(codegen, contains('CodegenReturn generate(EsmModule'));
    expect(codegen, contains('EsmModule'));
    expect(codegen, isNot(contains("package:kernel/kernel.dart")));
    expect(codegen, isNot(contains('runtime/runtime_helpers.dart')));
    expect(codegen, isNot(contains('runtime/runtime_linker.dart')));
    expect(codegen, isNot(contains('RuntimeLinkerReturn')));
    expect(codegen, isNot(contains('esmRuntimeHelperSource')));
    expect(codegen, isNot(contains('buildEsmProgramModel')));
    expect(codegen, isNot(contains('emitEsm(')));
    expect(codegen, isNot(contains('emitEsmModel(')));
    expect(codegen, isNot(contains('backend/esm_backend.dart')));
  });

  test('lowering constructs ESM AST before transformer normalization', () {
    final lowering = _read('lib/src/lowering/kernel_to_esm_ast.dart');
    final transformer = _read('lib/src/transformer/module_transformer.dart');

    expect(
      File('lib/src/module_builder/module_builder.dart').existsSync(),
      isFalse,
    );
    expect(
      lowering,
      contains('module = EsmModule(items: List.unmodifiable(items))'),
    );
    expect(lowering, contains('final EsmModule module'));
    expect(transformer, contains('final LowererReturn lowering'));
    expect(transformer, contains('EsmModule(items: normalized.items)'));
    expect(transformer, contains('changed: normalized.changed'));
    expect(
      transformer,
      contains('get runtimeHelpers => lowering.runtimeHelpers'),
    );
    expect(transformer, isNot(contains('ModuleBuildResult')));
  });

  test('SDK intrinsic lowering is routed through a registry', () {
    final lowering = _read('lib/src/lowering/kernel_to_esm_ast.dart');
    final registry = _read('lib/src/lowering/intrinsics/sdk_intrinsics.dart');
    final typedData = _read(
      'lib/src/lowering/intrinsics/dart_typed_data_intrinsics.dart',
    );
    final collection = _read(
      'lib/src/lowering/intrinsics/dart_collection_intrinsics.dart',
    );
    final coreEnum = _read(
      'lib/src/lowering/intrinsics/dart_core_enum_intrinsics.dart',
    );
    final coreError = _read(
      'lib/src/lowering/intrinsics/dart_core_error_intrinsics.dart',
    );
    final coreIterable = _read(
      'lib/src/lowering/intrinsics/dart_core_iterable_intrinsics.dart',
    );
    final coreNumber = _read(
      'lib/src/lowering/intrinsics/dart_core_number_intrinsics.dart',
    );
    final coreRuntime = _read(
      'lib/src/lowering/intrinsics/dart_core_runtime_intrinsics.dart',
    );
    final coreText = _read(
      'lib/src/lowering/intrinsics/dart_core_text_intrinsics.dart',
    );
    final coreTime = _read(
      'lib/src/lowering/intrinsics/dart_core_time_intrinsics.dart',
    );
    final coreUri = _read(
      'lib/src/lowering/intrinsics/dart_core_uri_intrinsics.dart',
    );
    final developer = _read(
      'lib/src/lowering/intrinsics/dart_developer_intrinsics.dart',
    );
    final math = _read('lib/src/lowering/intrinsics/dart_math_intrinsics.dart');
    final internal = _read(
      'lib/src/lowering/intrinsics/dart_internal_intrinsics.dart',
    );
    final convert = _read(
      'lib/src/lowering/intrinsics/dart_convert_intrinsics.dart',
    );
    final typedDataInvocation = _sliceBetween(
      lowering,
      '  EsmExpression? _lowerTypedDataInstanceInvocation(',
      '  EsmExpression? _lowerCoreStringInstanceInvocation(',
    );

    expect(registry, contains('final class DartSdkIntrinsicRegistry'));
    expect(registry, contains('lowerInstanceConstant'));
    expect(registry, contains('lowerStaticTearOffConstant'));
    expect(registry, contains('lowerInstanceInvocation'));
    expect(registry, contains('lowerInstanceGet'));
    expect(registry, contains('lowerStaticGet'));
    expect(registry, contains('lowerConstructorInvocation'));
    expect(registry, contains('lowerStaticInvocation'));
    expect(lowering, contains('final DartSdkIntrinsicRegistry sdkIntrinsics'));
    expect(lowering, contains('sdkIntrinsics.lowerInstanceConstant'));
    expect(lowering, contains('sdkIntrinsics.lowerInstanceInvocation'));
    expect(lowering, contains('sdkIntrinsics.lowerInstanceGet'));
    expect(lowering, contains('sdkIntrinsics.lowerStaticGet'));
    expect(lowering, contains('sdkIntrinsics.lowerConstructorInvocation'));
    expect(lowering, contains('sdkIntrinsics.lowerStaticInvocation'));
    expect(lowering, isNot(contains('_lowerByteDataInstanceInvocation')));
    expect(lowering, isNot(contains('_lowerDartConvertConstructorInvocation')));
    expect(lowering, isNot(contains('_lowerDartTypedDataInstanceConstant')));
    expect(
      lowering,
      isNot(contains('_lowerDartCollectionQueueInstanceInvocation')),
    );
    expect(lowering, isNot(contains('_lowerSdkCollectionStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreCollectionStaticInvocation')));
    expect(lowering, isNot(contains('_lowerDartCollectionQueueInstanceGet')));
    expect(lowering, isNot(contains('_lowerTypedDataInstanceGet')));
    expect(lowering, isNot(contains('_lowerTypedDataStaticInvocation')));
    expect(lowering, isNot(contains('_lowerTypedDataSublistView')));
    expect(lowering, isNot(contains('_lowerCoreUriInstanceInvocation')));
    expect(lowering, isNot(contains('_lowerCoreUriInstanceGet')));
    expect(lowering, isNot(contains('_lowerCoreUriStaticInvocation')));
    expect(lowering, isNot(contains('_lowerUriOptionsObject')));
    expect(lowering, isNot(contains('_lowerCoreStringStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreRegExpStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreTimeStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreNumberStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreDoubleStaticInvocation')));
    expect(lowering, isNot(contains('_lowerBigIntStaticInvocation')));
    expect(lowering, isNot(contains('_lowerDeveloperStaticGet')));
    expect(lowering, isNot(contains('_lowerDeveloperStaticInvocation')));
    expect(lowering, isNot(contains('_lowerMathStaticGet')));
    expect(lowering, isNot(contains('_lowerMathStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreObjectStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreFunctionApply')));
    expect(lowering, isNot(contains('_lowerCoreIdentical')));
    expect(lowering, isNot(contains('_lowerCoreIdentityHashCode')));
    expect(lowering, isNot(contains('_lowerCorePrint')));
    expect(lowering, isNot(contains('_lowerCoreEnumStaticInvocation')));
    expect(lowering, isNot(contains('_lowerCoreErrorStaticInvocation')));
    expect(lowering, isNot(contains('_lowerArgumentErrorStaticInvocation')));
    expect(lowering, isNot(contains('_lowerRangeErrorStaticInvocation')));
    expect(lowering, isNot(contains('_jsMathStaticFunctionName')));
    expect(lowering, isNot(contains('_jsMathStaticFunctionArity')));
    expect(
      lowering,
      isNot(contains('_typedDataByteBufferViewConstructorName')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.collectionNonNulls')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.collectionIndexed')),
    );
    expect(
      lowering,
      isNot(
        contains('DartSdkStaticInvocationSymbol.collectionListBaseToString'),
      ),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.internalCheckNotNullable')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.coreIterableToFullString')),
    );
    expect(lowering, isNot(contains('_lowerCoreErrorLiteral')));
    expect(lowering, isNot(contains('_dartDelimitedCollectionToString')));
    expect(lowering, isNot(contains('dart:convert::_Byte')));
    expect(lowering, isNot(contains('dart:typed_data::Endian')));
    expect(lowering, isNot(contains('dart:typed_data::ByteData')));
    expect(lowering, isNot(contains('dart:typed_data::ByteBuffer')));
    expect(lowering, isNot(contains('dart:core::Uri::')));
    expect(lowering, isNot(contains('dart:core::_Uri::')));
    expect(
      lowering,
      isNot(contains('dart:core::String::@factories::fromCharCode')),
    );
    expect(
      lowering,
      isNot(contains('dart:core::String::@factories::fromCharCodes')),
    );
    expect(lowering, isNot(contains('dart:core::RegExp::@methods::escape')));
    expect(lowering, isNot(contains('dart:core::DateTime::@methods::parse')));
    expect(lowering, isNot(contains('dart:core::int::@methods::parse')));
    expect(lowering, isNot(contains('dart:core::double::@methods::parse')));
    expect(lowering, isNot(contains('dart:core::num::@methods::parse')));
    expect(lowering, isNot(contains('dart:core::BigInt::@methods::parse')));
    expect(lowering, isNot(contains('dart:core::BigInt::@factories::from')));
    expect(lowering, isNot(contains('dart:core::List::@factories::of')));
    expect(lowering, isNot(contains('dart:core::List::@factories::filled')));
    expect(lowering, isNot(contains('dart:core::List::@methods::copyRange')));
    expect(
      lowering,
      isNot(contains('dart:core::Map::@factories::fromIterable')),
    );
    expect(
      lowering,
      isNot(contains('dart:collection::SplayTreeSet::@factories::')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.coreDateTimeCopyWith')),
    );
    expect(
      lowering,
      isNot(contains('dart:core::ArgumentError::@methods::checkNotNull')),
    );
    expect(
      lowering,
      isNot(contains('dart:core::RangeError::@methods::checkValidRange')),
    );
    expect(
      lowering,
      isNot(contains('dart:core::Error::@methods::safeToString')),
    );
    expect(lowering, isNot(contains('DartDeveloperStaticGetSymbol')));
    expect(lowering, isNot(contains('DartDeveloperStaticInvocationSymbol')));
    expect(lowering, isNot(contains('DartMathStaticGetSymbol')));
    expect(lowering, isNot(contains('DartMathStaticInvocationSymbol')));
    expect(lowering, isNot(contains('DartCoreObjectStaticInvocationSymbol')));
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.corePrint')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.coreFunctionApply')),
    );
    expect(
      lowering,
      isNot(contains('DartSdkStaticInvocationSymbol.coreEnumName')),
    );
    expect(typedDataInvocation, isNot(contains('__dartListSetAll')));
    expect(typedDataInvocation, isNot(contains('__dartListSetRange')));
    expect(typedDataInvocation, isNot(contains('__dartListFillRange')));
    expect(typedDataInvocation, isNot(contains('__dartListAsMap')));
    expect(typedDataInvocation, isNot(contains("name == 'sublist'")));
    expect(typedDataInvocation, isNot(contains("name == 'getRange'")));
    expect(typedDataInvocation, isNot(contains("name == 'setRange'")));
    expect(typedDataInvocation, isNot(contains("name == 'fillRange'")));
    expect(typedData, contains('dart:typed_data::Endian'));
    expect(typedData, contains('lowerByteDataInstanceInvocation'));
    expect(typedData, contains('lowerByteBufferInstanceInvocation'));
    expect(typedData, contains('lowerTypedDataInstanceInvocation'));
    expect(typedData, contains('_lowerTypedDataListInstanceInvocation'));
    expect(typedData, contains('lowerTypedDataInstanceGet'));
    expect(typedData, contains('lowerTypedDataStaticInvocation'));
    expect(typedData, contains("'ByteBuffer'"));
    expect(typedData, contains('__dartListSetAll'));
    expect(typedData, contains('__dartListSetRange'));
    expect(typedData, contains('__dartListFillRange'));
    expect(typedData, contains('__dartListAsMap'));
    expect(coreText, contains('lowerDartCoreTextStaticInvocation'));
    expect(coreText, contains('dart:core::String::@factories::fromCharCode'));
    expect(coreText, contains('dart:core::String::@factories::fromCharCodes'));
    expect(coreText, contains('dart:core::RegExp::@factories::'));
    expect(coreText, contains('dart:core::RegExp::@methods::escape'));
    expect(coreText, contains('EsmRuntimeHelper.regExp'));
    expect(coreText, contains('EsmRuntimeHelper.stringFactory'));
    expect(coreTime, contains('lowerDartCoreTimeStaticInvocation'));
    expect(coreTime, contains('dart:core::DateTime::@methods::parse'));
    expect(
      coreTime,
      contains('DartSdkStaticInvocationSymbol.coreDateTimeCopyWith'),
    );
    expect(coreTime, contains('__dartDateTimeCopyWith'));
    expect(coreUri, contains('lowerDartCoreUriStaticGet'));
    expect(coreUri, contains('lowerDartCoreUriInstanceInvocation'));
    expect(coreUri, contains('lowerDartCoreUriInstanceGet'));
    expect(coreUri, contains('lowerDartCoreUriStaticInvocation'));
    expect(coreUri, contains('dart:core::Uri::@getters::base'));
    expect(coreUri, contains('dart:core::Uri::@methods::parse'));
    expect(coreUri, contains('dart:core::_Uri::@factories::'));
    expect(coreUri, contains('__dartUriReplace'));
    expect(coreUri, contains('queryParametersAll'));
    expect(developer, contains('lowerDartDeveloperStaticGet'));
    expect(developer, contains('lowerDartDeveloperStaticInvocation'));
    expect(developer, contains('DartDeveloperStaticGetSymbol.timelineNow'));
    expect(
      developer,
      contains('DartDeveloperStaticInvocationSymbol.timelineTimeSync'),
    );
    expect(developer, contains('DartDeveloperStaticInvocationSymbol.log'));
    expect(math, contains('lowerDartMathStaticTearOffConstant'));
    expect(math, contains('lowerDartMathStaticGet'));
    expect(math, contains('lowerDartMathStaticInvocation'));
    expect(math, contains('DartMathStaticGetSymbol.pi'));
    expect(math, contains('DartMathStaticInvocationSymbol.random'));
    expect(
      math,
      contains('DartMathStaticInvocationSymbol.rectangleFromPoints'),
    );
    expect(collection, contains('lowerDartCollectionQueueInstanceInvocation'));
    expect(collection, contains('lowerDartCollectionQueueInstanceGet'));
    expect(collection, contains('lowerDartCollectionStaticInvocation'));
    expect(
      collection,
      contains('DartSdkStaticInvocationSymbol.collectionNonNulls'),
    );
    expect(
      collection,
      contains('DartSdkStaticInvocationSymbol.collectionListBaseToString'),
    );
    expect(collection, contains('dart:core::List::@factories::of'));
    expect(collection, contains('dart:core::List::@factories::filled'));
    expect(collection, contains('dart:core::List::@methods::copyRange'));
    expect(collection, contains('dart:core::Map::@factories::fromIterable'));
    expect(collection, contains('dart:collection::SplayTreeSet::@factories::'));
    expect(collection, contains('EsmRuntimeHelper.mapFactories'));
    expect(collection, contains('EsmRuntimeHelper.splayTree'));
    expect(coreEnum, contains('lowerDartCoreEnumStaticInvocation'));
    expect(coreEnum, contains('DartSdkStaticInvocationSymbol.coreEnumName'));
    expect(coreEnum, contains('DartSdkStaticInvocationSymbol.coreEnumByName'));
    expect(
      coreEnum,
      contains('DartSdkStaticInvocationSymbol.coreEnumAsNameMap'),
    );
    expect(coreError, contains('lowerDartCoreErrorStaticInvocation'));
    expect(
      coreError,
      contains('dart:core::ArgumentError::@methods::checkNotNull'),
    );
    expect(
      coreError,
      contains('dart:core::RangeError::@methods::checkValidRange'),
    );
    expect(coreError, contains('dart:core::Error::@methods::safeToString'));
    expect(coreIterable, contains('lowerDartCoreIterableStaticInvocation'));
    expect(
      coreIterable,
      contains('DartSdkStaticInvocationSymbol.coreIterableToFullString'),
    );
    expect(coreNumber, contains('lowerDartCoreNumberStaticInvocation'));
    expect(coreNumber, contains('dart:core::int::@methods::parse'));
    expect(coreNumber, contains('dart:core::double::@methods::parse'));
    expect(coreNumber, contains('dart:core::num::@methods::parse'));
    expect(coreNumber, contains('dart:core::BigInt::@methods::parse'));
    expect(coreNumber, contains('dart:core::BigInt::@factories::from'));
    expect(coreNumber, contains('EsmRuntimeHelper.intParse'));
    expect(coreNumber, contains('EsmRuntimeHelper.doubleParse'));
    expect(coreNumber, contains('EsmRuntimeHelper.bigIntParse'));
    expect(coreRuntime, contains('lowerDartCoreRuntimeStaticInvocation'));
    expect(
      coreRuntime,
      contains('DartCoreObjectStaticInvocationSymbol.hashAllUnordered'),
    );
    expect(coreRuntime, contains('DartSdkStaticInvocationSymbol.corePrint'));
    expect(
      coreRuntime,
      contains('DartSdkStaticInvocationSymbol.coreFunctionApply'),
    );
    expect(
      coreRuntime,
      contains('DartSdkStaticInvocationSymbol.coreIdentical'),
    );
    expect(
      coreRuntime,
      contains('DartSdkStaticInvocationSymbol.coreIdentityHashCode'),
    );
    expect(internal, contains('lowerDartInternalStaticInvocation'));
    expect(
      internal,
      contains('DartSdkStaticInvocationSymbol.internalCheckNotNullable'),
    );
    expect(
      internal,
      contains('DartSdkStaticInvocationSymbol.iterableElementErrorTooMany'),
    );
    expect(convert, contains('dart:convert::_ByteAdapterSink'));
    expect(convert, contains('dart:convert::_ByteCallbackSink'));
  });

  test('compiler components does not lower pub packages by package URI', () {
    final compilerCoreSources = _dartFiles(
      'lib/src',
    ).map((file) => file.readAsStringSync()).join('\n');

    for (final packageUri in [
      'package:collection/',
      'package:source_span/',
      'package:string_scanner/',
      'package:http_parser/',
      'package:typed_data/',
      'package:glob/',
    ]) {
      expect(compilerCoreSources, isNot(contains(packageUri)));
    }
  });

  test('ESM AST is independent from runtime helper registry', () {
    final ir = _read('lib/src/ast/esm_ast.dart');

    expect(ir, isNot(contains('runtime_helpers.dart')));
    expect(ir, isNot(contains('EsmRuntimeHelper')));
    expect(ir, isNot(contains('runtimeHelpers')));
  });

  test('ESM arrow function parameters use structured binding AST', () {
    final ir = _read('lib/src/ast/esm_ast.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');

    expect(ir, contains('final class EsmArrayPatternParameter'));
    expect(ir, contains('final List<EsmParameter> elements;'));
    expect(ir, isNot(contains('final List<String> bindings;')));
    expect(ir, contains('final List<EsmParameter> parameters;'));
    expect(ir, isNot(contains('final List<String> parameters;')));
    expect(codegen, contains('EsmArrayPatternParameter()'));
    expect(codegen, contains('parameter.elements.map(_emitBindingPattern)'));
    expect(codegen, contains('String _emitBindingPattern(EsmParameter'));
    expect(codegen, contains('expression.parameters.map(_emitParameter)'));
    expect(codegen, isNot(contains('expression.parameters.join')));
  });

  test('ESM class superclass uses expression AST', () {
    final ir = _read('lib/src/ast/esm_ast.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');

    expect(ir, contains('final EsmExpression? superclass;'));
    expect(ir, isNot(contains('final String? superclass;')));
    expect(codegen, contains('extends \${_emitExpression(klass.superclass!)}'));
    expect(codegen, isNot(contains('extends \${klass.superclass}')));
  });

  test('ESM catch parameter uses binding AST', () {
    final ir = _read('lib/src/ast/esm_ast.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');
    final lowering = _read('lib/src/lowering/kernel_to_esm_ast.dart');

    expect(ir, contains('final EsmParameter? catchParameter;'));
    expect(ir, isNot(contains('final String? catchParameter;')));
    expect(codegen, contains('_emitBindingPattern(catchParameter)'));
    expect(codegen, isNot(contains('catch (\${statement.catchParameter})')));
    expect(lowering, contains('catchParameter: EsmIdentifierParameter'));
  });

  test('ESM variable declarations use binding AST', () {
    final ir = _read('lib/src/ast/esm_ast.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');
    final lowering = _read('lib/src/lowering/kernel_to_esm_ast.dart');

    expect(ir, contains('sealed class EsmBinding'));
    expect(ir, contains('final class EsmIdentifierBinding'));
    expect(ir, contains('final class EsmObjectBindingPattern'));
    expect(ir, contains('final class EsmArrayBindingPattern'));
    expect(ir, contains('final EsmBinding binding;'));
    expect(
      ir,
      isNot(
        contains('final String name;\n  final EsmExpression? initializer;'),
      ),
    );
    expect(codegen, contains('_emitBinding(statement.binding)'));
    expect(codegen, contains('_emitBinding(initializer.binding)'));
    expect(codegen, isNot(contains('statement.name')));
    expect(codegen, isNot(contains('initializer.name')));
    expect(lowering, contains('binding: EsmIdentifierBinding'));
  });

  test('ESM operators use syntax enum AST', () {
    final ir = _read('lib/src/ast/esm_ast.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');
    final operatorLiteral = RegExp(r'''operator:\s*['"]''');

    expect(ir, contains('enum EsmBinaryOperator'));
    expect(ir, contains('enum EsmUnaryOperator'));
    expect(ir, contains('final EsmBinaryOperator operator;'));
    expect(ir, contains('final EsmUnaryOperator operator;'));
    expect(ir, isNot(contains('final String operator;')));
    expect(codegen, contains('_emitBinaryOperator(EsmBinaryOperator'));
    expect(codegen, contains('_binaryPrecedence(EsmBinaryOperator'));
    expect(codegen, contains('_emitUnaryExpression(EsmUnary'));
    expect(codegen, isNot(contains('_binaryPrecedence(String')));
    for (final file in _dartFiles('lib/src')) {
      expect(
        operatorLiteral.firstMatch(file.readAsStringSync()),
        isNull,
        reason: '${file.path} must model operators with enum AST',
      );
    }
  });

  test('ESM object literal properties use property key AST', () {
    final ir = _read('lib/src/ast/esm_ast.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');
    final lowering = _read('lib/src/lowering/kernel_to_esm_ast.dart');

    expect(ir, contains('sealed class EsmPropertyKey'));
    expect(ir, contains('final class EsmStaticPropertyKey'));
    expect(ir, contains('final class EsmComputedPropertyKey'));
    expect(ir, contains('final EsmPropertyKey key;'));
    expect(
      ir,
      isNot(contains('final String name;\n  final EsmExpression value;')),
    );
    expect(codegen, contains('_emitPropertyKey(property.key)'));
    expect(codegen, isNot(contains('_emitObjectPropertyName(property.name)')));
    expect(lowering, contains('EsmObjectLiteralProperty.static'));
    expect(lowering, isNot(contains('EsmObjectLiteralProperty(name:')));
  });

  test('ESM class methods use property key AST', () {
    final ir = _read('lib/src/ast/esm_ast.dart');
    final codegen = _read('lib/src/codegen/esm_codegen.dart');
    final lowering = _read('lib/src/lowering/kernel_to_esm_ast.dart');
    final transformer = _read('lib/src/transformer/module_transformer.dart');

    expect(
      ir,
      contains('final EsmPropertyKey key;\n  final EsmClassMethodKind'),
    );
    expect(codegen, contains('_emitPropertyKey(method.key)'));
    expect(codegen, isNot(contains('_emitObjectPropertyName(method.name)')));
    expect(lowering, contains('key: EsmStaticPropertyKey'));
    expect(lowering, isNot(contains('EsmClassMethod(\n      name:')));
    expect(transformer, contains('key: method.key'));
    expect(transformer, isNot(contains('EsmStaticPropertyKey(method.name)')));
  });

  test('ESM identifier AST is not used for member expressions', () {
    final dottedIdentifierLiteral = RegExp(
      r'''EsmIdentifier\(\s*['"][^'"]+\.[^'"]*['"]''',
    );

    for (final file in _dartFiles('lib/src')) {
      final source = file.readAsStringSync();
      expect(
        dottedIdentifierLiteral.firstMatch(source),
        isNull,
        reason:
            '${file.path} must model member/meta access with structured ESM AST',
      );
    }
  });

  test(
    'compiler components does not adapt third-party packages by API path',
    () {
      for (final contract in compilerComponentContracts) {
        for (final file in _dartFiles('lib/src/${contract.ownerDirectory}')) {
          final nonImportSource = file
              .readAsLinesSync()
              .where((line) => !line.trimLeft().startsWith('import '))
              .join('\n');
          expect(
            nonImportSource,
            isNot(contains("'package:")),
            reason: file.path,
          );
          expect(
            nonImportSource,
            isNot(contains('"package:')),
            reason: file.path,
          );
          expect(
            nonImportSource,
            isNot(contains('package_')),
            reason: file.path,
          );
        }
      }
    },
  );

  test('semantic accepts name reservations without runtime dependency', () {
    final semantic = _read('lib/src/semantic/semantic_world.dart');
    final compiler = _read('lib/src/compiler.dart');

    expect(semantic, contains('generatedGlobalNames'));
    expect(semantic, isNot(contains('runtime_helpers.dart')));
    expect(semantic, isNot(contains('EsmRuntimeHelper')));
    expect(compiler, contains('EsmRuntimeHelperRegistry.generatedGlobalNames'));
  });

  test('runtime helpers are owned by compiler components', () {
    final runtime = _read('lib/src/runtime/runtime_helpers.dart');
    final linker = _read('lib/src/runtime/runtime_linker.dart');
    final lowering = _read('lib/src/lowering/kernel_to_esm_ast.dart');
    final loweringContext = _read('lib/src/lowering/lowering_context.dart');
    final coreFiles = _dartFiles('lib/src');

    expect(runtime, contains('enum EsmRuntimeHelper'));
    expect(runtime, contains('final class EsmRuntimeHelperRegistry'));
    expect(runtime, contains('bool require(EsmRuntimeHelper helper)'));
    expect(runtime, contains('EsmIdentifier reference('));
    expect(runtime, contains('__dartPrint'));
    expect(linker, contains('final class RuntimeLinker'));
    expect(linker, contains('runtimeHelpers.declaration'));
    expect(linker, contains('transform.runtimeHelpers'));
    expect(linker, isNot(contains('moduleBuild')));
    expect(loweringContext, contains('final class DartLoweringContext'));
    expect(loweringContext, contains('EsmRuntimeHelperUseSet'));
    expect(loweringContext, contains('runtimeHelperUses'));
    expect(lowering, contains('helpers.require('));
    expect(lowering, contains('helpers.reference(runtimeHelpers'));
    expect(lowering, isNot(contains('helpers.add(')));
    expect(lowering, isNot(contains('runtimeHelpers.reference')));
    expect(lowering, contains('DartLoweringContext('));
    expect(lowering, isNot(contains('EsmRuntimeHelperUseSet()')));
    expect(lowering, isNot(contains('esmRuntimeHelperName')));
    for (final file in coreFiles) {
      expect(
        file.readAsStringSync(),
        isNot(contains('backend/runtime_helpers.dart')),
        reason: file.path,
      );
    }
  });

  test('legacy backend entrypoints are deleted from the architecture', () {
    expect(Directory('lib/src/backend').existsSync(), isFalse);
    expect(File('lib/src/legacy_oracle.dart').existsSync(), isFalse);

    for (final file in _dartFiles('lib/src')) {
      final source = file.readAsStringSync();
      expect(
        source,
        isNot(contains('backend/esm_backend.dart')),
        reason: file.path,
      );
      expect(source, isNot(contains('emitEsm(')), reason: file.path);
      expect(source, isNot(contains('emitEsmModel(')), reason: file.path);
    }
  });

  test('compiler exposes no legacy backend oracle entrypoint', () {
    final cli = _read('lib/src/app/cli.dart');
    final compiler = _read('lib/src/app/compiler.dart');
    final compilerCore = _read('lib/src/compiler.dart');

    expect(compiler, isNot(contains('allowLegacyOracle')));
    expect(compilerCore, isNot(contains('allowLegacyOracle')));
    expect(cli, isNot(contains('legacy-oracle')));
    expect(cli, isNot(contains('allowLegacyOracle')));
  });
}

String _read(String relativePath) {
  return File(p.join(Directory.current.path, relativePath)).readAsStringSync();
}

List<File> _dartFiles(String relativeDirectory) {
  final directory = Directory(
    p.join(Directory.current.path, relativeDirectory),
  );
  return directory
      .listSync(recursive: true)
      .whereType<File>()
      .where((file) => file.path.endsWith('.dart'))
      .toList()
    ..sort((left, right) => left.path.compareTo(right.path));
}

String _sliceBetween(String source, String start, String end) {
  final startIndex = source.indexOf(start);
  expect(startIndex, isNonNegative, reason: start);
  final endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex, isNonNegative, reason: end);
  return source.substring(startIndex, endIndex);
}
