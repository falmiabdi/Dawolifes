import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/admin.dart';

void main() {
  group('AdminAgent', () {
    test('fromJson parses all fields', () {
      final json = {
        'id': 'a1',
        'username': 'agent1',
        'email': 'agent@test.com',
        'role': 'agent',
        'status': 'Pending',
        'rejectionReason': null,
        'isRootAdmin': false,
        'profilePhoto': 'photo.jpg',
        'phone': '0912345678',
        'onboardingComplete': true,
        'createdAt': '2024-01-01',
        'fullName': 'Agent Full Name',
        'gender': 'Male',
        'dateOfBirth': '1990-01-01',
        'nationality': 'Ethiopian',
        'preferredLanguage': 'am',
        'safaricomPhone': '0923456789',
        'region': 'Addis Ababa',
        'city': 'Bole',
        'woreda': 'Woreda 3',
        'kebele': '01',
        'fullAddress': 'Bole, Addis Ababa',
        'faydaFront': 'fayda_front.jpg',
        'faydaBack': 'fayda_back.jpg',
        'selfieFayda': 'selfie.jpg',
        'passportPhoto': 'passport.jpg',
        'highestEducation': 'Bachelor',
        'educationCertificate': 'cert.jpg',
        'agentExperience': '3-5 years',
        'companyName': 'ABC Real Estate',
        'officeAddress': 'Bole, Addis',
        'businessLicenseNumber': 'BL123',
        'businessLicenseFile': 'bl.jpg',
        'tinNumber': 'TIN123',
      };
      final agent = AdminAgent.fromJson(json);
      expect(agent.id, 'a1');
      expect(agent.username, 'agent1');
      expect(agent.email, 'agent@test.com');
      expect(agent.role, 'agent');
      expect(agent.status, 'Pending');
      expect(agent.rejectionReason, null);
      expect(agent.isRootAdmin, false);
      expect(agent.profilePhoto, 'photo.jpg');
      expect(agent.phone, '0912345678');
      expect(agent.onboardingComplete, true);
      expect(agent.createdAt, '2024-01-01');
      expect(agent.fullName, 'Agent Full Name');
      expect(agent.displayName, 'Agent Full Name');
    });

      test('displayName falls back to username when fullName empty', () {
      final json = {
        'id': 'a2',
        'username': 'agent2',
        'email': 'agent2@test.com',
        'role': 'agent',
        'status': 'Pending',
      };
      final agent = AdminAgent.fromJson(json);
      expect(agent.fullName, null);
      expect(agent.displayName, 'agent2');
    });

    test('copyWith updates status and rejectionReason', () {
      final agent = AdminAgent(
        id: 'a3',
        username: 'agent3',
        email: 'agent3@test.com',
        role: 'agent',
        status: 'Pending',
        rejectionReason: null,
      );
      final updated = agent.copyWith(status: 'Approved', rejectionReason: 'Missing docs');
      expect(updated.status, 'Approved');
      expect(updated.rejectionReason, 'Missing docs');
      expect(updated.id, 'a3');
      expect(updated.username, 'agent3');
      expect(updated.email, 'agent3@test.com');
    });

    test('copyWith preserves existing values when not provided', () {
      final agent = AdminAgent(
        id: 'a4',
        username: 'agent4',
        email: 'agent4@test.com',
        role: 'agent',
        status: 'Pending',
        rejectionReason: null,
      );
      final updated = agent.copyWith(status: 'Approved');
      expect(updated.status, 'Approved');
      expect(updated.rejectionReason, null);
      expect(updated.id, 'a4');
    });
  });

  group('AdminUser', () {
    test('fromJson parses all fields', () {
      final json = {
        'id': 'u1',
        'username': 'user1',
        'email': 'user@test.com',
        'role': 'buyer',
        'status': 'Active',
        'rejectionReason': null,
        'isRootAdmin': false,
        'createdAt': '2024-01-01',
        'phone': '0912345678',
      };
      final user = AdminUser.fromJson(json);
      expect(user.id, 'u1');
      expect(user.username, 'user1');
      expect(user.email, 'user@test.com');
      expect(user.role, 'buyer');
      expect(user.status, 'Active');
      expect(user.rejectionReason, null);
      expect(user.isRootAdmin, false);
      expect(user.createdAt, '2024-01-01');
      expect(user.phone, '0912345678');
    });

    test('fromJson defaults status to Pending when missing', () {
      final json = {
        'id': 'u2',
        'username': 'user2',
        'email': 'user2@test.com',
      };
      final user = AdminUser.fromJson(json);
      expect(user.status, 'Pending');
    });

    test('fromJson defaults role to user when missing', () {
      final json = {
        'id': 'u3',
        'username': 'user3',
        'email': 'user3@test.com',
      };
      final user = AdminUser.fromJson(json);
      expect(user.role, 'user');
    });
  });
}
