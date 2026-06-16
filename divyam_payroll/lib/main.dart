import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide LocalStorage;
import 'package:hive_flutter/hive_flutter.dart';
import 'core/storage/local_storage.dart';
import 'app.dart';

import 'package:flutter/foundation.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Local Hive Storage
  await LocalStorage.init();

  // Note: Replace these with your new Firebase credentials in Firebase Console
  const firebaseOptions = kIsWeb
      ? FirebaseOptions(
          apiKey: "AIzaSyB8w-QPgDMNHMJ1qL8XOU3IjRjdGixvwFA",
          authDomain: "hmspayroll-85ed0.firebaseapp.com",
          projectId: "hmspayroll-85ed0",
          storageBucket: "hmspayroll-85ed0.firebasestorage.app",
          messagingSenderId: "514106432331",
          appId: "1:514106432331:web:6d60c174ab45bb4c70a6ce",
          measurementId: "G-VK3PN0HP61",
        )
      : FirebaseOptions(
          apiKey: "AIzaSyCt6elGkAixu_qdCqI_mATTI2IbTMSwxpk",
          authDomain: "hmspayroll-85ed0.firebaseapp.com",
          projectId: "hmspayroll-85ed0",
          storageBucket: "hmspayroll-85ed0.firebasestorage.app",
          messagingSenderId: "514106432331",
          appId: "1:514106432331:android:e344f84eaefb7a0e70a6ce",
        );

  await Firebase.initializeApp(options: firebaseOptions);

  await Supabase.initialize(
    url: 'https://fglrshzodiroznjmxepx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnbHJzaHpvZGlyb3puam14ZXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTYwODMsImV4cCI6MjA5Njk5MjA4M30.45EYguG1uXgVJlxa3cK3M72szHRfq6Qn6Jt401zw82M',
  );

  // Load Remote App Settings
  try {
    final response = await Supabase.instance.client
        .from('settings')
        .select('app_settings')
        .limit(1)
        .maybeSingle();
    if (response != null && response['app_settings'] != null) {
      final box = Hive.box(LocalStorage.settingsBox);
      await box.put('app_settings', response['app_settings']);
      debugPrint('[SETTINGS] Loaded remote app settings successfully.');
    }
  } catch (e) {
    debugPrint('[SETTINGS] Failed to load remote settings: $e');
  }

  runApp(
    const ProviderScope(
      child: HamsApp(),
    ),
  );
}
