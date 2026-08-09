import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'onboarding_gate.dart';

/// Launch splash shown on every app open. Displays the DawoLife brand icon
/// (large icon1 on top and centered) before handing off to the onboarding gate,
/// so the splash is always visible even when onboarding was already completed.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.storage});

  final SharedPreferences storage;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward();

    Future.delayed(const Duration(milliseconds: 1800), _goNext);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _goNext() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => OnboardingGate(storage: widget.storage),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: FadeTransition(
          opacity: fade,
          child: Column(
            children: [
              const SizedBox(height: 48),
              Image.asset(
                'assets/images/icon 1.png',
                height: 120,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const SizedBox(height: 120),
              ),
              Expanded(
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.94, end: 1.0).animate(fade),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Image.asset(
                      'assets/images/icon 1.png',
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => const SizedBox.shrink(),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
