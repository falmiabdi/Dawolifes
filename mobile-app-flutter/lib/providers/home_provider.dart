import 'package:flutter/foundation.dart';

import '../data/models/listing_item.dart';
import '../data/repositories/listing_repository.dart';

class HomeProvider extends ChangeNotifier {
  HomeProvider(this._repository);

  final ListingRepository _repository;

  int _page = 1;
  bool _hasMore = true;
  bool _loadingMore = false;
  List<ListingItem> _allHouseItems = [];
  List<ListingItem> _allVehicleItems = [];
  String _query = '';
  String _category = '';
  bool _loading = true;
  bool _failed = false;

  List<ListingItem> get houseItems => _allHouseItems;
  List<ListingItem> get vehicleItems => _allVehicleItems;
  String get query => _query;
  String get category => _category;
  bool get loading => _loading;
  bool get failed => _failed;
  bool get hasMore => _hasMore;
  bool get loadingMore => _loadingMore;

  List<ListingItem> get visibleHouseItems =>
      _allHouseItems.where((i) => i.matches(query: _query, category: _category)).toList();

  List<ListingItem> get visibleVehicleItems {
    if (_category.isNotEmpty && _category != 'Vehicle') return const [];
    return _allVehicleItems.where((i) => i.matches(query: _query)).toList();
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
    _page = 1;
    _hasMore = true;
    _allHouseItems = [];
    _allVehicleItems = [];
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.fetchProperties(page: 1, limit: 8),
        _repository.fetchVehicles(page: 1, limit: 8),
      ]);
      if (results[0].isNotEmpty) _allHouseItems = results[0];
      if (results[1].isNotEmpty) _allVehicleItems = results[1];
    } catch (e, st) {
      debugPrint('HomeProvider.load failed: $e\n$st');
      _failed = true;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (_loadingMore || !_hasMore) return;
    _loadingMore = true;
    _page++;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.fetchProperties(page: _page, limit: 8),
        _repository.fetchVehicles(page: _page, limit: 8),
      ]);
      if (results[0].isNotEmpty) _allHouseItems.addAll(results[0]);
      if (results[1].isNotEmpty) _allVehicleItems.addAll(results[1]);
      if (results[0].length < 8 && results[1].length < 8) {
        _hasMore = false;
      }
    } catch (e, st) {
      debugPrint('HomeProvider.loadMore failed: $e\n$st');
      _page--;
    } finally {
      _loadingMore = false;
      notifyListeners();
    }
  }

  Future<void> refresh() => load();
}
