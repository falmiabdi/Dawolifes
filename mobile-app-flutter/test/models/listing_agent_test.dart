import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/listing_agent.dart';

void main() {
  group('ListingAgent', () {
    test('returns default name when json is null', () {
      expect(const ListingAgent().displayName, 'Agent');
    });

    test('parses full json', () {
      final agent = ListingAgent.fromJson({
        'id': 'a1',
        'username': 'Alice',
        'phone': '0912345678',
        'email': 'alice@test.com',
        'profilePhoto': 'https://example.com/photo.jpg',
      });
      expect(agent.id, 'a1');
      expect(agent.name, 'Alice');
      expect(agent.phone, '0912345678');
      expect(agent.email, 'alice@test.com');
      expect(agent.avatar, 'https://example.com/photo.jpg');
      expect(agent.displayName, 'Alice');
    });

    test('falls back to name when username missing', () {
      final agent = ListingAgent.fromJson({
        'name': 'Bob',
        'phone': '0912345678',
      });
      expect(agent.name, 'Bob');
      expect(agent.displayName, 'Bob');
    });

    test('falls back to Agent when name and username missing', () {
      final agent = ListingAgent.fromJson({'id': 'a2'});
      expect(agent.displayName, 'Agent');
    });

    test('avatar falls back to avatar key', () {
      final agent = ListingAgent.fromJson({
        'avatar': 'https://example.com/avatar.jpg',
      });
      expect(agent.avatar, 'https://example.com/avatar.jpg');
    });
  });
}
