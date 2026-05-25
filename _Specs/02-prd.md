# PRD — Busca Inteligente de Filmes

**Produto:** Battle of Movies
**Feature:** Busca por linguagem natural em cima da base IMDb
**Autor:** Rubens Alves
**Versão:** 1.0
**Data:** 26/05/2026

---

## 1. Problema

Usuários que querem assistir a um filme frequentemente não sabem o título — sabem o que querem sentir, o gênero, a época, o estilo. As buscas tradicionais por palavra-chave não resolvem isso. O usuário precisa de uma busca que entenda intenção, não só texto.

---

## 2. Objetivo

Permitir que o usuário encontre filmes descrevendo em linguagem natural o que quer assistir, sem precisar saber o título ou usar filtros manuais.

---

## 3. Usuário-alvo

Pessoa que quer assistir a um filme mas não sabe qual. Sabe o que quer sentir, o gênero aproximado ou uma referência vaga. Não quer navegar por catálogo nem aplicar filtro por filtro.

---

## 4. Funcionalidades

### 4.1 Input de busca
O usuário digita uma query em linguagem natural em campo de texto livre. Não há restrição de formato ou vocabulário controlado.

### 4.2 Processamento da query
O sistema interpreta a intenção da busca e mapeia para os atributos disponíveis na base: gênero, ano, tipo de título, nota mínima, duração aproximada.

### 4.3 Consulta à base IMDb
O sistema busca em `title.basics` filtrando por `titleType = movie`, cruza com `title.ratings` para nota e volume de votos, e usa `title.akas` para suportar queries com títulos em português.

### 4.4 Ranqueamento dos resultados
Resultados ordenados por combinação de relevância semântica para a query e qualidade do título (`averageRating` × peso logarítmico de `numVotes`).

### 4.5 Resposta ao usuário
Lista paginada de filmes com: título principal (`primaryTitle`), ano (`startYear`), gêneros (`genres`), duração em minutos (`runtimeMinutes`), nota IMDb (`averageRating`) e número de votos (`numVotes`).

---

## 5. Critérios de sucesso

- Usuário encontra um filme relevante para sua query nos primeiros 5 resultados em pelo menos 80% dos casos
- Tempo de resposta abaixo de 2 segundos para queries simples
- Sistema retorna resultado útil mesmo para queries ambíguas ou incompletas
- Busca funciona com termos em português

---

## 6. Fora do escopo desta feature

- Busca por ator ou diretor
- Filtros manuais por interface
- Recomendação baseada em histórico do usuário
- Títulos de série, episódio ou short — apenas `titleType = movie`
- Streaming availability

---

## 7. Restrições técnicas

- Dados estão no neon, a variavel de ambiente será a data_url
- Faça a implementação do pedido abaixo dentro do pasta 2_PRD, considere que utilizaremos netlify, e separe front de back.
- Sem chamada a API externa para os dados de filmes
- A interpretação da query pode usar modelo de linguagem externo
