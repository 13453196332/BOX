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
    const messageItem = document.createElement('div');
    messageItem.classList.add('message-item', type);

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');

    // 使用 marked.js 解析富文本内容
    if (type === 'received') {
        messageBubble.innerHTML = marked.parse(content);
    } else {
        messageBubble.textContent = content;
    }

    const timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    timestamp.textContent = `${type === 'sent' ? '你' : 'DeepSeek'} ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;

    messageBubble.appendChild(timestamp);
    messageItem.appendChild(messageBubble);
    messageList.appendChild(messageItem);
    // 滚动到最新消息
    messageList.scrollTop = messageList.scrollHeight;
}
// 设置系统消息时间
// const now = new Date();
// systemTimestamp.textContent = `系统消息 ${now.getHours()}:${now.getMinutes()}`;
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
function displayLoadingMessage() {
    const loadingMessages = ["加载中", "加载中.", "加载中..", "加载中..."];
    let currentIndex = 0;

    const messageItem = document.createElement('div');
    messageItem.classList.add('message-item', 'received', 'loading');
    messageItem.setAttribute('id', 'loadingMessage');

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');
    messageBubble.textContent = loadingMessages[currentIndex];

    // 将定时器ID存储在messageItem上
    messageItem._intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        messageBubble.textContent = loadingMessages[currentIndex];
    }, 500);

    messageItem.appendChild(messageBubble);
    messageList.appendChild(messageItem);
    messageList.scrollTop = messageList.scrollHeight;

    return 'loadingMessage';
}

function removeLoadingMessage(loadingMessageId) {
    const loadingMessageElement = document.getElementById(loadingMessageId);
    if (loadingMessageElement) {
        // 确保清除定时器
        if (loadingMessageElement._intervalId) {
            clearInterval(loadingMessageElement._intervalId);
        }
        messageList.removeChild(loadingMessageElement);
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
function displayErrorMessage(errorMessage, retryMessage = null) {
    const messageItem = document.createElement('div');
    messageItem.classList.add('message-item', 'received', 'error-message');

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');
    messageBubble.textContent = errorMessage;

    if (retryMessage) {
        const refreshButton = document.createElement('button');
        refreshButton.classList.add('refresh-button');
        refreshButton.innerHTML = '&#x21bb;'; // 刷新图标
        refreshButton.addEventListener('click', () => {
            const loadingMessageId = displayLoadingMessage();
            fetchDeepSeekResponse(retryMessage, loadingMessageId);
        });
        messageBubble.appendChild(refreshButton);
    }

    messageItem.appendChild(messageBubble);
    messageList.appendChild(messageItem);
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