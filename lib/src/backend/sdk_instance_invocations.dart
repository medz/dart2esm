import 'package:kernel/kernel.dart' as k;

import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkInstanceInvocationEmitter {
  DartSdkInstanceInvocationEmitter({required this.helpers});

  final EsmRuntimeHelperUseSet helpers;

  String? emitInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    final namedArgumentsEmpty = arguments.named.isEmpty;
    return _emitDurationOperatorInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          namedArgumentsEmpty,
        ) ??
        _emitBigIntInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          namedArgumentsEmpty,
        ) ??
        _emitNumberInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          namedArgumentsEmpty,
        ) ??
        _emitByteDataInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          namedArgumentsEmpty,
        );
  }

  String? emitGet(k.Reference target, String name, String receiver) {
    if (!isDartCoreNumberMember(target, name)) {
      return null;
    }
    final value = 'Number($receiver)';
    return switch (name) {
      'sign' =>
        '(Number.isNaN($value) ? Number.NaN : ($value < 0 ? -1 : ($value > 0 ? 1 : $value)))',
      'isNaN' => 'Number.isNaN($value)',
      'isInfinite' => '($value === Infinity || $value === -Infinity)',
      'isFinite' => 'Number.isFinite($value)',
      'isNegative' => '($value < 0 || Object.is($value, -0))',
      _ => null,
    };
  }

  String? _emitNumberInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    bool namedArgumentsEmpty,
  ) {
    if (!namedArgumentsEmpty || !isDartCoreNumberMember(target, name)) {
      return null;
    }
    if (positionalArgs.isEmpty) {
      return switch (name) {
        'abs' => 'Math.abs($receiver)',
        'round' => () {
          helpers.add('__dartRoundToInt');
          return '__dartRoundToInt($receiver)';
        }(),
        'floor' => 'Math.floor($receiver)',
        'ceil' => 'Math.ceil($receiver)',
        'truncate' || 'toInt' => 'Math.trunc($receiver)',
        'roundToDouble' => () {
          helpers.add('__dartDouble');
          helpers.add('__dartRoundToInt');
          return '__dartDouble(__dartRoundToInt($receiver))';
        }(),
        'floorToDouble' => () {
          helpers.add('__dartDouble');
          return '__dartDouble(Math.floor($receiver))';
        }(),
        'ceilToDouble' => () {
          helpers.add('__dartDouble');
          return '__dartDouble(Math.ceil($receiver))';
        }(),
        'truncateToDouble' => () {
          helpers.add('__dartDouble');
          return '__dartDouble(Math.trunc($receiver))';
        }(),
        'toDouble' => () {
          helpers.add('__dartDouble');
          return '__dartDouble($receiver)';
        }(),
        'toString' => () {
          helpers.add('__dartStr');
          return '__dartStr($receiver)';
        }(),
        _ => null,
      };
    }
    if (name == 'clamp' && positionalArgs.length == 2) {
      helpers.add('__dartNumClamp');
      return '__dartNumClamp($receiver, ${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (isDartCoreMember(target, 'int', name)) {
      if (name == 'modPow' && positionalArgs.length == 2) {
        helpers.add('__dartCoreError');
        helpers.add('__dartIntModPow');
        return '__dartIntModPow($receiver, ${positionalArgs[0]}, ${positionalArgs[1]})';
      }
      if (positionalArgs.length == 1) {
        final argument = positionalArgs.single;
        return switch (name) {
          'gcd' => () {
            helpers.add('__dartIntGcd');
            return '__dartIntGcd($receiver, $argument)';
          }(),
          'modInverse' => () {
            helpers.add('__dartCoreError');
            helpers.add('__dartIntModInverse');
            return '__dartIntModInverse($receiver, $argument)';
          }(),
          'toRadixString' => () {
            helpers.add('__dartCoreError');
            helpers.add('__dartIntToRadixString');
            return '__dartIntToRadixString($receiver, $argument)';
          }(),
          _ => null,
        };
      }
    }
    if (positionalArgs.length != 1) {
      return null;
    }
    final argument = positionalArgs.single;
    return switch (name) {
      'remainder' => '($receiver % $argument)',
      'compareTo' =>
        '($receiver < $argument ? -1 : ($receiver > $argument ? 1 : 0))',
      'toStringAsFixed' => 'Number($receiver).toFixed($argument)',
      'toStringAsExponential' => 'Number($receiver).toExponential($argument)',
      'toStringAsPrecision' => 'Number($receiver).toPrecision($argument)',
      _ => null,
    };
  }

  String? _emitByteDataInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    bool namedArgumentsEmpty,
  ) {
    if (!namedArgumentsEmpty ||
        !isDartTypedDataClassMember(target, 'ByteData', name)) {
      return null;
    }
    if ((name == 'getInt64' || name == 'getUint64') &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      final method = name == 'getInt64' ? 'getBigInt64' : 'getBigUint64';
      final endian = positionalArgs.length == 2 ? positionalArgs[1] : 'false';
      return 'Number($receiver.$method(${positionalArgs[0]}, $endian))';
    }
    if ((name == 'setInt64' || name == 'setUint64') &&
        positionalArgs.length >= 2 &&
        positionalArgs.length <= 3) {
      final method = name == 'setInt64' ? 'setBigInt64' : 'setBigUint64';
      final endian = positionalArgs.length == 3 ? positionalArgs[2] : 'false';
      return '($receiver.$method(${positionalArgs[0]}, BigInt(${positionalArgs[1]}), $endian), null)';
    }
    return null;
  }

  String? _emitBigIntInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    bool namedArgumentsEmpty,
  ) {
    if (!namedArgumentsEmpty || !isDartCoreMember(target, 'BigInt', name)) {
      return null;
    }
    if (positionalArgs.isEmpty) {
      return switch (name) {
        'toInt' || 'toDouble' => 'Number($receiver)',
        'abs' => '($receiver < 0n ? -$receiver : $receiver)',
        'unary-' => '(-$receiver)',
        '~' => '(~$receiver)',
        _ => null,
      };
    }
    if (positionalArgs.length != 1) {
      return null;
    }
    final right = positionalArgs.single;
    return switch (name) {
      '~/' => '($receiver / $right)',
      'toRadixString' => '$receiver.toString($right)',
      'remainder' => '($receiver % $right)',
      _ => null,
    };
  }

  String? _emitDurationOperatorInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    bool namedArgumentsEmpty,
  ) {
    if (!namedArgumentsEmpty || !isDartCoreMember(target, 'Duration', name)) {
      return null;
    }
    if (name == 'unary-' && positionalArgs.isEmpty) {
      helpers.add('__dartDuration');
      return '__dartDuration({ microseconds: -$receiver.inMicroseconds })';
    }
    if (positionalArgs.length != 1) {
      return null;
    }
    final right = positionalArgs.single;
    return switch (name) {
      '+' => () {
        helpers.add('__dartDuration');
        return '__dartDuration({ microseconds: $receiver.inMicroseconds + $right.inMicroseconds })';
      }(),
      '-' => () {
        helpers.add('__dartDuration');
        return '__dartDuration({ microseconds: $receiver.inMicroseconds - $right.inMicroseconds })';
      }(),
      '*' => () {
        helpers.add('__dartDuration');
        helpers.add('__dartRoundToInt');
        return '__dartDuration({ microseconds: __dartRoundToInt($receiver.inMicroseconds * $right) })';
      }(),
      '~/' => () {
        helpers.add('__dartDuration');
        return '__dartDuration({ microseconds: Math.trunc($receiver.inMicroseconds / $right) })';
      }(),
      '<' => '($receiver.inMicroseconds < $right.inMicroseconds)',
      '<=' => '($receiver.inMicroseconds <= $right.inMicroseconds)',
      '>' => '($receiver.inMicroseconds > $right.inMicroseconds)',
      '>=' => '($receiver.inMicroseconds >= $right.inMicroseconds)',
      _ => null,
    };
  }
}
