"""
ingest_remaining.py — Ingesta apenas title_ratings e title_akas.
Usar quando title_basics já foi carregado e só ratings/akas precisam ser atualizados.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from ingest import ingest_ratings, ingest_akas, DATABASE_URL

import psycopg2
import time

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = False
cur = conn.cursor()

total = time.time()
try:
    r = ingest_ratings(cur)
    conn.commit()

    a = ingest_akas(cur)
    conn.commit()

    print(f"\n🎉  Concluído em {time.time()-total:.0f}s")
    print(f"    ratings: {r:,}")
    print(f"    akas:    {a:,}")
except Exception as e:
    conn.rollback()
    print(f"\n❌  Erro: {e}")
    raise
finally:
    cur.close()
    conn.close()
