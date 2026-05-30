# Guia de Uso - Battle of Movies Flutter App

## 📋 Visão Geral

Este documento fornece instruções detalhadas sobre como usar as telas Flutter criadas para comparação de filmes.

## 🎯 Funcionalidades Principais

### 1. Tela de Seleção de Filmes

**Componente:** `MovieSelectionScreen`

**Localização:** `lib/screens/movie_selection_screen.dart`

**Características:**
- Interface intuitiva com design dark theme
- Dois campos de entrada para seleção de filmes
- Validação de campos vazios
- Ícones visuais diferenciados (roxo para Filme 1, rosa para Filme 2)
- Botão destacado para iniciar a batalha
- Dica informativa sobre geração automática de dados

**Uso no código:**
```dart
import 'package:battle_of_movies/screens/movie_selection_screen.dart';

// Em qualquer lugar do seu app
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const MovieSelectionScreen(),
  ),
);
```

### 2. Tela de Resultado da Batalha

**Componente:** `BattleResultScreen`

**Localização:** `lib/screens/battle_result_screen.dart`

**Características:**
- Comparação visual lado a lado dos filmes
- Cards com gradiente (roxo e rosa)
- Destaque para o vencedor com badge dourado
- Seção de comparação de métricas com barras de progresso
- Área de análise textual em destaque
- Botão para iniciar nova batalha

**Uso no código:**
```dart
import 'package:battle_of_movies/screens/battle_result_screen.dart';
import 'package:battle_of_movies/models/movie_battle.dart';

// Criar objeto de batalha a partir do JSON
final battleData = {
  "comparacao": {
    "filmes": [...],
    "vencedor": {...},
    "analise": "..."
  }
};

final battle = MovieBattle.fromJson(battleData);

// Navegar para a tela de resultado
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => BattleResultScreen(battle: battle),
  ),
);
```

## 📊 Estrutura de Dados

### Modelo MovieBattle

O modelo principal que representa uma batalha de filmes.

**Propriedades:**
- `filmes`: Lista de 2 objetos `Movie`
- `vencedor`: Objeto `Winner` com título e score do vencedor
- `analise`: String com a análise textual do resultado

### Modelo Movie

Representa um filme individual com todas suas métricas.

**Propriedades:**
- `titulo`: Nome do filme
- `notas`: Objeto `MovieRatings` com avaliações
- `orcamento`: Orçamento em dólares (int)
- `bilheteria`: Arrecadação em dólares (int)
- `premios`: Objeto `MovieAwards` com contagem de prêmios
- `scoreFinal`: Score calculado da batalha (double)

### Modelo MovieRatings

Avaliações do filme em diferentes plataformas.

**Propriedades:**
- `imdb`: Nota IMDb (0-10) - pode ser null
- `rottenTomatoes`: Porcentagem Rotten Tomatoes (0-100) - pode ser null
- `adoroCinema`: Nota Adoro Cinema - pode ser null
- `metacritic`: Nota Metacritic (0-100) - pode ser null

### Modelo MovieAwards

Prêmios conquistados pelo filme.

**Propriedades:**
- `oscar`: Número de Oscars ganhos
- `outros`: Número de outros prêmios

### Modelo Winner

Informações do vencedor da batalha.

**Propriedades:**
- `titulo`: Nome do filme vencedor
- `score`: Score final do vencedor

## 🔧 Integração com Backend

### Abordagem Recomendada

1. **Criar um Service/Repository Layer:**

```dart
// lib/services/battle_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/movie_battle.dart';

class BattleService {
  final String baseUrl;

  BattleService({required this.baseUrl});

  Future<MovieBattle> comparMovies(String movie1, String movie2) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/battle'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'filme1': movie1,
        'filme2': movie2,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return MovieBattle.fromJson(data);
    } else {
      throw Exception('Falha ao comparar filmes');
    }
  }
}
```

2. **Implementar Provider/BLoC para Estado:**

