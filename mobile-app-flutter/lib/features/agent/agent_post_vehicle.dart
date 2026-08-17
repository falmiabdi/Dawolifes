import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/listing_options.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/vehicle.dart';
import '../../data/repositories/agent_repository.dart';
import '../../providers/language_provider.dart';
import 'map_picker.dart';
import 'post_form_widgets.dart';

const _vehicleCategories = [
  'Sedan', 'SUV', 'Pickup', 'Hatchback', 'Coupe', 'Convertible', 'Van',
  'Minibus', 'Bus', 'Truck', 'Motorcycle', 'Three-Wheeler (Bajaj)',
  'Electric Vehicle', 'Hybrid Vehicle',
];
const _listingTypes = ['For Sale', 'For Rent', 'Both'];
const _priceTypes = ['Fixed Price', 'Negotiable', 'Starting From'];
const _conditions = ['New', 'Used', 'Certified Pre-Owned'];
const _fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
const _transmissions = ['Automatic', 'Manual', 'CVT', 'DCT'];
const _drivetrains = ['FWD', 'RWD', '4WD', 'AWD'];
const _origins = [
  'Japan', 'Germany', 'USA', 'South Korea', 'China', 'UK', 'France',
  'Italy', 'Thailand', 'India', 'Ethiopia', 'Other',
];
const _colors = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Brown', 'Beige', 'Gold', 'Other',
];
const _makes = [
  'Toyota', 'Hyundai', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi',
  'Suzuki', 'Kia', 'Ford', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Chevrolet',
  'Isuzu', 'Lexus', 'Acura', 'Infiniti', 'Range Rover', 'Jeep', 'Tesla',
  'BYD', 'Other',
];
const _safetyFeatures = [
  'ABS', 'Airbags', 'Traction Control', 'Stability Control',
  'Blind Spot Monitoring', 'Lane Assist', 'Tire Pressure Monitoring',
  'Child Lock', 'Immobilizer', 'Alarm System',
];
const _interiorFeatures = [
  'Leather Seats', 'Fabric Seats', 'Heated Seats', 'Power Windows',
  'Power Steering', 'Power Mirrors', 'Sunroof', 'Bluetooth', 'USB Ports',
  'Apple CarPlay', 'Android Auto', 'Premium Sound System',
];
const _exteriorFeatures = [
  'Alloy Wheels', 'Fog Lights', 'LED Headlights', 'Roof Rack', 'Tow Hook',
  'Running Boards', 'Spare Tire',
];
const _fuelPolicies = ['Full to Full', 'Prepaid', 'Included'];
const _plateTypes = ['Black', 'Red', 'Green', 'Yellow', 'Diplomatic'];

/// Post/edit vehicle mirroring components/post/post-vehicle-wizard.tsx.
class AgentPostVehicleScreen extends StatefulWidget {
  const AgentPostVehicleScreen({super.key, this.edit});

  final Vehicle? edit;

  @override
  State<AgentPostVehicleScreen> createState() => _AgentPostVehicleScreenState();
}

