import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/i18n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/language_provider.dart';

/// DawoLife brand orange (#F38121).
const Color kBrandOrange = Color(0xFFF38121);

/// Data for one onboarding page. Each page is a localized version of the
/// welcome message (Oromo, English, Amharic).
class _OnboardingPage {
  const _OnboardingPage({
    required this.headline,
    required this.subtitle,
    required this.ctaLabel,
    required this.languageLabel,
    required this.language,
  });

  final String headline;
  final String subtitle;
  final String ctaLabel;
  final String languageLabel;
  final AppLanguage language;
}

/// Polished, brand-first onboarding flow. Shows the DawoLife logo, the
/// provided umbrella/property/car illustration and a welcome message in three
/// languages, with an animated 4-dot indicator, orange CTA and language picker.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onDone});

  /// Called when the user completes the flow (taps the CTA on the last page).
  final VoidCallback onDone;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  static const _pages = <_OnboardingPage>[
    _OnboardingPage(
      headline: 'Baga Nagaan Gara DawoLife Dhuftan!',
      subtitle: 'DawoLife – Bakka Argamaa Jireenyaa fi Gammachuu',
      ctaLabel: 'Jalaqabi!',
      languageLabel: 'Afaan Oromoo',
      language: AppLanguage.oromo,
    ),
    _OnboardingPage(
      headline: 'Welcome to DawoLife!',
      subtitle: 'DawoLife – Where Life and Happiness Come Together.',
      ctaLabel: 'Get Started',
      languageLabel: 'English',
      language: AppLanguage.english,
    ),
    _OnboardingPage(
      headline: 'ወደ DawoLife እንኳን በደህና መጡ!',
      subtitle: 'ቤት ይፈልጉ፣ መኪና ይግዙ እና አገልግሎቶችን በቀላሉ ያግኙ።',
      ctaLabel: 'ይጀምሩ',
      languageLabel: 'አማርኛ',
      language: AppLanguage.amharic,
    ),
  ];

  late final AnimationController _intro;
  final PageController _controller = PageController();
  int _current = 0;

  @override
  void initState() {
    super.initState();
    _intro = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
  }

  @override
  void dispose() {
    _intro.dispose();
    _controller.dispose();
    super.dispose();
  }

  _OnboardingPage get _page => _pages[_current];
  bool get _isLast => _current == _pages.length - 1;

  void _onCtaPressed() {
    if (_isLast) {
      widget.onDone();
      return;
    }
    _controller.nextPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    );
  }

  void _openLanguagePicker() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Choose Language',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              for (var i = 0; i < _pages.length; i++)
                ListTile(
                  leading: const Icon(Icons.language, color: kBrandOrange),
                  title: Text(
                    _pages[i].languageLabel,
                    style: const TextStyle(fontSize: 15),
                  ),
                  trailing: i == _current
                      ? const Icon(Icons.check_circle, color: kBrandOrange)
                      : null,
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    final lang = _pages[i].language;
                    context.read<LanguageProvider>().setLang(lang);
                    if (i != _current) {
                      _controller.animateToPage(
                        i,
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.easeOutCubic,
                      );
                    }
                  },
                ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            _buildLogo(),
            Expanded(child: _buildPageView()),
            _buildDots(),
            const SizedBox(height: 16),
            _buildCta(),
            const SizedBox(height: 18),
            _buildLanguageSelector(),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo() {
    final slide = CurvedAnimation(parent: _intro, curve: const Interval(0.0, 0.55, curve: Curves.easeOut));
    return FadeTransition(
      opacity: slide,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, -0.15),
          end: Offset.zero,
        ).animate(slide),
        child: Padding(
          padding: const EdgeInsets.only(top: 20, bottom: 8),
          child: Image.asset(
            'assets/images/dawolife_logo.png',
            height: 72,
            fit: BoxFit.contain,
            errorBuilder: (_, _, _) => const SizedBox(height: 72),
          ),
        ),
      ),
    );
  }

  Widget _buildPageView() {
    return PageView.builder(
      controller: _controller,
      itemCount: _pages.length,
      onPageChanged: (index) => setState(() => _current = index),
      itemBuilder: (context, index) {
        final page = _pages[index];
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: _buildIllustration(index: index),
              ),
              const SizedBox(height: 28),
              Text(
                page.headline,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF1F2937),
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                page.subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.mutedForeground,
                  fontSize: 15,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _buildIllustration({required int index}) {
    final fade = CurvedAnimation(parent: _intro, curve: const Interval(0.15, 1.0, curve: Curves.easeOut));
    return FadeTransition(
      opacity: fade,
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.92, end: 1.0).animate(fade),
        child: Image.asset(
          'assets/images/onboarding_illustration.png',
          fit: BoxFit.contain,
          errorBuilder: (_, _, _) => const SizedBox.shrink(),
        ),
      ),
    );
  }

  Widget _buildDots() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(_pages.length, (i) {
        final active = i == _current;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: active ? 24 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: active ? kBrandOrange : const Color(0xFFE5E7EB),
            borderRadius: BorderRadius.circular(999),
          ),
        );
      }),
    );
  }

  Widget _buildCta() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: _PressScale(
        onTap: _onCtaPressed,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          transitionBuilder: (child, animation) =>
              FadeTransition(opacity: animation, child: child),
          child: Container(
            key: ValueKey(_current),
            height: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: kBrandOrange,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: kBrandOrange.withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Text(
              _page.ctaLabel,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageSelector() {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _openLanguagePicker,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.language, color: AppColors.mutedForeground, size: 18),
            const SizedBox(width: 6),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: Text(
                _page.languageLabel,
                key: ValueKey(_current),
                style: const TextStyle(
                  color: AppColors.mutedForeground,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 2),
            const Icon(Icons.arrow_drop_down, color: AppColors.mutedForeground, size: 20),
          ],
        ),
      ),
    );
  }
}

/// Subtle press/scale animation for the primary CTA.
class _PressScale extends StatefulWidget {
  const _PressScale({required this.onTap, required this.child});

  final VoidCallback onTap;
  final Widget child;

  @override
  State<_PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<_PressScale> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
