import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/user.dart';

void main() {
  group('SessionUser', () {
    test('fromJson parses all fields', () {
      final json = {
        'id': 'u1',
        'name': 'John Doe',
        'email': 'john@test.com',
        'role': 'agent',
        'roles': ['agent', 'buyer'],
        'status': 'Approved',
        'rejectionReason': null,
        'isRootAdmin': false,
        'profilePhoto': 'https://example.com/photo.jpg',
        'phone': '0912345678',
      };
      final user = SessionUser.fromJson(json);
      expect(user.id, 'u1');
      expect(user.name, 'John Doe');
      expect(user.email, 'john@test.com');
      expect(user.role, 'agent');
      expect(user.roles, ['agent', 'buyer']);
      expect(user.status, 'Approved');
      expect(user.rejectionReason, null);
      expect(user.isRootAdmin, false);
      expect(user.profilePhoto, 'https://example.com/photo.jpg');
      expect(user.phone, '0912345678');
    });

    test('fromJson falls back to username when name missing', () {
      final json = {
        'id': 'u2',
        'username': 'jane_doe',
        'email': 'jane@test.com',
        'role': 'buyer',
      };
      final user = SessionUser.fromJson(json);
      expect(user.name, 'jane_doe');
    });

    test('fromJson defaults role to buyer', () {
      final json = {
        'id': 'u3',
        'name': 'Buyer',
        'email': 'buyer@test.com',
      };
      final user = SessionUser.fromJson(json);
      expect(user.role, 'buyer');
    });

    test('fromJson defaults email to empty string', () {
      final json = {
        'id': 'u4',
        'name': 'No Email',
      };
      final user = SessionUser.fromJson(json);
      expect(user.email, '');
    });

    test('isAdmin is true for admin role', () {
      final user = SessionUser.fromJson({
        'id': 'u5',
        'name': 'Admin',
        'email': 'admin@test.com',
        'role': 'admin',
      });
      expect(user.isAdmin, true);
    });

    test('isAdmin is true when roles contains admin', () {
      final user = SessionUser.fromJson({
        'id': 'u6',
        'name': 'User',
        'email': 'user@test.com',
        'role': 'buyer',
        'roles': ['admin'],
      });
      expect(user.isAdmin, true);
    });

    test('isAdmin is false for buyer', () {
      final user = SessionUser.fromJson({
        'id': 'u7',
        'name': 'Buyer',
        'email': 'buyer@test.com',
        'role': 'buyer',
      });
      expect(user.isAdmin, false);
    });

    test('isAgent is true for agent role', () {
      final user = SessionUser.fromJson({
        'id': 'u8',
        'name': 'Agent',
        'email': 'agent@test.com',
        'role': 'agent',
      });
      expect(user.isAgent, true);
    });

    test('isAgent is false for buyer', () {
      final user = SessionUser.fromJson({
        'id': 'u9',
        'name': 'Buyer',
        'email': 'buyer@test.com',
        'role': 'buyer',
      });
      expect(user.isAgent, false);
    });

    test('canSell is true for agent', () {
      final agent = SessionUser.fromJson({
        'id': 'u10',
        'name': 'Agent',
        'email': 'agent@test.com',
        'role': 'agent',
      });
      expect(agent.canSell, true);
    });

    test('canSell is true for admin', () {
      final admin = SessionUser.fromJson({
        'id': 'u11',
        'name': 'Admin',
        'email': 'admin@test.com',
        'role': 'admin',
      });
      expect(admin.canSell, true);
    });

    test('canSell is false for buyer', () {
      final buyer = SessionUser.fromJson({
        'id': 'u12',
        'name': 'Buyer',
        'email': 'buyer@test.com',
        'role': 'buyer',
      });
      expect(buyer.canSell, false);
    });

    test('toJson roundtrips correctly', () {
      final json = {
        'id': 'u13',
        'name': 'Test User',
        'email': 'test@test.com',
        'role': 'agent',
        'roles': ['agent'],
        'status': 'Pending',
        'rejectionReason': 'Missing docs',
        'isRootAdmin': true,
        'profilePhoto': 'photo.jpg',
        'phone': '0911111111',
      };
      final user = SessionUser.fromJson(json);
      final roundtrip = user.toJson();
      expect(roundtrip['id'], 'u13');
      expect(roundtrip['name'], 'Test User');
      expect(roundtrip['email'], 'test@test.com');
      expect(roundtrip['role'], 'agent');
      expect(roundtrip['roles'], ['agent']);
      expect(roundtrip['status'], 'Pending');
      expect(roundtrip['rejectionReason'], 'Missing docs');
      expect(roundtrip['isRootAdmin'], true);
      expect(roundtrip['profilePhoto'], 'photo.jpg');
      expect(roundtrip['phone'], '0911111111');
    });
  });
}
