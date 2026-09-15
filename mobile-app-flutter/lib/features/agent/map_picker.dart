import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/theme/app_colors.dart';




class MapPickerScreen extends StatefulWidget {
  const MapPickerScreen({super.key, this.initialPosition, this.initialQuery});

  final LatLng? initialPosition;
  final String? initialQuery;

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  static final _addisAbaba = LatLng(9.0375, 38.7612);
  late final MapController _mapController;
  late final TextEditingController _search;

  LatLng? _selected;
  List<Map<String, dynamic>> _results = [];
  bool _searching = false;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _search = TextEditingController(text: widget.initialQuery ?? '');
    _selected = widget.initialPosition;
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _runSearch() async {
    final q = _search.text.trim();
    if (q.isEmpty) return;
    setState(() => _searching = true);
    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeQueryComponent("$q Ethiopia")}&limit=5',
      );
      final res = await http.get(url, headers: {'User-Agent': 'DawoLife/1.0'});
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        if (!mounted) return;
        setState(() => _results = list.cast<Map<String, dynamic>>());
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  void _selectResult(Map<String, dynamic> r) {
    final lat = double.tryParse('${r['lat']}');
    final lng = double.tryParse('${r['lon']}');
    if (lat == null || lng == null) return;
    final point = LatLng(lat, lng);
    _mapController.move(point, 15);
    setState(() {
      _selected = point;
      _search.text = '${r['display_name'] ?? ''}';
      _results = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pick Location')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _search,
                    decoration: InputDecoration(
                      isDense: true,
                      hintText: 'Search address in Ethiopia...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      suffixIcon: _searching
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : IconButton(
                              icon: const Icon(Icons.search, size: 20),
                              onPressed: _runSearch,
                            ),
                    ),
                    onSubmitted: (_) => _runSearch(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: () {
                    if (_selected != null) Navigator.of(context).pop(_selected);
                  },
                  child: const Text('Confirm'),
                ),
              ],
            ),
          ),
          if (_results.isNotEmpty)
            Material(
              elevation: 2,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 200),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _results.length,
                  itemBuilder: (context, i) {
                    final r = _results[i];
                    return ListTile(
                      leading: const Icon(Icons.location_on_outlined, size: 20),
                      title: Text('${r['display_name'] ?? ''}', style: const TextStyle(fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                      onTap: () => _selectResult(r),
                    );
                  },
                ),
              ),
            ),
          Expanded(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _selected ?? widget.initialPosition ?? _addisAbaba,
                initialZoom: 13,
                onTap: (_, point) => setState(() => _selected = point),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  subdomains: const ['a', 'b', 'c'],
                ),
                if (_selected != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _selected!,
                        width: 40,
                        height: 40,
                        child: const Icon(Icons.location_pin, color: AppColors.primary, size: 40),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          if (_selected != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: AppColors.muted,
              child: Text(
                'Lat: ${_selected!.latitude.toStringAsFixed(5)}, Lng: ${_selected!.longitude.toStringAsFixed(5)}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
        ],
      ),
    );
  }
}



class MapPickerField extends StatefulWidget {
  const MapPickerField({
    super.key,
    required this.latController,
    required this.lngController,
  });

  final TextEditingController latController;
  final TextEditingController lngController;

  @override
  State<MapPickerField> createState() => _MapPickerFieldState();
}

class _MapPickerFieldState extends State<MapPickerField> {
  bool _locating = false;

  Future<void> _useCurrentLocation() async {
    setState(() => _locating = true);
    try {
      var status = await Permission.location.request();
      if (!status.isGranted) {
        status = await Permission.locationWhenInUse.request();
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      if (!mounted) return;
      widget.latController.text = position.latitude.toStringAsFixed(5);
      widget.lngController.text = position.longitude.toStringAsFixed(5);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not determine your location. Check location permissions.')),
      );
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: widget.latController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(hintText: 'Latitude', isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextFormField(
                controller: widget.lngController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(hintText: 'Longitude', isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              icon: const Icon(Icons.map_outlined, size: 20),
              onPressed: () async {
                final initial = LatLng(
                  double.tryParse(widget.latController.text) ?? 9.0375,
                  double.tryParse(widget.lngController.text) ?? 38.7612,
                );
                final result = await Navigator.of(context).push<LatLng>(
                  MaterialPageRoute(builder: (_) => MapPickerScreen(initialPosition: initial)),
                );
                if (result != null && mounted) {
                  widget.latController.text = result.latitude.toStringAsFixed(5);
                  widget.lngController.text = result.longitude.toStringAsFixed(5);
                }
              },
            ),
          ],
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _locating ? null : _useCurrentLocation,
          icon: _locating
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.my_location, size: 18),
          label: Text(_locating ? 'Locating…' : 'Use my current location'),
        ),
      ],
    );
  }
}