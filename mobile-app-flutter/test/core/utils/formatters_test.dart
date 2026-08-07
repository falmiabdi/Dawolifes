import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/core/utils/formatters.dart';

void main() {
  group('Formatters', () {
    group('formatPrice', () {
      test('formats integer with thousand separators', () {
        expect(Formatters.formatPrice(1000000), '1,000,000');
        expect(Formatters.formatPrice(5000), '5,000');
        expect(Formatters.formatPrice(0), '0');
      });

      test('formats double with decimal places', () {
        expect(Formatters.formatPrice(1000.50), '1,000.5');
        expect(Formatters.formatPrice(300.75), '300.75');
      });

      test('formats large numbers', () {
        expect(Formatters.formatPrice(5000000), '5,000,000');
        expect(Formatters.formatPrice(100000000), '100,000,000');
      });
    });

    group('imageUrl', () {
      test('returns absolute URL unchanged', () {
        expect(Formatters.imageUrl('https://example.com/img.jpg'), 'https://example.com/img.jpg');
        expect(Formatters.imageUrl('http://example.com/img.jpg'), 'http://example.com/img.jpg');
      });

      test('resolves relative path against base URL', () {
        final url = Formatters.imageUrl('/uploads/img.jpg');
        expect(url.contains('uploads/img.jpg'), true);
        expect(url.startsWith('https://'), true);
      });

      test('resolves relative path without leading slash', () {
        final url = Formatters.imageUrl('uploads/img.jpg');
        expect(url.contains('uploads/img.jpg'), true);
      });

      test('returns empty string for empty input', () {
        expect(Formatters.imageUrl(''), '');
      });
    });
  });
}
