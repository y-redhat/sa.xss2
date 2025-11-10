// ページ読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('ページが正常に読み込まれました');
    
    // 検索ボタンのイベントリスナー
    document.getElementById('searchButton').addEventListener('click', function() {
        const input = document.getElementById('searchInput').value;
        // ❌ 終わてるポイント innerHTMLで直接表示
        document.getElementById('result').innerHTML = 
            "検索結果: " + input;
    });

    // コメントボタンのイベントリスナー
    document.getElementById('commentButton').addEventListener('click', function() {
        const comment = document.getElementById('commentInput').value;
        const div = document.createElement('div');
        // ❌ 終わてるポイント: innerHTMLで直接表示
        div.innerHTML = "コメント: " + comment;
        document.getElementById('commentArea').appendChild(div);
        document.getElementById('commentInput').value = '';
    });

    // Enterキーでも送信できるように
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('searchButton').click();
        }
    });

    document.getElementById('commentInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('commentButton').click();
        }
    });
});
