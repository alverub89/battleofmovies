import 'package:flutter/material.dart';
import 'battle_result_screen.dart';
import '../models/movie_battle.dart';

class MovieSelectionScreen extends StatefulWidget {
  const MovieSelectionScreen({super.key});

  @override
  State<MovieSelectionScreen> createState() => _MovieSelectionScreenState();
}

class _MovieSelectionScreenState extends State<MovieSelectionScreen> {
  final TextEditingController _movie1Controller = TextEditingController();
  final TextEditingController _movie2Controller = TextEditingController();

  @override
  void dispose() {
    _movie1Controller.dispose();
    _movie2Controller.dispose();
    super.dispose();
  }

  void _startBattle() {
    if (_movie1Controller.text.isEmpty || _movie2Controller.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, preencha os dois filmes'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Mock data for demonstration
    final mockBattleData = {
      "comparacao": {
        "filmes": [
          {
            "titulo": _movie1Controller.text,
            "notas": {
              "imdb": 8.0,
              "rotten_tomatoes": 91,
              "adoro_cinema": null,
              "metacritic": null
            },
            "orcamento": 220000000,
            "bilheteria": 1515000000,
            "premios": {"oscar": 1, "outros": 0},
            "score_final": 90.6
          },
          {
            "titulo": _movie2Controller.text,
            "notas": {
              "imdb": 7.3,
              "rotten_tomatoes": 75,
              "adoro_cinema": null,
              "metacritic": null
            },
            "orcamento": 365000000,
            "bilheteria": 1405000000,
            "premios": {"oscar": 0, "outros": 1},
            "score_final": 83.8
          }
        ],
        "vencedor": {
          "titulo": _movie1Controller.text,
          "score": 90.6
        },
        "analise":
            "Embora ambos os filmes sejam marcos de entretenimento, \"${_movie1Controller.text}\" sobressai por ter uma reação crítica mais entusiasmada e um retorno sobre orçamento mais eficiente, garantindo a vitória neste duelo cinematográfico."
      }
    };

    final battle = MovieBattle.fromJson(mockBattleData);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BattleResultScreen(battle: battle),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1a1f2e),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                const SizedBox(height: 40),
                // Title
                RichText(
                  textAlign: TextAlign.center,
                  text: const TextSpan(
                    children: [
                      TextSpan(
                        text: 'MOVIE\n',
                        style: TextStyle(
                          fontSize: 64,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFc084fc),
                          height: 1.1,
                        ),
                      ),
                      TextSpan(
                        text: 'BATTLE',
                        style: TextStyle(
                          fontSize: 64,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1.1,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Escolha dois filmes para a batalha épica!',
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFF9ca3af),
                  ),
                ),
                const SizedBox(height: 60),

                // Movie 1 Input
                _buildMovieInput(
                  controller: _movie1Controller,
                  label: 'Filme 1',
                  icon: Icons.movie,
                  iconColor: const Color(0xFFa855f7),
                  hint: 'Ex: Forrest Gump',
                ),

                const SizedBox(height: 40),

                // Battle Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFF374151),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.close,
                    size: 40,
                    color: Color(0xFF6b7280),
                  ),
                ),

                const SizedBox(height: 40),

                // Movie 2 Input
                _buildMovieInput(
                  controller: _movie2Controller,
                  label: 'Filme 2',
                  icon: Icons.movie,
                  iconColor: const Color(0xFFec4899),
                  hint: 'Ex: Superman (The Movie 1978)',
                ),

                const SizedBox(height: 60),

                // Start Battle Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _startBattle,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFa855f7),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.close, color: Colors.white),
                        SizedBox(width: 12),
                        Text(
                          'Iniciar Batalha',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Info text
                Row(
                  children: const [
                    Icon(
                      Icons.lightbulb_outline,
                      color: Color(0xFFfbbf24),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Dica: Os dados da batalha são gerados automaticamente com base nos filmes escolhidos.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9ca3af),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMovieInput({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required Color iconColor,
    required String hint,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF243141),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF374151),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                color: Color(0xFF6b7280),
              ),
              filled: true,
              fillColor: const Color(0xFF1a1f2e),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
