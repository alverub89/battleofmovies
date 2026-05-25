# Battle of Movies

Projeto de busca inteligente de filmes com base nos dados públicos do IMDb.

---

## Estrutura

```
_data/
  ingest/
    ingest.py            # Ingestão completa (3 tabelas)
    ingest_remaining.py  # Só ratings + akas (quando basics já está no banco)
  title.basics.tsv/      # Dados brutos IMDb — não versionar
  title.ratings.tsv/
  title.akas.tsv/
dataBase.md              # Migration SQL (schema completo do banco Neon)
```

---

## Atualização mensal dos dados

O IMDb disponibiliza dumps atualizados todo mês em:
**https://developer.imdb.com/non-commercial-datasets/**

Arquivos necessários:
- `title.basics.tsv.gz`
- `title.ratings.tsv.gz`
- `title.akas.tsv.gz`

Após baixar e descompactar em `_data/`, rodar a ingestão completa:

```powershell
# 1. Definir a variável de ambiente com a connection string do Neon
$env:DATABASE_URL = "postgresql://..."

# 2. Rodar a ingestão completa
python _data/ingest/ingest.py
```

### Só atualizar ratings e akas (sem recarregar basics)

Se `title_basics` não mudou e você só quer atualizar notas/títulos:

```powershell
$env:DATABASE_URL = "postgresql://..."
python _data/ingest/ingest_remaining.py
```

---

## O que a ingestão faz

| Script | Tabelas | Filtros aplicados |
|---|---|---|
| `ingest.py` | basics → ratings → akas | `titleType=movie`, `isAdult=0`, regiões BR/PT/US/GB |
| `ingest_remaining.py` | ratings → akas | Idem, pulando basics |

- Usa `COPY FROM STDIN` (bulk insert via streaming — sem carregar tudo na memória)
- Commita cada tabela separadamente
- Respeita a FK: basics precisa existir antes de ratings e akas

---

## Schema do banco

Ver [dataBase.md](dataBase.md) para o SQL completo de migration (tabelas, índices, view `movies_search`).

Para aplicar o schema em um banco novo:

```powershell
$env:DATABASE_URL = "postgresql://..."
python -c "
import psycopg2, os
conn = psycopg2.connect(os.environ['DATABASE_URL'])
conn.autocommit = False
cur = conn.cursor()
cur.execute(open('dataBase.md').read())
conn.commit()
cur.close(); conn.close()
print('Migration OK')
"
```
