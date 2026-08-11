import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/message.dart';
import '../../data/repositories/message_repository.dart';
import '../../providers/auth_provider.dart';

/// Chat thread with the listing's agent, mirroring MessageAgent + messages.ts.
class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.propertyId,
    required this.propertyTitle,
    required this.recipientId,
    required this.recipientName,
  });

  final String propertyId;
  final String propertyTitle;
  final String recipientId;
  final String recipientName;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  List<ChatMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  bool _markedRead = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final repo = context.read<MessageRepository>();
      final messages = await repo.fetchThread(widget.propertyId);
      if (mounted) {
        setState(() {
          _messages = messages;
          _loading = false;
        });
        // Mark unread messages as read after loading
        if (!_markedRead) {
          _markUnreadAsRead();
        }
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markUnreadAsRead() async {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    if (user == null) return;

    final unreadMessages = _messages.where((m) => m.recipientId == user.id && !m.read).toList();
    if (unreadMessages.isEmpty) return;

    _markedRead = true;
    final repo = context.read<MessageRepository>();
    for (final msg in unreadMessages) {
      try {
        await repo.markRead(msg.id);
      } catch (_) {
        // Ignore individual failures
      }
    }
    // Update local state to show messages as read
    if (mounted) {
      setState(() {
        _messages = _messages.map((m) {
          if (m.recipientId == user.id && !m.read) {
            return m.copyWith(read: true);
          }
          return m;
        }).toList();
      });
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;

    final auth = context.read<AuthProvider>();
    final user = auth.user;
    if (user == null) return;
    if (widget.recipientId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No agent contact available for this listing.')),
      );
      return;
    }
    if (widget.recipientId == user.id) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This is your own listing.')),
      );
      return;
    }

    setState(() => _sending = true);
    _controller.clear();

    try {
      await context.read<MessageRepository>().send(
            propertyId: widget.propertyId,
            recipientId: widget.recipientId,
            recipientName: widget.recipientName,
            content: text,
          );
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.recipientName.isNotEmpty ? widget.recipientName : 'Agent',
                style: const TextStyle(fontSize: 16)),
            Text(widget.propertyTitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _messages.isEmpty
                    ? const Center(
                        child: Text(
                          'No messages yet. Say hello!',
                          style: TextStyle(color: AppColors.mutedForeground),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) => _Bubble(message: _messages[index]),
                      ),
          ),
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 4,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(hintText: 'Type a message...'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : _send,
                    style: IconButton.styleFrom(backgroundColor: AppColors.primary),
                    icon: const Icon(Icons.send, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isMine = context.read<AuthProvider>().user?.id == message.senderId;

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: const BoxConstraints(maxWidth: 280),
        decoration: BoxDecoration(
          color: isMine ? AppColors.primary : AppColors.muted,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMine ? 16 : 4),
            bottomRight: Radius.circular(isMine ? 4 : 16),
          ),
        ),
        child: Text(
          message.content,
          style: TextStyle(color: isMine ? Colors.white : AppColors.foreground, fontSize: 14),
        ),
      ),
    );
  }
}
