import 'package:dart2esm/src/third_party/kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../ast/esm_ast.dart';
import '../../transformer/helpers/runtime_helpers.dart';

EsmExpression? lowerDartConvertConstructorInvocation({
  required k.ConstructorInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  final path = kernelReferencePath(expression.targetReference);
  final helperName = _dartConvertConstructorHelper(path);
  if (helperName == null) {
    return null;
  }
  helpers.require(
    helperName.startsWith('__dartByteConversionSink')
        ? EsmRuntimeHelper.byteConversionSink
        : EsmRuntimeHelper.encoding,
  );
  return EsmCall(
    callee: EsmIdentifier(helperName),
    arguments: _dartConvertConstructorArguments(
      path,
      expression.arguments,
      lower,
      lowerNamedArgument,
    ),
  );
}

EsmExpression? lowerDartConvertStaticGet({
  required k.StaticGet expression,
  required EsmRuntimeHelperUseSet helpers,
}) {
  final path = kernelReferencePath(expression.targetReference);
  final helperCall = switch (path) {
    'dart:convert::@getters::json' => const EsmCall(
      callee: EsmIdentifier('__dartJsonCodec'),
      arguments: [],
    ),
    'dart:convert::@getters::utf8' => const EsmCall(
      callee: EsmIdentifier('__dartUtf8Codec'),
      arguments: [],
    ),
    'dart:convert::@getters::ascii' => const EsmCall(
      callee: EsmIdentifier('__dartAsciiCodec'),
      arguments: [],
    ),
    'dart:convert::@getters::latin1' => const EsmCall(
      callee: EsmIdentifier('__dartLatin1Codec'),
      arguments: [],
    ),
    'dart:convert::@getters::base64' => const EsmCall(
      callee: EsmIdentifier('__dartBase64Codec'),
      arguments: [],
    ),
    'dart:convert::@getters::base64Url' => const EsmCall(
      callee: EsmIdentifier('__dartBase64Codec'),
      arguments: [EsmBooleanLiteral(true)],
    ),
    'dart:convert::@getters::htmlEscape' => const EsmCall(
      callee: EsmIdentifier('__dartHtmlEscape'),
      arguments: [],
    ),
    'dart:convert::HtmlEscapeMode::@getters::attribute' ||
    'dart:convert::HtmlEscapeMode::@fields::attribute' => EsmCall(
      callee: EsmIdentifier('__dartHtmlEscapeMode'),
      arguments: [
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'escapeLtGt',
            value: EsmBooleanLiteral(true),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeQuot',
            value: EsmBooleanLiteral(true),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeApos',
            value: EsmBooleanLiteral(false),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeSlash',
            value: EsmBooleanLiteral(false),
          ),
        ]),
      ],
    ),
    'dart:convert::HtmlEscapeMode::@getters::element' ||
    'dart:convert::HtmlEscapeMode::@fields::element' => EsmCall(
      callee: EsmIdentifier('__dartHtmlEscapeMode'),
      arguments: [
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'escapeLtGt',
            value: EsmBooleanLiteral(true),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeQuot',
            value: EsmBooleanLiteral(false),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeApos',
            value: EsmBooleanLiteral(false),
          ),
          EsmObjectLiteralProperty.static(
            key: 'escapeSlash',
            value: EsmBooleanLiteral(false),
          ),
        ]),
      ],
    ),
    _ => null,
  };
  if (helperCall == null) return null;
  helpers.require(EsmRuntimeHelper.encoding);
  return helperCall;
}

