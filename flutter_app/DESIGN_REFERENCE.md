# Referência de Design - Battle of Movies

Este documento detalha como o design das imagens de referência foi implementado nas telas Flutter.

## 🎨 Tela 1: Seleção de Filmes

### Imagem de Referência
![Reference](https://github.com/user-attachments/assets/78018a00-27df-44a3-8220-33c693562b3b)

### Elementos Implementados

#### 1. Cabeçalho
**Referência:**
- "MOVIE BATTLE" em fonte grande e bold
- "MOVIE" em roxo/rosa claro
- "BATTLE" em branco

**Implementação:**
```dart
RichText(
  text: TextSpan(
    children: [
      TextSpan(
        text: 'MOVIE\n',
        style: TextStyle(
          fontSize: 64,
          fontWeight: FontWeight.w900,
          color: Color(0xFFc084fc), // Roxo claro
        ),
      ),
      TextSpan(
        text: 'BATTLE',
        style: TextStyle(
          fontSize: 64,
          fontWeight: FontWeight.w900,
          color: Colors.white,
        ),
      ),
    ],
  ),
)
```

#### 2. Subtítulo
**Referência:**
- "Escolha dois filmes para a batalha épica!"
- Cinza claro

**Implementação:**
```dart
Text(
  'Escolha dois filmes para a batalha épica!',
  style: TextStyle(
    fontSize: 16,
    color: Color(0xFF9ca3af),
  ),
)
```

#### 3. Card Filme 1
**Referência:**
- Background escuro
- Ícone de filme roxo em círculo
- Label "Filme 1"
- Input field com exemplo

**Implementação:**
```dart
Container(
  padding: EdgeInsets.all(24),
  decoration: BoxDecoration(
    color: Color(0xFF243141),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: Color(0xFF374151)),
  ),
  child: Column(
    children: [
      // Ícone
      Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Color(0xFFa855f7).withOpacity(0.2),
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.movie,
          color: Color(0xFFa855f7),
        ),
      ),
      // Label e Input
      TextField(...)
    ],
  ),
)
```

#### 4. Ícone Central
**Referência:**
- Espadas cruzadas em círculo cinza

**Implementação:**
```dart
Container(
  width: 80,
  height: 80,
  decoration: BoxDecoration(
    color: Color(0xFF374151),
    shape: BoxShape.circle,
  ),
  child: Icon(
    Icons.close, // Espadas cruzadas
    size: 40,
    color: Color(0xFF6b7280),
  ),
)
```

#### 5. Card Filme 2
**Referência:**
- Idêntico ao Card Filme 1 mas com ícone rosa

**Implementação:**
```dart
// Mesmo código do Card Filme 1
// Com cor: Color(0xFFec4899) para o rosa
```

#### 6. Botão Iniciar Batalha
**Referência:**
- Roxo vibrante
- Texto branco "Iniciar Batalha"
- Ícone de espadas

**Implementação:**
```dart
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: Color(0xFFa855f7),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  child: Row(
    children: [
      Icon(Icons.close),
      Text('Iniciar Batalha'),
    ],
  ),
)
```

#### 7. Dica Informativa
**Referência:**
- Ícone de lâmpada dourado
- Texto explicativo em cinza

**Implementação:**
```dart
Row(
  children: [
    Icon(
      Icons.lightbulb_outline,
      color: Color(0xFFfbbf24),
    ),
    Text(
      'Dica: Os dados da batalha são gerados...',
      style: TextStyle(color: Color(0xFF9ca3af)),
    ),
  ],
)
```

### Cores Utilizadas - Tela 1

| Elemento | Cor Hex | Uso |
|----------|---------|-----|
| Background | #1a1f2e | Fundo da tela |
| Cards | #243141 | Background dos cards |
| Borders | #374151 | Bordas dos cards |
| Purple | #a855f7 | Ícone e botão Filme 1 |
| Pink | #ec4899 | Ícone Filme 2 |
| Light Purple | #c084fc | Título "MOVIE" |
| Gray Text | #9ca3af | Textos secundários |
| Dark Gray | #6b7280 | Ícones neutros |
| Golden | #fbbf24 | Ícone de dica |

---

## 🏆 Tela 2: Resultado da Batalha

### Imagem de Referência
![Reference](https://github.com/user-attachments/assets/1eabcf2f-69d0-4dd3-bc4a-76f141a1d485)

### Elementos Implementados

#### 1. Cabeçalho
**Referência:**
- "MOVIE BATTLE" bicolor
- "MOVIE" em roxo
- "BATTLE" em rosa/coral

**Implementação:**
```dart
RichText(
  text: TextSpan(
    children: [
      TextSpan(
        text: 'MOVIE ',
        style: TextStyle(
          fontSize: 48,
          color: Color(0xFFc084fc), // Roxo
        ),
      ),
      TextSpan(
        text: 'BATTLE',
        style: TextStyle(
          fontSize: 48,
          color: Color(0xFFfda4af), // Rosa coral
        ),
      ),
    ],
  ),
)
```

#### 2. Cards dos Filmes

**Card Esquerdo (Vencedor):**
- Gradiente roxo
- Badge "VENCEDOR" dourado no topo
- Score grande: 72.5
- Métricas listadas

**Implementação:**
```dart
Container(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      colors: [
        Color(0xFFa855f7),
        Color(0xFFa855f7).withOpacity(0.7),
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    borderRadius: BorderRadius.circular(16),
  ),
  child: Column(
    children: [
      // Badge Vencedor
      Container(
        decoration: BoxDecoration(
          color: Color(0xFFfbbf24),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(Icons.emoji_events),
            Text('VENCEDOR'),
          ],
        ),
      ),
      // Título
      Text(movie.titulo),
      // Score
      Text('72.5', style: TextStyle(fontSize: 36)),
      // Métricas
      _buildMetricItem('⭐ IMDb:', '8.9/10'),
      _buildMetricItem('🍅 Rotten Tomatoes:', '89%'),
      // etc...
    ],
  ),
)
```

**Card Direito:**
- Gradiente rosa/coral
- Sem badge
- Mesma estrutura do card esquerdo

#### 3. VS Central

**Referência:**
- Espadas cruzadas
- "VS" abaixo

**Implementação:**
```dart
Column(
  children: [
    Icon(Icons.close, color: Color(0xFF6b7280), size: 40),
    Text('VS', style: TextStyle(color: Colors.white)),
  ],
)
```

#### 4. Comparação de Métricas

**Referência:**
- Card escuro
- Ícone de gráfico + título
- Barras comparativas coloridas
- 5 métricas principais

**Implementação:**
```dart
Container(
  padding: EdgeInsets.all(24),
  decoration: BoxDecoration(
    color: Color(0xFF243141),
    borderRadius: BorderRadius.circular(16),
  ),
  child: Column(
    children: [
      // Título
      Row(
        children: [
          Icon(Icons.bar_chart, color: Color(0xFF60a5fa)),
          Text('Comparação de Métricas'),
        ],
      ),
      // Cada métrica
      _buildMetricComparison(
        '⭐ IMDb Rating',
        '8.9/10', '8.8/10',
        8.9, 8.8, 10,
      ),
      // Barras de progresso
      Row(
        children: [
          Expanded( // Barra roxa
            flex: percentage1,
            child: Container(color: Color(0xFFa855f7)),
          ),
          Expanded( // Área cinza (não alcançada)
            flex: percentageGray,
            child: Container(color: Color(0xFF374151)),
          ),
          Expanded( // Barra rosa
            flex: percentage2,
            child: Container(color: Color(0xFFec4899)),
          ),
        ],
      ),
    ],
  ),
)
```

#### 5. Card Vencedor Final

**Referência:**
- Fundo dourado com gradiente
- Borda dourada
- Troféu grande
- "E o vencedor é..."
- Nome do filme
- Score
- Análise textual

**Implementação:**
```dart
Container(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      colors: [Color(0xFFfbbf24), Color(0xFFf59e0b)],
    ),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(
      color: Color(0xFFfcd34d),
      width: 2,
    ),
  ),
  child: Column(
    children: [
      Icon(Icons.emoji_events, size: 48),
      Text('🎬 E o vencedor é... 🎬'),
      Text(
        battle.vencedor.titulo,
        style: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w900,
        ),
      ),
      Text('Score: ${battle.vencedor.score}'),
      // Análise
      Container(
        color: Color(0xFF1a1f2e).withOpacity(0.2),
        child: Text(battle.analise),
      ),
    ],
  ),
)
```

#### 6. Botão Nova Batalha

**Referência:**
- Azul
- "Nova Batalha"
- Ícone de refresh

**Implementação:**
```dart
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: Color(0xFF3b82f6),
  ),
  child: Row(
    children: [
      Icon(Icons.refresh),
      Text('Nova Batalha'),
    ],
  ),
)
```

### Cores Utilizadas - Tela 2

| Elemento | Cor Hex | Uso |
|----------|---------|-----|
| Background | #1a1f2e | Fundo da tela |
| Card Dark | #243141 | Card de comparação |
| Purple Start | #a855f7 | Início gradiente filme 1 |
| Purple End | #a855f7 (70%) | Fim gradiente filme 1 |
| Pink Start | #ec4899 | Início gradiente filme 2 |
| Pink End | #ec4899 (70%) | Fim gradiente filme 2 |
| Golden Start | #fbbf24 | Início gradiente vencedor |
| Golden End | #f59e0b | Fim gradiente vencedor |
| Golden Border | #fcd34d | Borda card vencedor |
| Blue Button | #3b82f6 | Botão Nova Batalha |
| Gray Progress | #374151 | Área não alcançada nas barras |

### Métricas Comparadas

1. **⭐ IMDb Rating** - Escala 0-10
2. **🍅 Rotten Tomatoes** - Percentual 0-100%
3. **📊 Metacritic** - Escala 0-100
4. **💰 Bilheteria** - Valores formatados ($XXB ou $XXM)
5. **🏆 Prêmios Oscar** - Número de prêmios

---

## 📐 Espaçamentos

### Tela 1
```dart
Padding geral: 24px
Espaçamento entre elementos grandes: 60px
Espaçamento entre elementos médios: 40px
Espaçamento entre elementos pequenos: 16px
Padding interno cards: 24px
```

### Tela 2
```dart
Padding geral: 24px
Espaçamento entre seções: 32px
Espaçamento entre métricas: 16px
Padding interno cards: 24px / 20px
```

## 🔤 Tipografia

### Tamanhos de Fonte
```dart
Título principal: 64px (Tela 1) / 48px (Tela 2)
Score grande: 36px
Título do filme no card: 16px
Títulos de seção: 18px
Texto corpo: 16px
Texto secundário: 14px
Labels pequenos: 12px
Métricas: 11px
```

### Pesos de Fonte
```dart
Títulos principais: w900 (Black)
Títulos de seção: bold / w600
Texto normal: normal / w400
```

## 🎯 Fidelidade ao Design

### ✅ Implementado Fielmente
- Todas as cores principais
- Todos os gradientes
- Layout geral das duas telas
- Estrutura de cards
- Posicionamento de elementos
- Barras de comparação
- Badge de vencedor
- Ícones e emojis

### 🔄 Adaptações Feitas
1. **Ícones:**
   - Usados ícones da biblioteca Material Icons
   - Mantida a intenção visual (filme, troféu, etc)

2. **Fontes:**
   - Usada fonte padrão do sistema
   - Mantidos pesos e tamanhos proporcionais

3. **Espaçamentos:**
   - Ajustados para melhor responsividade
   - Mantidas proporções gerais

4. **Interatividade:**
   - Adicionada validação (não visível na imagem)
   - Feedback via SnackBar

### ⚡ Melhorias Implementadas
- Scroll para telas pequenas
- Validação de entrada
- Feedback visual
- Navegação suave
- Tratamento de valores null

---

## 🎨 Paleta Completa

```dart
// Backgrounds
const backgroundColor = Color(0xFF1a1f2e);
const cardBackground = Color(0xFF243141);
const borderColor = Color(0xFF374151);

// Primary Colors
const purpleMain = Color(0xFFa855f7);
const purpleLight = Color(0xFFc084fc);
const pinkMain = Color(0xFFec4899);
const pinkLight = Color(0xFFfda4af);
const blueMain = Color(0xFF3b82f6);
const blueLight = Color(0xFF60a5fa);

// Accent Colors
const goldenMain = Color(0xFFfbbf24);
const goldenDark = Color(0xFFf59e0b);
const goldenLight = Color(0xFFfcd34d);

// Text Colors
const textWhite = Colors.white;
const textGrayLight = Color(0xFF9ca3af);
const textGrayMedium = Color(0xFF6b7280);

// Status Colors
const successGreen = Colors.green;
const errorRed = Colors.red;
```

## ✅ Checklist de Design

### Tela 1
- [x] Logo "MOVIE BATTLE"
- [x] Subtítulo correto
- [x] Card Filme 1 (roxo)
- [x] Card Filme 2 (rosa)
- [x] Ícone central
- [x] Botão roxo
- [x] Dica com lâmpada
- [x] Inputs funcionais
- [x] Cores corretas
- [x] Espaçamentos adequados

### Tela 2
- [x] Logo bicolor
- [x] Cards com gradiente
- [x] Badge vencedor
- [x] VS central
- [x] Seção de comparação
- [x] Barras de progresso
- [x] Card dourado vencedor
- [x] Botão azul
- [x] Todas as métricas
- [x] Análise textual
- [x] Cores corretas
- [x] Layout responsivo

---

**Conclusão:** O design foi implementado com alta fidelidade às imagens de referência, mantendo todas as cores, estruturas e elementos visuais solicitados.
