import 'package:flutter_test/flutter_test.dart';
import 'package:battle_of_movies/models/movie_battle.dart';

void main() {
  group('MovieBattle Model Tests', () {
    test('MovieBattle.fromJson should parse valid JSON correctly', () {
      final json = {
        "comparacao": {
          "filmes": [
            {
              "titulo": "Test Movie 1",
              "notas": {
                "imdb": 8.5,
                "rotten_tomatoes": 90,
                "adoro_cinema": null,
                "metacritic": 85
              },
              "orcamento": 200000000,
              "bilheteria": 1000000000,
              "premios": {"oscar": 2, "outros": 5},
              "score_final": 92.5
            },
            {
              "titulo": "Test Movie 2",
              "notas": {
                "imdb": 7.5,
                "rotten_tomatoes": 80,
                "adoro_cinema": null,
                "metacritic": 75
              },
              "orcamento": 150000000,
              "bilheteria": 800000000,
              "premios": {"oscar": 1, "outros": 3},
              "score_final": 85.0
            }
          ],
          "vencedor": {"titulo": "Test Movie 1", "score": 92.5},
          "analise": "Test analysis text"
        }
      };

      final battle = MovieBattle.fromJson(json);

      expect(battle.filmes.length, 2);
      expect(battle.filmes[0].titulo, "Test Movie 1");
      expect(battle.filmes[1].titulo, "Test Movie 2");
      expect(battle.vencedor.titulo, "Test Movie 1");
      expect(battle.vencedor.score, 92.5);
      expect(battle.analise, "Test analysis text");
    });

    test('Movie model should parse ratings correctly', () {
      final json = {
        "titulo": "Test Movie",
        "notas": {
          "imdb": 8.0,
          "rotten_tomatoes": 85,
          "adoro_cinema": null,
          "metacritic": 80
        },
        "orcamento": 100000000,
        "bilheteria": 500000000,
        "premios": {"oscar": 1, "outros": 2},
        "score_final": 88.5
      };

      final movie = Movie.fromJson(json);

      expect(movie.titulo, "Test Movie");
      expect(movie.notas.imdb, 8.0);
      expect(movie.notas.rottenTomatoes, 85);
      expect(movie.notas.adoroCinema, null);
      expect(movie.notas.metacritic, 80);
      expect(movie.orcamento, 100000000);
      expect(movie.bilheteria, 500000000);
      expect(movie.premios.oscar, 1);
      expect(movie.premios.outros, 2);
      expect(movie.scoreFinal, 88.5);
    });

    test('MovieRatings should handle null values', () {
      final json = {
        "imdb": null,
        "rotten_tomatoes": null,
        "adoro_cinema": null,
        "metacritic": null
      };

      final ratings = MovieRatings.fromJson(json);

      expect(ratings.imdb, null);
      expect(ratings.rottenTomatoes, null);
      expect(ratings.adoroCinema, null);
      expect(ratings.metacritic, null);
    });

    test('MovieAwards should parse correctly', () {
      final json = {"oscar": 3, "outros": 10};

      final awards = MovieAwards.fromJson(json);

      expect(awards.oscar, 3);
      expect(awards.outros, 10);
    });

    test('Winner should parse correctly', () {
      final json = {"titulo": "Winner Movie", "score": 95.5};

      final winner = Winner.fromJson(json);

      expect(winner.titulo, "Winner Movie");
      expect(winner.score, 95.5);
    });
  });
}
