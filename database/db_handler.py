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
            rate REAL
        )
        """)
    
    def insert_rates(self, df):
        df.to_sql("rates", self.conn, if_exists="replace", index=False)
    
    def get_rates(self, limit=100, offset=0):
        cursor = self.conn.cursor()
        cursor.execute("""
        SELECT date, rate FROM rates
        ORDER BY date DESC
        LIMIT ? OFFSET ?
        """, (limit, offset))
        return cursor.fetchall()
    
    def get_all_rates(self):
        cursor = self.conn.cursor()
        cursor.execute("""
        SELECT date, rate FROM rates
        ORDER BY date DESC
        """)
        return cursor.fetchall()
    
    def get_rates_count(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM rates")
        return cursor.fetchone()[0]
    
    def __del__(self):
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()