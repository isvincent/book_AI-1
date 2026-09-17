// === 音效管理器 ===
const sounds = {
    click: document.getElementById('sound-click'),
    receive: document.getElementById('sound-receive'),
    achievement: document.getElementById('sound-achievement')
};

function playSound(type) {
    if (sounds[type]) {
        sounds[type].currentTime = 0;
        sounds[type].play().catch(e => console.log('音效播放失敗(可能因瀏覽器政策阻擋):', e));
    }
}

// === 登入狀態管理 ===
let isLoggedIn = false;
let userName = '訪客';
const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

function updateLoginState(state) {
    isLoggedIn = state;
    if (isLoggedIn) {
        loginOverlay.classList.add('hidden');
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userProfile.classList.add('flex');
        chatInput.disabled = false;
        sendBtn.disabled = false;
        playSound('achievement');
        addHistoryItem('🔗 成功登入系統，連線至 Gemini AI。');
    } else {
        loginOverlay.classList.remove('hidden');
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        userProfile.classList.remove('flex');
        chatInput.disabled = true;
        sendBtn.disabled = true;
    }
}

// 模擬登入
loginBtn.addEventListener('click', () => {
    playSound('click');
    userName = '王小明'; // 模擬取得使用者名稱
    document.querySelector('#user-profile p.font-bold').textContent = `你好，${userName}！`;
    updateLoginState(true);
});

logoutBtn.addEventListener('click', () => {
    playSound('click');
    updateLoginState(false);
});

// 初始化狀態
updateLoginState(false);


// === YouTube 播放器整合 ===
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            listType: 'playlist',
            list: 'PLRLj8B40-Dx0' // 指定播放清單
        },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

// 載入 YouTube API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let currentVideoTitle = '';
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        const videoData = player.getVideoData();
        if (videoData && videoData.title && videoData.title !== currentVideoTitle) {
            currentVideoTitle = videoData.title;
            addHistoryItem(`▶️ 開始觀看影片：${currentVideoTitle}`);
        }
    } else if (event.data === YT.PlayerState.ENDED) {
        addHistoryItem(`✅ 影片觀看完成：${currentVideoTitle}`);
        playSound('achievement');
    }
}

document.getElementById('record-video-btn').addEventListener('click', () => {
    playSound('click');
    let title = currentVideoTitle || '目前播放的影片';
    addHistoryItem(`📝 手動標記完成觀看：${title}`);
});


// === 學習歷程管理 ===
let learningHistory = [];
const historyList = document.getElementById('history-list');
const emptyHistoryMsg = document.getElementById('empty-history-msg');

function addHistoryItem(text) {
    const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    const fullText = `[${time}] ${text}`;
    learningHistory.push(fullText);
    
    if (emptyHistoryMsg) emptyHistoryMsg.style.display = 'none';
    
    const p = document.createElement('p');
    p.className = 'border-b border-gray-100 pb-2 mb-2 animate-fade-in';
    p.textContent = fullText;
    historyList.prepend(p);
}

document.getElementById('download-history-btn').addEventListener('click', () => {
    playSound('click');
    if (learningHistory.length === 0) {
        alert('目前還沒有任何紀錄可以下載喔！');
        return;
    }
    
    const content = "=== 說書小宇宙 學習歷程紀錄 ===\n\n" + learningHistory.join("\n") + "\n\n=======================";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `學習歷程_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});


// === AI 聊天室邏輯 ===
const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
let chatHistory = [];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    
    const msg = chatInput.value.trim();
    if (!msg) return;
    
    // Play sound and clear input
    playSound('click');
    chatInput.value = '';
    
    // Add user message to UI
    appendUserMessage(msg);
    chatHistory.push({ role: 'user', content: msg });
    addHistoryItem(`💬 詢問了 AI 一個問題`);
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, history: chatHistory.slice(-10) }) // 傳送最後10則紀錄
        });
        
        const data = await response.json();
        removeTypingIndicator(typingId);
        
        if (response.ok) {
            appendAiMessage(data.reply);
            chatHistory.push({ role: 'model', content: data.reply });
            playSound('receive');
        } else {
            appendAiMessage(`⚠️ 錯誤：${data.error}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        removeTypingIndicator(typingId);
        appendAiMessage('連線失敗，請檢查網路連線或確認伺服器是否運行。');
    }
});

function appendUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'flex gap-3 flex-row-reverse animate-fade-in';
    div.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow">
            <i class="fa-solid fa-user"></i>
        </div>
        <div class="bg-indigo-600 p-3 rounded-2xl rounded-tr-none shadow-sm text-white text-[16px] max-w-[85%] leading-relaxed">
            ${escapeHTML(text)}
        </div>
    `;
    chatBox.appendChild(div);
    scrollToBottom();
}

function appendAiMessage(text) {
    // 簡單的 markdown 轉換 (處理換行和粗體)
    const formattedText = escapeHTML(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    const div = document.createElement('div');
    div.className = 'flex gap-3 animate-fade-in';
    div.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow">
            <i class="fa-solid fa-robot"></i>
        </div>
        <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-gray-700 text-[16px] max-w-[85%] leading-relaxed border border-gray-100 ai-message-content">
            ${formattedText}
        </div>
    `;
    chatBox.appendChild(div);
    scrollToBottom();
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex gap-3 animate-fade-in';
    div.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow">
            <i class="fa-solid fa-robot"></i>
        </div>
        <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 border border-gray-100">
            <div class="w-2 h-2 bg-purple-400 rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-purple-400 rounded-full typing-dot"></div>
            <div class="w-2 h-2 bg-purple-400 rounded-full typing-dot"></div>
        </div>
    `;
    chatBox.appendChild(div);
    scrollToBottom();
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

// === 下載 Word 功能 ===
document.getElementById('download-word-btn').addEventListener('click', () => {
    playSound('click');
    if (chatHistory.length === 0) {
        alert('目前還沒有對話紀錄可以匯出喔！');
        return;
    }
    
    // 建立簡易 HTML 結構供 Word 讀取
    let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>AI 伴讀報告</title>
            <style>
                body { font-family: '微軟正黑體', sans-serif; line-height: 1.6; color: #333; }
                h1 { color: #4c1d95; border-bottom: 2px solid #4c1d95; padding-bottom: 5px; }
                .user-msg { color: #1e40af; font-weight: bold; margin-top: 20px; background: #e0e7ff; padding: 10px; border-radius: 5px;}
                .ai-msg { margin-bottom: 20px; padding: 10px; border-left: 4px solid #8b5cf6; background: #f5f3ff;}
            </style>
        </head>
        <body>
            <h1>說書小宇宙 - AI 伴讀報告</h1>
            <p>匯出時間：${new Date().toLocaleString('zh-TW')}</p>
            <hr>
    `;
    
    chatHistory.forEach(msg => {
        if (msg.role === 'user') {
            htmlContent += `<div class="user-msg">🧑‍🎓 學生：${escapeHTML(msg.content)}</div>`;
        } else {
            const formattedAi = escapeHTML(msg.content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            htmlContent += `<div class="ai-msg">🤖 AI 小助手：<br>${formattedAi}</div>`;
        }
    });
    
    htmlContent += `</body></html>`;
    
    // 輸出為 .doc 格式 (Word 相容性高)
    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI_伴讀報告_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
