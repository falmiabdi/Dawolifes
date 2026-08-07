import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/message.dart';

void main() {
  group('Conversation', () {
    test('fromJson parses all fields', () {
      final json = {
        'id': 'c1',
        'propertyId': 'p1',
        'propertyTitle': 'Villa',
        'senderId': 'u1',
        'senderName': 'Alice',
        'recipientId': 'u2',
        'recipientName': 'Bob',
        'content': 'Is this still available?',
        'read': true,
        'createdAt': '2024-01-01T10:00:00.000Z',
      };
      final conv = Conversation.fromJson(json);
      expect(conv.id, 'c1');
      expect(conv.propertyId, 'p1');
      expect(conv.propertyTitle, 'Villa');
      expect(conv.senderId, 'u1');
      expect(conv.senderName, 'Alice');
      expect(conv.recipientId, 'u2');
      expect(conv.recipientName, 'Bob');
      expect(conv.content, 'Is this still available?');
      expect(conv.read, true);
      expect(conv.createdAt, isA<DateTime>());
    });

    test('fromJson defaults missing fields', () {
      final json = {'id': 'c2'};
      final conv = Conversation.fromJson(json);
      expect(conv.id, 'c2');
      expect(conv.propertyId, '');
      expect(conv.propertyTitle, 'Listing');
      expect(conv.senderId, '');
      expect(conv.senderName, '');
      expect(conv.recipientId, '');
      expect(conv.recipientName, '');
      expect(conv.content, '');
      expect(conv.read, false);
      expect(conv.createdAt, isA<DateTime>());
    });

    test('fromJson parses createdAt to local DateTime', () {
      final json = {
        'id': 'c3',
        'createdAt': '2024-06-15T08:30:00.000Z',
      };
      final conv = Conversation.fromJson(json);
      expect(conv.createdAt.year, 2024);
      expect(conv.createdAt.month, 6);
      expect(conv.createdAt.day, 15);
    });
  });

  group('ChatMessage', () {
    test('fromJson parses all fields', () {
      final json = {
        'id': 'm1',
        'propertyId': 'p1',
        'senderId': 'u1',
        'senderName': 'Alice',
        'recipientId': 'u2',
        'recipientName': 'Bob',
        'content': 'Hello!',
        'read': true,
        'createdAt': '2024-01-01T10:00:00.000Z',
      };
      final msg = ChatMessage.fromJson(json);
      expect(msg.id, 'm1');
      expect(msg.propertyId, 'p1');
      expect(msg.senderId, 'u1');
      expect(msg.senderName, 'Alice');
      expect(msg.recipientId, 'u2');
      expect(msg.recipientName, 'Bob');
      expect(msg.content, 'Hello!');
      expect(msg.read, true);
      expect(msg.createdAt, isA<DateTime>());
    });

    test('fromJson defaults read to false', () {
      final json = {
        'id': 'm2',
        'propertyId': 'p1',
        'senderId': 'u1',
        'senderName': 'Alice',
        'recipientId': 'u2',
        'recipientName': 'Bob',
        'content': 'Hi',
        'createdAt': '2024-01-01T10:00:00.000Z',
      };
      final msg = ChatMessage.fromJson(json);
      expect(msg.read, false);
    });

    test('fromJson defaults createdAt to now when invalid', () {
      final json = {
        'id': 'm3',
        'propertyId': 'p1',
        'senderId': 'u1',
        'senderName': 'Alice',
        'recipientId': 'u2',
        'recipientName': 'Bob',
        'content': 'Hi',
        'createdAt': 'not-a-date',
      };
      final msg = ChatMessage.fromJson(json);
      expect(msg.createdAt, isA<DateTime>());
      expect(msg.createdAt.isAfter(DateTime.now().subtract(const Duration(seconds: 1))), true);
    });
  });
}
