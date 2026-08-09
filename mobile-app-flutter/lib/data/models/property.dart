import 'listing_agent.dart';

/// Property listing matching the Property type in lib/data.ts.
class Property {
  const Property({
    required this.id,
    required this.title,
    required this.type,
    required this.listingType,
    required this.price,
    this.priceType,
    this.region,
    this.city,
    this.subCity,
    this.woreda,
    this.kebele,
    this.parcel,
    this.block,
    this.homeNo,
    this.area,
    this.bedrooms,
    this.bathrooms,
    this.floorNumber,
    this.condition,
    this.legalizedYear,
    this.description,
    this.features = const [],
    this.images = const [],
    this.videoUrl,
    this.featured = false,
    this.status,
    this.agent,
    this.agentName,
    this.displayPhone,
    this.posterType,
    this.ownerType,
    this.latitude,
    this.longitude,
    this.locationDocument,
    this.rejectionReason,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String type;
  final String listingType;
  final num price;
  final String? priceType;
  final String? region;
  final String? city;
  final String? subCity;
  final String? woreda;
  final String? kebele;
  final String? parcel;
  final String? block;
  final String? homeNo;
  final num? area;
  final int? bedrooms;
  final int? bathrooms;
  final String? floorNumber;
  final String? condition;
  final int? legalizedYear;
  final String? description;
  final List<String> features;
  final List<String> images;
  final String? videoUrl;
  final bool featured;
  final String? status;
  final ListingAgent? agent;
  final String? agentName;
  final String? displayPhone;
  final String? posterType;
  final String? ownerType;
  final double? latitude;
  final double? longitude;
  final String? locationDocument;
  final String? rejectionReason;
  final String? createdAt;
  final String? updatedAt;

  bool get isRent {
    final t = listingType.toLowerCase();
    return t.contains('rent') || t.contains('both');
  }

  String get location => [subCity, city, region].where((e) => e != null && e.isNotEmpty).join(', ');

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: '${json['id']}',
      title: '${json['title'] ?? ''}',
      type: '${json['type'] ?? ''}',
      listingType: '${json['listingType'] ?? 'For Sale'}',
      price: json['price'] ?? 0,
      priceType: json['priceType'] as String?,
      region: json['region'] as String?,
      city: json['city'] as String?,
      subCity: json['subCity'] as String?,
      woreda: json['woreda'] as String?,
      kebele: json['kebele'] as String?,
      parcel: json['parcel'] as String?,
      block: json['block'] as String?,
      homeNo: json['homeNo'] as String?,
      area: (json['area'] as num?)?.toDouble(),
      bedrooms: json['bedrooms'] as int?,
      bathrooms: json['bathrooms'] as int?,
      floorNumber: json['floorNumber'] as String?,
      condition: json['condition'] as String?,
      legalizedYear: json['legalizedYear'] as int?,
      description: json['description'] as String?,
      features: (json['features'] as List?)?.map((e) => '$e').toList() ?? const [],
      images: (json['images'] as List?)?.map((e) => '$e').toList() ?? const [],
      videoUrl: json['videoUrl'] as String?,
      featured: json['featured'] == true,
      status: json['status'] as String?,
      agentName: json['agentName'] as String?,
      displayPhone: json['displayPhone'] as String?,
      posterType: json['posterType'] as String?,
      ownerType: json['ownerType'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      locationDocument: json['locationDocument'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      agent: ListingAgent.fromJson(
        json['agent'] is Map<String, dynamic> ? json['agent'] as Map<String, dynamic> : null,
      ),
    );
  }
}