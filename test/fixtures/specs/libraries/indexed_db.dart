// ignore_for_file: deprecated_member_use

import 'dart:html';
import 'dart:indexed_db' as idb;

Future<void> main() async {
  final supported = idb.IdbFactory.supported;
  final factory = window.indexedDB!;
  final db = await factory.open(
    'dart2esm',
    version: 1,
    onUpgradeNeeded: (event) {
      final request = (event as dynamic).target;
      request.result.createObjectStore('items');
    },
  );
  final transaction = db.transaction('items', 'readwrite');
  final store = transaction.objectStore('items');
  await store.put('ok', 'key');
  final value = await store.getObject('key');
  db.close();
  await factory.deleteDatabase('dart2esm');
  print('indexedDB $supported $value ${db.name}');
}
