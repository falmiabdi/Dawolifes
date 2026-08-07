/// Payment record, matching the Payment interface from the web app.
class Payment {
  const Payment({
    required this.id,
    this.orderId,
    this.title,
    this.amount,
    this.status,
    this.method,
    this.paymentType,
    this.buyerPhone,
    this.createdAt,
    this.userName,
  });

  final String id;
  final String? orderId;
  final String? title;
  final num? amount;
  final String? status;
  final String? method;
  final String? paymentType;
  final String? buyerPhone;
  final String? createdAt;
  final String? userName;

  String get typeLabel => (paymentType ?? '').replaceAll('_', ' ');

  factory Payment.fromJson(Map<String, dynamic> json) {
    final user = json['user'] is Map<String, dynamic> ? json['user'] as Map<String, dynamic> : null;
    return Payment(
      id: '${json['_id'] ?? json['id']}',
      orderId: json['orderId'] as String?,
      title: json['title'] as String?,
      amount: json['amount'] as num?,
      status: json['status'] as String?,
      method: json['method'] as String?,
      paymentType: json['paymentType'] as String?,
      buyerPhone: json['buyerPhone'] as String?,
      createdAt: json['createdAt'] as String?,
      userName: user?['fullName'] as String? ?? user?['username'] as String?,
    );
  }
}

/// Aggregated payment statistics from `/api/payments`.
class PaymentStats {
  const PaymentStats({
    this.totalRevenue = 0,
    this.completedCount = 0,
    this.pendingCount = 0,
    this.failedCount = 0,
    this.totalCount = 0,
  });

  final num totalRevenue;
  final int completedCount;
  final int pendingCount;
  final int failedCount;
  final int totalCount;

  factory PaymentStats.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const PaymentStats();
    return PaymentStats(
      totalRevenue: json['totalRevenue'] ?? 0,
      completedCount: json['completedCount'] ?? 0,
      pendingCount: json['pendingCount'] ?? 0,
      failedCount: json['failedCount'] ?? 0,
      totalCount: json['totalCount'] ?? 0,
    );
  }
}
