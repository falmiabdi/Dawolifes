import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/payment.dart';

void main() {
  group('Payment', () {
    test('fromJson uses _id when id missing', () {
      final json = {
        '_id': 'pay1',
        'orderId': 'ord1',
        'title': 'Property Listing',
        'amount': 5000,
        'status': 'Completed',
        'method': 'Telebirr',
        'paymentType': 'listing_fee',
        'buyerPhone': '0912345678',
        'createdAt': '2024-01-01',
        'user': {'fullName': 'Alice'},
      };
      final payment = Payment.fromJson(json);
      expect(payment.id, 'pay1');
      expect(payment.orderId, 'ord1');
      expect(payment.title, 'Property Listing');
      expect(payment.amount, 5000);
      expect(payment.status, 'Completed');
      expect(payment.method, 'Telebirr');
      expect(payment.paymentType, 'listing_fee');
      expect(payment.buyerPhone, '0912345678');
      expect(payment.createdAt, '2024-01-01');
      expect(payment.userName, 'Alice');
    });

    test('fromJson falls back to id when _id missing', () {
      final json = {
        'id': 'pay2',
        'title': 'Vehicle',
        'amount': 3000,
      };
      final payment = Payment.fromJson(json);
      expect(payment.id, 'pay2');
    });

    test('fromJson falls back to username when fullName missing', () {
      final json = {
        '_id': 'pay3',
        'user': {'username': 'bob'},
      };
      final payment = Payment.fromJson(json);
      expect(payment.userName, 'bob');
    });

    test('typeLabel replaces underscores with spaces', () {
      final payment = const Payment(
        id: 'pay4',
        paymentType: 'listing_fee',
      );
      expect(payment.typeLabel, 'listing fee');
    });

    test('typeLabel handles empty paymentType', () {
      final payment = const Payment(id: 'pay5');
      expect(payment.typeLabel, '');
    });
  });

  group('PaymentStats', () {
    test('fromJson parses all fields', () {
      final json = {
        'totalRevenue': 10000,
        'completedCount': 5,
        'pendingCount': 2,
        'failedCount': 1,
        'totalCount': 8,
      };
      final stats = PaymentStats.fromJson(json);
      expect(stats.totalRevenue, 10000);
      expect(stats.completedCount, 5);
      expect(stats.pendingCount, 2);
      expect(stats.failedCount, 1);
      expect(stats.totalCount, 8);
    });

    test('fromJson defaults to zeros when json is null', () {
      final stats = PaymentStats.fromJson(null);
      expect(stats.totalRevenue, 0);
      expect(stats.completedCount, 0);
      expect(stats.pendingCount, 0);
      expect(stats.failedCount, 0);
      expect(stats.totalCount, 0);
    });

    test('fromJson defaults missing fields to zero', () {
      final stats = PaymentStats.fromJson({});
      expect(stats.totalRevenue, 0);
      expect(stats.completedCount, 0);
    });
  });
}
