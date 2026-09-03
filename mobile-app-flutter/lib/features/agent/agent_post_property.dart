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

const _stepLabels = ['basic_info', 'location_details', 'media_upload', 'location_map2', 'review_submit'];

/// Post/edit property mirroring app/agent/post/page.tsx (5-step wizard with
/// a review & submit step).
class AgentPostPropertyScreen extends StatefulWidget {
  const AgentPostPropertyScreen({super.key, this.edit});

  final Property? edit;

  @override
  State<AgentPostPropertyScreen> createState() => _AgentPostPropertyScreenState();
}

class _AgentPostPropertyScreenState extends State<AgentPostPropertyScreen> {
  final _basicFormKey = GlobalKey<FormState>();
  final _locationFormKey = GlobalKey<FormState>();
  final _reviewFormKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();

  final _titleKey = GlobalKey<FormFieldState<String>>();
  final _priceKey = GlobalKey<FormFieldState<String>>();
  final _cityKey = GlobalKey<FormFieldState<String>>();
  final _nameKey = GlobalKey<FormFieldState<String>>();
  final _phoneKey = GlobalKey<FormFieldState<String>>();

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
  late final TextEditingController _kebele;
  late final TextEditingController _parcel;
  late final TextEditingController _block;
  late final TextEditingController _latitude;
  late final TextEditingController _longitude;
  late final TextEditingController _videoUrl;
  late final TextEditingController _name;
  late final TextEditingController _phone;

  late final TextEditingController _customFeature;
  late final TextEditingController _customSafety;
  late final TextEditingController _customInterior;
  late final TextEditingController _customExterior;

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
  int _step = 0;

