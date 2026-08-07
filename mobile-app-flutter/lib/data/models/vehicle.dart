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
    this.manufacturingYear,
    this.color,
    this.countryOfOrigin,
    this.fuelType,
    this.transmission,
    this.mileage,
    this.condition,
    this.price,
    this.priceType,
    this.region,
    this.city,
    this.subCity,
    this.description,
    this.features = const [],
    this.images = const [],
    this.videoUrl,
    this.status,
    this.agent,
    this.agentName,
    this.rejectionReason,
    this.createdAt,
  });

  final String id;
  final String title;
  final String listingType;
  final String? vehicleCategory;
  final String? make;
  final String? model;
  final int? manufacturingYear;
  final String? color;
  final String? countryOfOrigin;
  final String? fuelType;
  final String? transmission;
  final num? mileage;
  final String? condition;
  final num? price;
  final String? priceType;
  final String? region;
  final String? city;
  final String? subCity;
  final String? description;
  final List<String> features;
  final List<String> images;
  final String? videoUrl;
  final String? status;
  final ListingAgent? agent;
  final String? agentName;
  final String? rejectionReason;
  final String? createdAt;

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
      manufacturingYear: json['manufacturingYear'] as int?,
      color: json['color'] as String?,
      countryOfOrigin: json['countryOfOrigin'] as String?,
      fuelType: json['fuelType'] as String?,
      transmission: json['transmission'] as String?,
      mileage: json['mileage'] as num?,
      condition: json['condition'] as String?,
      price: json['price'],
      priceType: json['priceType'] as String?,
      region: json['region'] as String?,
      city: json['city'] as String?,
      subCity: json['subCity'] as String?,
      description: json['description'] as String?,
      features: (json['features'] as List?)?.map((e) => '$e').toList() ?? const [],
      images: (json['images'] as List?)?.map((e) => '$e').toList() ?? const [],
      videoUrl: json['videoUrl'] as String?,
      status: json['status'] as String?,
      agentName: json['agentName'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      createdAt: json['createdAt'] as String?,
      agent: ListingAgent.fromJson(
        json['agent'] is Map<String, dynamic> ? json['agent'] as Map<String, dynamic> : null,
      ),
    );
  }
}
