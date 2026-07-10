// Copyright (c) 2016, the Dart project authors. Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

library;

import 'dart:typed_data';

import 'ast.dart';
import 'binary/ast_from_binary.dart';

export 'ast.dart';

Component loadComponentFromBytes(Uint8List bytes, [Component? component]) {
  component ??= Component();
  BinaryBuilder(bytes).readComponent(component);
  return component;
}