  bool get _isEdit => widget.edit != null;
  bool get _isLastStep => _step == _stepLabels.length - 1;

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
    _kebele = TextEditingController(text: p?.kebele ?? '');
    _parcel = TextEditingController(text: p?.parcel ?? '');
    _block = TextEditingController(text: p?.block ?? '');
    _latitude = TextEditingController(text: p?.latitude != null ? '${p!.latitude}' : '');
    _longitude = TextEditingController(text: p?.longitude != null ? '${p!.longitude}' : '');
    _videoUrl = TextEditingController(text: p?.videoUrl ?? '');
    _name = TextEditingController();
    _phone = TextEditingController();
    _customFeature = TextEditingController();
    _customSafety = TextEditingController();
    _customInterior = TextEditingController();
    _customExterior = TextEditingController();
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
    _scrollController.dispose();
    for (final c in [
      _title, _price, _area, _bedrooms, _bathrooms, _legalizedYear, _description,
      _city, _subCity, _woreda, _kebele, _parcel, _block, _latitude, _longitude,
      _videoUrl, _name, _phone, _customFeature, _customSafety, _customInterior, _customExterior,
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
      final url = await pickAndUploadDocument(context, context.read<ApiClient>());
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

  void _addCustomFeature(TextEditingController ctrl) {
    final text = ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() {
      if (!_features.contains(text)) _features = [..._features, text];
      ctrl.clear();
    });
  }

  void _scrollToFirstError() {
    final keys = [_titleKey, _priceKey, _cityKey, _nameKey, _phoneKey];
    WidgetsBinding.instance.addPostFrameCallback((_) {
      for (final k in keys) {
        if (k.currentState?.hasError == true && k.currentContext != null) {
          Scrollable.ensureVisible(
            k.currentContext!,
            alignment: 0.1,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
          return;
        }
      }
    });
  }

  void _next() {
    final t = context.read<LanguageProvider>().t;
    switch (_step) {
      case 0:
        if (!(_basicFormKey.currentState?.validate() ?? false)) {
          _scrollToFirstError();
          return;
        }
        break;
      case 1:
        if (!(_locationFormKey.currentState?.validate() ?? false)) {
          _scrollToFirstError();
          return;
        }
        break;
      case 2:
        if (_images.length < 3) {
          setState(() => _error = 'Please upload at least 3 photos to continue.');
          return;
        }
        break;
      case 3:
        final lat = num.tryParse(_latitude.text.trim());
        final lng = num.tryParse(_longitude.text.trim());
        if (lat == null || lat == 0 || lng == null || lng == 0) {
          setState(() => _error = t('select_location_map'));
          return;
        }
        break;
    }
    setState(() {
      _error = null;
      _step = _step + 1;
    });
  }

  void _back() {
    setState(() {
      _error = null;
      _step = _step - 1;
    });
  }

  Future<void> _submit() async {
    if (_images.length < 3) {
      setState(() => _error = 'At least 3 photos are required to list a property.');
      return;
    }
    if (!(_reviewFormKey.currentState?.validate() ?? false)) {
      _scrollToFirstError();
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
      'kebele': _kebele.text.trim(),
      'parcel': _parcel.text.trim(),
      'block': _block.text.trim(),
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
    final hasMatch = options.contains(value);
    return Field(
      label: label,
      child: DropdownButtonFormField<String>(
        initialValue: hasMatch ? value : null,
        isExpanded: true,
        decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
        hint: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground), overflow: TextOverflow.ellipsis),
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

  Widget _featureSection(String title, List<String> options, TextEditingController customCtrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _featureChips(title, options),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: customCtrl,
                decoration: const InputDecoration(hintText: 'Add custom feature', isDense: true),
                onFieldSubmitted: (_) => _addCustomFeature(customCtrl),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: () => _addCustomFeature(customCtrl),
              icon: const Icon(Icons.add, size: 20),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBasicInfo() {
    final t = context.read<LanguageProvider>().t;
    return Form(
      key: _basicFormKey,
      child: FormSection(
        title: t('basic_info'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: _dropdown(t('listing_by'), _posterType, _posterTypes, (v) => setState(() => _posterType = v))),
                const SizedBox(width: 10),
                Expanded(child: _dropdown(t('owner_type'), _ownerType, _ownerTypes, (v) => setState(() => _ownerType = v))),
              ],
            ),
            Field(
              label: t('property_title'),
              child: TextFormField(
                key: _titleKey,
                controller: _title,
                decoration: const InputDecoration(hintText: 'e.g. Modern 3 Bedroom Villa'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
            ),
            Row(
              children: [
                Expanded(child: _dropdown(t('property_type'), _propertyType, _propertyTypes, (v) => setState(() => _propertyType = v))),
                const SizedBox(width: 10),
                Expanded(child: _dropdown(t('listing_type'), _listingType, _listingTypes, (v) => setState(() => _listingType = v))),
              ],
            ),
            Row(
              children: [
                Expanded(
                  child: Field(
                    label: t('price_etb'),
                    child: TextFormField(
                      key: _priceKey,
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
                ),
                const SizedBox(width: 10),
                Expanded(child: _dropdown(t('price_type'), _priceType, _priceTypes, (v) => setState(() => _priceType = v))),
              ],
            ),
            Row(
              children: [
                Expanded(child: Field(label: t('area'), child: TextFormField(controller: _area, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'e.g. 250')))),
                const SizedBox(width: 10),
                Expanded(child: Field(label: t('bedrooms'), child: TextFormField(controller: _bedrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'e.g. 3')))),
                const SizedBox(width: 10),
                Expanded(child: Field(label: t('bathrooms'), child: TextFormField(controller: _bathrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'e.g. 2')))),
              ],
            ),
            Row(
              children: [
                Expanded(child: _dropdown(t('condition'), _condition, _conditions, (v) => setState(() => _condition = v))),
                const SizedBox(width: 10),
                Expanded(
                  child: Field(
                    label: t('legalized_year'),
                    child: TextFormField(
                      controller: _legalizedYear,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(hintText: 'e.g. 2015'),
                    ),
                  ),
                ),
              ],
            ),
            Field(
              label: t('description'),
              child: TextFormField(
                controller: _description,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'Describe the property...'),
              ),
            ),
            _featureSection(t('features_amenities'), propertyAmenities, _customFeature),
            const SizedBox(height: 12),
            _featureSection(t('safety_features'), houseSafetyFeatures, _customSafety),
            const SizedBox(height: 12),
            _featureSection(t('interior_features'), houseInteriorFeatures, _customInterior),
            const SizedBox(height: 12),
            _featureSection(t('exterior_features'), houseExteriorFeatures, _customExterior),
          ],
        ),
      ),
    );
  }

  Widget _buildLocation() {
    final t = context.read<LanguageProvider>().t;
    return Form(
      key: _locationFormKey,
      child: FormSection(
        title: t('location_details'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _dropdown(
              t('region'),
              _region,
              ethiopianRegions,
              (v) => setState(() => _region = v),
            ),
            Field(
              label: t('city'),
              child: TextFormField(
                key: _cityKey,
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
            Row(
              children: [
                Expanded(child: Field(label: t('parcel'), child: TextFormField(controller: _parcel, decoration: const InputDecoration(hintText: 'e.g. 1234')))),
              ],
            ),
            Field(
              label: t('block'),
              child: TextFormField(controller: _block, decoration: const InputDecoration(hintText: 'e.g. 05')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMedia() {
    final t = context.read<LanguageProvider>().t;
    return FormSection(
      title: t('media_upload'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ImageGridPicker(
            images: _images,
            onChanged: (list) => setState(() => _images = list),
            onPick: _pickImage,
            uploading: _uploading,
            hint: 'Upload at least 3 photos',
          ),
          const SizedBox(height: 12),
          Field(
            label: t('video_url'),
            child: TextFormField(
              controller: _videoUrl,
              decoration: const InputDecoration(hintText: 'https://youtube.com/watch?v=... (optional)'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMap() {
    final t = context.read<LanguageProvider>().t;
    return FormSection(
      title: t('location_map2'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Click on the map to select the exact location, or enter the coordinates manually below.',
            style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
          ),
          const SizedBox(height: 12),
          MapPickerField(latController: _latitude, lngController: _longitude),
          const SizedBox(height: 16),
          Text(
            t('location_document'),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.foreground),
          ),
          const SizedBox(height: 4),
          Text(t('location_document_note'), style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
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
    );
  }

  Widget _summaryRow(String label, String value, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground)),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: highlight ? AppColors.primary : AppColors.foreground,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReview() {
    final t = context.read<LanguageProvider>().t;
    final tv = context.read<LanguageProvider>().tv;
    final addressParts = [
      _subCity.text.trim(),
      _woreda.text.trim(),
      _kebele.text.trim(),
      _parcel.text.trim(),
      _block.text.trim(),
      _city.text.trim(),
      _region,
    ].where((e) => e.isNotEmpty);
    return Form(
      key: _reviewFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FormSection(
            title: t('review_listing_info'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _title.text.trim().isEmpty ? tv('not_specified') : _title.text.trim(),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.foreground),
                ),
                const SizedBox(height: 12),
                _summaryRow(t('type'), '${tv(_propertyType)} (${tv(_listingType)})'),
                _summaryRow(t('price'), _price.text.trim().isEmpty ? tv('not_set') : '${_price.text.trim()} ETB (${tv(_priceType)})', highlight: _price.text.trim().isNotEmpty),
                _summaryRow(t('location'), addressParts.isEmpty ? tv('not_set') : addressParts.join(', ')),
                _summaryRow('Beds / Baths', '${_bedrooms.text.trim().isEmpty ? '-' : _bedrooms.text.trim()} / ${_bathrooms.text.trim().isEmpty ? '-' : _bathrooms.text.trim()}'),
                _summaryRow(t('area'), _area.text.trim().isEmpty ? tv('not_set') : '${_area.text.trim()} m²'),
                _summaryRow(t('condition'), tv(_condition)),
                _summaryRow(t('photos'), '${_images.length} ${tv('uploaded')}'),
                _summaryRow(t('features'), _features.isEmpty ? tv('none') : '${_features.length} ${tv('selected')}'),
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
                    key: _nameKey,
                    controller: _name,
                    decoration: const InputDecoration(hintText: 'Your name'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
                Field(
                  label: t('phone_number_label'),
                  child: TextFormField(
                    key: _phoneKey,
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(hintText: '+251 911 000 000'),
                    validator: (v) {
                      final digits = (v ?? '').replaceAll(RegExp(r'\D'), '');
                      if (digits.length < 9) return 'Enter a valid phone number';
                      return null;
                    },
                  ),
                ),
              ],
            ),
          ),
          FormSection(
            title: t('description'),
            child: Text(
              _description.text.trim().isEmpty ? tv('not_set') : _description.text.trim(),
              style: const TextStyle(fontSize: 13, color: AppColors.foreground),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepper() {
    final t = context.read<LanguageProvider>().t;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: List.generate(_stepLabels.length, (i) {
          final done = i < _step;
          final active = i == _step;
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: active
                              ? AppColors.primary
                              : (done ? Colors.green : Colors.white),
                          border: Border.all(
                            color: active || done ? Colors.transparent : AppColors.border,
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: done
                              ? const Icon(Icons.check, size: 16, color: Colors.white)
                              : Text(
                                  '${i + 1}',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: active ? Colors.white : AppColors.mutedForeground,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        t(_stepLabels[i]),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: active ? FontWeight.bold : FontWeight.normal,
                          color: active ? AppColors.primary : AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
                if (i < _stepLabels.length - 1)
                  Container(
                    height: 2,
                    width: 14,
                    color: done ? Colors.green : AppColors.border,
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.read<LanguageProvider>();
    final t = l10n.t;
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Edit Property' : t('post_property'))),
      body: SafeArea(
        child: Column(
          children: [
            _stepper(),
            if (_error != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.destructive.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, size: 18, color: AppColors.destructive),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(fontSize: 12, color: AppColors.destructive),
                      ),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: ListView(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                children: [
                  switch (_step) {
                    0 => _buildBasicInfo(),
                    1 => _buildLocation(),
                    2 => _buildMedia(),
                    3 => _buildMap(),
                    _ => _buildReview(),
                  },
                ],
              ),
            ),
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    final t = context.read<LanguageProvider>().t;
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            OutlinedButton.icon(
              onPressed: _step == 0 || _submitting ? null : _back,
              icon: const Icon(Icons.arrow_back, size: 18),
              label: Text(t('back')),
            ),
            const Spacer(),
            if (!_isLastStep)
              FilledButton.icon(
                onPressed: (_submitting || (_step == 2 && _images.length < 3)) ? null : _next,
                icon: const Icon(Icons.arrow_forward, size: 18),
                label: Text(t('next')),
              )
            else
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send, size: 18),
                label: Text(_submitting ? t('submitting') : (_isEdit ? 'Update Property' : t('submit_listing'))),
              ),
          ],
        ),
      ),
    );
  }
}
