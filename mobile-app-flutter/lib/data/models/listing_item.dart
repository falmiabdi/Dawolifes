import 'listing_agent.dart';
import 'property.dart';
import 'vehicle.dart';

/// A unified item rendered by the home grid and saved list,
/// matching the ListingItem interface from image-section.tsx.
class ListingItem {
  const ListingItem({
    required this.id,
    required this.image,
    required this.title,
    required this.listingType,
    required this.price,
    required this.isVehicle,
    this.priceType,
    this.location,
    this.type,
    this.beds,
    this.baths,
    this.area,
    this.condition,
    this.year,
    this.mileage,
    this.features = const [],
    this.status,
    this.agent,
    this.agentName,
    this.displayPhone,
    this.displayPhoto,
    this.contactUserId,
  });

  final String id;
  final String image;
  final String title;
  final String listingType;
  final num price;
  final bool isVehicle;
  final String? priceType;
  final String? location;
  final String? type;
  final int? beds;
  final int? baths;
  final num? area;
  final String? condition;
  final int? year;
  final num? mileage;
  final List<String> features;
  final String? status;
  final ListingAgent? agent;
  final String? agentName;
  final String? displayPhone;
  final String? displayPhoto;
  final String? contactUserId;

  /// Name shown on the public listing: the stored override wins when present,
  /// otherwise falls back to the agent account name.
  String get contactName {
    final n = agentName?.trim() ?? '';
    final email = agent?.email?.trim() ?? '';
    if (n.isNotEmpty && n.toLowerCase() != email.toLowerCase()) return n;
    return agent?.displayName ?? 'Agent';
  }

  /// Phone shown on the public listing: stored override wins over agent phone.
  String get contactPhone {
    final p = displayPhone?.trim() ?? '';
    if (p.isNotEmpty) return p;
    return agent?.phone?.trim() ?? '';
  }

  /// Profile photo shown on the public listing: stored override wins.
  String get contactPhoto {
    final p = displayPhoto?.trim() ?? '';
    if (p.isNotEmpty) return p;
    return agent?.avatar?.trim() ?? '';
  }

  /// User id the Message button routes to: follows the admin-switched contact
  /// when one is set, otherwise the listing's original agent.
  String? get messageRecipientId {
    final c = contactUserId?.trim();
    if (c != null && c.isNotEmpty) return c;
    final a = agent?.id?.trim();
    return (a != null && a.isNotEmpty) ? a : null;
  }

  bool get isRent {
    final t = listingType.toLowerCase();
    return t.contains('rent') || t.contains('both');
  }

  factory ListingItem.fromProperty(Property p) => ListingItem(
        id: p.id,
        image: p.images.isNotEmpty ? p.images.first : '',
        title: p.title,
        listingType: p.listingType,
        price: p.price,
        priceType: p.priceType,
        location: p.location,
        type: p.type,
        beds: p.bedrooms,
        baths: p.bathrooms,
        area: p.area,
        condition: p.condition,
        features: p.features,
        status: p.status,
        agent: p.agent,
        agentName: p.agentName,
        displayPhone: p.displayPhone,
        displayPhoto: p.displayPhoto,
        contactUserId: p.contactUserId,
        isVehicle: false,
      );

  factory ListingItem.fromVehicle(Vehicle v) => ListingItem(
        id: v.id,
        image: v.images.isNotEmpty ? v.images.first : '',
        title: v.title,
        listingType: v.listingType,
        price: v.price ?? 0,
        priceType: v.priceType,
        location: v.location,
        type: 'Vehicle',
        year: v.manufacturingYear,
        mileage: v.mileage,
        features: v.features,
        status: v.status,
        agent: v.agent,
        agentName: v.agentName,
        displayPhone: v.displayPhone,
        displayPhoto: v.displayPhoto,
        contactUserId: v.contactUserId,
        isVehicle: true,
      );

  /// Matches the search/filter logic from mobile-home.tsx.
  bool matches({String query = '', String category = ''}) {
    final term = query.trim().toLowerCase();

    if (category.isNotEmpty) {
      final isVehicleCat = category == 'Vehicle';
      final itemType = (type ?? '').toLowerCase();
      final itemListingType = listingType.toLowerCase();
      final itemTitle = title.toLowerCase();
      final matchesType = isVehicleCat
          ? itemType == 'vehicle'
          : itemType == category.toLowerCase() ||
              itemListingType.contains(category.toLowerCase()) ||
              itemTitle.contains(category.toLowerCase());
      if (!matchesType) return false;
    }

    if (term.isEmpty) return true;

    final searchable = [
      title,
      location ?? '',
      listingType,
      type ?? '',
      priceType ?? '',
      price > 0 ? '$price' : '',
      beds != null ? 'bed $beds' : '',
      beds != null ? '$beds' : '',
      baths != null ? 'bath $baths' : '',
      baths != null ? '$baths' : '',
      area != null ? 'area $area' : '',
      area != null ? '$area' : '',
      year != null ? '$year' : '',
      mileage != null ? '$mileage' : '',
      ...features,
    ].join(' ').toLowerCase();

    return searchable.contains(term);
  }
}