```dart
// Exemplo com Provider
import 'package:flutter/foundation.dart';
import '../models/movie_battle.dart';
import '../services/battle_service.dart';

class BattleProvider with ChangeNotifier {
  final BattleService _service;
  MovieBattle? _currentBattle;
  bool _isLoading = false;
  String? _error;

  BattleProvider(this._service);

  MovieBattle? get currentBattle => _currentBattle;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> startBattle(String movie1, String movie2) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentBattle = await _service.comparMovies(movie1, movie2);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

3. **Atualizar MovieSelectionScreen:**

```dart
// Modificar o método _startBattle para usar o provider
void _startBattle() async {
  if (_movie1Controller.text.isEmpty || _movie2Controller.text.isEmpty) {
    // ... validação
    return;
  }

  final provider = Provider.of<BattleProvider>(context, listen: false);
  
  await provider.startBattle(
    _movie1Controller.text,
    _movie2Controller.text,
  );

  if (provider.error != null) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(provider.error!)),
    );
    return;
  }

  if (provider.currentBattle != null) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BattleResultScreen(
          battle: provider.currentBattle!,
        ),
      ),
    );
  }
}
```

## 🎨 Personalização de Cores

As cores principais usadas no app:

```dart
// Background
const backgroundColor = Color(0xFF1a1f2e);
const cardBackground = Color(0xFF243141);

// Primary Colors
const purpleColor = Color(0xFFa855f7);  // Roxo
const pinkColor = Color(0xFFec4899);    // Rosa
const blueColor = Color(0xFF3b82f6);    // Azul

// Accent Colors
const goldenColor = Color(0xFFfbbf24);  // Dourado (vencedor)

// Text Colors
const whiteText = Colors.white;
const grayText = Color(0xFF9ca3af);
const darkGrayText = Color(0xFF6b7280);
```

## 📱 Responsividade

As telas foram desenvolvidas para se adaptar a diferentes tamanhos de tela:
- Uso de `SingleChildScrollView` para evitar overflow
- Layouts flex com `Expanded` e `Flexible`
- Padding e spacing proporcionais
- Text overflow com ellipsis

## ✅ Boas Práticas Implementadas

1. **Separação de Responsabilidades:**
   - Models separados para dados
   - Screens para UI
   - Lógica de navegação encapsulada

2. **Null Safety:**
   - Tratamento adequado de valores nullable
   - Operador `??` para valores padrão

3. **Widgets Reutilizáveis:**
   - Métodos privados para construir componentes
   - DRY principle aplicado

4. **Performance:**
   - Uso de `const` constructors onde possível
   - Widgets stateless quando não há estado

5. **UX:**
   - Validação de entrada
   - Feedback visual (SnackBars)
   - Loading states preparados para implementação
   - Navegação intuitiva

## 🔄 Fluxo de Navegação

```
MovieSelectionScreen
    |
    | (usuário preenche filmes)
    |
    | (clica "Iniciar Batalha")
    |
    v
[Validação] -> (campos vazios?) -> SnackBar de erro
    |
    | (válido)
    |
    v
[Processar Batalha]
    |
    v
BattleResultScreen
    |
    | (clica "Nova Batalha")
    |
    v
Navigator.pop() -> volta para MovieSelectionScreen
```

## 🧪 Testando a Aplicação

Para testar as telas com dados mock:

1. Execute o app
2. Digite nomes de filmes nos campos
3. Clique em "Iniciar Batalha"
4. Observe a tela de resultado com dados de exemplo
5. Clique em "Nova Batalha" para voltar

Os dados mock são gerados automaticamente no método `_startBattle()` da `MovieSelectionScreen`.

## 📖 Próximos Passos Sugeridos

1. **Integração com API:**
   - Implementar service layer
   - Adicionar gerenciamento de estado (Provider/BLoC)
   - Implementar loading states
   - Tratamento de erros

2. **Melhorias de UX:**
   - Adicionar animações de transição
   - Implementar skeleton loading
   - Adicionar pull-to-refresh
   - Cache de resultados

3. **Features Adicionais:**
   - Histórico de batalhas
   - Compartilhamento de resultados
   - Favoritos
   - Busca de filmes com autocomplete

4. **Testes:**
   - Unit tests para models
   - Widget tests para screens
   - Integration tests para fluxo completo

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação no README.md
2. Consulte os exemplos em `examples/`
3. Revise os comentários no código
