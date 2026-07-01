import 'package:dart2esm/src/foundation/kernel/kernel_references.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('describes references by canonical or node path', () {
    final library = k.Library(
      Uri.parse('dart:core'),
      fileUri: Uri.parse('dart:core/object.dart'),
    );
    final object = k.Class(
      name: 'Object',
      fileUri: Uri.parse('dart:core/object.dart'),
    );
    library.addClass(object);

    expect(kernelReferencePath(object.reference), contains('Object'));
    expect(isKernelCoreClassReference(object.reference, 'Object'), isTrue);
    expect(isDartSdkReference(object.reference), isTrue);
  });

  test('finds local classes from non-SDK supertypes only', () {
    final libraryUri = Uri.parse('package:sample/main.dart');
    final library = k.Library(libraryUri, fileUri: libraryUri);
    final local = k.Class(name: 'Local', fileUri: libraryUri);
    final other = k.Class(name: 'Other', fileUri: libraryUri);
    library.addClass(local);
    library.addClass(other);

    expect(
      localClassFromSupertype(k.Supertype(local, const []), {local}),
      same(local),
    );
    expect(
      localClassFromSupertype(k.Supertype(other, const []), {local}),
      isNull,
    );
  });
}
