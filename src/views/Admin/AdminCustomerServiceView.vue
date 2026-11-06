<script setup>
// 3. 你原本所有的 import 和程式邏輯都原封不動地保留
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import * as signalR from '@microsoft/signalr';
import { useAdminAuthStore } from '@/stores/adminauth';
import api from '@/services/jjapi.js';

// --- 響應式狀態定義 ---
const BACKEND_URL = 'https://localhost:7017';
const adminAuthStore = useAdminAuthStore();
const connection = ref(null);
const isConnected = ref(false);
const connectionStatusText = ref('連線中...');
const onlineUsers = ref([]); 
const userMessages = ref(new Map());
const currentUserId = ref(null);
const newMessage = ref('');
const messagesContainer = ref(null); 
const fileInput = ref(null);//圖檔~

// --- Computed Properties ---
const currentMessages = computed(() => {
  return userMessages.value.get(currentUserId.value) || [];
});
const adminName = computed(() => adminAuthStore.admin?.name || '未登入');

const triggerFileUpload = () => {
  fileInput.value.click();
}; //圖檔

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file || !currentUserId.value) return;

  // 簡單的前端驗證
  if (!file.type.startsWith('image/')) {
    alert('只能上傳圖片檔案！');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    // 步驟一：將檔案上傳到我們的新 API
    const response = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const imageUrl = response.data.url;

    // 步驟二：透過 SignalR 發送圖片 URL
    const messagePayload = {
      type: 'image',
      message: imageUrl,
    };
    await connection.value.invoke('SendMessageToUser', currentUserId.value, messagePayload);

    // 立刻在自己的畫面上顯示出來
    const localMessage = {
      ...messagePayload,
      type: 'admin-image', // 用一個特殊的 type 來區分是自己發的圖片
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    userMessages.value.get(currentUserId.value).push(localMessage);
    scrollToBottom();

  } catch (err) {
    console.error('檔案上傳或訊息發送失敗:', err);
    alert('檔案上傳失敗！');
  } finally {
    // 清空 file input 的值，這樣才能重複上傳同一個檔案
    event.target.value = '';
  }
};

// --- SignalR 連線邏輯 ---
const initConnection = async () => {
  connection.value = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:7017/chatHub', {
        accessTokenFactory: () => localStorage.getItem('adminToken')
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // --- 註冊監聽事件 ---
  connection.value.on('ReceiveMessage', (messageData) => {
    const receivedTime = new Date(messageData.timestamp);
    const formattedMessage = {
        ...messageData,
        timestamp: receivedTime.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    };
    
    const userId = formattedMessage.userId;
    if (!userMessages.value.has(userId)) {
        userMessages.value.set(userId, []);
    }
    userMessages.value.get(userId).push(formattedMessage);

    if (currentUserId.value !== userId) {
        const user = onlineUsers.value.find(u => u.userId === userId);
        if (user) {
            user.unreadCount++;
        }
    } else {
        scrollToBottom();
    }
  });

  connection.value.on('UserOnline', (userId) => {
    if (!onlineUsers.value.some(u => u.userId === userId)) {
      onlineUsers.value.push({ userId, unreadCount: 0 });
    }
  });
  
  connection.value.on('UserOffline', (userId) => {
    onlineUsers.value = onlineUsers.value.filter(u => u.userId !== userId);
    if (userMessages.value.has(userId)) {
        userMessages.value.get(userId).push({
            type: 'system',
            message: '會員已離開對話。',
            timestamp: new Date().toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit'
            })
        });
    }
  });

  connection.value.on('OnlineUsersList', (users) => {
    onlineUsers.value = users.map(userId => ({ userId, unreadCount: 0 }));
  });

  // --- 連線狀態處理 ---
  connection.value.onclose(() => {
    isConnected.value = false;
    connectionStatusText.value = '連線已斷開';
  });

  connection.value.onreconnecting(() => {
    isConnected.value = false;
    connectionStatusText.value = '重新連線中...';
  });
  
  connection.value.onreconnected(async () => {
    isConnected.value = true;
    connectionStatusText.value = '已連線';
    if (connection.value) await connection.value.invoke('JoinAsAdmin');
  });

  // --- 啟動連線 ---
  try {
    await connection.value.start();
    isConnected.value = true;
    connectionStatusText.value = '已連線';
    await connection.value.invoke('JoinAsAdmin');
  } catch (err) {
    console.error('SignalR 連線失敗:', err);
    connectionStatusText.value = '連線失敗';
    setTimeout(initConnection, 5000); 
  }
};

