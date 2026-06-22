import 'dart:convert';
import 'dart:typed_data';

const _componentMagic = 0x90ABCDEF;
const _binaryFormatVersion = 130;
const _sdkHashLength = 10;

KernelHeader readKernelHeader(Uint8List bytes) {
  final reader = _KernelHeaderReader(bytes);
  final magic = reader.readUint32();
  if (magic != _componentMagic) {
    throw FormatException('Not a Kernel .dill file: wrong magic number.');
  }
  final version = reader.readUint32();
  if (version != _binaryFormatVersion) {
    throw FormatException(
      'Unsupported Kernel binary format $version; expected $_binaryFormatVersion.',
    );
  }
  final sdkHash = ascii.decode(reader.readBytes(_sdkHashLength));
  final problems = reader.readStringList();
  return KernelHeader(
    formatVersion: version,
    sdkHash: sdkHash,
    problemsAsJson: problems,
  );
}

final class KernelHeader {
  const KernelHeader({
    required this.formatVersion,
    required this.sdkHash,
    required this.problemsAsJson,
  });

  final int formatVersion;
  final String sdkHash;
  final List<String> problemsAsJson;
}

final class _KernelHeaderReader {
  _KernelHeaderReader(this._bytes);

  final Uint8List _bytes;
  int _offset = 0;

  int readUint32() {
    _checkAvailable(4);
    final value = ByteData.sublistView(
      _bytes,
      _offset,
      _offset + 4,
    ).getUint32(0);
    _offset += 4;
    return value;
  }

  int readUInt() {
    _checkAvailable(1);
    final byte = _bytes[_offset++];
    if ((byte & 0x80) == 0) {
      return byte;
    }
    if ((byte & 0xC0) == 0x80) {
      _checkAvailable(1);
      return ((byte & 0x3F) << 8) | _bytes[_offset++];
    }
    _checkAvailable(3);
    final value =
        ((byte & 0x3F) << 24) |
        (_bytes[_offset] << 16) |
        (_bytes[_offset + 1] << 8) |
        _bytes[_offset + 2];
    _offset += 3;
    return value;
  }

  Uint8List readBytes(int length) {
    _checkAvailable(length);
    final value = Uint8List.sublistView(_bytes, _offset, _offset + length);
    _offset += length;
    return value;
  }

  List<String> readStringList() {
    final length = readUInt();
    return [
      for (var index = 0; index < length; index++)
        utf8.decode(readBytes(readUInt())),
    ];
  }

  void _checkAvailable(int length) {
    if (_offset + length > _bytes.length) {
      throw FormatException('Unexpected end of Kernel binary.');
    }
  }
}
