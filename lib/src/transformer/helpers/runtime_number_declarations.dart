part of 'runtime_helpers.dart';

extension _Numberhelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _numberHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.bigIntBitLength => EsmRawModuleItem('''
function __dartBigIntBitLength(value) {
  if (value === 0n || value === -1n) return 0;
  const magnitude = value < 0n ? -value - 1n : value;
  return magnitude.toString(2).length;
}
'''),
      EsmRuntimeHelper.bigIntParse => EsmRawModuleItem(r'''
function __dartBigIntParse(source, radix = null, tryParse = false) {
  try {
    const text = String(source).trim();
    const sign = /^[+-]/.test(text) ? text[0] : "";
    let digits = sign === "" ? text : text.slice(1);
    let base = radix == null ? null : Number(radix);
    if (base == null && /^0x[0-9a-f]+$/i.test(digits)) { base = 16; digits = digits.slice(2); }
    base ??= 10;
    if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError("Radix out of range");
    if (digits.length === 0) throw new Error("Invalid BigInt literal");
    let value = 0n;
    const bigBase = BigInt(base);
    for (const char of digits.toLowerCase()) {
      const code = char.charCodeAt(0);
      const digit = code >= 48 && code <= 57 ? code - 48 : code >= 97 && code <= 122 ? code - 87 : -1;
      if (digit < 0 || digit >= base) throw new Error("Invalid BigInt literal");
      value = value * bigBase + BigInt(digit);
    }
    return sign === "-" ? -value : value;
  } catch (error) {
    if (tryParse) return null;
    throw error;
  }
}
'''),
      EsmRuntimeHelper.doubleParse => EsmRawModuleItem(r'''
function __dartDoubleTryParse(source) {
  const text = String(source).trim();
  if (text.length === 0) return null;
  if (/^[+-]?NaN$/i.test(text)) return NaN;
  const value = Number(text);
  return Number.isNaN(value) ? null : value;
}
function __dartDoubleParse(source) {
  const value = __dartDoubleTryParse(source);
  if (value === null) {
    const error = new Error("Invalid double literal");
    error.name = "FormatException";
    throw error;
  }
  return value;
}
function __dartNumTryParse(source) {
  return __dartDoubleTryParse(source);
}
function __dartNumParse(source) {
  const value = __dartNumTryParse(source);
  if (value === null) {
    const error = new Error("Invalid number literal");
    error.name = "FormatException";
    throw error;
  }
  return value;
}
'''),
      EsmRuntimeHelper.doubleValue => EsmRawModuleItem('''
function __dartDoubleValue(value) {
  const number = Number(value);
  return Object.freeze({
    __dartType: "double",
    valueOf() { return number; },
    toString() {
      if (Number.isNaN(number)) return "NaN";
      if (number === Infinity) return "Infinity";
      if (number === -Infinity) return "-Infinity";
      if (Object.is(number, -0)) return "-0.0";
      return Number.isInteger(number) ? number.toString() + ".0" : number.toString();
    },
  });
}
'''),
      EsmRuntimeHelper.intGcd => EsmRawModuleItem('''
function __dartIntGcd(left, right) {
  let a = Math.abs(Math.trunc(Number(left)));
  let b = Math.abs(Math.trunc(Number(right)));
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a;
}
'''),
      EsmRuntimeHelper.intShift => EsmRawModuleItem('''
function __dartShr(left, right) {
  return Math.floor(Number(left) / (2 ** Number(right)));
}
'''),
      EsmRuntimeHelper.intModular => EsmRawModuleItem('''
function __dartIntModInverse(value, modulus) {
  let a = ((Math.trunc(Number(value)) % Math.trunc(Number(modulus))) + Math.trunc(Number(modulus))) % Math.trunc(Number(modulus));
  let m = Math.trunc(Number(modulus));
  if (m <= 0) throw __dartCoreError("RangeError", "Modulus must be positive");
  let x0 = 0;
  let x1 = 1;
  let b = m;
  while (a > 1 && b !== 0) {
    const q = Math.trunc(a / b);
    [a, b] = [b, a % b];
    [x0, x1] = [x1 - q * x0, x0];
  }
  if (a !== 1) {
    throw __dartCoreError("Exception", "Not coprime");
  }
  return ((x1 % m) + m) % m;
}
function __dartIntModPow(value, exponent, modulus) {
  let e = Math.trunc(Number(exponent));
  const m = Math.trunc(Number(modulus));
  if (e < 0) throw __dartCoreError("RangeError", "Exponent must be non-negative");
  if (m <= 0) throw __dartCoreError("RangeError", "Modulus must be positive");
  let base = ((Math.trunc(Number(value)) % m) + m) % m;
  let result = 1 % m;
  while (e > 0) {
    if ((e & 1) === 1) result = (result * base) % m;
    e = Math.floor(e / 2);
    base = (base * base) % m;
  }
  return result;
}
'''),
      EsmRuntimeHelper.intParse => EsmRawModuleItem(r'''
function __dartFormatException(message) {
  const error = new Error(String(message));
  error.name = "FormatException";
  return error;
}
function __dartIntTryParse(source, radix = null) {
  const text = String(source).trim();
  let base = radix == null ? null : Number(radix);
  if (base != null && (!Number.isInteger(base) || base < 2 || base > 36)) return null;
  if (base == null && /^[+-]?0x[0-9a-f]+$/i.test(text)) return Number.parseInt(text, 16);
  base ??= 10;
  const sign = /^[+-]/.test(text) ? text[0] : "";
  const digits = sign === "" ? text : text.slice(1);
  if (digits.length === 0) return null;
  for (const char of digits.toLowerCase()) {
    const code = char.charCodeAt(0);
    const value = code >= 48 && code <= 57 ? code - 48 : code >= 97 && code <= 122 ? code - 87 : -1;
    if (value < 0 || value >= base) return null;
  }
  return Number.parseInt(text, base);
}
function __dartIntParse(source, radix = null) {
  const value = __dartIntTryParse(source, radix);
  if (value == null) throw __dartFormatException("Invalid integer literal");
  return value;
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
