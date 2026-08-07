import 'package:flutter/foundation.dart';

import '../data/models/listing_item.dart';
import '../data/repositories/listing_repository.dart';

/// Home listings state, mirroring mobile-home.tsx.
class HomeProvider extends ChangeNotifier {
  HomeProvider(this._repository);

  final ListingRepository _repository;

  List<ListingItem> _houseItems = [];
  List<ListingItem> _vehicleItems = [];
  String _query = '';
  String _category = '';
  bool _loading = true;
  bool _failed = false;

  List<ListingItem> get houseItems => _houseItems;
  List<ListingItem> get vehicleItems => _vehicleItems;
  String get query => _query;
  String get category => _category;
  bool get loading => _loading;
  bool get failed => _failed;

  List<ListingItem> get visibleHouseItems =>
      _houseItems.where((i) => i.matches(query: _query, category: _category)).toList();

  List<ListingItem> get visibleVehicleItems {
    if (_category.isNotEmpty && _category != 'Vehicle') return const [];
    return _vehicleItems.where((i) => i.matches(query: _query)).toList();
  }

  void setQuery(String value) {
    if (_query == value) return;
    _query = value;
    notifyListeners();
  }

  void setCategory(String value) {
    if (_category == value) return;
    _category = value;
    notifyListeners();
  }

  Future<void> load() async {
    _loading = true;
    _failed = false;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.fetchProperties(),
        _repository.fetchVehicles(),
      ]);
      if (results[0].isNotEmpty) _houseItems = results[0];
      if (results[1].isNotEmpty) _vehicleItems = results[1];
    } catch (e, st) {
      // Keep existing items on transient failure (matches web behavior), but
      // surface the cause so connectivity/backend issues are diagnosable.
      debugPrint('HomeProvider.load failed: $e\n$st');
      _failed = true;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() => load();
}
