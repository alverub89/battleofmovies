# Documentação de Desenvolvimento - Battle of Movies Flutter

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios

```
flutter_app/
├── lib/
│   ├── main.dart                          # Ponto de entrada da aplicação
│   ├── models/
│   │   └── movie_battle.dart              # Modelos de dados (MovieBattle, Movie, etc)
│   └── screens/
│       ├── movie_selection_screen.dart    # Tela de seleção de filmes
│       └── battle_result_screen.dart      # Tela de resultado da batalha
├── test/
│   ├── models/
│   │   └── movie_battle_test.dart         # Testes dos modelos
│   └── widget_test.dart                   # Testes dos widgets
├── examples/
│   └── battle_example.json                # Exemplo de JSON para testes
├── pubspec.yaml                           # Dependências e configurações
├── analysis_options.yaml                  # Regras de linting
├── .gitignore                             # Arquivos ignorados pelo Git
├── README.md                              # Documentação principal
├── USAGE.md                               # Guia de uso detalhado
└── DEVELOPMENT.md                         # Este arquivo
```

## 📐 Padrões de Design Utilizados

### 1. Model-View Pattern
- **Models:** Representam os dados e lógica de negócio
- **Views (Screens):** Widgets que apresentam a interface ao usuário

### 2. Separation of Concerns
- Modelos separados da apresentação
- Lógica de UI encapsulada em métodos privados
- Navegação gerenciada de forma centralizada

### 3. Composition over Inheritance
- Uso de widgets compostos ao invés de herança complexa
- Reutilização através de métodos builders

## 🎨 Design System

### Paleta de Cores

#### Cores Principais
```dart
// Backgrounds
backgroundColor: Color(0xFF1a1f2e)      // Azul escuro
cardBackground: Color(0xFF243141)      // Azul card
borderColor: Color(0xFF374151)         // Cinza borda

// Primary
purpleGradient: Color(0xFFa855f7)      // Roxo vibrante
pinkGradient: Color(0xFFec4899)        // Rosa vibrante
blueButton: Color(0xFF3b82f6)          // Azul botão

// Accent
golden: Color(0xFFfbbf24)              // Dourado (vencedor)
lightGolden: Color(0xFFfcd34d)         // Dourado claro

// Text
white: Colors.white                    // Texto principal
grayLight: Color(0xFF9ca3af)           // Texto secundário
grayMedium: Color(0xFF6b7280)          // Texto terciário
```

#### Gradientes
```dart
// Gradiente Roxo (Filme 1)
LinearGradient(
  colors: [Color(0xFFa855f7), Color(0xFFa855f7).withOpacity(0.7)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
)

// Gradiente Rosa (Filme 2)
LinearGradient(
  colors: [Color(0xFFec4899), Color(0xFFec4899).withOpacity(0.7)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
)

// Gradiente Dourado (Vencedor)
LinearGradient(
  colors: [Color(0xFFfbbf24), Color(0xFFf59e0b)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
)
```

### Tipografia

```dart
// Títulos Principais
TextStyle(
  fontSize: 64,           // ou 48 para títulos secundários
  fontWeight: FontWeight.w900,
  color: Color(0xFFc084fc),
  height: 1.1,
)

// Títulos de Seção
TextStyle(
  fontSize: 18,
  fontWeight: FontWeight.bold,
  color: Colors.white,
)

// Texto Corpo
TextStyle(
  fontSize: 16,
  color: Colors.white,
)

// Texto Secundário
TextStyle(
  fontSize: 14,
  color: Color(0xFF9ca3af),
)

// Labels e Hints
TextStyle(
  fontSize: 12,
  color: Color(0xFF6b7280),
)
```

### Espaçamento

```dart
// Espaçamento interno de cards
padding: EdgeInsets.all(24.0)

// Espaçamento entre elementos
SizedBox(height: 16)  // Pequeno
SizedBox(height: 24)  // Médio
SizedBox(height: 32)  // Grande
SizedBox(height: 60)  // Extra grande

// Margens da tela
padding: EdgeInsets.all(24.0)
```

### Border Radius

```dart
// Cards principais
borderRadius: BorderRadius.circular(16)

// Botões
borderRadius: BorderRadius.circular(12)

// Inputs
borderRadius: BorderRadius.circular(8)

// Badges circulares
shape: BoxShape.circle
```

## 🧩 Componentes Reutilizáveis

### _buildMovieInput (MovieSelectionScreen)

Widget para entrada de dados de filmes com ícone personalizado.

**Parâmetros:**
- `controller`: TextEditingController
- `label`: String (ex: "Filme 1")
- `icon`: IconData
- `iconColor`: Color
- `hint`: String

**Uso:**
```dart
_buildMovieInput(
  controller: _movie1Controller,
  label: 'Filme 1',
  icon: Icons.movie,
  iconColor: const Color(0xFFa855f7),
  hint: 'Ex: Forrest Gump',
)
```

### _buildMovieCard (BattleResultScreen)

Card com informações resumidas do filme.

**Parâmetros:**
- `movie`: Movie
- `isWinner`: bool
- `color`: Color

### _buildMetricComparison (BattleResultScreen)

Barra de comparação visual entre duas métricas.

**Parâmetros:**
- `label`: String
- `value1`: String
- `value2`: String
- `metric1`: double
- `metric2`: double
- `maxValue`: double

### _formatCurrency

Formata valores monetários para exibição.

**Retorna:**
- Bilhões: `$1.5B`
- Milhões: `$150M`
- Outros: `$150000`

