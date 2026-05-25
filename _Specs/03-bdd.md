# BDD — Busca Inteligente de Filmes

**Projeto:** Battle of Movies
**Feature:** Busca IMDb por linguagem natural
**Versão:** 1.0
**Data:** 26/05/2026

---

```gherkin
Feature: Busca inteligente de filmes por linguagem natural
  Como usuário do Battle of Movies
  Quero buscar filmes descrevendo em linguagem natural o que quero assistir
  Para encontrar filmes relevantes sem precisar saber o título

  Background:
    Given a base IMDb está carregada com title_basics, title_ratings e title_akas
    And o sistema está disponível e respondendo

  # ── BUSCA BÁSICA ──────────────────────────────────────────

  Scenario: Busca por gênero e década
    Given o usuário digita "filmes de terror dos anos 80"
    When o sistema processa a query
    Then o sistema retorna uma lista com no mínimo 5 filmes
    And todos os filmes retornados têm titleType igual a "movie"
    And todos os filmes retornados contêm o gênero "Horror"
    And todos os filmes retornados têm startYear entre 1980 e 1989
    And os resultados estão ordenados por relevância decrescente

  Scenario: Busca por sentimento e estilo
    Given o usuário digita "filme para chorar com final triste"
    When o sistema processa a query
    Then o sistema retorna uma lista com no mínimo 5 filmes
    And todos os filmes retornados têm titleType igual a "movie"
    And os filmes retornados incluem gêneros como "Drama" ou "Romance"
    And todos os filmes retornados têm averageRating maior ou igual a 6.0

  Scenario: Busca por referência vaga sem título
    Given o usuário digita "aquele filme com robô que aprende a ser humano"
    When o sistema processa a query
    Then o sistema retorna uma lista com no mínimo 3 filmes
    And todos os filmes retornados têm titleType igual a "movie"
    And os resultados incluem filmes do gênero "Sci-Fi"

  # ── BUSCA EM PORTUGUÊS ────────────────────────────────────

  Scenario: Busca com título em português
    Given o usuário digita "filme de guerra"
    When o sistema processa a query
    Then o sistema retorna uma lista com no mínimo 5 filmes
    And os filmes retornados incluem gêneros como "War" ou "Action"
    And o sistema considerou títulos da tabela title_akas com region "BR"

  Scenario: Busca com termo em português sem equivalente direto em inglês
    Given o usuário digita "filme de faroeste com mocinho e bandido"
    When o sistema processa a query
    Then o sistema retorna uma lista com no mínimo 3 filmes
    And os filmes retornados incluem o gênero "Western"

  # ── RANQUEAMENTO ──────────────────────────────────────────

  Scenario: Resultados são ranqueados por qualidade quando relevância é similar
    Given o usuário digita "comédia romântica"
    When o sistema processa a query
    Then o sistema retorna uma lista com no mínimo 10 filmes
    And o primeiro resultado tem averageRating maior ou igual ao último resultado
    And filmes com numVotes abaixo de 1000 não aparecem nos primeiros 5 resultados

  Scenario: Filmes muito antigos com poucos votos não dominam os resultados
    Given o usuário digita "drama familiar"
    When o sistema processa a query
    Then os 5 primeiros resultados têm numVotes maior ou igual a 5000

  # ── PAGINAÇÃO ─────────────────────────────────────────────

  Scenario: Primeira página de resultados
    Given o usuário digita "filme de ação"
    When o sistema processa a query sem parâmetro de página
    Then o sistema retorna exatamente 10 filmes
    And a resposta inclui o total de resultados encontrados
    And a resposta indica que existe uma próxima página

  Scenario: Segunda página de resultados
    Given o usuário digita "filme de ação"
    When o sistema processa a query com page igual a 2
    Then o sistema retorna até 10 filmes
    And nenhum filme retornado é igual aos filmes da primeira página

  # ── PERFORMANCE ───────────────────────────────────────────

  Scenario: Tempo de resposta para query simples
    Given o usuário digita "filme de terror"
    When o sistema processa a query
    Then o sistema retorna a resposta em menos de 2 segundos

  Scenario: Tempo de resposta para query complexa
    Given o usuário digita "drama histórico europeu do século XIX baseado em livro com protagonista feminina forte"
    When o sistema processa a query
    Then o sistema retorna a resposta em menos de 2 segundos

  # ── CASOS DE BORDA ────────────────────────────────────────

  Scenario: Query ambígua retorna resultado útil com fallback
    Given o usuário digita "aquele filme sabe né"
    When o sistema processa a query
    Then o sistema não retorna erro
    And o sistema retorna uma lista com no mínimo 1 filme
    And a resposta indica baixa confiança no resultado

  Scenario: Query com termo que não existe na base
    Given o usuário digita "filme do planeta Zorbak com aliens cor-de-rosa"
    When o sistema processa a query
    Then o sistema retorna uma lista vazia
    And a resposta contém uma mensagem informando que nenhum resultado foi encontrado
    And o status HTTP da resposta é 200

  Scenario: Query vazia
    Given o usuário envia uma query em branco
    When o sistema processa a query
    Then o sistema retorna status HTTP 400
    And a resposta contém uma mensagem de erro indicando que a query é obrigatória

  Scenario: Query com apenas caracteres especiais
    Given o usuário digita "!@#$%"
    When o sistema processa a query
    Then o sistema retorna status HTTP 400
    And a resposta contém uma mensagem de erro indicando query inválida

  # ── FORMATO DA RESPOSTA ───────────────────────────────────

  Scenario: Estrutura dos dados retornados
    Given o usuário digita "filme de ficção científica"
    When o sistema processa a query
    Then cada filme na resposta contém os campos:
      | campo            | tipo    |
      | tconst           | string  |
      | primaryTitle     | string  |
      | startYear        | integer |
      | genres           | array   |
      | runtimeMinutes   | integer |
      | averageRating    | float   |
      | numVotes         | integer |
      | relevanceScore   | float   |
    And o campo relevanceScore está entre 0.0 e 1.0
    And nenhum campo obrigatório está nulo ou ausente

  Scenario: Filmes adultos não aparecem nos resultados
    Given o usuário digita qualquer query válida
    When o sistema processa a query
    Then nenhum filme retornado tem isAdult igual a 1

  Scenario: Apenas filmes aparecem nos resultados
    Given o usuário digita "série de drama"
    When o sistema processa a query
    Then nenhum resultado retornado tem titleType diferente de "movie"
```