EsmExpression? lowerDartConvertStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  if (expression.arguments.types.isNotEmpty) {
    return null;
  }
  final path = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  final call = switch (path) {
    'dart:convert::@methods::jsonEncode' when positional.length == 1 => EsmCall(
      callee: const EsmIdentifier('__dartJsonEncode'),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(expression.arguments, 'toEncodable') ??
            const EsmNullLiteral(),
      ],
    ),
    'dart:convert::@methods::jsonDecode' when positional.length == 1 => EsmCall(
      callee: const EsmIdentifier('__dartJsonDecode'),
      arguments: [
        lower(positional.single),
        lowerNamedArgument(expression.arguments, 'reviver') ??
            const EsmNullLiteral(),
      ],
    ),
    'dart:convert::@methods::base64Encode' when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartBase64BytesToString'),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::@methods::base64Decode' when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartBase64StringToBytes'),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::LineSplitter::@methods::split' when positional.length == 1 =>
      EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmCall(
            callee: EsmIdentifier('__dartLineSplitter'),
            arguments: [],
          ),
          property: 'convert',
        ),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::ByteConversionSink::@factories::withCallback'
        when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartByteConversionSink'),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::ByteConversionSink::@factories::from'
        when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartByteConversionSinkFrom'),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::StringConversionSink::@factories::withCallback'
        when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartStringConversionSinkWithCallback'),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::StringConversionSink::@factories::from'
        when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartStringConversionSinkFrom'),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::StringConversionSink::@factories::fromStringSink'
        when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartStringConversionSinkFromStringSink'),
        arguments: [lower(positional.single)],
      ),
    'dart:convert::ChunkedConversionSink::@factories::withCallback'
        when positional.length == 1 =>
      EsmCall(
        callee: const EsmIdentifier('__dartChunkedSink'),
        arguments: [lower(positional.single)],
      ),
    _ => null,
  };
  if (call == null) return null;
  helpers.require(
    path.contains('ByteConversionSink')
        ? EsmRuntimeHelper.byteConversionSink
        : EsmRuntimeHelper.encoding,
  );
  return call;
}

String? _dartConvertConstructorHelper(String path) {
  if (path.startsWith('dart:convert::_ByteAdapterSink::@constructors::')) {
    return '__dartByteConversionSinkFrom';
  }
  if (path.startsWith('dart:convert::_ByteCallbackSink::@constructors::')) {
    return '__dartByteConversionSink';
  }
  if (path.startsWith('dart:convert::_StringAdapterSink::@constructors::')) {
    return '__dartStringConversionSinkFrom';
  }
  if (path.startsWith('dart:convert::_StringCallbackSink::@constructors::')) {
    return '__dartStringConversionSinkWithCallback';
  }
  if (path.startsWith(
    'dart:convert::_StringSinkConversionSink::@constructors::',
  )) {
    return '__dartStringConversionSinkFromStringSink';
  }
  if (path.startsWith('dart:convert::_SimpleCallbackSink::@constructors::')) {
    return '__dartChunkedSink';
  }
  if (path.startsWith('dart:convert::Utf8Codec::@constructors::')) {
    return '__dartUtf8Codec';
  }
  if (path.startsWith('dart:convert::Utf8Encoder::@constructors::')) {
    return '__dartUtf8Encoder';
  }
  if (path.startsWith('dart:convert::Utf8Decoder::@constructors::')) {
    return '__dartUtf8Decoder';
  }
  if (path.startsWith('dart:convert::AsciiCodec::@constructors::')) {
    return '__dartAsciiCodec';
  }
  if (path.startsWith('dart:convert::AsciiEncoder::@constructors::')) {
    return '__dartAsciiEncoder';
  }
  if (path.startsWith('dart:convert::AsciiDecoder::@constructors::')) {
    return '__dartAsciiDecoder';
  }
  if (path.startsWith('dart:convert::Latin1Codec::@constructors::')) {
    return '__dartLatin1Codec';
  }
  if (path.startsWith('dart:convert::Latin1Encoder::@constructors::')) {
    return '__dartLatin1Encoder';
  }
  if (path.startsWith('dart:convert::Latin1Decoder::@constructors::')) {
    return '__dartLatin1Decoder';
  }
  if (path.startsWith('dart:convert::JsonEncoder::@constructors::withIndent')) {
    return '__dartJsonEncoder';
  }
  if (path.startsWith('dart:convert::JsonEncoder::@constructors::')) {
    return '__dartJsonEncoder';
  }
  if (path.startsWith('dart:convert::JsonDecoder::@constructors::')) {
    return '__dartJsonDecoder';
  }
  if (path.startsWith('dart:convert::JsonUtf8Encoder::@constructors::')) {
    return '__dartJsonUtf8Encoder';
  }
  if (path.startsWith('dart:convert::Base64Encoder::@constructors::')) {
    return '__dartBase64Encoder';
  }
  if (path.startsWith('dart:convert::Base64Decoder::@constructors::')) {
    return '__dartBase64Decoder';
  }
  if (path.startsWith('dart:convert::Base64Codec::@constructors::')) {
    return '__dartBase64Codec';
  }
  if (path.startsWith('dart:convert::LineSplitter::@constructors::')) {
    return '__dartLineSplitter';
  }
  if (path.startsWith('dart:convert::HtmlEscapeMode::@constructors::')) {
    return '__dartHtmlEscapeMode';
  }
  if (path.startsWith('dart:convert::HtmlEscape::@constructors::')) {
    return '__dartHtmlEscape';
  }
  return null;
}

