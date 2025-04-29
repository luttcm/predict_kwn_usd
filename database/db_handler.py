import sqlite3
import pandas as pd

class Database:
    def __init__(self, db_path="exchange.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._create_table()
    
    def _create_table(self):
        self.conn.execute("""
        CREATE TABLE IF NOT EXISTS rates (
            date TEXT PRIMARY KEY,
            usd_to_krw REAL
        )
        """)
    
    def insert_rates(self, df):
        df.to_sql("rates", self.conn, if_exists="replace", index=False)