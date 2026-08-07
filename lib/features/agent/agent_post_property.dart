import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/listing_options.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/property.dart';
import '../../data/repositories/agent_repository.dart';
import '../../providers/language_provider.dart';
import 'map_picker.dart';
import 'post_form_widgets.dart';

const _propertyTypes = ['House', 'Apartment', 'Land', 'Commercial', 'Villa', 'Townhouse', 'Office', 'Studio', 'Penthouse'];
const _listingTypes = ['For Sale', 'For Rent'];
const _priceTypes = ['Fixed Price', 'Negotiable', 'per month'];
const _posterTypes = ['Agent', 'Owner'];
const _ownerTypes = ['Farmer Owner', 'Saving Owner', 'Private Owner', 'Government', 'Company'];
const _conditions = ['Finished', 'Semi-Finished', 'Under Construction', 'Unfinished', 'Shell'];

/// Post/edit property mirroring app/agent/post/page.tsx.
class AgentPostPropertyScreen extends StatefulWidget {
  const AgentPostPropertyScreen({super.key, this.edit});

  final Property? edit;

  @override
  State<AgentPostPropertyScreen> createState() => _AgentPostPropertyScreenState();
}

class _AgentPostPropertyScreenState extends State<AgentPostPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _customFeature = TextEditingController();

  late final TextEditingController _title;
  late final TextEditingController _price;
  late final TextEditingController _area;
  late final TextEditingController _bedrooms;
  late final TextEditingController _bathrooms;
  late final TextEditingController _legalizedYear;
  late final TextEditingController _description;
  late final TextEditingController _city;
  late final TextEditingController _subCity;
  late final TextEditingController _woreda;
  late final TextEditingController _latitude;
  late final TextEditingController _longitude;
  late final TextEditingController _videoUrl;
  late final TextEditingController _name;
  late final TextEditingController _phone;

  String _posterType = 'Agent';
  String _ownerType = 'Farmer Owner';
  String _propertyType = 'House';
  String _listingType = 'For Sale';
  String _priceType = 'Fixed Price';
  String _condition = 'Finished';
  String _region = '';
  List<String> _features = [];
  List<String> _images = [];
  String? _locationDocument;
  bool _uploading = false;
  bool _uploadingDoc = false;
  bool _submitting = false;
  String? _error;

  bool get _isEdit => widget.edit != null;

  @override
  void initState() {
    super.initState();
    final p = widget.edit;
    _title = TextEditingController(text: p?.title ?? '');
    _price = TextEditingController(text: p?.price != null ? '${p!.price}' : '');
    _area = TextEditingController(text: p?.area != null ? '${p!.area}' : '');
    _bedrooms = TextEditingController(text: p?.bedrooms != null ? '${p!.bedrooms}' : '');
    _bathrooms = TextEditingController(text: p?.bathrooms != null ? '${p!.bathrooms}' : '');
    _legalizedYear = TextEditingController(text: p?.legalizedYear != null ? '${p!.legalizedYear}' : '');
    _description = TextEditingController(text: p?.description ?? '');
    _city = TextEditingController(text: p?.city ?? '');
    _subCity = TextEditingController(text: p?.subCity ?? '');
    _woreda = TextEditingController(text: p?.woreda ?? '');
    _latitude = TextEditingController(text: p?.latitude != null ? '${p!.latitude}' : '');
    _longitude = TextEditingController(text: p?.longitude != null ? '${p!.longitude}' : '');
    _videoUrl = TextEditingController(text: p?.videoUrl ?? '');
    _name = TextEditingController();
    _phone = TextEditingController();
    if (p != null) {
      _posterType = p.posterType ?? _posterType;
      _ownerType = p.ownerType ?? _ownerType;
      _propertyType = p.type.isNotEmpty ? p.type : _propertyType;
      _listingType = p.listingType.isNotEmpty ? p.listingType : _listingType;
      _priceType = p.priceType ?? _priceType;
      _condition = p.condition ?? _condition;
      _region = p.region ?? '';
      _features = p.features;
      _images = p.images;
    }
  }

  @override
  void dispose() {
    for (final c in [
      _title, _price, _area, _bedrooms, _bathrooms, _legalizedYear, _description,
      _city, _subCity, _woreda, _latitude, _longitude, _videoUrl, _name, _phone,
      _customFeature,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickImage() async {
    setState(() => _uploading = true);
    try {
      final url = await pickAndUploadImage(context.read<ApiClient>(), endpoint: '/api/agent/upload', field: 'image');
      if (!mounted) return;
      setState(() => _images = [..._images, url]);
    } on ImagePickCancelled {
      // user backed out of the picker
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: ${e.message}')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _uploadDocument() async {
    setState(() => _uploadingDoc = true);
    try {
      final url = await pickAndUploadDocument(context.read<ApiClient>());
      if (!mounted) return;
      setState(() => _locationDocument = url);
    } on ImagePickCancelled {
      // user backed out of the picker
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Document upload failed: ${e.message}')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Document upload failed: $e')));
    } finally {
      if (mounted) setState(() => _uploadingDoc = false);
    }
  }

  void _addCustomFeature() {
    final text = _customFeature.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _features = [..._features, text];
      _customFeature.clear();
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_images.length < 3) {
      setState(() => _error = 'At least 3 photos are required to list a property.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    final payload = <String, dynamic>{
      'title': _title.text.trim(),
      'posterType': _posterType,
      'ownerType': _ownerType,
      'type': _propertyType,
      'listingType': _listingType,
      'price': num.tryParse(_price.text.trim()) ?? 0,
      'priceType': _priceType,
      'area': num.tryParse(_area.text.trim()),
      'bedrooms': int.tryParse(_bedrooms.text.trim()),
      'bathrooms': int.tryParse(_bathrooms.text.trim()),
      'condition': _condition,
      'legalizedYear': int.tryParse(_legalizedYear.text.trim()),
      'description': _description.text.trim(),
      'features': _features,
      'region': _region,
      'city': _city.text.trim(),
      'subCity': _subCity.text.trim(),
      'woreda': _woreda.text.trim(),
      'images': _images,
      'videoUrl': _videoUrl.text.trim().isEmpty ? null : _videoUrl.text.trim(),
      'locationDocument': _locationDocument,
      'name': _name.text.trim(),
      'phone': _phone.text.trim(),
    };
    final lat = num.tryParse(_latitude.text.trim());
    final lng = num.tryParse(_longitude.text.trim());
    if (lat != null) payload['latitude'] = lat;
    if (lng != null) payload['longitude'] = lng;
    try {
      final repo = context.read<AgentRepository>();
      if (_isEdit) {
        await repo.updateProperty(widget.edit!.id, payload);
      } else {
        await repo.createProperty(payload);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property submitted! It is now pending review.')),
      );
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _dropdown(String label, String value, List<String> options, ValueChanged<String> onChanged) {
    final tv = context.read<LanguageProvider>().tv;
    return Field(
      label: label,
      child: DropdownButtonFormField<String>(
        initialValue: value.isEmpty ? null : value,
        decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
        hint: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground)),
        items: options.map((o) => DropdownMenuItem(
          value: o,
          child: Text(tv(o), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.normal, color: AppColors.foreground), overflow: TextOverflow.ellipsis),
        )).toList(),
        onChanged: (v) => onChanged(v ?? value),
      ),
    );
  }

  Widget _featureChips(String title, List<String> options) {
    final tv = context.read<LanguageProvider>().tv;
    final allOptions = [...options, ..._features.where((f) => !options.contains(f))];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.foreground)),
        const SizedBox(height: 8),
        if (allOptions.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: allOptions.map((a) {
              final selected = _features.contains(a);
              return FilterChip(
                label: Text(tv(a), style: const TextStyle(fontSize: 12)),
                selected: selected,
                onSelected: (on) => setState(() {
                  _features = on ? [..._features, a] : _features.where((e) => e != a).toList();
                }),
              );
            }).toList(),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.read<LanguageProvider>();
    final t = l10n.t;
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Edit Property' : t('post_property'))),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            FormSection(
              title: t('property_details'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _dropdown(t('listing_by'), _posterType, _posterTypes, (v) => setState(() => _posterType = v)),
                  _dropdown(t('owner_type'), _ownerType, _ownerTypes, (v) => setState(() => _ownerType = v)),
                  Field(
                    label: t('property_title'),
                    child: TextFormField(
                      controller: _title,
                      decoration: const InputDecoration(hintText: 'e.g. Modern 3 Bedroom Villa'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                    ),
                  ),
                  _dropdown(t('property_type'), _propertyType, _propertyTypes, (v) => setState(() => _propertyType = v)),
                  _dropdown(t('listing_type'), _listingType, _listingTypes, (v) => setState(() => _listingType = v)),
                  Field(
                    label: t('price_etb'),
                    child: TextFormField(
                      controller: _price,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(hintText: 'e.g. 12000000'),
                      validator: (v) {
                        final n = num.tryParse((v ?? '').trim());
                        if (n == null || n <= 0) return 'Enter a valid price';
                        return null;
                      },
                    ),
                  ),
                  _dropdown(t('price_type'), _priceType, _priceTypes, (v) => setState(() => _priceType = v)),
                  Row(
                    children: [
                      Expanded(child: Field(label: t('area'), child: TextFormField(controller: _area, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'e.g. 250')))),
                      const SizedBox(width: 10),
                      Expanded(child: Field(label: t('bedrooms'), child: TextFormField(controller: _bedrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'e.g. 3')))),
                      const SizedBox(width: 10),
                      Expanded(child: Field(label: t('bathrooms'), child: TextFormField(controller: _bathrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'e.g. 2')))),
                    ],
                  ),
                  _dropdown(t('condition'), _condition, _conditions, (v) => setState(() => _condition = v)),
                  Field(
                    label: t('legalized_year'),
                    child: TextFormField(
                      controller: _legalizedYear,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(hintText: 'e.g. 2015'),
                    ),
                  ),
                ],
              ),
            ),
            FormSection(
              title: t('property_location'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _dropdown(t('region'), _region, ethiopianRegions, (v) => setState(() => _region = v)),
                  Field(
                    label: t('city'),
                    child: TextFormField(
                      controller: _city,
                      decoration: const InputDecoration(hintText: 'e.g. Addis Ababa'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(child: Field(label: t('sub_city'), child: TextFormField(controller: _subCity, decoration: const InputDecoration(hintText: 'e.g. Bole')))),
                      const SizedBox(width: 10),
                      Expanded(child: Field(label: t('woreda'), child: TextFormField(controller: _woreda, decoration: const InputDecoration(hintText: 'e.g. 03')))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('Location coordinates (optional)', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.foreground)),
                  const SizedBox(height: 6),
                  MapPickerField(latController: _latitude, lngController: _longitude),
                ],
              ),
            ),
            FormSection(
              title: t('features_amenities'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _featureChips('Amenities', propertyAmenities),
                  const SizedBox(height: 12),
                  _featureChips('Safety', houseSafetyFeatures),
                  const SizedBox(height: 12),
                  _featureChips('Interior', houseInteriorFeatures),
                  const SizedBox(height: 12),
                  _featureChips('Exterior', houseExteriorFeatures),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _customFeature,
                          decoration: const InputDecoration(hintText: 'Add custom feature', isDense: true),
                          onFieldSubmitted: (_) => _addCustomFeature(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: _addCustomFeature,
                        icon: const Icon(Icons.add, size: 20),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            FormSection(
              title: t('photos_media_title'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ImageGridPicker(
                    images: _images,
                    onChanged: (list) => setState(() => _images = list),
                    onPick: _pickImage,
                    uploading: _uploading,
                    hint: 'Upload at least 3 clear photos',
                  ),
                  const SizedBox(height: 12),
                  Field(
                    label: t('video_url'),
                    child: TextFormField(
                      controller: _videoUrl,
                      decoration: const InputDecoration(hintText: 'https://youtube.com/watch?v=... (optional)'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Location document',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.foreground),
                  ),
                  const SizedBox(height: 8),
                  if (_locationDocument == null)
                    OutlinedButton.icon(
                      onPressed: _uploadingDoc ? null : _uploadDocument,
                      icon: _uploadingDoc
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.upload_file_outlined, size: 18),
                      label: Text(_uploadingDoc ? t('uploading_document') : t('click_upload_document')),
                    )
                  else
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      leading: const Icon(Icons.check_circle_outline, color: Colors.green),
                      title: Text(t('upload_success'), style: const TextStyle(fontSize: 13)),
                      trailing: IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () => setState(() => _locationDocument = null),
                      ),
                    ),
                ],
              ),
            ),
            FormSection(
              title: t('contact_info_title'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Field(
                    label: t('your_name'),
                    child: TextFormField(
                      controller: _name,
                      decoration: const InputDecoration(hintText: 'Your name'),
                    ),
                  ),
                  Field(
                    label: t('phone_number_label'),
                    child: TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(hintText: '+251 911 000 000'),
                    ),
                  ),
                ],
              ),
            ),
            FormSection(
              title: t('description'),
              child: TextFormField(
                controller: _description,
                maxLines: 5,
                decoration: const InputDecoration(hintText: 'Describe the property...'),
              ),
            ),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: AppColors.destructive, fontSize: 13)),
              const SizedBox(height: 12),
            ],
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send, size: 18),
              label: Text(_submitting ? t('submitting') : (_isEdit ? 'Update Property' : t('submit_property'))),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}