List<EsmExpression> _dartConvertConstructorArguments(
  String path,
  k.Arguments arguments,
  EsmExpression Function(k.Expression argument) lower,
  EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
) {
  final positional = arguments.positional;
  if (path.startsWith('dart:convert::Utf8Codec::@constructors::') ||
      path.startsWith('dart:convert::Utf8Decoder::@constructors::')) {
    return [
      lowerNamedArgument(arguments, 'allowMalformed') ??
          (positional.isEmpty
              ? const EsmBooleanLiteral(false)
              : lower(positional.first)),
    ];
  }
  if (path.startsWith('dart:convert::AsciiCodec::@constructors::') ||
      path.startsWith('dart:convert::AsciiDecoder::@constructors::') ||
      path.startsWith('dart:convert::Latin1Codec::@constructors::') ||
      path.startsWith('dart:convert::Latin1Decoder::@constructors::')) {
    return [
      lowerNamedArgument(arguments, 'allowInvalid') ??
          (positional.isEmpty
              ? const EsmBooleanLiteral(false)
              : lower(positional.first)),
    ];
  }
  if (path.startsWith('dart:convert::JsonEncoder::@constructors::withIndent')) {
    return [
      positional.isEmpty ? const EsmNullLiteral() : lower(positional.first),
      lowerNamedArgument(arguments, 'toEncodable') ?? const EsmNullLiteral(),
    ];
  }
  if (path.startsWith('dart:convert::JsonEncoder::@constructors::')) {
    return [
      const EsmNullLiteral(),
      lowerNamedArgument(arguments, 'toEncodable') ??
          (positional.isEmpty
              ? const EsmNullLiteral()
              : lower(positional.first)),
    ];
  }
  if (path.startsWith('dart:convert::JsonDecoder::@constructors::')) {
    return [
      lowerNamedArgument(arguments, 'reviver') ??
          (positional.isEmpty
              ? const EsmNullLiteral()
              : lower(positional.first)),
    ];
  }
  if (path.startsWith('dart:convert::JsonUtf8Encoder::@constructors::')) {
    return [
      positional.isEmpty ? const EsmNullLiteral() : lower(positional.first),
      lowerNamedArgument(arguments, 'toEncodable') ?? const EsmNullLiteral(),
    ];
  }
  if (path.startsWith('dart:convert::Base64Encoder::@constructors::urlSafe') ||
      path.startsWith('dart:convert::Base64Codec::@constructors::urlSafe')) {
    return const [EsmBooleanLiteral(true)];
  }
  if (path.startsWith('dart:convert::HtmlEscapeMode::@constructors::')) {
    return [
      EsmObjectLiteral([
        EsmObjectLiteralProperty.static(
          key: 'escapeLtGt',
          value:
              lowerNamedArgument(arguments, 'escapeLtGt') ??
              const EsmBooleanLiteral(false),
        ),
        EsmObjectLiteralProperty.static(
          key: 'escapeQuot',
          value:
              lowerNamedArgument(arguments, 'escapeQuot') ??
              const EsmBooleanLiteral(false),
        ),
        EsmObjectLiteralProperty.static(
          key: 'escapeApos',
          value:
              lowerNamedArgument(arguments, 'escapeApos') ??
              const EsmBooleanLiteral(false),
        ),
        EsmObjectLiteralProperty.static(
          key: 'escapeSlash',
          value:
              lowerNamedArgument(arguments, 'escapeSlash') ??
              const EsmBooleanLiteral(false),
        ),
      ]),
    ];
  }
  return [for (final argument in positional) lower(argument)];
}
