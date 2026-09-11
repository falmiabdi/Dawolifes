import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../auth/auth_routing.dart';
import 'agent_onboarding_screen.dart';

/// Full-page pending/rejected/suspended state for agents & owners, mirroring
/// web/components/agent/pending-approval.tsx.
///
/// Shown right after onboarding is submitted (the account stays Pending until
/// an admin approves it) so the seller knows exactly where they stand. Once
/// status becomes 'Approved', the user is returned to the app shell.
class PendingApprovalScreen extends StatefulWidget {
  const PendingApprovalScreen({super.key});

  @override
  State<PendingApprovalScreen> createState() => _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends State<PendingApprovalScreen> {
  bool _busy = false;

  String get _status => context.watch<AuthProvider>().user?.status ?? 'Pending';

  Future<void> _checkStatus() async {
    setState(() => _busy = true);
    await context.read<AuthProvider>().refreshUser();
    if (!mounted) return;
    setState(() => _busy = false);
    if (_status == 'Approved') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your account has been approved.')),
      );
      routeToRoleHome(context);
    }
  }

  Future<void> _signOut() async {
    await context.read<AuthProvider>().logout();
    if (!mounted) return;
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final status = auth.user?.status ?? 'Pending';
    final reason = auth.user?.rejectionReason;

    final (icon, accent, title, subtitle) = switch (status) {
      'Suspended' => (
          Icons.block_outlined,
          const Color(0xFF475569),
          'Account Suspended',
          'Your account has been suspended. Contact support for assistance.',
        ),
      'Rejected' => (
          Icons.cancel_outlined,
          AppColors.destructive,
          'Account Rejected',
          reason != null && reason.isNotEmpty
              ? 'Your application was rejected: $reason'
              : 'Your application was rejected. Update your details and resubmit.',
        ),
      _ => (
          Icons.hourglass_empty_outlined,
          const Color(0xFFD97706),
          'Application Under Review',
          'Your application is being reviewed by our administrators. You will be able to post listings once your account is approved.',
        ),
    };

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(icon, size: 72, color: accent),
                const SizedBox(height: 20),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14, height: 1.5, color: AppColors.mutedForeground),
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: _busy ? null : _checkStatus,
                  child: _busy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Check Approval Status'),
                ),
                if (status == 'Rejected') ...[
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: _busy ? null : () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const AgentOnboardingScreen()),
                      );
                    },
                    child: const Text('Update Application'),
                  ),
                ],
                const SizedBox(height: 14),
                TextButton(
                  onPressed: _busy ? null : _signOut,
                  child: const Text(
                    'Sign Out',
                    style: TextStyle(color: AppColors.mutedForeground),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}