import sqlite3
import os

DATABASE = 'vulnerable_app.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """データベースの初期化 - テストデータ投入"""
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
    
    conn = get_db_connection()
    
    # ユーザーテーブル作成
    conn.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            profile_text TEXT
        )
    ''')
    
    # テストデータ投入
    test_users = [
        ('admin', 'admin123', 'admin@example.com', '管理者です'),
        ('taro', 'taro123', 'taro@example.com', '太郎です。よろしく！'),
        ('hanako', 'hanako123', 'hanako@example.com', '花子のプロフィール'),
        ('test', 'test123', 'test@example.com', '<script>alert("XSS")</script>'),
        ("' OR '1'='1", 'hack', 'hacker@example.com', 'SQLインジェクションの例')
    ]
    
    for username, password, email, profile in test_users:
        conn.execute(
            'INSERT INTO users (username, password, email, profile_text) VALUES (?, ?, ?, ?)',
            (username, password, email, profile)
        )
    
    conn.commit()
    conn.close()

def search_users_unsafe(query):
    """❌ SQLインジェクション脆弱性のある検索"""
    conn = get_db_connection()
    
    # 危険: 文字列連結でクエリ構築
    sql = f"SELECT * FROM users WHERE username LIKE '%{query}%' OR profile_text LIKE '%{query}%'"
    
    print(f"実行されるSQL: {sql}")  # デバッグ用
    results = conn.execute(sql).fetchall()
    conn.close()
    
    return results

def login_user_unsafe(username, password):
    """❌ SQLインジェクション脆弱性のあるログイン"""
    conn = get_db_connection()
    
    # 危険: 文字列連結でクエリ構築
    sql = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    
    print(f"実行されるSQL: {sql}")  # デバッグ用
    result = conn.execute(sql).fetchone()
    conn.close()
    
    return result

def get_all_users():
    """全ユーザー取得"""
    conn = get_db_connection()
    users = conn.execute('SELECT * FROM users').fetchall()
    conn.close()
    return users
