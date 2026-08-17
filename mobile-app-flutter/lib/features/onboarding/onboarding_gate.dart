import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../app.dart';
import '../../providers/auth_provider.dart';
import '../admin/admin_portal.dart';
import '../agent/agent_onboarding_screen.dart';
import '../agent/agent_portal.dart';
import 'onboarding_screen.dart';

/// Decides whether to show the onboarding flow or go straight to the app.
///
/// Onboarding is shown once (first launch) and skipped afterwards. Once seen,
/// the user is routed to their role-appropriate home: admins to the admin
/// portal, agents to the agent portal (or their onboarding form while not yet
/// approved), and buyers/users to the app shell.
class OnboardingGate extends StatefulWidget {
  const OnboardingGate({super.key, required this.storage});

  final SharedPreferences storage;

  static const String seenKey = 'onboarding_seen';

  @override
  State<OnboardingGate> createState() => _OnboardingGateState();
}

class _OnboardingGateState extends State<OnboardingGate> {
  late bool _seen;

  @override
  void initState() {
    super.initState();
    _seen = widget.storage.getBool(OnboardingGate.seenKey) ?? false;
  }

  Widget _roleHome() {
    final user = context.read<AuthProvider>().user;
    if (user != null && user.isAdmin) return const AdminPortalScreen();
    if (user != null && user.isAgent) {
      return user.status == 'Approved' ? const AgentPortalScreen() : const AgentOnboardingScreen();
    }
    return const AppShell();
  }

  Future<void> _finish() async {
    await widget.storage.setBool(OnboardingGate.seenKey, true);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => _roleHome()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_seen) return _roleHome();
    return OnboardingScreen(onDone: _finish);
  }
}
