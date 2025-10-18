import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:battle_of_movies/main.dart';

void main() {
  testWidgets('App should start with MovieSelectionScreen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const BattleOfMoviesApp());

    // Verify that the app title is present
    expect(find.text('MOVIE'), findsOneWidget);
    expect(find.text('BATTLE'), findsOneWidget);
    
    // Verify that the subtitle is present
    expect(find.text('Escolha dois filmes para a batalha épica!'), findsOneWidget);
    
    // Verify that the input fields are present
    expect(find.text('Filme 1'), findsOneWidget);
    expect(find.text('Filme 2'), findsOneWidget);
    
    // Verify that the button is present
    expect(find.text('Iniciar Batalha'), findsOneWidget);
  });

  testWidgets('App should show error when fields are empty', (WidgetTester tester) async {
    await tester.pumpWidget(const BattleOfMoviesApp());

    // Find and tap the button without filling the fields
    final button = find.text('Iniciar Batalha');
    await tester.tap(button);
    await tester.pump();

    // Verify that an error message is shown
    expect(find.text('Por favor, preencha os dois filmes'), findsOneWidget);
  });
}
