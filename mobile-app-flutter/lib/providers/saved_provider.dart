import 'package:flutter/foundation.dart';

import '../data/models/listing_item.dart';
import '../data/repositories/listing_repository.dart';

/// Saved items state for the Saved tab.
class SavedProvider extends ChangeNotifier {
  SavedProvider(this._repository);

  final ListingRepository _repository;

  List<ListingItem> _items = [];
  bool _loading = false;

  List<ListingItem> get items => _items;
  bool get loading => _loading;

  Future<void> load() async {
    _loading = true;
    notifyListeners();
    try {
      _items = await _repository.fetchSaved();
    } catch (_) {
      _items = [];
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> toggle(ListingItem item) async {
    final itemType = item.isVehicle ? 'vehicle' : 'property';
    if (_items.any((i) => i.id == item.id)) {
      await _repository.unsave(itemType: itemType, itemId: item.id);
      _items.removeWhere((i) => i.id == item.id);
    } else {
      await _repository.save(itemType: itemType, itemId: item.id);
      _items.insert(0, item);
    }
    notifyListeners();
  }
}
