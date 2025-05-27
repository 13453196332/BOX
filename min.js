// 本地存储功能
function saveMessage(message, type) {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.push({ message, type, timestamp: new Date().toISOString() });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}
function loadMessages() {
    return JSON.parse(localStorage.getItem('chatHistory')) || [];
}
// 获取 DOM 元素
const messageList = document.getElementById('messageList');
const messageContent = document.getElementById('messageContent');
const submitBtn = document.getElementById('submitBtn');
const systemTimestamp = document.getElementById('systemTimestamp');
// 加载历史消息
function loadChatHistory() {
    const messages = loadMessages();
    messages.forEach(({ message, type, timestamp }) => {
        displayMessage(message, type, new Date(timestamp));
    });
}
// 显示消息
function displayMessage(content, type, date = new Date()) {
    // type: 'sent'（用户） or 'received'（AI）
    const row = document.createElement('div');
    row.className = 'chat-row ' + (type === 'sent' ? 'user' : 'ai');

    // 头像
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    if (type === 'sent') {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
    }

    // 气泡
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    if (type === 'received') {
        bubble.innerHTML = marked.parse(content);
    } else {
        bubble.textContent = content;
    }

    // 时间
    const timestamp = document.createElement('div');
    timestamp.className = 'chat-timestamp';
    timestamp.textContent = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    // 组装
    if (type === 'sent') {
        row.appendChild(avatar);
        row.appendChild(bubble);
        row.appendChild(timestamp);
    } else {
        row.appendChild(avatar);
        row.appendChild(bubble);
        row.appendChild(timestamp);
    }

    messageList.appendChild(row);
    messageList.scrollTop = messageList.scrollHeight;
}

// 重写 displayLoadingMessage 以适配新结构
function displayLoadingMessage() {
    const loadingMessages = ["加载中", "加载中.", "加载中..", "加载中..."];
    let currentIndex = 0;

    const row = document.createElement('div');
    row.className = 'chat-row ai loading';
    row.setAttribute('id', 'loadingMessage');

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = loadingMessages[currentIndex];

    row._intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        bubble.textContent = loadingMessages[currentIndex];
    }, 500);

    row.appendChild(avatar);
    row.appendChild(bubble);

    const timestamp = document.createElement('div');
    timestamp.className = 'chat-timestamp';
    const now = new Date();
    timestamp.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    row.appendChild(timestamp);

    messageList.appendChild(row);
    messageList.scrollTop = messageList.scrollHeight;

    return 'loadingMessage';
}

function removeLoadingMessage(loadingMessageId) {
    const loadingMessageElement = document.getElementById(loadingMessageId);
    if (loadingMessageElement) {
        if (loadingMessageElement._intervalId) {
            clearInterval(loadingMessageElement._intervalId);
        }
        messageList.removeChild(loadingMessageElement);
    }
}

// 发送消息函数
function sendMessage() {
    const content = messageContent.value.trim();
    if (content) {
        displayMessage(content, 'sent');
        saveMessage(content, 'sent');
        messageContent.value = '';
        messageContent.style.height = 'auto';
        const loadingMessageId = displayLoadingMessage();
        // 调用 DeepSeek API
        fetchDeepSeekResponse(content, loadingMessageId);
    }
}
function fetchDeepSeekResponse(message, loadingMessageId) {
    fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-4d4479dd52564ee4b369d83e9b4072f1'
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {
                    "role": "system",
                    "content": "你是一个友好的AI助手，可以帮助用户解答各种问题。请用自然、亲切的语气与用户交流。"
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            enable_internet: true
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            removeLoadingMessage(loadingMessageId);
            if (data && data.choices && data.choices[0] && data.choices[0].message) {
                const reply = data.choices[0].message.content;
                displayMessage(reply, 'received');
                saveMessage(reply, 'received');
            } else {
                console.error('Invalid API response:', data);
                throw new Error('Invalid response format');
            }
        }).catch(error => {
            removeLoadingMessage(loadingMessageId);
            console.error('Error:', error);
            if (error.message.includes('Failed to fetch')) {
                displayErrorMessage('无法连接到服务器，请检查您的网络连接。', message);
            } else {
                displayErrorMessage('抱歉，服务暂时出现问题，请稍后再试。', message);
            }
        });
}
// 显示错误消息
// 重写 displayErrorMessage 以适配新结构
function displayErrorMessage(errorMessage, retryMessage = null) {
    const row = document.createElement('div');
    row.className = 'chat-row ai error-message';

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = errorMessage;

    if (retryMessage) {
        const refreshButton = document.createElement('button');
        refreshButton.classList.add('refresh-button');
        refreshButton.innerHTML = '&#x21bb;';
        refreshButton.addEventListener('click', () => {
            const loadingMessageId = displayLoadingMessage();
            fetchDeepSeekResponse(retryMessage, loadingMessageId);
        });
        bubble.appendChild(refreshButton);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);

    const timestamp = document.createElement('div');
    timestamp.className = 'chat-timestamp';
    const now = new Date();
    timestamp.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    row.appendChild(timestamp);

    messageList.appendChild(row);
    messageList.scrollTop = messageList.scrollHeight;

    saveMessage(errorMessage, 'received');
}
// 绑定发送按钮点击事件
submitBtn.addEventListener('click', sendMessage);
// 绑定回车键发送消息
messageContent.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
// 加载聊天历史
loadChatHistory();