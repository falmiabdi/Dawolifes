import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/network/websocket_service.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/announcement.dart';
import '../../data/repositories/announcement_repository.dart';
import '../portal/widgets.dart';

/// News / announcements feed mirroring the web app's `/news` page.
/// Refreshes from the API and on real-time WebSocket `announcement` events.
class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  List<Announcement> _announcements = [];
  bool _loading = true;
  String? _error;
  StreamSubscription<WSMessage>? _wsSub;

  AnnouncementRepository get _repo => AnnouncementRepository(context.read<ApiClient>());

  @override
  void initState() {
    super.initState();
    _load();
    _wsSub = context.read<WebSocketService>().messages.listen((msg) {
      if (msg.type == WSMessageType.announcement && mounted) {
        _load(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final items = await _repo.fetchAnnouncements();
      if (!mounted) return;
      setState(() {
        _announcements = items;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (!silent) _error = '$e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('News & Announcements'),
        centerTitle: false,
      ),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _announcements.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: const [
                            SizedBox(height: 120),
                            EmptyState(
                              icon: Icons.campaign_outlined,
                              message: 'No announcements yet',
                            ),
                          ],
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          itemCount: _announcements.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 16),
                          itemBuilder: (context, index) {
                            final item = _announcements[index];
                            return _AnnouncementCard(announcement: item);
                          },
                        ),
                ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.announcement});

  final Announcement announcement;

  String _formatDate(String? iso) {
    if (iso == null) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final date = _formatDate(announcement.createdAt);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (date.isNotEmpty)
            Text(
              date,
              style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground, fontWeight: FontWeight.w500),
            ),
          const SizedBox(height: 4),
          Text(
            announcement.title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.foreground),
          ),
          const SizedBox(height: 8),
          Text(
            announcement.content,
            style: const TextStyle(fontSize: 14, color: AppColors.mutedForeground, height: 1.4),
          ),
        ],
      ),
    );
  }
}