// --- 組件生命週期 ---
onMounted(() => {
  initConnection();
});

onUnmounted(() => {
  if (connection.value) {
    connection.value.stop();
  }
});

// --- UI 互動函式 ---
const selectUser = (userId) => {
  currentUserId.value = userId;
  if (!userMessages.value.has(userId)) {
    userMessages.value.set(userId, []);
  }
  const user = onlineUsers.value.find(u => u.userId === userId);
  if (user) {
    user.unreadCount = 0;
  }
  scrollToBottom();
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentUserId.value) return;

  try {
    // 將純文字也打包成物件再發送
    const messagePayload = {
      type: 'text',
      message: newMessage.value,
    };
    await connection.value.invoke('SendMessageToUser', currentUserId.value, messagePayload);
    
    // 在本地顯示
    const localMessage = {
      message: newMessage.value,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
      type: 'admin' // 維持原樣
    };
    userMessages.value.get(currentUserId.value).push(localMessage);
    
    newMessage.value = '';
    scrollToBottom();
  } catch (err) {
    console.error('發送訊息失敗:', err);
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};
</script>

<template>
  <div class="chat-page-container">
    <div class="admin-container">
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>客服管理系統</h2>
        </div>
        <div class="admin-info">
          <label>管理員：</label>
          <span class="admin-name-display">{{ adminName }}</span>
        </div>
        <div class="connection-status" :class="{ 'connected': isConnected }">
          {{ connectionStatusText }}
        </div>
        <div class="stats">
          線上用戶：<span>{{ onlineUsers.length }}</span>
        </div>
        <div class="user-list">
          <div 
            v-if="onlineUsers.length === 0" 
            class="empty-state" 
            style="padding: 20px; text-align: center; color: #6c757d;">
            目前沒有用戶在線
          </div>
          <div
            v-for="user in onlineUsers"
            :key="user.userId"
            class="user-item"
            :class="{ 'active': currentUserId === user.userId }"
            @click="selectUser(user.userId)"
          >
            <div class="user-info">
              <div class="user-avatar">{{ user.userId.charAt(user.userId.length - 1) }}</div>
              <div>
                <div>會員編號：{{user.userId }}</div>
                <div class="user-status"></div>
              </div>
            </div>
            <div v-if="user.unreadCount > 0" class="unread-count">{{ user.unreadCount }}</div>
          </div>
        </div>
      </div>
      <div class="chat-area">
        <template v-if="currentUserId">
          <div class="chat-header">
            <div class="user-info">
               <div class="user-avatar">{{ currentUserId.charAt(currentUserId.length - 1) }}</div>
               <div style="font-weight: bold;">會員編號：{{ currentUserId }}</div>
            </div>
          </div>
          <div class="chat-messages" ref="messagesContainer">
            <div 
                v-for="(msg, index) in currentMessages" 
                  :key="index" 
                  class="message" 
                  :class="{
                    'admin-message': msg.type.includes('admin'),
                    'user-message': msg.type.includes('user'),
                    'system-message': msg.type === 'system'
                  }">
                <div class="message-content">
                  <a v-if="msg.type.includes('image')" :href="`${BACKEND_URL}${msg.message}`" target="_blank">
                      <img :src="`${BACKEND_URL}${msg.message}`" class="chat-image" alt="聊天圖片" />
                  </a>

                  <p v-else>{{ msg.message }}</p>

                  <div class="timestamp">{{ msg.timestamp }}</div>
                </div>
              </div>
            </div>
          <div class="chat-input">
            <button @click="triggerFileUpload" class="upload-btn" title="傳送圖片">✚</button>
            <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept="image/*" />

            <input 
              type="text"
              v-model="newMessage"
              @keypress.enter="sendMessage"
              placeholder="輸入回覆訊息..."
            />
            <button @click="sendMessage" :disabled="!newMessage.trim()">發送</button>
          </div>
        </template>
        <div v-else class="empty-state">
          請從左側選擇一個用戶開始對話
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
/* 最外層容器的樣式 */
.chat-page-container {
  height: 100%;
  width: 100%;
}
.admin-container { 
  display: flex; 
  height: 100%;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* 左側邊欄樣式 */
.sidebar { 
  width: 300px; 
  background: white; 
  border-right: 1px solid #e9ecef; 
  display: flex; 
  flex-direction: column; 
  flex-shrink: 0;
}
.sidebar-header {
    background: #582b5e; /* 改為主題深紫色 */
    color: white;
    padding: 20px;
    text-align: center;
    flex-shrink: 0;
}
.sidebar-header h2 {
    margin: 0;
    font-size: 1.2rem;
}
.admin-info { background: white; padding: 15px 20px; border-bottom: 1px solid #e9ecef; }
.admin-id-input { width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 18px; }
.connection-status { padding: 10px 20px; text-align: center; font-size: 18px; background: #ffc107; color: #333; }
.connection-status.connected { background: #198754; color: white; }
.stats { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; font-size: 16px; color: #6c757d; }
.user-list { flex: 1; overflow-y: auto; }
.user-item { padding: 15px 20px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s; }
.user-item:hover { background: #f8f9fa; }
.user-item.active { 
  background: #f3e3f4; /* 改為主題淺紫色 */
  color: #582b5e; /* 深紫色文字 */
}
.user-info { display: flex; align-items: center; gap: 12px; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; background: #6c757d; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
.user-item.active .user-avatar { background-color: #582b5e; }
.unread-count { background: #dc3545; color: white; border-radius: 50%; min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px; padding: 2px; }

/* 右側聊天區樣式 */
.chat-area { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  background: #f4f7f6; /* 與後台主內容區背景色一致 */
}
.chat-header {
    background: white; /* 與頂部 Header 風格一致 */
    color: #343a40;
    padding: 20px;
    text-align: left;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 1px solid #e9ecef;
}
.chat-messages { flex: 1; padding: 20px; overflow-y: auto; }
.message { margin-bottom: 15px; display: flex; }
.message.user-message { justify-content: flex-start; }
.message.admin-message { justify-content: flex-end; }
.message-content { max-width: 70%; padding: 12px 16px; border-radius: 18px; word-wrap: break-word; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.user-message .message-content { background: rgb(218, 181, 230); color: #333; border: 1px solid #e9ecef; }
.admin-message .message-content { background: #582b5e; color: white; } /* 管理員訊息改為主題深紫色 */
.message-content p { margin: 0 0 5px 0; }
.timestamp { font-size: 15px; opacity: 0.7; }
.chat-input { display: flex; padding: 15px; background: rgb(255, 255, 255); border-top: 1px solid #e9ecef; }
.chat-input input { flex: 1; border: 1px solid #e5e1e1; border-radius: 25px; padding: 12px 20px; outline: none; margin-right: 15px; font-size: 18px; }
.chat-input input:focus { border-color: #582b5e; }
.chat-input button { 
  background: #582b5e; /* 按鈕也改為主題深紫色 */
  color: white; 
  border: none; 
  border-radius: 25px; 
  padding: 12px 24px; 
  cursor: pointer; 
  font-size: 16px; 
  transition: background 0.3s;
}
.chat-input button:hover:not(:disabled) { background: #4a234e; } /* 加深的紫色 */
.chat-input button:disabled { background: #ccc; cursor: not-allowed; }
.empty-state { display: flex; align-items: center; justify-content: center; height: 100%; color: #6c757d; font-size: 20px; }
.message.system-message { justify-content: center; margin: 20px 0; }
.system-message .message-content { background: #e9ecef; color: #6c757d; font-style: italic; font-size: 15px; text-align: center; box-shadow: none; }
.system-message .timestamp { display: none; }
.admin-name-display {
  font-weight: bold;
  color:  #6c757d; 
  font-size: 16px;
}
.chat-image {
  max-width: 100%; /* 限制圖片最大寬度為其容器寬度 */
  max-height: 250px; /* 【建議】可以再加一個最大高度，避免長條圖撐爆畫面 */
  border-radius: 10px;
  cursor: pointer;
  display: block; /* 避免圖片下方可能出現的多餘空白 */
  object-fit: cover; /* 確保圖片在指定尺寸內被妥善裁剪 */
}
.upload-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  margin-right: 10px;
  color: #6c757d;
}
</style>