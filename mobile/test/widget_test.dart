import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:rakit_campus/main.dart';

void main() {
  testWidgets('RakitCampusApp smoke test renders login', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      const ProviderScope(
        child: RakitCampusApp(),
      ),
    );

    await tester.pump();

    // Verify brand and login fields exist
    expect(find.text('RAKIT Campus'), findsOneWidget);
    expect(find.text('Selamat Datang Kembali'), findsOneWidget);
    expect(find.text('Email Kampus'), findsOneWidget);
    expect(find.text('Masuk ke Akun'), findsOneWidget);
  });
}
