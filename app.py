from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
from database import init_db, get_db_connection
import html

app = Flask(__name__)
app.secret_key = 'debug_secret_key_123'  # 実際の運用ではランダムなキーを使用

# データベース初期化
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['GET', 'POST'])
def search():
    results = []
    query = ""
    
    if request.method == 'POST':
        query = request.form.get('query', '')
        
        # ❌ 脆弱性: XSS & SQLインジェクションの可能性
        conn = get_db_connection()
        
        # ❌ 危険: 文字列連結でSQLクエリ構築
        sql = f"SELECT * FROM users WHERE username LIKE '%{query}%' OR email LIKE '%{query}%'"
        
        cursor = conn.cursor()
        cursor.execute(sql)  # ❌ SQLインジェクション脆弱
        results = cursor.fetchall()
        conn.close()
    
    # ❌ 危険: エスケープせずにテンプレートに渡す
    return render_template('search.html', results=results, query=query)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        conn = get_db_connection()
        
        # ❌ 深刻な脆弱性: SQLインジェクション
        sql = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
        
        cursor = conn.cursor()
        cursor.execute(sql)  # ❌ パラメータ化せず実行
        user = cursor.fetchone()
        conn.close()
        
        if user:
            session['user'] = username
            flash('ログイン成功！', 'success')
            return redirect(url_for('index'))
        else:
            flash('ログイン失敗！', 'error')
    
    return render_template('login.html')

@app.route('/users')
def users():
    conn = get_db_connection()
    
    # ❌ 脆弱性: エスケープなし
    filter_param = request.args.get('filter', '')
    
    if filter_param:
        sql = f"SELECT * FROM users WHERE username LIKE '%{filter_param}%'"
    else:
        sql = "SELECT * FROM users"
    
    cursor = conn.cursor()
    cursor.execute(sql)  # ❌ SQLインジェクション
    users = cursor.fetchall()
    conn.close()
    
    return render_template('users.html', users=users, filter=filter_param)

@app.route('/add_user', methods=['POST'])
def add_user():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        conn = get_db_connection()
        
        # ❌ 脆弱性: SQLインジェクション
        sql = f"INSERT INTO users (username, email, password) VALUES ('{username}', '{email}', '{password}')"
        
        try:
            cursor = conn.cursor()
            cursor.execute(sql)
            conn.commit()
            flash('ユーザー追加成功！', 'success')
        except sqlite3.IntegrityError:
            flash('ユーザー名が既に存在します', 'error')
        finally:
            conn.close()
    
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    print("⚠ 脆弱性のあるアプリケーションを起動します...")
    print("⚠ このアプリは教育目的のみで使用してください")
    print("⚠ http://localhost:5000 でアクセスできます")
    app.run(debug=True, host='127.0.0.1', port=5000)