class _AgentPostVehicleScreenState extends State<AgentPostVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();

  final _titleKey = GlobalKey<FormFieldState<String>>();
  final _modelKey = GlobalKey<FormFieldState<String>>();
  final _yearKey = GlobalKey<FormFieldState<String>>();
  final _priceKey = GlobalKey<FormFieldState<String>>();
  final _cityKey = GlobalKey<FormFieldState<String>>();

  late final TextEditingController _title;
  late final TextEditingController _model;
  late final TextEditingController _trimVersion;
  late final TextEditingController _year;
  late final TextEditingController _registrationYear;
  late final TextEditingController _engineSize;
  late final TextEditingController _horsepower;
  late final TextEditingController _cylinders;
  late final TextEditingController _seatingCapacity;
  late final TextEditingController _doors;
  late final TextEditingController _mileage;
  late final TextEditingController _fuelConsumption;
  late final TextEditingController _fuelTankCapacity;
  late final TextEditingController _groundClearance;
  late final TextEditingController _weight;
  late final TextEditingController _tireSize;
  late final TextEditingController _ownershipCount;
  late final TextEditingController _accidentHistory;
  late final TextEditingController _price;
  late final TextEditingController _sellingPrice;
  late final TextEditingController _dailyRate;
  late final TextEditingController _weeklyRate;
  late final TextEditingController _monthlyRate;
  late final TextEditingController _securityDeposit;
  late final TextEditingController _minRentalDays;
  late final TextEditingController _maxRentalDays;
  late final TextEditingController _mileageLimit;
  late final TextEditingController _extraKmCharge;
  late final TextEditingController _city;
  late final TextEditingController _subCity;
  late final TextEditingController _woreda;
  late final TextEditingController _pickupAddress;
  late final TextEditingController _regionRegistration;
  late final TextEditingController _plateNumber;
  late final TextEditingController _description;
  late final TextEditingController _videoUrl;
  late final TextEditingController _latitude;
  late final TextEditingController _longitude;

  String _listingType = 'For Sale';
  String _vehicleCategory = 'Sedan';
  String _make = 'Toyota';
  String _color = 'White';
  String _countryOfOrigin = 'Japan';
  String _priceType = 'Fixed Price';
  String _condition = 'Used';
  String _fuelType = 'Gasoline';
  String _transmission = 'Automatic';
  String _drivetrain = 'FWD';
  String _fuelPolicy = 'Full to Full';
  String _plateType = 'Black';
  String _region = '';
  bool _accidentFree = false;
  bool _serviceHistoryAvailable = false;
  bool _imported = false;
  bool _locallyAssembled = false;
  bool _negotiable = false;
  bool _financingAvailable = false;
  bool _exchangeAccepted = false;
  bool _bankLoanAccepted = false;
  bool _driverIncluded = false;
  bool _selfDrive = false;
  bool _deliveryAvailable = false;
  bool _airportPickup = false;
  bool _ownershipCertificate = false;
  bool _roadFundPaid = false;
  bool _insuranceValid = false;
  bool _inspectionCertificate = false;
  bool _customsClearance = false;
  bool _dutyPaid = false;
  List<String> _safety = [];
  List<String> _interior = [];
  List<String> _exterior = [];
  List<String> _images = [];
  bool _uploading = false;
  bool _submitting = false;
  String? _error;

  bool get _isEdit => widget.edit != null;
  bool get _isRent => _listingType.toLowerCase().contains('rent');

  @override
  void initState() {
    super.initState();
    final v = widget.edit;
    _title = TextEditingController(text: v?.title ?? '');
    _model = TextEditingController(text: v?.model ?? '');
    _trimVersion = TextEditingController();
    _year = TextEditingController(text: v?.manufacturingYear != null ? '${v!.manufacturingYear}' : '');
    _registrationYear = TextEditingController();
    _engineSize = TextEditingController();
    _horsepower = TextEditingController();
    _cylinders = TextEditingController();
    _seatingCapacity = TextEditingController();
    _doors = TextEditingController();
    _mileage = TextEditingController(text: v?.mileage != null ? '${v!.mileage}' : '');
    _fuelConsumption = TextEditingController();
    _fuelTankCapacity = TextEditingController();
    _groundClearance = TextEditingController();
    _weight = TextEditingController();
    _tireSize = TextEditingController();
    _ownershipCount = TextEditingController();
    _accidentHistory = TextEditingController();
    _price = TextEditingController(text: v?.price != null ? '${v!.price}' : '');
    _sellingPrice = TextEditingController();
    _dailyRate = TextEditingController();
    _weeklyRate = TextEditingController();
    _monthlyRate = TextEditingController();
    _securityDeposit = TextEditingController();
    _minRentalDays = TextEditingController();
    _maxRentalDays = TextEditingController();
    _mileageLimit = TextEditingController();
    _extraKmCharge = TextEditingController();
    _city = TextEditingController(text: v?.city ?? '');
    _subCity = TextEditingController(text: v?.subCity ?? '');
    _woreda = TextEditingController();
    _pickupAddress = TextEditingController();
    _regionRegistration = TextEditingController();
    _plateNumber = TextEditingController();
    _description = TextEditingController(text: v?.description ?? '');
    _videoUrl = TextEditingController(text: v?.videoUrl ?? '');
    _latitude = TextEditingController();
    _longitude = TextEditingController();
    if (v != null) {
      _listingType = v.listingType.isNotEmpty ? v.listingType : _listingType;
      _vehicleCategory = v.vehicleCategory ?? _vehicleCategory;
      _make = v.make ?? _make;
      _color = v.color ?? _color;
      _countryOfOrigin = v.countryOfOrigin ?? _countryOfOrigin;
      _priceType = v.priceType ?? _priceType;
      _condition = v.condition ?? _condition;
      _fuelType = v.fuelType ?? _fuelType;
      _transmission = v.transmission ?? _transmission;
      _images = v.images;
      _region = v.region ?? '';
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    for (final c in [
      _title, _model, _trimVersion, _year, _registrationYear, _engineSize,
      _horsepower, _cylinders, _seatingCapacity, _doors, _mileage,
      _fuelConsumption, _fuelTankCapacity, _groundClearance, _weight,
      _tireSize, _ownershipCount, _accidentHistory, _price, _sellingPrice,
      _dailyRate, _weeklyRate, _monthlyRate, _securityDeposit, _minRentalDays,
      _maxRentalDays, _mileageLimit, _extraKmCharge, _city, _subCity,
      _woreda, _pickupAddress, _regionRegistration, _plateNumber, _description,
      _videoUrl, _latitude, _longitude,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickImage() async {
    setState(() => _uploading = true);
    try {
      final url = await pickAndUploadImage(context.read<ApiClient>(), endpoint: '/api/agent/upload');
      if (!mounted) return;
      setState(() => _images = [..._images, url]);
    } on ImagePickCancelled {
      // user backed out; nothing to do
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  num? _num(TextEditingController c) {
    final t = c.text.trim();
    return t.isEmpty ? null : num.tryParse(t);
  }

  void _scrollToFirstError() {
    final keys = [_titleKey, _modelKey, _yearKey, _priceKey, _cityKey];
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      _scrollToFirstError();
      return;
    }
    if (_images.length < 3) {
      setState(() => _error = 'At least 3 photos are required to list a vehicle.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    final payload = <String, dynamic>{
      'title': _title.text.trim(),
      'vehicleId': '${_make.trim()}-${_model.text.trim()}-${DateTime.now().millisecondsSinceEpoch}',
      'listingType': _listingType,
      'vehicleCategory': _vehicleCategory,
      'make': _make.trim(),
      'vehicleModel': _model.text.trim(),
      'trimVersion': _trimVersion.text.trim(),
      'manufacturingYear': int.tryParse(_year.text.trim()) ?? DateTime.now().year,
      'registrationYear': int.tryParse(_registrationYear.text.trim()),
      'color': _color,
      'countryOfOrigin': _countryOfOrigin,
      'condition': _condition,
      'fuelType': _fuelType,
      'engineSize': _num(_engineSize),
      'horsepower': _num(_horsepower),
      'transmission': _transmission,
      'drivetrain': _drivetrain,
      'cylinders': _num(_cylinders),
      'seatingCapacity': _num(_seatingCapacity),
      'doors': _num(_doors),
      'mileage': _num(_mileage),
      'fuelConsumption': _fuelConsumption.text.trim(),
      'fuelTankCapacity': _num(_fuelTankCapacity),
      'groundClearance': _num(_groundClearance),
      'weight': _num(_weight),
      'tireSize': _tireSize.text.trim(),
      'accidentFree': _accidentFree,
      'accidentHistory': _accidentHistory.text.trim(),
      'serviceHistoryAvailable': _serviceHistoryAvailable,
      'ownershipCount': _num(_ownershipCount),
      'imported': _imported,
      'locallyAssembled': _locallyAssembled,
      'safetyFeatures': _safety,
      'interiorFeatures': _interior,
      'exteriorFeatures': _exterior,
      'price': num.tryParse(_price.text.trim()) ?? 0,
      'priceType': _priceType,
      'sellingPrice': _num(_sellingPrice),
      'negotiable': _negotiable,
      'financingAvailable': _financingAvailable,
      'exchangeAccepted': _exchangeAccepted,
      'bankLoanAccepted': _bankLoanAccepted,
      'dailyRate': _num(_dailyRate),
      'weeklyRate': _num(_weeklyRate),
      'monthlyRate': _num(_monthlyRate),
      'securityDeposit': _num(_securityDeposit),
      'minRentalDays': _num(_minRentalDays),
      'maxRentalDays': _num(_maxRentalDays),
      'driverIncluded': _driverIncluded,
      'selfDrive': _selfDrive,
      'fuelPolicy': _fuelPolicy,
      'mileageLimit': _num(_mileageLimit),
      'extraKmCharge': _num(_extraKmCharge),
      'deliveryAvailable': _deliveryAvailable,
      'airportPickup': _airportPickup,
      'region': _region,
      'city': _city.text.trim(),
      'subCity': _subCity.text.trim(),
      'woreda': _woreda.text.trim(),
      'latitude': _latitude.text.trim().isEmpty ? null : num.tryParse(_latitude.text.trim()),
      'longitude': _longitude.text.trim().isEmpty ? null : num.tryParse(_longitude.text.trim()),
      'pickupAddress': _pickupAddress.text.trim(),
      'regionRegistration': _regionRegistration.text.trim(),
      'ownershipCertificate': _ownershipCertificate,
      'roadFundPaid': _roadFundPaid,
      'insuranceValid': _insuranceValid,
      'inspectionCertificate': _inspectionCertificate,
      'customsClearance': _customsClearance,
      'dutyPaid': _dutyPaid,
      'plateType': _plateType,
      'plateNumber': _plateNumber.text.trim(),
      'description': _description.text.trim(),
      'images': _images,
      'videoUrl': _videoUrl.text.trim(),
    };
    try {
      final repo = context.read<AgentRepository>();
      if (_isEdit) {
        await repo.updateVehicle(widget.edit!.id, payload);
      } else {
        await repo.createVehicle(payload);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vehicle submitted! It is now pending review.')),
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

  Widget _text(
    String label,
    TextEditingController controller, {
    String? hint,
    TextInputType? keyboard,
    String? Function(String?)? validator,
    Key? fieldKey,
  }) {
    return Field(
      label: label,
      child: TextFormField(
        key: fieldKey,
        controller: controller,
        keyboardType: keyboard,
        decoration: InputDecoration(hintText: hint),
        validator: validator,
      ),
    );
  }

  Widget _row(List<Widget> children) {
    return Row(
      children: [
        for (int i = 0; i < children.length; i++) ...[
          Expanded(child: children[i]),
          if (i < children.length - 1) const SizedBox(width: 10),
        ],
      ],
    );
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

  Widget _yesNo(String label, bool value, ValueChanged<bool> onChanged) {
    return _dropdown(label, value ? 'Yes' : 'No', const ['Yes', 'No'], (v) => onChanged(v == 'Yes'));
  }

  Widget _chips(String title, List<String> options, List<String> selected, ValueChanged<List<String>> onChanged) {
    final tv = context.read<LanguageProvider>().tv;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.foreground)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((o) {
            final sel = selected.contains(o);
            return FilterChip(
              label: Text(tv(o), style: const TextStyle(fontSize: 12)),
              selected: sel,
              onSelected: (on) {
                onChanged(on ? [...selected, o] : selected.where((e) => e != o).toList());
              },
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
      appBar: AppBar(title: Text(_isEdit ? 'Edit Vehicle' : t('post_vehicle'))),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            FormSection(
              title: t('basic_vehicle_info'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _text(t('vehicle_title'), _title,
                      hint: 'e.g. 2020 Toyota Land Cruiser V8',
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                      fieldKey: _titleKey),                  _row([
                    _dropdown(t('listing_type'), _listingType, _listingTypes, (v) => setState(() => _listingType = v)),
                    _dropdown(t('vehicle_category'), _vehicleCategory, _vehicleCategories, (v) => setState(() => _vehicleCategory = v)),
                  ]),
                  _row([
                    _dropdown(t('make'), _make, _makes, (v) => setState(() => _make = v)),
                    _text(t('model'), _model, hint: 'e.g. Land Cruiser',
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                        fieldKey: _modelKey),
                  ]),
                  _row([
                    _text(t('trim_version'), _trimVersion, hint: 'e.g. VX-R'),
                    _dropdown(t('condition'), _condition, _conditions, (v) => setState(() => _condition = v)),
                  ]),
                  _row([
                    _text(t('manufacturing_year'), _year, hint: '2020', keyboard: TextInputType.number,
                        validator: (v) {
                          final n = int.tryParse((v ?? '').trim());
                          if (n == null || n < 1900 || n > 2030) return 'Valid year required';
                          return null;
                        },
                        fieldKey: _yearKey),
                    _text(t('registration_year'), _registrationYear, hint: '2020', keyboard: TextInputType.number),
                  ]),
                  _dropdown(t('color'), _color, _colors, (v) => setState(() => _color = v)),
                  _dropdown(t('country_of_origin'), _countryOfOrigin, _origins, (v) => setState(() => _countryOfOrigin = v)),
                ],
              ),
            ),
            FormSection(
              title: t('technical_specs'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _dropdown(t('fuel_type'), _fuelType, _fuelTypes, (v) => setState(() => _fuelType = v)),
                  _row([
                    _text(t('engine_size'), _engineSize, hint: 'e.g. 4.5', keyboard: TextInputType.number),
                    _text(t('horsepower'), _horsepower, hint: 'e.g. 381', keyboard: TextInputType.number),
                  ]),
                  _row([
                    _dropdown(t('transmission'), _transmission, _transmissions, (v) => setState(() => _transmission = v)),
                    _dropdown(t('drivetrain'), _drivetrain, _drivetrains, (v) => setState(() => _drivetrain = v)),
                  ]),
                  _text(t('cylinders'), _cylinders, hint: 'e.g. 6', keyboard: TextInputType.number),
                  _row([
                    _text(t('seating_capacity'), _seatingCapacity, hint: 'e.g. 7', keyboard: TextInputType.number),
                    _text(t('doors'), _doors, hint: 'e.g. 5', keyboard: TextInputType.number),
                    _text(t('mileage'), _mileage, hint: 'e.g. 45000', keyboard: TextInputType.number),
                  ]),
                  _row([
                    _text(t('fuel_consumption'), _fuelConsumption, hint: 'e.g. 12.5'),
                    _text(t('fuel_tank_capacity'), _fuelTankCapacity, hint: 'e.g. 93', keyboard: TextInputType.number),
                    _text(t('ground_clearance'), _groundClearance, hint: 'e.g. 225', keyboard: TextInputType.number),
                  ]),
                  _row([
                    _text(t('weight'), _weight, hint: 'e.g. 2650', keyboard: TextInputType.number),
                    _text(t('tire_size'), _tireSize, hint: 'e.g. 265/65R18'),
                  ]),
                ],
              ),
            ),
            FormSection(
              title: t('vehicle_condition_features'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _row([
                    _yesNo(t('accident_free'), _accidentFree, (v) => setState(() => _accidentFree = v)),
                    _yesNo(t('service_history'), _serviceHistoryAvailable, (v) => setState(() => _serviceHistoryAvailable = v)),
                  ]),
                  _text(t('ownership_count'), _ownershipCount, hint: 'e.g. 2', keyboard: TextInputType.number),
                  _row([
                    _yesNo(t('imported'), _imported, (v) => setState(() => _imported = v)),
                    _yesNo(t('locally_assembled'), _locallyAssembled, (v) => setState(() => _locallyAssembled = v)),
                  ]),
                  _text(t('accident_history'), _accidentHistory, hint: 'Describe any accident history...'),
                  const SizedBox(height: 8),
                  _chips(t('safety_features'), _safetyFeatures, _safety, (v) => setState(() => _safety = v)),
                  const SizedBox(height: 12),
                  _chips(t('interior_features'), _interiorFeatures, _interior, (v) => setState(() => _interior = v)),
                  const SizedBox(height: 12),
                  _chips(t('exterior_features'), _exteriorFeatures, _exterior, (v) => setState(() => _exterior = v)),
                ],
              ),
            ),
            FormSection(
              title: t('pricing_info'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _row([
                    _text(t('price_etb'), _price, hint: 'e.g. 3500000', keyboard: TextInputType.number,
                        validator: (v) {
                          final n = num.tryParse((v ?? '').trim());
                          if (n == null || n <= 0) return 'Enter a valid price';
                          return null;
                        },
                        fieldKey: _priceKey),
                    _dropdown(t('price_type'), _priceType, _priceTypes, (v) => setState(() => _priceType = v)),
                  ]),
                  _row([
                    _text(t('selling_price'), _sellingPrice, hint: 'e.g. 3500000', keyboard: TextInputType.number),
                    _yesNo(t('negotiable'), _negotiable, (v) => setState(() => _negotiable = v)),
                  ]),
                  _row([
                    _yesNo(t('financing_available'), _financingAvailable, (v) => setState(() => _financingAvailable = v)),
                    _yesNo(t('exchange_accepted'), _exchangeAccepted, (v) => setState(() => _exchangeAccepted = v)),
                  ]),
                  _yesNo(t('bank_loan'), _bankLoanAccepted, (v) => setState(() => _bankLoanAccepted = v)),
                  if (_isRent) ...[
                    const Divider(height: 24),
                    Text(t('rental_info'),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.foreground)),
                    const SizedBox(height: 8),
                    _row([
                      _text(t('daily_rate'), _dailyRate, hint: 'e.g. 5000', keyboard: TextInputType.number),
                      _text(t('weekly_rate'), _weeklyRate, hint: 'e.g. 30000', keyboard: TextInputType.number),
                      _text(t('monthly_rate'), _monthlyRate, hint: 'e.g. 100000', keyboard: TextInputType.number),
                    ]),
                    _row([
                      _text(t('security_deposit'), _securityDeposit, hint: 'e.g. 50000', keyboard: TextInputType.number),
                      _text(t('min_rental_days'), _minRentalDays, hint: 'e.g. 1', keyboard: TextInputType.number),
                      _text(t('max_rental_days'), _maxRentalDays, hint: 'e.g. 30', keyboard: TextInputType.number),
                    ]),
                    _row([
                      _yesNo(t('driver_included'), _driverIncluded, (v) => setState(() => _driverIncluded = v)),
                      _yesNo(t('self_drive'), _selfDrive, (v) => setState(() => _selfDrive = v)),
                    ]),
                    _dropdown(t('fuel_policy'), _fuelPolicy, _fuelPolicies, (v) => setState(() => _fuelPolicy = v)),
                    _row([
                      _text(t('mileage_limit'), _mileageLimit, hint: 'e.g. 200', keyboard: TextInputType.number),
                      _text(t('extra_km_charge'), _extraKmCharge, hint: 'e.g. 15', keyboard: TextInputType.number),
                    ]),
                    _row([
                      _yesNo(t('delivery_available'), _deliveryAvailable, (v) => setState(() => _deliveryAvailable = v)),
                      _yesNo(t('airport_pickup'), _airportPickup, (v) => setState(() => _airportPickup = v)),
                    ]),
                  ],
                ],
              ),
            ),
            FormSection(
              title: t('location_legal_info'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _dropdown(t('region'), _region, ethiopianRegions, (v) => setState(() => _region = v)),
                  _text(t('city'), _city, hint: 'e.g. Addis Ababa',
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                      fieldKey: _cityKey),
                  _row([
                    _text(t('sub_city'), _subCity, hint: 'e.g. Bole'),
                    _text(t('woreda'), _woreda, hint: 'e.g. 03'),
                  ]),
                  _text(t('pickup_address'), _pickupAddress, hint: 'e.g. Bole Road, near Edna Mall'),
                  const Divider(height: 24),
                  Text(t('legal_documents'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.foreground)),
                  const SizedBox(height: 8),
                  _row([
                    _text(t('region_registration'), _regionRegistration, hint: 'e.g. Addis Ababa'),
                    _yesNo(t('ownership_certificate'), _ownershipCertificate, (v) => setState(() => _ownershipCertificate = v)),
                  ]),
                  _row([
                    _yesNo(t('road_fund_paid'), _roadFundPaid, (v) => setState(() => _roadFundPaid = v)),
                    _yesNo(t('insurance_valid'), _insuranceValid, (v) => setState(() => _insuranceValid = v)),
                  ]),
                  _yesNo(t('inspection_certificate'), _inspectionCertificate, (v) => setState(() => _inspectionCertificate = v)),
                  _row([
                    _yesNo(t('customs_clearance'), _customsClearance, (v) => setState(() => _customsClearance = v)),
                    _yesNo(t('duty_paid'), _dutyPaid, (v) => setState(() => _dutyPaid = v)),
                  ]),
                  _dropdown(t('plate_type'), _plateType, _plateTypes, (v) => setState(() => _plateType = v)),
                  _text(t('plate_number'), _plateNumber, hint: 'e.g. AA-123456'),
                  const Divider(height: 24),
                  Text('Location coordinates (optional)', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.foreground)),
                  const SizedBox(height: 8),
                  MapPickerField(latController: _latitude, lngController: _longitude),
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
                  ),
                  const SizedBox(height: 12),
                  _text(t('video_url'), _videoUrl, hint: 'https://youtube.com/watch?v=...'),
                ],
              ),
            ),
            FormSection(
              title: t('description'),
              child: TextFormField(
                controller: _description,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'Describe the vehicle...'),
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
              label: Text(_submitting ? t('submitting') : (_isEdit ? 'Update Vehicle' : t('submit_vehicle'))),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
