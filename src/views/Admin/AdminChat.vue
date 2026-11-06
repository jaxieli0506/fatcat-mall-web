<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import * as signalR from '@microsoft/signalr';
import { useAdminAuthStore } from '@/stores/adminauth';

// --- 響應式狀態定義 ---
const adminAuthStore = useAdminAuthStore();
const connection = ref(null);
const isConnected = ref(false);
const connectionStatusText = ref('連線中...');
const onlineUsers = ref([]);
const userMessages = ref(new Map());
const currentUserId = ref(null);
const newMessage = ref('');
const messagesContainer = ref(null);


// --- Computed Properties ---
const currentMessages = computed(() => {
  return userMessages.value.get(currentUserId.value) || [];
});

const adminName = computed(() => adminAuthStore.admin?.name || '未登入');

// --- SignalR 連線邏輯 ---
const initConnection = async () => {
  connection.value = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:7017/chatHub', {
    // 建立一個函式，它會回傳儲存在 localStorage 的 adminToken
    // SignalR 在每次連線或重連時，都會自動執行這個函式來取得最新的 adminToken
    accessTokenFactory: () => localStorage.getItem('adminToken') 
  })
  .configureLogging(signalR.LogLevel.Information)
  .build();

  // --- 註冊監聽事件 ---
 connection.value.on('ReceiveMessage', (messageData) => {
  // 從後端來的 timestamp 是完整的 ISO 字串，我們先轉成 Date 物件
  const receivedTime = new Date(messageData.timestamp);
  const formattedMessage = {
    // 從收到的 messageData 中，把需要的屬性一個一個複製過來
    userId: messageData.userId,
    message: messageData.message,
    type: messageData.type,
    
    // 然後使用我們格式化好的新時間來覆蓋掉舊的時間
    timestamp: receivedTime.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // 使用24小時制
    })
  };
  
  // 後續的程式碼完全不用改變
  const userId = formattedMessage.userId;
  if (!userMessages.value.has(userId)) {
    userMessages.value.set(userId, []);
  }
  
  // 將我們剛剛手動建立的、格式完全正確的 formattedMessage 物件推進陣列
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
      type: 'system', // 一個新的訊息類型
      message: '使用者已離開對話。',
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
    if (connection.value) await connection.value.invoke('JoinAsAdmin', adminName.value);
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
    await connection.value.invoke('SendMessageToUser',currentUserId.value, newMessage.value);
    
    // 將自己發送的訊息也顯示出來，統一使用小寫 key
    const messageData = {
        message: newMessage.value,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: 'admin'
    };
    userMessages.value.get(currentUserId.value).push(messageData);
    
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
              <div>{{ user.userId }}</div>
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
             <div style="font-weight: bold;">{{ currentUserId }}</div>
          </div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div 
            v-for="(msg, index) in currentMessages" 
            :key="index" 
            class="message" 
            :class="`${msg.type}-message`">
            <div class="message-content">
              <p>{{ msg.message }}</p>
              <div class="timestamp">{{ msg.timestamp }}</div>
            </div>
          </div>
        </div>

        <!-- 使用者以離開對話的設置 -->
        <div 
          v-for="(msg, index) in currentMessages" 
          :key="index" 
          class="message" 
          :class="`${msg.type}-message`"> </div> 
          <!-- 結束 -->

        <div class="chat-input">
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

  
</template>


<style scoped>
/* 這裡直接沿用您原本 admin.html 的 CSS，可以無縫對接 */
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#f5f5f5; height:100vh; overflow:hidden; }
.admin-container { display:flex; height:100vh; }
.sidebar { width:300px; background:white; border-right:1px solid #ddd; display:flex; flex-direction:column; }
.sidebar-header { background:#007bff; color:white; padding:20px; text-align:center; }
.connection-status { padding:10px 20px; text-align:center; font-size:14px; background:#ffc107; color:#333; }
.connection-status.connected { background:#28a745; color:white; }
.user-list { flex:1; overflow-y:auto; }
.user-item { padding:15px 20px; border-bottom:1px solid #eee; cursor:pointer; display:flex; align-items:center; justify-content:space-between; transition:background 0.3s; }
.user-item:hover { background:#f8f9fa; }
.user-item.active { background:#007bff; color:white; }
.user-info { display:flex; align-items:center; }
.user-avatar { width:40px; height:40px; border-radius:50%; background:#6c757d; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; margin-right:10px; }
.user-status { width:10px; height:10px; border-radius:50%; background:#28a745; border:2px solid white; margin-top:2px; }
.unread-count { background:#dc3545; color:white; border-radius:50%; min-width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:12px; padding: 2px; }
.chat-area { flex:1; display:flex; flex-direction:column; background:#E3F2FD; }
.chat-header { background:#f8f9fa; padding:15px 20px; border-bottom:1px solid #ddd; display:flex; align-items:center; }
.chat-messages { flex:1; padding:20px; overflow-y:auto; }
.message { margin-bottom:15px; display:flex; }
.message.user-message { justify-content:flex-start; }
.message.admin-message { justify-content:flex-end; }
.message-content { max-width:70%; padding:12px 16px; border-radius:18px; word-wrap:break-word; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.user-message .message-content { background:white; color:#333; }
.admin-message .message-content { background:#007bff; color:white; }
.message-content p { margin:0 0 5px 0; }
.timestamp { font-size:11px; opacity:0.7; }
.chat-input { display:flex; padding:15px; background:white; border-top:1px solid #ddd; }
.chat-input input { flex:1; border:1px solid #ddd; border-radius:25px; padding:12px 20px; outline:none; margin-right:15px; font-size:14px; }
.chat-input button { background:#007bff; color:white; border:none; border-radius:25px; padding:12px 24px; cursor:pointer; font-size:14px; transition:background 0.3s; }
.chat-input button:hover:not(:disabled) { background:#0056b3; }
.chat-input button:disabled { background:#ccc; cursor:not-allowed; }
.empty-state { display:flex; align-items:center; justify-content:center; height:100%; color:#6c757d; font-size:18px; }
.admin-info { background:white; padding:15px 20px; }
.stats { padding:15px 20px; background:#f8f9fa; border-bottom:1px solid #ddd; font-size:14px; color:#6c757d; }
.admin-name-display {
  font-weight: bold;
  color: #007bff; /* 使用主題藍色 */
  font-size: 16px;
}
.message.system-message {
  justify-content: center; /* 讓訊息置中 */
  margin: 20px 0;
}

.system-message .message-content {
  background: #e9ecef; /* 灰色背景 */
  color: #6c757d;      /* 深灰色文字 */
  font-style: italic;
  font-size: 13px;
  text-align: center;
  box-shadow: none;
}

.system-message .timestamp {
    display: none; /* 系統訊息可以不用顯示時間戳 */
}
</style>