"""
ingest.py — Ingesta os arquivos TSV do IMDb no banco Neon (PostgreSQL)

Uso:
    $env:DATABASE_URL='postgres://...'
    python _data/ingest/ingest.py

Ordem de ingestão:
    1. title_basics   (filtro: titleType=movie, isAdult=0)
    2. title_ratings  (apenas filmes presentes em title_basics)
    3. title_akas     (filtro: region IN BR,PT,US,GB ou is_original_title=1)

Estratégia: COPY FROM STDIN com streaming — não carrega o arquivo inteiro na memória.
"""

import os
import csv
import io
import sys
import time
import psycopg2

# Alguns campos do IMDb excedem o limite padrão de 128KB do csv
csv.field_size_limit(10_000_000)

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌  Variável DATABASE_URL não definida.")
    print("    Uso: $env:DATABASE_URL='postgres://...' ; python _data/ingest/ingest.py")
    sys.exit(1)

# _data/ é o diretório pai deste script
DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FILES = {
    "basics":  os.path.join(DATA_DIR, "title.basics.tsv",  "title.basics.tsv"),
    "ratings": os.path.join(DATA_DIR, "title.ratings.tsv", "title.ratings.tsv"),
    "akas":    os.path.join(DATA_DIR, "title.akas.tsv",    "title.akas.tsv"),
}

NULL_MARKER  = r"\N"
BATCH_SIZE   = 50_000
AKAS_REGIONS = {"BR", "PT", "US", "GB"}


def null(v):
    """Converte \\N para None, mantém o restante."""
    return None if v == NULL_MARKER else v


def pg_array(v):
    """Converte 'Action,Drama' para '{Action,Drama}' (formato array do Postgres)."""
    if v is None or v == NULL_MARKER:
        return None
    return "{" + v + "}"


def progress(label, count, start):
    elapsed = time.time() - start
    print(f"\r  {label}: {count:,} linhas | {elapsed:.0f}s", end="", flush=True)


# ─────────────────────────────────────────────
# 1. title_basics
# ─────────────────────────────────────────────
def ingest_basics(cur):
    print("\n[1/3] title_basics …")
    cur.execute("TRUNCATE title_basics CASCADE;")

    path = FILES["basics"]
    count = 0
    start = time.time()
    buf = io.StringIO()

    def flush(buf, cur):
        buf.seek(0)
        cur.copy_expert(
            "COPY title_basics (tconst, primary_title, original_title, start_year, runtime_minutes, genres) FROM STDIN WITH (FORMAT text, NULL '\\N', DELIMITER E'\\t')",
            buf,
        )
        buf.truncate(0)
        buf.seek(0)

    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row["titleType"] != "movie":
                continue
            if row["isAdult"] != "0":
                continue

            genres = pg_array(row["genres"])
            line = "\t".join([
                row["tconst"],
                row["primaryTitle"]   if row["primaryTitle"]   != NULL_MARKER else "\\N",
                row["originalTitle"]  if row["originalTitle"]  != NULL_MARKER else "\\N",
                row["startYear"]      if row["startYear"]      != NULL_MARKER else "\\N",
                row["runtimeMinutes"] if row["runtimeMinutes"] != NULL_MARKER else "\\N",
                genres if genres is not None else "\\N",
            ]) + "\n"
            buf.write(line)
            count += 1

            if count % BATCH_SIZE == 0:
                flush(buf, cur)
                progress("basics", count, start)

        if buf.tell() > 0:
            flush(buf, cur)

    print(f"\r  ✅ title_basics: {count:,} linhas em {time.time()-start:.0f}s")
    return count


# ─────────────────────────────────────────────
# 2. title_ratings
# ─────────────────────────────────────────────
def ingest_ratings(cur):
    print("\n[2/3] title_ratings …")
    cur.execute("TRUNCATE title_ratings;")

    print("  Carregando tconsts válidos de title_basics …")
    cur.execute("SELECT tconst FROM title_basics;")
    valid_tconsts = {row[0] for row in cur.fetchall()}
    print(f"  {len(valid_tconsts):,} tconsts carregados.")

    path = FILES["ratings"]
    count = 0
    skipped = 0
    start = time.time()
    buf = io.StringIO()

    def flush(buf, cur):
        buf.seek(0)
        cur.copy_expert(
            "COPY title_ratings (tconst, average_rating, num_votes) FROM STDIN WITH (FORMAT text, NULL '\\N', DELIMITER E'\\t')",
            buf,
        )
        buf.truncate(0)
        buf.seek(0)

    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row["tconst"] not in valid_tconsts:
                skipped += 1
                continue
            line = "\t".join([
                row["tconst"],
                row["averageRating"],
                row["numVotes"],
            ]) + "\n"
            buf.write(line)
            count += 1

            if count % BATCH_SIZE == 0:
                flush(buf, cur)
                progress("ratings", count, start)

        if buf.tell() > 0:
            flush(buf, cur)

    print(f"\r  ✅ title_ratings: {count:,} linhas ({skipped:,} ignoradas) em {time.time()-start:.0f}s")
    return count


# ─────────────────────────────────────────────
# 3. title_akas
# ─────────────────────────────────────────────
def ingest_akas(cur):
    print("\n[3/3] title_akas …")
    cur.execute("TRUNCATE title_akas;")

    print("  Carregando tconsts válidos de title_basics …")
    cur.execute("SELECT tconst FROM title_basics;")
    valid_tconsts = {row[0] for row in cur.fetchall()}

    path = FILES["akas"]
    count = 0
    skipped = 0
    start = time.time()
    buf = io.StringIO()

    def flush(buf, cur):
        buf.seek(0)
        cur.copy_expert(
            "COPY title_akas (title_id, ordering, title, region, language, is_original_title) FROM STDIN WITH (FORMAT text, NULL '\\N', DELIMITER E'\\t')",
            buf,
        )
        buf.truncate(0)
        buf.seek(0)

    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            region  = null(row.get("region", NULL_MARKER))
            is_orig = row.get("isOriginalTitle", "0") == "1"

            if region not in AKAS_REGIONS and not is_orig:
                continue
            if row["titleId"] not in valid_tconsts:
                skipped += 1
                continue

            line = "\t".join([
                row["titleId"],
                row["ordering"],
                row["title"]   if row["title"]   != NULL_MARKER else "\\N",
                region         if region is not None else "\\N",
                null(row.get("language", NULL_MARKER)) or "\\N",
                "true" if is_orig else "false",
            ]) + "\n"
            buf.write(line)
            count += 1

            if count % BATCH_SIZE == 0:
                flush(buf, cur)
                progress("akas", count, start)

        if buf.tell() > 0:
            flush(buf, cur)

    print(f"\r  ✅ title_akas: {count:,} linhas ({skipped:,} ignoradas) em {time.time()-start:.0f}s")
    return count


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
def main():
    print("🔌  Conectando ao banco …")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()
    print("✅  Conectado.\n")

    total_start = time.time()
    try:
        b = ingest_basics(cur)
        conn.commit()

        r = ingest_ratings(cur)
        conn.commit()

        a = ingest_akas(cur)
        conn.commit()

        elapsed = time.time() - total_start
        print(f"\n🎉  Ingestão concluída em {elapsed:.0f}s")
        print(f"    basics:  {b:,}")
        print(f"    ratings: {r:,}")
        print(f"    akas:    {a:,}")

    except Exception as e:
        conn.rollback()
        print(f"\n❌  Erro: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
