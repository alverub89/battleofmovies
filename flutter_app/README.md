# Battle of Movies - Flutter App

Uma aplicação Flutter para comparação de filmes através de batalhas épicas.

## 📱 Telas

### 1. Tela de Seleção de Filmes (Movie Selection Screen)
- Permite ao usuário escolher dois filmes para a batalha
- Interface com campos de entrada para "Filme 1" e "Filme 2"
- Botão "Iniciar Batalha" para começar a comparação
- Dica informativa sobre a geração automática de dados

### 2. Tela de Resultado da Batalha (Battle Result Screen)
- Exibe comparação detalhada entre os dois filmes
- Métricas comparadas:
  - Notas IMDb
  - Rotten Tomatoes
  - Metacritic
  - Prêmios Oscar
  - Bilheteria
- Destaque visual para o filme vencedor
- Seção de análise textual explicando o resultado
- Botão "Nova Batalha" para reiniciar

## 🎨 Design

A interface foi desenvolvida seguindo as referências visuais fornecidas:
- Tema escuro com tons de roxo e rosa
- Cards gradientes para os filmes
- Ícones intuitivos para cada métrica
- Destaque dourado para o vencedor

## 📊 Estrutura de Dados

As telas estão preparadas para receber dados via JSON no seguinte formato:

```json
{
  "comparacao": {
    "filmes": [
      {
        "titulo": "Marvel's The Avengers",
        "notas": {
          "imdb": 8.0,
          "rotten_tomatoes": 91,
          "adoro_cinema": null,
          "metacritic": null
        },
        "orcamento": 220000000,
        "bilheteria": 1515000000,
        "premios": {
          "oscar": 1,
          "outros": 0
        },
        "score_final": 90.6
      }
    ],
    "vencedor": {
      "titulo": "Marvel's The Avengers",
      "score": 90.6
    },
    "analise": "Análise textual do resultado..."
  }
}
```

## 🚀 Como Executar

### Pré-requisitos
- Flutter SDK instalado (versão 3.0.0 ou superior)
- Dart SDK
- Um emulador Android/iOS ou dispositivo físico conectado

### Passos

1. Instale as dependências:
```bash
cd flutter_app
flutter pub get
```

2. Execute o aplicativo:
```bash
flutter run
```

## 📁 Estrutura do Projeto

```
flutter_app/
├── lib/
│   ├── main.dart                          # Ponto de entrada da aplicação
│   ├── models/
│   │   └── movie_battle.dart              # Modelos de dados
│   └── screens/
│       ├── movie_selection_screen.dart    # Tela de seleção
│       └── battle_result_screen.dart      # Tela de resultado
├── pubspec.yaml                           # Dependências do projeto
└── README.md                              # Este arquivo
```

## 🎯 Funcionalidades Implementadas

- ✅ Tela de seleção com dois campos de entrada
- ✅ Validação de campos vazios
- ✅ Navegação entre telas
- ✅ Modelo de dados completo para batalhas
- ✅ Tela de resultado com comparação visual
- ✅ Barras de progresso para comparação de métricas
- ✅ Destaque para o vencedor
- ✅ Formatação de valores (moeda, percentuais)
- ✅ Botão para nova batalha
- ✅ Mock data para demonstração

## 🔄 Próximos Passos (Integração Backend)

Para integração com o backend:
1. Substituir os dados mock por chamadas à API
2. Implementar um Provider ou BLoC para gerenciamento de estado
3. Adicionar loading states durante as requisições
4. Implementar tratamento de erros
5. Adicionar cache de dados

## 📝 Notas

- A aplicação atualmente usa dados mock para demonstração
- Os dados podem ser facilmente substituídos por chamadas reais à API
- O design segue as referências visuais fornecidas
- Todas as cores e estilos foram implementados conforme as imagens de exemplo
