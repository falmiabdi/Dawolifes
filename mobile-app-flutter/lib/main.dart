import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/network/api_client.dart';
import 'core/network/websocket_service.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/admin_repository.dart';
import 'data/repositories/agent_repository.dart';
import 'data/repositories/announcement_repository.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/listing_repository.dart';
import 'data/repositories/message_repository.dart';
import 'features/onboarding/splash_screen.dart';
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
  final ws = WebSocketService(api);

  final auth = AuthProvider(
    repository: AuthRepository(api),
    storage: storage,
  );
  final language = LanguageProvider(prefs);
  final listingRepo = ListingRepository(api);

  await Future.wait([auth.init(), language.init()]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: language),
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider(create: (_) => HomeProvider(listingRepo)),
        ChangeNotifierProvider(create: (_) => SavedProvider(listingRepo)),
        Provider.value(value: listingRepo),
        Provider.value(value: MessageRepository(api)),
        Provider.value(value: AgentRepository(api)),
        Provider.value(value: AdminRepository(api)),
        Provider.value(value: AnnouncementRepository(api)),
        Provider.value(value: ws),
        Provider.value(value: api),
      ],
      child: DawoLifeApp(prefs: prefs),
    ),
  );
}

class DawoLifeApp extends StatelessWidget {
  const DawoLifeApp({super.key, required this.prefs});

  final SharedPreferences prefs;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DawoLife',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: SplashScreen(storage: prefs),
    );
  }
}
