import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/network/websocket_service.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/message.dart';
import '../../data/repositories/message_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../auth/login_screen.dart';
import 'chat_screen.dart';

/// Inbox screen, mirroring GET /api/messages/inbox. Refreshes from the API
/// and also on real-time WebSocket `message` events for parity with the web.
class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Conversation> _conversations = [];
  bool _loading = true;
  String? _error;
  Timer? _pollTimer;
  StreamSubscription<WSMessage>? _wsSub;
  static const Duration _pollInterval = Duration(seconds: 5);

  @override
  void initState() {
    super.initState();
    _load();
    _startPolling();
    _wsSub = context.read<WebSocketService>().messages.listen((msg) {
      if (msg.type == WSMessageType.message && mounted) {
        _load(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _wsSub?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(_pollInterval, (_) {
      if (mounted) _load(silent: true);
    });
  }

  Future<void> _load({bool silent = false}) async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      if (!silent) setState(() => _loading = false);
      return;
    }
    try {
      final items = await context.read<MessageRepository>().fetchInbox();
      if (mounted) {
        setState(() {
          _conversations = items;
          _loading = false;
          _error = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted && !silent) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isLoggedIn) {
      return _LoggedOut(
        onLogin: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.destructive)))
              : _conversations.isEmpty
                  ? const Center(
                      child: Text(
                        'No messages yet',
                        style: TextStyle(color: AppColors.mutedForeground),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: _conversations.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final c = _conversations[index];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.muted,
                              child: Text(
                                (c.senderName.isNotEmpty ? c.senderName[0] : '?').toUpperCase(),
                                style: const TextStyle(color: AppColors.foreground, fontWeight: FontWeight.bold),
                              ),
                            ),
                            title: Text(
                              c.senderName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: AppColors.foreground,
                                fontWeight: c.read ? FontWeight.w500 : FontWeight.bold,
                              ),
                            ),
                            subtitle: Text(
                              c.content,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.mutedForeground, fontSize: 13),
                            ),
                            trailing: Text(
                              _timeAgo(c.createdAt),
                              style: const TextStyle(color: AppColors.mutedForeground, fontSize: 11),
                            ),
                            onTap: () {
                              final me = context.read<AuthProvider>().user?.id;
                              final isRecipient = c.recipientId == me;
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ChatScreen(
                                    propertyId: c.propertyId,
                                    propertyTitle: c.propertyTitle,
                                    recipientId: isRecipient ? c.senderId : c.recipientId,
                                    recipientName: isRecipient ? c.senderName : c.recipientName,
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      ),
                    ),
    );
  }

  String _timeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

class _LoggedOut extends StatelessWidget {
  const _LoggedOut({required this.onLogin});

  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LanguageProvider>().t;
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.chat_bubble_outline, size: 48, color: AppColors.mutedForeground),
              const SizedBox(height: 12),
              const Text(
                'Sign in to see your messages',
                style: TextStyle(color: AppColors.mutedForeground),
              ),
              const SizedBox(height: 16),
              FilledButton(onPressed: onLogin, child: Text(t('sign_in'))),
            ],
          ),
        ),
      ),
    );
  }
}
