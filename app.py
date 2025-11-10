from flask import Flask, render_template, request, redirect, url_for, session, make_response
import sqlite3
import os
from database import init_db, get_all_users, search_users_unsafe, login_user_unsafe

app = Flask(__name__)
app.secret_key = 'very_insecure_secret_key_12345'
DATABASE = 'vulnerable_app.db'

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
        # ❌ 脆弱性: SQLインジェクション
        results = search_users_unsafe(query)
    elif request.method == 'GET':
        query = request.args.get('q', '')
        if query:
            results = search_users_unsafe(query)
    
    # ❌ 脆弱性: XSS - ユーザー入力をそのままテンプレートに渡す
    return render_template('search.html', results=results, query=query)

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # ❌ 脆弱性: SQLインジェクション
        user = login_user_unsafe(username, password)
        
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            return redirect(url_for('dashboard'))
        else:
            error = "ログインに失敗しました"
    
    return render_template('login.html', error=error)

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # ❌ 脆弱性: ユーザー入力の安全な確認なし
    message = request.args.get('message', '')
    
    return render_template('users.html', 
                         username=session.get('username'),
                         message=message,
                         users=get_all_users())

@app.route('/profile')
def profile():
    # ❌ 脆弱性: XSS - URLパラメータをそのまま表示
    name = request.args.get('name', 'ゲスト')
    bio = request.args.get('bio', '自己紹介がありません')
    
    response = make_response(render_template('profile.html', name=name, bio=bio))
    
    # ❌ 脆弱性: ユーザー入力のCookie設定
    theme = request.args.get('theme', 'light')
    response.set_cookie('theme', theme)
    
    return response

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    print("⚠ 警告: このアプリケーションには意図的な脆弱性が含まれています")
    print("🚫 公開サーバーでは絶対に実行しないでください")
    print("🌐 ローカルアクセス: http://localhost:5000")
    app.run(debug=True, host='127.0.0.1', port=5000)
