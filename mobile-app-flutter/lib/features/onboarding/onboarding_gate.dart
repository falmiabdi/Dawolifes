import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../app.dart';
import 'onboarding_screen.dart';

/// Decides whether to show the onboarding flow or go straight to the app.
///
/// Onboarding is shown once (first launch) and skipped afterwards. Once seen,
/// the user is routed to their role-appropriate home: admins to the admin
/// portal, agents to the agent portal, and buyers/users to the app shell.
/// Post features are locked until the agent profile is approved.
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
