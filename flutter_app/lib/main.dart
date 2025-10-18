import 'package:flutter/material.dart';
import 'screens/movie_selection_screen.dart';

void main() {
  runApp(const BattleOfMoviesApp());
}

class BattleOfMoviesApp extends StatelessWidget {
  const BattleOfMoviesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Battle of Movies',
      theme: ThemeData(
        primarySwatch: Colors.purple,
        useMaterial3: true,
      ),
      debugShowCheckedModeBanner: false,
      home: const MovieSelectionScreen(),
    );
  }
}
