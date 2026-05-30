class MovieBattle {
  final List<Movie> filmes;
  final Winner vencedor;
  final String analise;

  MovieBattle({
    required this.filmes,
    required this.vencedor,
    required this.analise,
  });

  factory MovieBattle.fromJson(Map<String, dynamic> json) {
    final comparacao = json['comparacao'];
    return MovieBattle(
      filmes: (comparacao['filmes'] as List)
          .map((movie) => Movie.fromJson(movie))
          .toList(),
      vencedor: Winner.fromJson(comparacao['vencedor']),
      analise: comparacao['analise'],
    );
  }
}

class Movie {
  final String titulo;
  final MovieRatings notas;
  final int orcamento;
  final int bilheteria;
  final MovieAwards premios;
  final double scoreFinal;

  Movie({
    required this.titulo,
    required this.notas,
    required this.orcamento,
    required this.bilheteria,
    required this.premios,
    required this.scoreFinal,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      titulo: json['titulo'],
      notas: MovieRatings.fromJson(json['notas']),
      orcamento: json['orcamento'],
      bilheteria: json['bilheteria'],
      premios: MovieAwards.fromJson(json['premios']),
      scoreFinal: (json['score_final'] as num).toDouble(),
    );
  }
}

class MovieRatings {
  final double? imdb;
  final int? rottenTomatoes;
  final double? adoroCinema;
  final int? metacritic;

  MovieRatings({
    this.imdb,
    this.rottenTomatoes,
    this.adoroCinema,
    this.metacritic,
  });

  factory MovieRatings.fromJson(Map<String, dynamic> json) {
    return MovieRatings(
      imdb: json['imdb']?.toDouble(),
      rottenTomatoes: json['rotten_tomatoes'],
      adoroCinema: json['adoro_cinema']?.toDouble(),
      metacritic: json['metacritic'],
    );
  }
}

class MovieAwards {
  final int oscar;
  final int outros;

  MovieAwards({
    required this.oscar,
    required this.outros,
  });

  factory MovieAwards.fromJson(Map<String, dynamic> json) {
    return MovieAwards(
      oscar: json['oscar'],
      outros: json['outros'],
    );
  }
}

class Winner {
  final String titulo;
  final double score;

  Winner({
    required this.titulo,
    required this.score,
  });

  factory Winner.fromJson(Map<String, dynamic> json) {
    return Winner(
      titulo: json['titulo'],
      score: (json['score'] as num).toDouble(),
    );
  }
}
