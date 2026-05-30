# 🚀 Quick Start - Battle of Movies Flutter

Guia rápido para começar a usar o app em 5 minutos!

## ⚡ Setup Rápido

### 1. Verificar Flutter

```bash
flutter --version
# Deve ser 3.0.0 ou superior
```

Se não tiver Flutter instalado, [baixe aqui](https://flutter.dev/docs/get-started/install).

### 2. Instalar Dependências

```bash
cd flutter_app
flutter pub get
```

### 3. Executar o App

```bash
flutter run
```

Escolha o dispositivo (emulador Android/iOS ou Chrome para web).

---

## 📱 Uso Básico

### Tela 1: Seleção
1. Digite o nome do primeiro filme (ex: "The Avengers")
2. Digite o nome do segundo filme (ex: "Age of Ultron")
3. Clique em "Iniciar Batalha"

### Tela 2: Resultado
- Veja a comparação detalhada
- Observe o vencedor destacado em dourado
- Leia a análise
- Clique em "Nova Batalha" para voltar

---

## 🔧 Testes Rápidos

```bash
# Todos os testes
flutter test

# Apenas models
flutter test test/models/

# Apenas widgets
flutter test test/widget_test.dart
```

---

## 📊 Dados de Teste

Os dados são gerados automaticamente ao iniciar uma batalha. Para personalizar:

### Opção 1: Editar Mock Data

Edite o método `_startBattle()` em `lib/screens/movie_selection_screen.dart`:

```dart
final mockBattleData = {
  "comparacao": {
    "filmes": [
      {
        "titulo": _movie1Controller.text,
        "notas": {
          "imdb": 9.0,  // ← Altere aqui
          "rotten_tomatoes": 95,
          // ...
        },
        // ...
      }
    ]
  }
};
```

### Opção 2: Usar JSON Externo

1. Coloque seu JSON em `examples/my_battle.json`
2. Carregue no app:

```dart
import 'dart:convert';
import 'package:flutter/services.dart';

Future<MovieBattle> loadBattle() async {
  final String jsonString = await rootBundle.loadString(
    'examples/my_battle.json'
  );
  final jsonData = jsonDecode(jsonString);
  return MovieBattle.fromJson(jsonData);
}
```

---

## 🎨 Personalizar Cores

Edite as cores nos arquivos de screen:

```dart
// Background
const backgroundColor = Color(0xFF1a1f2e);

// Filme 1 (roxo)
const purpleColor = Color(0xFFa855f7);

// Filme 2 (rosa)
const pinkColor = Color(0xFFec4899);

// Vencedor (dourado)
const goldenColor = Color(0xFFfbbf24);
```

---

## 🔌 Integração com API (Básico)

### 1. Adicionar Dependência HTTP

Em `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
```

### 2. Criar Service

Crie `lib/services/battle_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/movie_battle.dart';

class BattleService {
  static const baseUrl = 'https://sua-api.com';

  Future<MovieBattle> comparar(String filme1, String filme2) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/battle'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'filme1': filme1,
        'filme2': filme2,
      }),
    );

    if (response.statusCode == 200) {
      return MovieBattle.fromJson(jsonDecode(response.body));
    }
    throw Exception('Erro ao comparar filmes');
  }
}
```

### 3. Usar no Widget

Em `movie_selection_screen.dart`:

```dart
void _startBattle() async {
  if (_movie1Controller.text.isEmpty || _movie2Controller.text.isEmpty) {
    // validação...
    return;
  }

  try {
    final battle = await BattleService().comparar(
      _movie1Controller.text,
      _movie2Controller.text,
    );

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BattleResultScreen(battle: battle),
      ),
    );
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Erro: $e')),
    );
  }
}
```

---

## 🐛 Problemas Comuns

### Erro: "No device found"
```bash
# Para web
flutter run -d chrome

# Para Android
flutter emulators --launch <emulator-id>
```

### Erro: "Pub get failed"
```bash
flutter clean
flutter pub get
```

### Erro de build
```bash
flutter clean
flutter pub get
flutter run
```

---

## 📚 Arquivos Importantes

```
flutter_app/
├── lib/
│   ├── main.dart                    ← Início do app
│   ├── models/
│   │   └── movie_battle.dart        ← Modelos de dados
│   └── screens/
│       ├── movie_selection_screen.dart  ← Tela 1
│       └── battle_result_screen.dart    ← Tela 2
├── test/                            ← Testes
├── examples/
│   └── battle_example.json          ← JSON de exemplo
└── pubspec.yaml                     ← Dependências
```

---

## 🎯 Próximos Passos

1. ✅ **Testou o app?** → Explore as telas
2. 📖 **Quer saber mais?** → Leia [USAGE.md](USAGE.md)
3. 🔧 **Vai integrar API?** → Veja exemplo acima
4. 🎨 **Quer customizar?** → Confira [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md)
5. 💻 **Quer contribuir?** → Leia [DEVELOPMENT.md](DEVELOPMENT.md)

---

## 💡 Dicas Úteis

### Hot Reload
Após alterar o código:
- Pressione `r` no terminal para reload
- Pressione `R` para restart completo

### Debug
```bash
# Modo debug (padrão)
flutter run

# Modo release (mais rápido)
flutter run --release

# Web
flutter run -d chrome
```

### Análise de Código
```bash
# Verificar problemas
flutter analyze

# Formatar código
flutter format lib/
```

---

## 🆘 Precisa de Ajuda?

- **Erro de Flutter?** → [Flutter Troubleshooting](https://flutter.dev/docs/testing/errors)
- **Dúvida sobre o app?** → Leia [README.md](README.md)
- **Integração?** → Veja [USAGE.md](USAGE.md)
- **Detalhes técnicos?** → Confira [DEVELOPMENT.md](DEVELOPMENT.md)

---

## ✅ Checklist Rápido

- [ ] Flutter instalado (3.0.0+)
- [ ] Dependências instaladas (`flutter pub get`)
- [ ] App rodando (`flutter run`)
- [ ] Testou ambas as telas
- [ ] Testes passando (`flutter test`)

Se todos os itens estão marcados, você está pronto! 🎉

---

**Última atualização:** 2025-10-18
