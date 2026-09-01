import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../data/repositories/notification_repository.dart';
import '../../features/notifications/notifications_screen.dart';

/// Global [NavigatorKey] so taps on push notifications (which arrive outside
/// the widget tree, e.g. from a cold start) can navigate to the notifications
/// screen. Assigned to the root `MaterialApp.navigatorKey`.
final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

const String _pushChannelId = 'notifications';
const String _pushChannelName = 'Notifications';

/// Android shows system-tray notifications itself for FCM messages that carry a
/// [RemoteMessage.notification]. This handler covers data-only messages while
/// the app is in the background/terminated state. It must stay a top-level
/// function (Firebase requires `@pragma('vm:entry-point')`-tagged top-level or
/// static entries). Plugins are registered automatically in the background
/// isolate by the engine on this Flutter version.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    final plugin = FlutterLocalNotificationsPlugin();
    await PushNotificationService._initLocalPlugin(plugin);
    await PushNotificationService._showLocal(
      plugin,
      message,
      id: message.messageId?.hashCode ?? 0,
    );
  } catch (_) {}
}

/// Manages FCM registration + local notification display.
///
/// - Foreground messages: rendered as a local notification (FCM does not
///   display anything while the app is open).
/// - Background/terminated: handled by the OS (Android) / APNs (iOS); taps are
///   caught via [FirebaseMessaging.onMessageOpenedApp] / `getInitialMessage`.
class PushNotificationService {
  PushNotificationService._();

  static final PushNotificationService instance = PushNotificationService._();

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  String? _fcmToken;
  bool _pendingOpen = false;

  String? get fcmToken => _fcmToken;

  Future<void> initialize() async {
    await _initLocalPlugin(_local);

    try {
      await _local
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    } catch (_) {}

    try {
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (_) {}

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    FirebaseMessaging.onMessage.listen((message) {
      _showLocal(_local, message, id: message.messageId?.hashCode ?? 0);
    });
    FirebaseMessaging.onMessageOpenedApp.listen((_) => _openNotifications());
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) _openNotifications();
  }

  /// Fetches the current FCM token (cached for unregister-on-logout).
  Future<String?> refreshToken() async {
    try {
      _fcmToken = await FirebaseMessaging.instance.getToken();
    } catch (_) {
      _fcmToken = null;
    }
    return _fcmToken;
  }

  /// Registers this device's FCM token with the backend so the server can send
  /// pushes. Best-effort: never throws.
  Future<void> register(NotificationRepository repo, String platform) async {
    final token = await refreshToken();
    if (token == null || token.isEmpty) return;
    try {
      await repo.registerPushToken(token, platform: platform);
    } catch (_) {}
  }

  /// Removes this device's FCM token from the backend (e.g. on logout).
  /// Best-effort: never throws.
  Future<void> unregister(NotificationRepository repo) async {
    final token = _fcmToken;
    if (token == null || token.isEmpty) return;
    try {
      await repo.unregisterPushToken(token);
    } catch (_) {}
    _fcmToken = null;
  }

  /// Navigates to the notifications screen when a push is tapped. If the
  /// navigator isn't ready yet (cold-start tap before first frame), defers the
  /// navigation until [maybeOpenPending] is called.
  void _openNotifications() {
    final nav = appNavigatorKey.currentState;
    if (nav == null || !nav.mounted) {
      _pendingOpen = true;
      return;
    }
    nav.push(MaterialPageRoute(builder: (_) => const NotificationsScreen()));
  }

  void maybeOpenPending() {
    if (!_pendingOpen) return;
    _pendingOpen = false;
    _openNotifications();
  }

  static Future<void> _initLocalPlugin(FlutterLocalNotificationsPlugin plugin) async {
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    );
    await plugin.initialize(settings: settings);
  }

  static Future<void> _showLocal(
    FlutterLocalNotificationsPlugin plugin,
    RemoteMessage message, {
    required int id,
  }) async {
    final data = message.data;
    final title = message.notification?.title ?? data['title'] as String? ?? 'DawoLife';
    final body = message.notification?.body ?? data['body'] as String? ?? '';
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _pushChannelId,
        _pushChannelName,
        channelDescription: 'Real-time DawoLife notifications',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    await plugin.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: details,
      payload: data['type'] as String?,
    );
  }
}