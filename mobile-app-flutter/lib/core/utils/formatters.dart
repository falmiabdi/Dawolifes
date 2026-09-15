import 'package:intl/intl.dart';

import '../config/app_config.dart';


abstract final class Formatters {
  static final NumberFormat _number = NumberFormat.decimalPattern('en_US');

  static String formatPrice(num price) => _number.format(price.toDouble());

  
  static String imageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final base = AppConfig.apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
    return url.startsWith('/') ? '$base$url' : '$base/$url';
  }
}
