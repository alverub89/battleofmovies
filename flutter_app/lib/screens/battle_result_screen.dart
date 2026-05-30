import 'package:flutter/material.dart';
import '../models/movie_battle.dart';

class BattleResultScreen extends StatelessWidget {
  final MovieBattle battle;

  const BattleResultScreen({super.key, required this.battle});

  @override
  Widget build(BuildContext context) {
    final movie1 = battle.filmes[0];
    final movie2 = battle.filmes[1];
    final isMovie1Winner = movie1.titulo == battle.vencedor.titulo;

    return Scaffold(
      backgroundColor: const Color(0xFF1a1f2e),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                const SizedBox(height: 20),
                // Title
                RichText(
                  textAlign: TextAlign.center,
                  text: const TextSpan(
                    children: [
                      TextSpan(
                        text: 'MOVIE ',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFc084fc),
                          height: 1.1,
                        ),
                      ),
                      TextSpan(
                        text: 'BATTLE',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFfda4af),
                          height: 1.1,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Duelo de Gigantes do Cinema',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF9ca3af),
                  ),
                ),
                const SizedBox(height: 32),

                // Battle Cards
                Row(
                  children: [
                    Expanded(
                      child: _buildMovieCard(
                        movie: movie1,
                        isWinner: isMovie1Winner,
                        color: const Color(0xFFa855f7),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      children: const [
                        Icon(
                          Icons.close,
                          color: Color(0xFF6b7280),
                          size: 40,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'VS',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildMovieCard(
                        movie: movie2,
                        isWinner: !isMovie1Winner,
                        color: const Color(0xFFec4899),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Metrics Comparison Section
                Container(
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
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(
                            Icons.bar_chart,
                            color: Color(0xFF60a5fa),
                            size: 24,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Comparação de Métricas',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _buildMetricComparison(
                        '⭐ IMDb Rating',
                        movie1.notas.imdb?.toString() ?? 'N/A',
                        movie2.notas.imdb?.toString() ?? 'N/A',
                        movie1.notas.imdb ?? 0,
                        movie2.notas.imdb ?? 0,
                        10,
                      ),
                      const SizedBox(height: 16),
                      _buildMetricComparison(
                        '🍅 Rotten Tomatoes',
                        movie1.notas.rottenTomatoes != null
                            ? '${movie1.notas.rottenTomatoes}%'
                            : 'N/A',
                        movie2.notas.rottenTomatoes != null
                            ? '${movie2.notas.rottenTomatoes}%'
                            : 'N/A',
                        (movie1.notas.rottenTomatoes ?? 0).toDouble(),
                        (movie2.notas.rottenTomatoes ?? 0).toDouble(),
                        100,
                      ),
                      const SizedBox(height: 16),
                      _buildMetricComparison(
                        '📊 Metacritic',
                        movie1.notas.metacritic != null
                            ? '${movie1.notas.metacritic}/100'
                            : 'N/A',
                        movie2.notas.metacritic != null
                            ? '${movie2.notas.metacritic}/100'
                            : 'N/A',
                        (movie1.notas.metacritic ?? 0).toDouble(),
                        (movie2.notas.metacritic ?? 0).toDouble(),
                        100,
                      ),
                      const SizedBox(height: 16),
                      _buildMetricComparison(
                        '💰 Bilheteria',
                        _formatCurrency(movie1.bilheteria),
                        _formatCurrency(movie2.bilheteria),
                        movie1.bilheteria.toDouble(),
                        movie2.bilheteria.toDouble(),
                        movie1.bilheteria > movie2.bilheteria
                            ? movie1.bilheteria.toDouble()
                            : movie2.bilheteria.toDouble(),
                      ),
                      const SizedBox(height: 16),
                      _buildMetricComparison(
                        '🏆 Prêmios Oscar',
                        movie1.premios.oscar.toString(),
                        movie2.premios.oscar.toString(),
                        movie1.premios.oscar.toDouble(),
                        movie2.premios.oscar.toDouble(),
                        movie1.premios.oscar > movie2.premios.oscar
                            ? movie1.premios.oscar.toDouble()
                            : movie2.premios.oscar.toDouble(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Winner Section
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFfbbf24), Color(0xFFf59e0b)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFFfcd34d),
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.emoji_events,
                        color: Color(0xFF1a1f2e),
                        size: 48,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Text(
                            '🎬 E o vencedor é... 🎬',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1a1f2e),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        battle.vencedor.titulo,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF1a1f2e),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Score: ${battle.vencedor.score.toStringAsFixed(1)}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1a1f2e),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1a1f2e).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          battle.analise,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF1a1f2e),
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // New Battle Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3b82f6),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.refresh, color: Colors.white),
                        SizedBox(width: 12),
                        Text(
                          'Nova Batalha',
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
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMovieCard({
    required Movie movie,
    required bool isWinner,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color,
            color.withOpacity(0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          if (isWinner)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFfbbf24),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.emoji_events, size: 16, color: Color(0xFF1a1f2e)),
                  SizedBox(width: 4),
                  Text(
                    'VENCEDOR',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1a1f2e),
                    ),
                  ),
                ],
              ),
            ),
          if (isWinner) const SizedBox(height: 12),
          const Icon(
            Icons.movie,
            color: Colors.white,
            size: 32,
          ),
          const SizedBox(height: 12),
          Text(
            movie.titulo,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            movie.scoreFinal.toStringAsFixed(1),
            style: const TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          _buildMetricItem('⭐ IMDb:', '${movie.notas.imdb ?? "N/A"}/10'),
          const SizedBox(height: 8),
          _buildMetricItem(
            '🍅 Rotten Tomatoes:',
            movie.notas.rottenTomatoes != null
                ? '${movie.notas.rottenTomatoes}%'
                : 'N/A',
          ),
          const SizedBox(height: 8),
          _buildMetricItem(
            '📊 Metacritic:',
            movie.notas.metacritic != null
                ? '${movie.notas.metacritic}/100'
                : 'N/A',
          ),
          const SizedBox(height: 8),
          _buildMetricItem('🏆 Oscars:', '${movie.premios.oscar}'),
          const SizedBox(height: 8),
          _buildMetricItem('💰 Bilheteria:', _formatCurrency(movie.bilheteria)),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.white70,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricComparison(
    String label,
    String value1,
    String value2,
    double metric1,
    double metric2,
    double maxValue,
  ) {
    final total = metric1 + metric2;
    final percentage1 = total > 0 ? (metric1 / maxValue) : 0.0;
    final percentage2 = total > 0 ? (metric2 / maxValue) : 0.0;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Text(
                value1,
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFa855f7),
                ),
              ),
            ),
            const SizedBox(width: 16),
            const Text(
              'vs',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF6b7280),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                value2,
                textAlign: TextAlign.left,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFec4899),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: Row(
            children: [
              Expanded(
                flex: (percentage1 * 100).toInt(),
                child: Container(
                  height: 8,
                  color: const Color(0xFFa855f7),
                ),
              ),
              Expanded(
                flex: ((1 - percentage1 - percentage2) * 100).toInt().clamp(0, 100),
                child: Container(
                  height: 8,
                  color: const Color(0xFF374151),
                ),
              ),
              Expanded(
                flex: (percentage2 * 100).toInt(),
                child: Container(
                  height: 8,
                  color: const Color(0xFFec4899),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatCurrency(int value) {
    if (value >= 1000000000) {
      return '\$${(value / 1000000000).toStringAsFixed(1)}B';
    } else if (value >= 1000000) {
      return '\$${(value / 1000000).toStringAsFixed(0)}M';
    } else {
      return '\$$value';
    }
  }
}
