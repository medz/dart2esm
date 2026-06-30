import 'package:kernel/kernel.dart' as k;

import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkInstanceInvocationEmitter {
  DartSdkInstanceInvocationEmitter({
    required this.helpers,
    this.namedArgument = _noNamedArgument,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String? Function(k.Arguments arguments, String name) namedArgument;

  String? emitInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    final namedArgumentsEmpty = arguments.named.isEmpty;
    return _emitCoreInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          arguments,
        ) ??
        _emitDurationOperatorInvocation(
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
        _emitComparableInstanceInvocation(
          target,
          name,
          receiver,
          positionalArgs,
          namedArgumentsEmpty,
        );
  }

  String? emitGet(k.Reference target, String name, String receiver) {
    final weakReferenceGet = _emitWeakReferenceGet(target, name, receiver);
    if (weakReferenceGet != null) {
      return weakReferenceGet;
    }
    final objectGet = _emitObjectGet(target, name, receiver);
    if (objectGet != null) {
      return objectGet;
    }
    final intGet = _emitIntGet(target, name, receiver);
    if (intGet != null) {
      return intGet;
    }
    final numberGet = _emitNumberGet(target, name, receiver);
    if (numberGet != null) {
      return numberGet;
    }
    return _emitBigIntGet(target, name, receiver);
  }

  String? _emitCoreInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isEmpty &&
        name == '[]' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'Expando', '[]')) {
      return '$receiver.get(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        name == '[]=' &&
        positionalArgs.length == 2 &&
        isDartCoreMember(target, 'Expando', '[]=')) {
      return '$receiver.set(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (name == 'attach' &&
        isDartCoreFinalizerMember(target, name) &&
        positionalArgs.length == 2 &&
        _hasOnlyNamedArguments(arguments, {'detach'})) {
      final detach = namedArgument(arguments, 'detach') ?? 'null';
      return '$receiver.attach(${positionalArgs[0]}, ${positionalArgs[1]}, { detach: $detach })';
    }
    if (name == 'detach' &&
        isDartCoreFinalizerMember(target, name) &&
        arguments.named.isEmpty &&
        positionalArgs.length == 1) {
      return '$receiver.detach(${positionalArgs.single})';
    }
    if (arguments.named.isEmpty &&
        positionalArgs.isEmpty &&
        name == 'toString' &&
        isDartCoreMember(target, 'Object', name)) {
      helpers.add('__dartObjectToString');
      return '__dartObjectToString($receiver)';
    }
    return null;
  }

  String? _emitWeakReferenceGet(
    k.Reference target,
    String name,
    String receiver,
  ) {
    if (name == 'target' && isDartCoreWeakReferenceMember(target, name)) {
      return '$receiver.target';
    }
    return null;
  }

  String? _emitObjectGet(k.Reference target, String name, String receiver) {
    if (!isDartCoreMember(target, 'Object', name)) {
      return null;
    }
    return switch (name) {
      'hashCode' => () {
        helpers.add('__dartObjectHash');
        return '__dartHashValue($receiver)';
      }(),
      'runtimeType' => () {
        helpers.add('__dartRuntimeType');
        helpers.add('__dartType');
        return '__dartRuntimeType($receiver)';
      }(),
      _ => null,
    };
  }

  String? _emitIntGet(k.Reference target, String name, String receiver) {
    if (!isDartCoreMember(target, 'int', name)) {
      return null;
    }
    return switch (name) {
      'isOdd' => '(Math.trunc($receiver) % 2 !== 0)',
      'isEven' => '(Math.trunc($receiver) % 2 === 0)',
      _ => null,
    };
  }

  String? _emitNumberGet(k.Reference target, String name, String receiver) {
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

  String? _emitBigIntGet(k.Reference target, String name, String receiver) {
    if (!isDartCoreMember(target, 'BigInt', name)) {
      return null;
    }
    return switch (name) {
      'isEven' => '($receiver % 2n === 0n)',
      'isOdd' => '($receiver % 2n !== 0n)',
      'isNegative' => '($receiver < 0n)',
      'sign' => '($receiver < 0n ? -1 : ($receiver > 0n ? 1 : 0))',
      'bitLength' => () {
        helpers.add('__dartBigIntBitLength');
        return '__dartBigIntBitLength($receiver)';
      }(),
      _ => null,
    };
  }

  bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
    return arguments.named.every((argument) => names.contains(argument.name));
  }

  String? _emitComparableInstanceInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    bool namedArgumentsEmpty,
  ) {
    if (namedArgumentsEmpty &&
        name == 'compareTo' &&
        positionalArgs.length == 1 &&
        isDartCoreMember(target, 'Comparable', name)) {
      helpers.add('__dartCompare');
      return '__dartCompare($receiver, ${positionalArgs.single})';
    }
    return null;
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

String? _noNamedArgument(k.Arguments arguments, String name) => null;
