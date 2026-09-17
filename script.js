document.addEventListener('DOMContentLoaded', () => {
    // === 音效控制 ===
    const clickSound = document.getElementById('clickSound');
    const msgSound = document.getElementById('msgSound');

    // 播放音效的安全封裝函數
    const playSound = (audioElement) => {
        try {
            audioElement.currentTime = 0;
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('音效無法播放 (瀏覽器通常限制自動播放):', error);
                });
            }
        } catch (e) {
            console.log('音效系統錯誤:', e);
        }
    };

    // 為頁面上所有按鈕加入點擊音效
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => playSound(clickSound));
    });

    // === 畫面切換與登入邏輯 ===
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginScreen = document.getElementById('loginScreen');
    const mainScreen = document.getElementById('mainScreen');

    loginBtn.addEventListener('click', () => {
        // 視覺化模擬登入過程
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 連線至 Gemini 中...';
        loginBtn.style.pointerEvents = 'none';
        
        setTimeout(() => {
            loginScreen.classList.remove('active');
            mainScreen.classList.add('active');
            loginBtn.innerHTML = '<i class="fab fa-google"></i> 使用 Google (Gemini) 帳號登入';
            loginBtn.style.pointerEvents = 'auto';
            addHistory('系統紀錄', '同學已成功登入系統，開始今天的閱讀旅程！', 'fa-sign-in-alt');
        }, 1500);
    });

    logoutBtn.addEventListener('click', () => {
        mainScreen.classList.remove('active');
        loginScreen.classList.add('active');
    });

    // === 聊天與 AI 模擬邏輯 ===
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const historyList = document.getElementById('historyList');

    // 模擬的 AI 回覆知識庫 (因為無須 API Key，採用前端模擬機制來互動)
    const mockAIResponses = [
        "這是一個很棒的問題！影片中這本書主要是想要告訴我們：『在資訊爆炸的時代，保持專注力是成功的關鍵』。你有特別同意書裡的哪個觀點嗎？",
        "根據影片的介紹，作者認為習慣的養成比單純依靠意志力更重要喔。如果我們每天進步 1%，一年後就會產生巨大的改變！",
        "我整理一下影片的重點：這本書強調『成長型思維』。面對挫折時，不要覺得自己『不行』，而是告訴自己『我只是還沒學會』。",
        "這個觀點很有趣！如果你想深入了解，我建議你可以特別注意影片在作者舉出『生活案例』的那一段，非常貼切高中生的生活。",
        "總結來說，這本書的核心精神就是『勇敢試錯，從做中學』。對於正在準備大考或探索未來的你們來說，是非常有幫助的思維模型喔！",
        "影片裡提到的那個理論，其實在心理學上叫做『棉花糖實驗』，也就是延遲享樂的能力。這在規劃讀書計畫時非常實用！"
    ];

    // 新增訊息到聊天室
    const addMessage = (text, isUser = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = isUser ? '<i class="fas fa-user-graduate"></i>' : '<i class="fas fa-robot"></i>';

        const content = document.createElement('div');
        content.className = 'content';
        content.textContent = text;

        // 若為 AI 訊息，加入「存為 Word」功能按鈕
        if (!isUser) {
            const dlBtn = document.createElement('button');
            dlBtn.className = 'download-word-btn';
            dlBtn.innerHTML = '<i class="fas fa-file-word"></i> 存為 Word';
            dlBtn.onclick = (e) => {
                playSound(clickSound);
                exportToWord(text);
            };
            content.appendChild(document.createElement('br'));
            content.appendChild(dlBtn);
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        chatBox.appendChild(msgDiv);
        
        // 平滑滾動到最新訊息
        chatBox.scrollTo({
            top: chatBox.scrollHeight,
            behavior: 'smooth'
        });
    };

    // 新增學習歷程
    const addHistory = (type, action, iconClass = 'fa-check-circle') => {
        const li = document.createElement('li');
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        li.innerHTML = `
            <span class="time"><i class="fas ${iconClass}"></i> ${timeStr} | ${type}</span>
            <div style="margin-top: 5px; color: #333;">${action}</div>
        `;
        historyList.prepend(li); // 將最新的歷程加在列表最頂端
    };

    // 處理送出訊息
    const handleSend = () => {
        const text = userInput.value.trim();
        if (text) {
            // 1. 顯示使用者訊息
            addMessage(text, true);
            userInput.value = '';
            userInput.focus();
            
            // 2. 紀錄至學習歷程
            addHistory('向 AI 提問', `詢問內容：「${text}」`, 'fa-question-circle');

            // 3. 模擬 AI 思考特效
            const typingMsgDiv = document.createElement('div');
            typingMsgDiv.className = 'message ai-message';
            typingMsgDiv.innerHTML = `
                <div class="avatar"><i class="fas fa-robot fa-spin"></i></div>
                <div class="content" style="color: #666;">
                    <i class="fas fa-circle-notch fa-spin"></i> Gemini AI 分析與思考中...
                </div>`;
            chatBox.appendChild(typingMsgDiv);
            chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

            // 4. 延遲後給出 AI 回覆 (模擬網路延遲)
            setTimeout(() => {
                chatBox.removeChild(typingMsgDiv);
                playSound(msgSound);
                
                // 隨機抽選回覆內容來模擬 AI
                const reply = mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
                addMessage(reply, false);
                addHistory('AI 助教回覆', `已成功解析問題並提供重點解答。`, 'fa-robot');
            }, 1500 + Math.random() * 1000); // 隨機 1.5 ~ 2.5 秒
        }
    };

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });

    // === 匯出功能：AI 回覆存為 Word (.doc) ===
    const exportToWord = (text) => {
        // 利用 HTML 結構加上 msword 的 namespace 產出 doc 檔案
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>AI 說書人重點筆記</title></head><body>";
        const footer = "</body></html>";
        
        // Word 內容排版
        const sourceHTML = `
            ${header}
            <div style="font-family: 'Microsoft JhengHei', sans-serif;">
                <h2 style="color: #4285F4; border-bottom: 2px solid #4285F4; padding-bottom: 5px;">AI 說書人小學堂 - 學習筆記</h2>
                <p style="font-size: 14pt; line-height: 1.8; color: #333333; margin-top: 20px;">
                    ${text}
                </p>
                <br>
                <hr>
                <p style="font-size: 10pt; color: #888888;">文件產生時間：${new Date().toLocaleString('zh-TW')}</p>
            </div>
            ${footer}
        `;
        
        const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AI_閱讀筆記_${new Date().getTime()}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addHistory('匯出筆記', '將 AI 助教的重點整理下載為 Word 文件。', 'fa-file-word');
    };

    // === 匯出功能：下載學習歷程 (.txt) ===
    const downloadHistoryBtn = document.getElementById('downloadHistoryBtn');
    downloadHistoryBtn.addEventListener('click', () => {
        let historyText = "====================================\n";
        historyText += "     AI 說書人小學堂 - 學習歷程紀錄     \n";
        historyText += `     匯出時間：${new Date().toLocaleString('zh-TW')}\n`;
        historyText += "====================================\n\n";
        
        const items = document.querySelectorAll('#historyList li');
        
        if(items.length === 0) {
            alert('目前還沒有任何學習歷程喔！趕快開始學習吧！');
            return;
        }

        // 由於 prepend 的關係，畫面上的順序是最新的在上面
        // 匯出時也依照畫面上的順序
        items.forEach((item, index) => {
            const timeElement = item.querySelector('.time').innerText;
            const actionText = item.querySelector('div').innerText;
            historyText += `[${timeElement}]\n詳細內容：${actionText}\n------------------------------------\n`;
        });

        const blob = new Blob([historyText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `個人學習歷程_${new Date().toISOString().slice(0,10)}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        
        // 不要把匯出歷程這個動作本身記錄到要匯出的檔案裡，所以放在匯出動作之後執行
        addHistory('匯出歷程', '下載完整的個人學習歷程紀錄檔。', 'fa-download');
    });
});
