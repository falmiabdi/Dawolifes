import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../admin/admin_portal.dart';
import '../agent/agent_onboarding_screen.dart';
import '../agent/agent_portal.dart';

/// Routes the logged-in user to their role-appropriate home after sign-in,
/// matching the web app (admin -> /admin, agent -> /agent, else app shell).
///
/// A new/unapproved agent is sent to the onboarding form first (the "form page"
/// they must complete and have verified before they can post properties). An
/// existing approved agent or admin goes straight to their dashboard by reading
/// the restored JWT session. Buyers/users stay in the app shell.
void routeToRoleHome(BuildContext context) {
  final auth = context.read<AuthProvider>();
  final user = auth.user;
  if (user == null) {
    Navigator.of(context).popUntil((route) => route.isFirst);
    return;
  }

  if (user.isAdmin) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminPortalScreen()));
    return;
  }

  if (user.isAgent) {
    if (user.status != 'Approved') {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentOnboardingScreen()));
    } else {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPortalScreen()));
    }
    return;
  }

  Navigator.of(context).popUntil((route) => route.isFirst);
}
