const http = require('http');
const url = require('url');
const querystring = require('querystring');

// 簡易データベース（メモリ上）
let users = [
    { id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com' },
    { id: 2, username: 'user1', password: 'password1', email: 'user1@example.com' },
    { id: 3, username: 'test', password: 'test123', email: 'test@example.com' }
];

let posts = [
    { id: 1, title: '最初の投稿', content: 'これはテスト投稿です', author: 'admin' },
    { id: 2, title: '二番目の投稿', content: 'もう一つの投稿', author: 'user1' }
];

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (pathname === '/') {
        serveFile(res, 'index.html');
    } else if (pathname === '/vulnerable') {
        serveFile(res, 'vulnerable.html');
    } else if (pathname === '/secure') {
        serveFile(res, 'secure.html');
    } else if (pathname === '/vulnerable-login' && req.method === 'POST') {
        handleVulnerableLogin(req, res);
    } else if (pathname === '/secure-login' && req.method === 'POST') {
        handleSecureLogin(req, res);
    } else if (pathname === '/vulnerable-search') {
        handleVulnerableSearch(req, res, parsedUrl);
    } else if (pathname === '/secure-search') {
        handleSecureSearch(req, res, parsedUrl);
    } else if (pathname === '/vulnerable-comments' && req.method === 'POST') {
        handleVulnerableComments(req, res);
    } else if (pathname === '/secure-comments' && req.method === 'POST') {
        handleSecureComments(req, res);
    } else {
        res.writeHead(404);
        res.end('ページが見つかりません');
    }
});

function serveFile(res, filename) {
    const fs = require('fs');
    fs.readFile(filename, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('ファイル読み込みエラー');
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
}

// 脆弱なログイン処理（SQLインジェクション）
function handleVulnerableLogin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        const { username, password } = querystring.parse(body);
        
        // ❌ 危険: SQLインジェクション脆弱性
        const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        
        // 簡易的なSQL実行シミュレーション
        const simulatedSQL = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        
        let result;
        if (username === "' OR '1'='1' --" || password === "' OR '1'='1' --") {
            // SQLインジェクション成功
            result = users; // 全ユーザーを返す
        } else {
            // 通常の検索
            result = users.filter(user => 
                user.username === username && user.password === password
            );
        }
        
        let html = `<h2>ログイン結果</h2>`;
        html += `<p>実行されたクエリ: <code>${simulatedSQL}</code></p>`;
        
        if (result.length > 0) {
            html += `<p style="color: green">✅ ログイン成功！</p>`;
            html += `<p>ユーザー情報: ${JSON.stringify(result)}</p>`;
        } else {
            html += `<p style="color: red">❌ ログイン失敗</p>`;
        }
        
        html += `<br><a href="/vulnerable">戻る</a>`;
        res.end(html);
    });
}

// 安全なログイン処理
function handleSecureLogin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        const { username, password } = querystring.parse(body);
        
        // ✅ 安全: パラメータ化されたクエリ
        const result = users.filter(user => 
            user.username === username && user.password === password
        );
        
        let html = `<h2>ログイン結果</h2>`;
        html += `<p>実行されたクエリ: <code>SELECT * FROM users WHERE username = ? AND password = ?</code></p>`;
        html += `<p>パラメータ: username='${username}', password='${password}'</p>`;
        
        if (result.length > 0) {
            html += `<p style="color: green">✅ ログイン成功！</p>`;
            // パスワードは表示しない
            const safeResult = result.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email
            }));
            html += `<p>ユーザー情報: ${JSON.stringify(safeResult)}</p>`;
        } else {
            html += `<p style="color: red">❌ ログイン失敗</p>`;
        }
        
        html += `<br><a href="/secure">戻る</a>`;
        res.end(html);
    });
}

// 脆弱な検索処理（XSS）
function handleVulnerableSearch(req, res, parsedUrl) {
    const query = parsedUrl.query.q || '';
    
    // ❌ 危険: XSS脆弱性
    let html = `<h2>検索結果</h2>`;
    html += `<p>検索クエリ: ${query}</p>`;
    html += `<div>結果: `;
    
    const results = posts.filter(post => 
        post.title.includes(query) || post.content.includes(query)
    );
    
    if (results.length > 0) {
        results.forEach(post => {
            // ❌ 危険: ユーザー入力をそのままHTMLに挿入
            html += `<div class="post">
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <small>投稿者: ${post.author}</small>
            </div>`;
        });
    } else {
        html += `<p>「${query}」の検索結果は見つかりませんでした</p>`;
    }
    
    html += `</div><br><a href="/vulnerable">戻る</a>`;
    res.end(html);
}

// 安全な検索処理
function handleSecureSearch(req, res, parsedUrl) {
    const query = parsedUrl.query.q || '';
    
    // ✅ 安全: エスケープ処理
    const escapeHTML = (str) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    };
    
    const safeQuery = escapeHTML(query);
    
    let html = `<h2>検索結果</h2>`;
    html += `<p>検索クエリ: ${safeQuery}</p>`;
    html += `<div>結果: `;
    
    const results = posts.filter(post => 
        post.title.includes(query) || post.content.includes(query)
    );
    
    if (results.length > 0) {
        results.forEach(post => {
            // ✅ 安全: エスケープ処理済み
            html += `<div class="post">
                <h3>${escapeHTML(post.title)}</h3>
                <p>${escapeHTML(post.content)}</p>
                <small>投稿者: ${escapeHTML(post.author)}</small>
            </div>`;
        });
    } else {
        html += `<p>「${safeQuery}」の検索結果は見つかりませんでした</p>`;
    }
    
    html += `</div><br><a href="/secure">戻る</a>`;
    res.end(html);
}

// 脆弱なコメント投稿（XSS）
function handleVulnerableComments(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        const { comment } = querystring.parse(body);
        
        // ❌ 危険: コメントをそのまま保存・表示
        let html = `<h2>コメント投稿結果</h2>`;
        html += `<p>あなたのコメント:</p>`;
        html += `<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">${comment}</div>`;
        html += `<p>コメントが投稿されました（実際には保存されません）</p>`;
        html += `<br><a href="/vulnerable">戻る</a>`;
        
        res.end(html);
    });
}

// 安全なコメント投稿
function handleSecureComments(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        const { comment } = querystring.parse(body);
        
        // ✅ 安全: エスケープ処理
        const escapeHTML = (str) => {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        };
        
        const safeComment = escapeHTML(comment);
        
        let html = `<h2>コメント投稿結果</h2>`;
        html += `<p>あなたのコメント:</p>`;
        html += `<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">${safeComment}</div>`;
        html += `<p>コメントが投稿されました（実際には保存されません）</p>`;
        html += `<br><a href="/secure">戻る</a>`;
        
        res.end(html);
    });
}

server.listen(3000, () => {
    console.log('サーバー起動: http://localhost:3000');
    console.log('脆弱性テストサイト: http://localhost:3000/vulnerable');
    console.log('安全なサイト: http://localhost:3000/secure');
});
