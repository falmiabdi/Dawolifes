import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../data/repositories/notification_repository.dart';
import '../../features/notifications/notifications_screen.dart';




final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

const String _pushChannelId = 'notifications';
const String _pushChannelName = 'Notifications';







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







class PushNotificationService {
  PushNotificationService._();

  static final PushNotificationService instance = PushNotificationService._();

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  String? _fcmToken;
  bool _pendingOpen = false;
  String? _pendingEntityType;
  String? _pendingEntityId;

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
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _openNotifications(
        entityType: _entityOf(message.data, 'entityType'),
        entityId: _entityOf(message.data, 'entityId'),
      );
    });
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      _openNotifications(
        entityType: _entityOf(initial.data, 'entityType'),
        entityId: _entityOf(initial.data, 'entityId'),
      );
    }
  }

  
  Future<String?> refreshToken() async {
    try {
      _fcmToken = await FirebaseMessaging.instance.getToken();
    } catch (_) {
      _fcmToken = null;
    }
    return _fcmToken;
  }

  
  
  Future<void> register(NotificationRepository repo, String platform) async {
    final token = await refreshToken();
    if (token == null || token.isEmpty) return;
    try {
      await repo.registerPushToken(token, platform: platform);
    } catch (_) {}
  }

  
  
  Future<void> unregister(NotificationRepository repo) async {
    final token = _fcmToken;
    if (token == null || token.isEmpty) return;
    try {
      await repo.unregisterPushToken(token);
    } catch (_) {}
    _fcmToken = null;
  }

  
  
  
  
  void _openNotifications({String entityType = '', String entityId = ''}) {
    final nav = appNavigatorKey.currentState;
    if (nav == null || !nav.mounted) {
      _pendingOpen = true;
      _pendingEntityType = entityType;
      _pendingEntityId = entityId;
      return;
    }
    nav.push(
      MaterialPageRoute(
        builder: (_) => NotificationsScreen(
          entityType: entityType.isEmpty ? null : entityType,
          entityId: entityId.isEmpty ? null : entityId,
        ),
      ),
    );
  }

  void maybeOpenPending() {
    if (!_pendingOpen) return;
    _pendingOpen = false;
    final et = _pendingEntityType;
    final eid = _pendingEntityId;
    _pendingEntityType = null;
    _pendingEntityId = null;
    _openNotifications(entityType: et ?? '', entityId: eid ?? '');
  }

  
  
  static String _entityOf(Map<String, dynamic> data, String key) {
    final direct = data[key] as String?;
    final nested = data['data'];
    if (nested is String && nested.isNotEmpty) {
      try {
        final obj = jsonDecode(nested);
        if (obj is Map<String, dynamic>) {
          final inner = obj[key] as String?;
          if (inner != null && inner.isNotEmpty) return inner;
        }
      } catch (_) {}
    }
    return direct ?? '';
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
    await plugin.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) return;
        try {
          final obj = jsonDecode(payload);
          if (obj is Map<String, dynamic>) {
            PushNotificationService.instance._openNotifications(
              entityType: obj['entityType'] as String? ?? '',
              entityId: obj['entityId'] as String? ?? '',
            );
          }
        } catch (_) {}
      },
    );
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
      payload: jsonEncode({
        'entityType': _entityOf(data, 'entityType'),
        'entityId': _entityOf(data, 'entityId'),
      }),
    );
  }
}