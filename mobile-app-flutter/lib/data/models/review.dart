
class AgentReview {
  const AgentReview({
    required this.id,
    required this.rating,
    this.comment,
    required this.createdAt,
    required this.reviewerId,
    required this.reviewerName,
    this.reviewerPhoto,
  });

  final String id;
  final int rating;
  final String? comment;
  final DateTime createdAt;
  final String reviewerId;
  final String reviewerName;
  final String? reviewerPhoto;

  factory AgentReview.fromJson(Map<String, dynamic> json) {
    final reviewer = json['reviewer'] is Map<String, dynamic>
        ? json['reviewer'] as Map<String, dynamic>
        : null;
    return AgentReview(
      id: '${json['id'] ?? ''}',
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment'] as String?,
      createdAt:
          DateTime.tryParse('${json['createdAt'] ?? ''}')?.toLocal() ?? DateTime.now(),
      reviewerId: '${reviewer?['id'] ?? ''}',
      reviewerName: '${reviewer?['username'] ?? 'User'}',
      reviewerPhoto: reviewer?['profilePhoto'] as String?,
    );
  }
}


class AgentReviews {
  const AgentReviews({
    required this.average,
    required this.count,
    required this.reviews,
  });

  const AgentReviews.empty()
      : average = 0,
        count = 0,
        reviews = const [];

  final double average;
  final int count;
  final List<AgentReview> reviews;

  factory AgentReviews.fromJson(Map<String, dynamic> json) {
    final rating = json['rating'] is Map<String, dynamic>
        ? json['rating'] as Map<String, dynamic>
        : null;
    final reviewList = json['reviews'] is List
        ? (json['reviews'] as List)
            .whereType<Map<String, dynamic>>()
            .map(AgentReview.fromJson)
            .toList()
        : <AgentReview>[];
    return AgentReviews(
      average: (rating?['average'] as num?)?.toDouble() ?? 0,
      count: (rating?['count'] as num?)?.toInt() ?? reviewList.length,
      reviews: reviewList,
    );
  }
}