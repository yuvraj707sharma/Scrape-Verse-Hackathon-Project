import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

_pool = psycopg2.pool.SimpleConnectionPool(
    1, 5,
    os.getenv("DATABASE_URL")
)

def get_conn():
    if _pool is not None:
        return _pool.getconn()
    raise Exception("Postgres connection pool not initialized")

def put_conn(conn):
    if _pool is not None:
        _pool.putconn(conn)
