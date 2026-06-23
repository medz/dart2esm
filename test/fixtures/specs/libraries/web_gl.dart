// ignore_for_file: deprecated_member_use

import 'dart:html';
import 'dart:web_gl' as gl;

Object? hide(Object? value) => value;

void main() {
  final canvas = CanvasElement(width: 16, height: 8);
  final generic = canvas.getContext('webgl');
  final context = canvas.getContext3d();
  context?.clearColor(0, 0, 0, 1);
  context?.clear(gl.WebGL.COLOR_BUFFER_BIT);
  final mask = gl.WebGL.COLOR_BUFFER_BIT | gl.WebGL.TRIANGLES;
  final hiddenContext = hide(context);
  final castContext = hiddenContext as gl.RenderingContext?;
  print(
    'webgl ${gl.RenderingContext.supported} $mask '
    '${canvas.width} ${canvas.height} ${generic != null} ${context != null} '
    '${hiddenContext is gl.RenderingContext} ${castContext != null}',
  );
}