## 🔧 Funcionalidades Implementadas

### Tela de Seleção (MovieSelectionScreen)

#### Features:
1. **Validação de Entrada**
   - Verifica se ambos os campos estão preenchidos
   - Mostra SnackBar com mensagem de erro se necessário

2. **Navegação**
   - Navegação programática para tela de resultado
   - Passa objeto MovieBattle como parâmetro

3. **Mock Data**
   - Gera dados de exemplo automaticamente
   - Útil para desenvolvimento e demonstração

4. **UI/UX**
   - Ícones diferenciados por cor
   - Dica informativa na parte inferior
   - Layout responsivo

### Tela de Resultado (BattleResultScreen)

#### Features:
1. **Comparação Visual**
   - Cards lado a lado com gradientes
   - Badge "VENCEDOR" destacado
   - Ícone VS no centro

2. **Métricas Detalhadas**
   - Barras de progresso comparativas
   - Formatação apropriada para cada tipo de dado
   - Cores diferenciadas por filme

3. **Seção de Vencedor**
   - Container dourado destacado
   - Análise textual
   - Trophy icon

4. **Navegação**
   - Botão "Nova Batalha" para voltar
   - Navigator.pop() limpo

## 🧪 Testes

### Testes de Modelo

Localização: `test/models/movie_battle_test.dart`

**Cobertura:**
- Parsing de JSON para MovieBattle
- Parsing de Movie
- Tratamento de valores null em MovieRatings
- Parsing de MovieAwards
- Parsing de Winner

**Executar:**
```bash
flutter test test/models/movie_battle_test.dart
```

### Testes de Widget

Localização: `test/widget_test.dart`

**Cobertura:**
- Verificação de elementos na tela inicial
- Validação de campos vazios
- Presença de botões e textos

**Executar:**
```bash
flutter test test/widget_test.dart
```

### Executar Todos os Testes

```bash
flutter test
```

## 🚀 Build e Deploy

### Debug Build

```bash
# Android
flutter build apk --debug

# iOS
flutter build ios --debug
```

### Release Build

```bash
# Android
flutter build apk --release

# iOS
flutter build ios --release
```

### Web Build

```bash
flutter build web
```

## 📊 Performance

### Otimizações Implementadas

1. **Const Constructors**
   - Usado onde possível para widgets imutáveis
   - Reduz rebuilds desnecessários

2. **SingleChildScrollView**
   - Evita overflow em telas pequenas
   - Performance eficiente

3. **Widgets Stateless**
   - Usado quando não há estado mutável
   - Mais leve que StatefulWidget

## 🔒 Boas Práticas de Segurança

1. **Validação de Entrada**
   - Campos verificados antes de processamento
   - Prevenção de estados inválidos

2. **Null Safety**
   - Tratamento completo de valores nullable
   - Operadores seguros (??, ?)

3. **Error Handling**
   - Prepared para try-catch em integrações futuras
   - Mensagens de erro claras para o usuário

## 🔄 Ciclo de Vida

### StatefulWidget (MovieSelectionScreen)

```
initState()
    ↓
build()
    ↓
[user interaction]
    ↓
setState() → build()
    ↓
dispose() → limpa controllers
```

### StatelessWidget (BattleResultScreen)

```
constructor com parâmetros
    ↓
build() uma única vez
    ↓
rebuilds apenas quando parâmetros mudam
```

## 📝 Convenções de Código

### Nomenclatura

- **Classes:** PascalCase (ex: `MovieSelectionScreen`)
- **Variáveis:** camelCase (ex: `_movie1Controller`)
- **Constantes:** camelCase com `const` (ex: `const backgroundColor`)
- **Métodos privados:** prefixo `_` (ex: `_buildMovieCard`)
- **Arquivos:** snake_case (ex: `movie_selection_screen.dart`)

### Organização de Imports

```dart
// 1. Dart core
import 'dart:async';

// 2. Flutter
import 'package:flutter/material.dart';

// 3. Packages
import 'package:provider/provider.dart';

// 4. Local
import '../models/movie_battle.dart';
import 'battle_result_screen.dart';
```

## 🐛 Debug

### Flutter DevTools

```bash
flutter pub global activate devtools
flutter pub global run devtools
```

### Logging

Para adicionar logs durante desenvolvimento:

```dart
import 'package:flutter/foundation.dart';

debugPrint('Debug message');

if (kDebugMode) {
  print('Only in debug mode');
}
```

## 🔮 Próximas Melhorias

### Alta Prioridade
- [ ] Integração com API real
- [ ] Loading states
- [ ] Error handling robusto
- [ ] Testes de integração

### Média Prioridade
- [ ] Animações de transição
- [ ] Cache de resultados
- [ ] Histórico de batalhas
- [ ] Tema claro/escuro

### Baixa Prioridade
- [ ] Compartilhamento social
- [ ] Favoritos
- [ ] Estatísticas
- [ ] Internacionalização (i18n)

## 📚 Recursos de Aprendizado

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Flutter Cookbook](https://flutter.dev/docs/cookbook)
- [Material Design Guidelines](https://material.io/design)

## 🤝 Contribuindo

Ao contribuir para este projeto:

1. Siga as convenções de código estabelecidas
2. Adicione testes para novas funcionalidades
3. Atualize a documentação
4. Use commits descritivos
5. Verifique o linting antes de commit

```bash
# Verificar análise
flutter analyze

# Formatar código
flutter format lib/
```
