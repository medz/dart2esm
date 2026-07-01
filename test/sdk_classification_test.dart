import 'package:dart2esm/src/compiler/semantic/analysis/sdk_classification.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('detects direct dart:core exception superclass and interface', () {
    final core = _sdkLibrary('dart:core');
    final formatException = _sdkClass(core, 'FormatException');
    final stateError = _sdkClass(core, 'StateError');
    final localUri = Uri.parse('package:sample/main.dart');
    final localException = k.Class(
      name: 'LocalException',
      supertype: k.Supertype(formatException, const []),
      fileUri: localUri,
    );
    final interfaceException = k.Class(
      name: 'InterfaceException',
      implementedTypes: [k.Supertype(stateError, const [])],
      fileUri: localUri,
    );

    expect(
      directDartCoreExceptionSuperclassName(localException),
      'FormatException',
    );
    expect(
      directDartCoreExceptionInterfaceName(interfaceException),
      'StateError',
    );
    expect(dartCoreExceptionSupertypeName(null), isNull);
  });

  test('detects direct dart:convert bases', () {
    final convert = _sdkLibrary('dart:convert');
    final codec = _sdkClass(convert, 'Codec');
    final converter = _sdkClass(convert, 'Converter');
    final stringSink = _sdkClass(convert, 'StringConversionSink');
    final byteSink = _sdkClass(convert, 'ByteConversionSinkBase');
    final localUri = Uri.parse('package:sample/main.dart');

    final codecSubclass = k.Class(
      name: 'CodecSubclass',
      supertype: k.Supertype(codec, const []),
      fileUri: localUri,
    );
    final converterMixinApplication = k.Class(
      name: 'ConverterMixinApplication',
      mixedInType: k.Supertype(converter, const []),
      fileUri: localUri,
    );
    final sinkImplementer = k.Class(
      name: 'SinkImplementer',
      implementedTypes: [k.Supertype(stringSink, const [])],
      fileUri: localUri,
    );
    final byteSinkSubclass = k.Class(
      name: 'ByteSinkSubclass',
      supertype: k.Supertype(byteSink, const []),
      fileUri: localUri,
    );

    expect(hasDartConvertBase(codecSubclass, const {'Codec'}), isTrue);
    expect(
      hasDartConvertBase(converterMixinApplication, const {'Converter'}),
      isTrue,
    );
    expect(
      hasDartConvertBase(sinkImplementer, const {'StringConversionSink'}),
      isTrue,
    );
    expect(
      hasDartConvertBase(byteSinkSubclass, const {'ByteConversionSinkBase'}),
      isTrue,
    );
    expect(hasDartConvertBase(codecSubclass, const {'Converter'}), isFalse);
  });
}

k.Library _sdkLibrary(String uri) {
  final parsed = Uri.parse(uri);
  return k.Library(parsed, fileUri: parsed);
}

k.Class _sdkClass(k.Library library, String name) {
  final klass = k.Class(name: name, fileUri: library.fileUri);
  library.addClass(klass);
  return klass;
}
