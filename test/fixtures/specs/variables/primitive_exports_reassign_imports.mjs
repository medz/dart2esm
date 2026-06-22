import { a, b, c } from './primitive_exports.mjs';

export function assignFinalImport() {
  a = 2;
}

export function assignConstImport() {
  b = 3;
}

export function assignMutableImport() {
  c = 4;
}
