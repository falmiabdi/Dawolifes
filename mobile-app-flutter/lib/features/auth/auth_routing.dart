import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../admin/admin_portal.dart';
import '../agent/agent_portal.dart';






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

  if (user.isAgent || user.isOwner) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPortalScreen()));
    return;
  }

  Navigator.of(context).popUntil((route) => route.isFirst);
}
