import sqlite3
import os

def get_db_connection():
    conn = sqlite3.connect('data.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists('data.db'):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ユーザーテーブル作成
        cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # テストデータ挿入
        test_users = [
            ('admin', 'admin@example.com', 'admin123'),
            ('user1', 'user1@example.com', 'password1'),
            ('testuser', 'test@example.com', 'testpass'),
            ('山田太郎', 'yamada@example.com', 'yamada123'),
            ('佐藤花子', 'sato@example.com', 'sato456')
        ]
        
        cursor.executemany(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            test_users
        )
        
        conn.commit()
        conn.close()
        print("✅ データベースを初期化しました")
