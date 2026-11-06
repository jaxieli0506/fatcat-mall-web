<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';

// --- 功能區塊：Props (元件的對外接口) ---
// 這裡定義了父層元件需要傳遞給 ChatRoom 的資料
const props = defineProps({
  // roomArn 是聊天室的唯一識別碼，必須由父層提供
  roomArn: {
    type: String,
    required: true,
  },
  // userName 是在聊天室中顯示的名稱，由父層決定
  userName: {
    type: String,
    default: '路過的喵' // 如果父層沒有提供，預設名稱就是「路過的喵」
  }
});


// --- 功能區塊：本地狀態 (Reactive State) ---
// 這裡定義了這個元件內部自己管理的所有狀態
const CHAT_HISTORY_KEY = 'fatcat_chat_history'; // 儲存在 sessionStorage 的 Key
const MAX_MESSAGES = 50; // 最多保留 50 則歷史訊息

const messages = ref([]); // 存放聊天訊息的陣列
const newMessage = ref(''); // 綁定到輸入框的文字
const connection = ref(null); // 存放 WebSocket 連線物件
const connectionState = ref('disconnected'); // 連線狀態，用於控制 UI 顯示 ('connecting', 'connected', 'disconnected')

// 【最終邏輯】聊天室的顯示名稱，直接使用從 props 傳進來的 userName
const chatUserName = ref(props.userName);


// --- 功能區塊：歷史紀錄處理 (Session Storage) ---

/**
 * @description 將目前的聊天訊息儲存到 sessionStorage
 */
const saveHistoryToSession = () => {
  const recentMessages = messages.value.slice(-MAX_MESSAGES);
  sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(recentMessages));
};

/**
 * @description 從 sessionStorage 載入聊天紀錄
 */
const loadHistoryFromSession = () => {
  const storedMessages = sessionStorage.getItem(CHAT_HISTORY_KEY);
  if (storedMessages) {
    try {
      messages.value = JSON.parse(storedMessages);
    } catch (e) {
      console.error("解析聊天紀錄失敗:", e);
      sessionStorage.removeItem(CHAT_HISTORY_KEY);
    }
  }
};


// --- 功能區塊：WebSocket 連線與訊息處理 ---

/**
 * @description 向後端 API 請求進入聊天室的臨時通行證 (Token)
 * @returns {Promise<string|null>}
 */
const getChatToken = async () => {
    try {
        const response = await axios.post('/api/streaming/chat-token');
        return response.data;
    } catch (error) {
        console.error('取得 Chat Token 失敗:', error);
        return null;
    }
}

/**
 * @description 建立並管理 WebSocket 連線
 */
const connectToChat = async () => {
    connectionState.value = 'connecting';
    const token = await getChatToken();

    if (!token) {
        connectionState.value = 'disconnected';
        return;
    }

    const ws = new WebSocket("wss://edge.ivschat.ap-northeast-1.amazonaws.com", token);
    connection.value = ws;

    // 監聽「連線成功」事件
    ws.onopen = () => {
        connectionState.value = 'connected';
        console.log('聊天室連線成功！');
    };

    // 監聽「收到訊息」事件
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.Type === 'MESSAGE') {
            messages.value.push({
                id: data.Id,
                username: data.Attributes?.username || '系統訊息',
                content: data.Content,
            });
            saveHistoryToSession(); // 收到新訊息時就儲存
            // 自動捲動到最下方
            nextTick(() => {
                const chatBox = document.querySelector('.chat-messages');
                if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
            });
        }
    };

    // 監聽「連線關閉」事件
    ws.onclose = () => {
        connectionState.value = 'disconnected';
        console.log('聊天室連線中斷。');
    };

    // 監聽「發生錯誤」事件
    ws.onerror = (error) => {
        console.error('聊天室發生錯誤:', error);
        connectionState.value = 'disconnected';
    };
}

/**
 * @description 發送訊息到聊天室
 */
const sendMessage = () => {
    if (newMessage.value.trim() && connection.value && connectionState.value === 'connected') {
        const message = {
            Action: 'SEND_MESSAGE',
            Content: newMessage.value.trim(),
            // 發送訊息時，帶上我們從 props 決定的使用者名稱
            Attributes: { username: chatUserName.value }
        };
        connection.value.send(JSON.stringify(message));
        newMessage.value = '';
    }
}


// --- 功能區塊：生命週期鉤子 (Lifecycle Hooks) ---

// onMounted: 當元件被掛載到畫面上時執行
onMounted(() => {
    // 1. 先從 sessionStorage 載入之前的歷史紀錄
    loadHistoryFromSession();
    // 2. 開始連線到聊天室
    connectToChat();
});

// onUnmounted: 當元件被從畫面上移除時執行
onUnmounted(() => {
    // 關閉 WebSocket 連線，避免記憶體洩漏和不必要的連線
    if (connection.value) {
        connection.value.close();
    }
});
</script>

<template>
    <div class="chat-wrapper">
        <div class="chat-messages">
            <div v-if="connectionState !== 'connected'" class="status-overlay">
                <div v-if="connectionState === 'connecting'" class="spinner-border spinner-border-sm"></div>
                <div v-if="connectionState === 'disconnected'">連線中斷</div>
            </div>
            <div v-for="msg in messages" :key="msg.id" class="message">
                <span class="username" :class="{ admin: msg.username === '肥貓小編' }">{{ msg.username }}：</span>
                <span class="content">{{ msg.content }}</span>
            </div>
        </div>
        <div class="chat-input">
            <input 
                type="text" 
                class="form-control" 
                placeholder="說點什麼..." 
                v-model="newMessage"
                @keyup.enter="sendMessage"
                :disabled="connectionState !== 'connected'"
            >
            <button 
                class="btn btn-primary" 
                @click="sendMessage"
                :disabled="connectionState !== 'connected' || !newMessage.trim()"
            >送出</button>
        </div>
    </div>
</template>

<style scoped>
.chat-wrapper { height: 100%; display: flex; flex-direction: column; }
.chat-messages { flex-grow: 1; padding: 1rem; overflow-y: auto; position: relative; }
.status-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: flex; justify-content: center; align-items: center; }
.message { margin-bottom: 0.75rem; font-size: 0.9rem; word-wrap: break-word; }
.username { font-weight: bold; }
.username.admin { color: #0d6efd; }
.chat-input { display: flex; padding: 1rem; border-top: 1px solid #e9ecef; gap: 0.5rem; }
</style>