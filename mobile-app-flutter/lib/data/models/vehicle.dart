import 'listing_agent.dart';

/// Vehicle listing matching the Vehicle type in lib/data.ts.
class Vehicle {
  const Vehicle({
    required this.id,
    required this.title,
    required this.listingType,
    this.vehicleCategory,
    this.make,
    this.model,
    this.trimVersion,
    this.manufacturingYear,
    this.registrationYear,
    this.vin,
    this.engineNumber,
    this.plateNumber,
    this.color,
    this.countryOfOrigin,
    this.fuelType,
    this.engineSize,
    this.horsepower,
    this.transmission,
    this.drivetrain,
    this.cylinders,
    this.seatingCapacity,
    this.doors,
    this.mileage,
    this.fuelConsumption,
    this.fuelTankCapacity,
    this.groundClearance,
    this.weight,
    this.tireSize,
    this.condition,
    this.accidentFree,
    this.accidentHistory,
    this.serviceHistoryAvailable,
    this.ownershipCount,
    this.imported,
    this.locallyAssembled,
    this.safetyFeatures = const [],
    this.interiorFeatures = const [],
    this.exteriorFeatures = const [],
    this.dailyRate,
    this.weeklyRate,
    this.monthlyRate,
    this.securityDeposit,
    this.minRentalDays,
    this.maxRentalDays,
    this.driverIncluded,
    this.selfDrive,
    this.fuelPolicy,
    this.mileageLimit,
    this.extraKmCharge,
    this.deliveryAvailable,
    this.airportPickup,
    this.availableLocations,
    this.availableDates,
    this.driverAgeRequirement,
    this.minDrivingExperience,
    this.drivingLicenseRequired,
    this.passportRequired,
    this.smokingAllowed,
    this.petsAllowed,
    this.offroadAllowed,
    this.crossborderAllowed,
    this.insuranceIncluded,
    this.damageLiability,
    this.sellingPrice,
    this.negotiable,
    this.financingAvailable,
    this.exchangeAccepted,
    this.bankLoanAccepted,
    this.regionRegistration,
    this.ownershipCertificate,
    this.roadFundPaid,
    this.insuranceValid,
    this.inspectionCertificate,
    this.customsClearance,
    this.dutyPaid,
    this.plateType,
    this.region,
    this.city,
    this.subCity,
    this.woreda,
    this.latitude,
    this.longitude,
    this.pickupAddress,
    this.description,
    this.images = const [],
    this.videoUrl,
    this.price,
    this.priceType,
    this.features = const [],
    this.featured = false,
    this.status,
    this.agent,
    this.agentName,
    this.displayPhone,
    this.rejectionReason,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String listingType;
  final String? vehicleCategory;
  final String? make;
  final String? model;
  final String? trimVersion;
  final int? manufacturingYear;
  final int? registrationYear;
  final String? vin;
  final String? engineNumber;
  final String? plateNumber;
  final String? color;
  final String? countryOfOrigin;
  final String? fuelType;
  final num? engineSize;
  final num? horsepower;
  final String? transmission;
  final String? drivetrain;
  final int? cylinders;
  final int? seatingCapacity;
  final int? doors;
  final num? mileage;
  final String? fuelConsumption;
  final num? fuelTankCapacity;
  final num? groundClearance;
  final num? weight;
  final String? tireSize;
  final String? condition;
  final bool? accidentFree;
  final String? accidentHistory;
  final bool? serviceHistoryAvailable;
  final int? ownershipCount;
  final bool? imported;
  final bool? locallyAssembled;
  final List<String> safetyFeatures;
  final List<String> interiorFeatures;
  final List<String> exteriorFeatures;
  final num? dailyRate;
  final num? weeklyRate;
  final num? monthlyRate;
  final num? securityDeposit;
  final int? minRentalDays;
  final int? maxRentalDays;
  final bool? driverIncluded;
  final bool? selfDrive;
  final String? fuelPolicy;
  final int? mileageLimit;
  final num? extraKmCharge;
  final bool? deliveryAvailable;
  final bool? airportPickup;
  final List<String>? availableLocations;
  final String? availableDates;
  final int? driverAgeRequirement;
  final int? minDrivingExperience;
  final String? drivingLicenseRequired;
  final bool? passportRequired;
  final bool? smokingAllowed;
  final bool? petsAllowed;
  final bool? offroadAllowed;
  final bool? crossborderAllowed;
  final bool? insuranceIncluded;
  final String? damageLiability;
  final num? sellingPrice;
  final bool? negotiable;
  final bool? financingAvailable;
  final bool? exchangeAccepted;
  final bool? bankLoanAccepted;
  final String? regionRegistration;
  final bool? ownershipCertificate;
  final bool? roadFundPaid;
  final bool? insuranceValid;
  final bool? inspectionCertificate;
  final bool? customsClearance;
  final bool? dutyPaid;
  final String? plateType;
  final String? region;
  final String? city;
  final String? subCity;
  final String? woreda;
  final double? latitude;
  final double? longitude;
  final String? pickupAddress;
  final String? description;
  final List<String> images;
  final String? videoUrl;
  final num? price;
  final String? priceType;
  final List<String> features;
  final bool featured;
  final String? status;
  final ListingAgent? agent;
  final String? agentName;
  final String? displayPhone;
  final String? rejectionReason;
  final String? createdAt;
  final String? updatedAt;

  bool get isRent {
    final t = listingType.toLowerCase();
    return t.contains('rent') || t.contains('both');
  }

  String get location => [subCity, city, region].where((e) => e != null && e.isNotEmpty).join(', ');

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    final title = json['title'] as String?;
    final fallbackTitle = [
      json['make'],
      json['vehicleModel'],
      json['model'],
    ].where((e) => e != null && '$e'.isNotEmpty).join(' ');

    return Vehicle(
      id: '${json['id']}',
      title: (title?.isNotEmpty ?? false) ? title! : fallbackTitle,
      listingType: '${json['listingType'] ?? 'For Sale'}',
      vehicleCategory: json['vehicleCategory'] as String?,
      make: json['make'] as String?,
      model: json['vehicleModel'] as String? ?? json['model'] as String?,
      trimVersion: json['trimVersion'] as String?,
      manufacturingYear: json['manufacturingYear'] as int?,
      registrationYear: json['registrationYear'] as int?,
      vin: json['vin'] as String?,
      engineNumber: json['engineNumber'] as String?,
      plateNumber: json['plateNumber'] as String?,
      color: json['color'] as String?,
      countryOfOrigin: json['countryOfOrigin'] as String?,
      fuelType: json['fuelType'] as String?,
      engineSize: json['engineSize'] as num?,
      horsepower: json['horsepower'] as num?,
      transmission: json['transmission'] as String?,
      drivetrain: json['drivetrain'] as String?,
      cylinders: json['cylinders'] as int?,
      seatingCapacity: json['seatingCapacity'] as int?,
      doors: json['doors'] as int?,
      mileage: json['mileage'] as num?,
      fuelConsumption: json['fuelConsumption'] as String?,
      fuelTankCapacity: json['fuelTankCapacity'] as num?,
      groundClearance: json['groundClearance'] as num?,
      weight: json['weight'] as num?,
      tireSize: json['tireSize'] as String?,
      condition: json['condition'] as String?,
      accidentFree: json['accidentFree'] as bool?,
      accidentHistory: json['accidentHistory'] as String?,
      serviceHistoryAvailable: json['serviceHistoryAvailable'] as bool?,
      ownershipCount: json['ownershipCount'] as int?,
      imported: json['imported'] as bool?,
      locallyAssembled: json['locallyAssembled'] as bool?,
      safetyFeatures: (json['safetyFeatures'] as List?)?.map((e) => '$e').toList() ?? const [],
      interiorFeatures: (json['interiorFeatures'] as List?)?.map((e) => '$e').toList() ?? const [],
      exteriorFeatures: (json['exteriorFeatures'] as List?)?.map((e) => '$e').toList() ?? const [],
      dailyRate: json['dailyRate'] as num?,
      weeklyRate: json['weeklyRate'] as num?,
      monthlyRate: json['monthlyRate'] as num?,
      securityDeposit: json['securityDeposit'] as num?,
      minRentalDays: json['minRentalDays'] as int?,
      maxRentalDays: json['maxRentalDays'] as int?,
      driverIncluded: json['driverIncluded'] as bool?,
      selfDrive: json['selfDrive'] as bool?,
      fuelPolicy: json['fuelPolicy'] as String?,
      mileageLimit: json['mileageLimit'] as int?,
      extraKmCharge: json['extraKmCharge'] as num?,
      deliveryAvailable: json['deliveryAvailable'] as bool?,
      airportPickup: json['airportPickup'] as bool?,
      availableLocations: (json['availableLocations'] as List?)?.map((e) => '$e').toList(),
      availableDates: json['availableDates'] as String?,
      driverAgeRequirement: json['driverAgeRequirement'] as int?,
      minDrivingExperience: json['minDrivingExperience'] as int?,
      drivingLicenseRequired: json['drivingLicenseRequired'] as String?,
      passportRequired: json['passportRequired'] as bool?,
      smokingAllowed: json['smokingAllowed'] as bool?,
      petsAllowed: json['petsAllowed'] as bool?,
      offroadAllowed: json['offroadAllowed'] as bool?,
      crossborderAllowed: json['crossborderAllowed'] as bool?,
      insuranceIncluded: json['insuranceIncluded'] as bool?,
      damageLiability: json['damageLiability'] as String?,
      sellingPrice: json['sellingPrice'] as num?,
      negotiable: json['negotiable'] as bool?,
      financingAvailable: json['financingAvailable'] as bool?,
      exchangeAccepted: json['exchangeAccepted'] as bool?,
      bankLoanAccepted: json['bankLoanAccepted'] as bool?,
      regionRegistration: json['regionRegistration'] as String?,
      ownershipCertificate: json['ownershipCertificate'] as bool?,
      roadFundPaid: json['roadFundPaid'] as bool?,
      insuranceValid: json['insuranceValid'] as bool?,
      inspectionCertificate: json['inspectionCertificate'] as bool?,
      customsClearance: json['customsClearance'] as bool?,
      dutyPaid: json['dutyPaid'] as bool?,
      plateType: json['plateType'] as String?,
      region: json['region'] as String?,
      city: json['city'] as String?,
      subCity: json['subCity'] as String?,
      woreda: json['woreda'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      pickupAddress: json['pickupAddress'] as String?,
      description: json['description'] as String?,
      images: (json['images'] as List?)?.map((e) => '$e').toList() ?? const [],
      videoUrl: json['videoUrl'] as String?,
      price: json['price'] as num?,
      priceType: json['priceType'] as String?,
      features: (json['features'] as List?)?.map((e) => '$e').toList() ?? const [],
      featured: json['featured'] == true,
      status: json['status'] as String?,
      agentName: json['agentName'] as String?,
      displayPhone: json['displayPhone'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      agent: ListingAgent.fromJson(
        json['agent'] is Map<String, dynamic> ? json['agent'] as Map<String, dynamic> : null,
      ),
    );
  }
}