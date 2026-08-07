import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../data/repositories/message_repository.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/signup_screen.dart';
import '../features/home/home_screen.dart';
import '../features/messages/messages_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/saved/saved_screen.dart';
import '../features/sell/sell_screen.dart';
import '../providers/auth_provider.dart';

/// Root shell with the bottom navigation, mirroring bottom-nav.tsx.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  int _unread = 0;
  Timer? _unreadTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadUnread());
    // Mirror the web bottom nav: poll the unread message count every 30s.
    _unreadTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadUnread());
  }

  @override
  void dispose() {
    _unreadTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadUnread() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      if (_unread != 0) setState(() => _unread = 0);
      return;
    }
    try {
      final count = await context.read<MessageRepository>().fetchUnreadCount();
      if (mounted && count != _unread) setState(() => _unread = count);
    } catch (_) {
      // Ignore polling failures.
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          const HomeScreen(),
          const SavedScreen(),
          const SellScreen(),
          const MessagesScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (index) => _onTap(context, index, auth),
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.mutedForeground,
        selectedFontSize: 10,
        unselectedFontSize: 10,
        type: BottomNavigationBarType.fixed,
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          const BottomNavigationBarItem(icon: Icon(Icons.bookmark_border), label: 'Saved'),
          const BottomNavigationBarItem(
            icon: Icon(Icons.sell_outlined),
            label: 'Sell',
          ),
          BottomNavigationBarItem(
            icon: _UnreadBadge(icon: Icons.chat_bubble_outline, count: _unread),
            label: 'Messages',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }

  void _onTap(BuildContext context, int index, AuthProvider auth) {
    switch (index) {
      case 1: // Saved
        if (!auth.isLoggedIn) {
          _push(context, const SignupScreen());
          return;
        }
      case 3: // Messages
        if (!auth.isLoggedIn) {
          _pushLogin(context);
          return;
        }
    }
    setState(() => _index = index);
  }

  void _pushLogin(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _push(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }
}

class _UnreadBadge extends StatelessWidget {
  const _UnreadBadge({required this.icon, required this.count});

  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon, size: 24),
        if (count > 0)
          Positioned(
            right: -8,
            top: -6,
            child: Container(
              constraints: const BoxConstraints(minWidth: 16),
              padding: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
              ),
            ),
          ),
      ],
    );
  }
}
