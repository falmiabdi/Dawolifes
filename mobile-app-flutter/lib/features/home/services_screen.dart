import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/language_provider.dart';
import '../../widgets/service_cards.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;

    return Scaffold(
      appBar: AppBar(title: Text(t('our_service'))),
      body: const SingleChildScrollView(
        child: ServiceCards(),
      ),
    );
  }
}
