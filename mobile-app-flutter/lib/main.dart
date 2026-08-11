import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/admin_repository.dart';
import 'data/repositories/agent_repository.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/listing_repository.dart';
import 'data/repositories/message_repository.dart';
import 'providers/auth_provider.dart';
import 'providers/home_provider.dart';
import 'providers/language_provider.dart';
import 'providers/saved_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();

  final prefs = await SharedPreferences.getInstance();
  final storage = TokenStorage(prefs);
  final api = ApiClient(storage: storage);

  final auth = AuthProvider(
    repository: AuthRepository(api),
    storage: storage,
  );
  final language = LanguageProvider(prefs);

  await Future.wait([auth.init(), language.init()]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: language),
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider(create: (_) => HomeProvider(ListingRepository(api))),
        ChangeNotifierProvider(create: (_) => SavedProvider(ListingRepository(api))),
        Provider.value(value: MessageRepository(api)),
        Provider.value(value: AgentRepository(api)),
        Provider.value(value: AdminRepository(api)),
        Provider.value(value: api),
      ],
      child: const DawoLifeApp(),
    ),
  );
}

class DawoLifeApp extends StatelessWidget {
  const DawoLifeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DawoLife',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const AppShell(),
    );
  }
}
