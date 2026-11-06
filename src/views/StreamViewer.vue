<script setup>
// --- 功能區塊：引入函式庫與元件 ---
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import ChatRoom from '@/components/ChatRoom.vue';
import { HubConnectionBuilder } from '@microsoft/signalr'; // SignalR

// --- 功能區塊：元件狀態 (Reactive State) ---
const isLoading = ref(true);
const streamInfo = ref(null);
const error = ref(null);
let player = null;
const connection = ref(null);
const featuredProduct = ref(null);

// --- 【「主打商品」功能新增的函式】 ---
const setupSignalRConnection = () => {
  const hubUrl = "https://localhost:7017/chatHub";

  // 【修改處】確保 accessTokenFactory 正確地從 localStorage 獲取 token
  connection.value = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      // 由於路由守衛已確保此頁面為登入狀態，這裡一定能取到 token
      accessTokenFactory: () => localStorage.getItem('token') 
    })
    .withAutomaticReconnect()
    .build();

  // 監聽來自伺服器的廣播
  connection.value.on("ReceiveFeaturedProduct", (product) => {
    console.log("收到主打商品:", product);
    featuredProduct.value = product;
  });

  connection.value.on("ReceiveClearProduct", () => {
    console.log("收到清除商品指令");
    featuredProduct.value = null;
  });

  // 開始連線
  connection.value.start()
    .then(() => {
      console.log('✅ SignalR 已連接 (使用者)');
      connection.value.invoke('JoinAsUser');
    })
    .catch(err => {
      console.error('SignalR 連線失敗: ', err)
      // 可以選擇性地顯示一個更友善的錯誤提示
      error.value = "無法連接到即時互動功能。"
    });
};

// --- 功能區塊：核心邏輯 (Core Logic) ---
const initializePage = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await axios.get('/api/streaming/current');
    streamInfo.value = response.data;
  } catch (err) {
    console.error("獲取直播資訊失敗:", err);
    error.value = "無法載入直播資訊，請稍後再試。";
  } finally {
    isLoading.value = false;
  }

  if (streamInfo.value && streamInfo.value.playbackUrl) {
    await nextTick();
    setupPlayer(streamInfo.value.playbackUrl);
    // 只有在直播存在時才連線 SignalR
    setupSignalRConnection(); 
  }
};

const setupPlayer = (playbackUrl) => {
  const IVSPlayer = window.IVSPlayer;
  if (!IVSPlayer || !IVSPlayer.isPlayerSupported) {
    error.value = "您的瀏覽器不支援此直播格式。";
    return;
  }
  const { PlayerState, PlayerEventType } = IVSPlayer;
  const videoElement = document.getElementById('video-player');
  if (videoElement) {
    player = IVSPlayer.create();
    player.attachHTMLVideoElement(videoElement);
    player.addEventListener(PlayerState.PLAYING, () => console.log("✅ IVS Player: 狀態 -> 正在播放！"));
    player.addEventListener(PlayerState.ENDED, () => {
      streamInfo.value = null;
      error.value = "直播已結束。";
    });
    player.addEventListener(PlayerEventType.ERROR, (err) => {
      console.error("IVS Player Error:", err);
      if (streamInfo.value) {
        error.value = `播放時發生錯誤: ${err.message}`;
      }
    });
    player.load(playbackUrl);
    player.play();
  }
};

const getUserDisplayName = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData && userData.userId) {
        return `肥貓會員:${userData.userId}`;
      }
    }
  } catch (e) {
    console.error("解析使用者資訊失敗:", e);
  }
  return '路過的喵';
};

// --- 功能區塊：生命週期鉤子 (Lifecycle Hooks) ---
onMounted(() => {
  initializePage();
});

onUnmounted(() => {
  if (player) {
    player.delete();
    player = null;
  }
  if (connection.value) {
    connection.value.stop();
  }
});
</script>

<template>
  <div class="stream-page-container">
    
    <div v-if="isLoading" class="status-message">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="mt-3">正在連接直播頻道...</p>
    </div>
    <div v-else-if="error" class="status-message">
      <h4>發生錯誤</h4>
      <p>{{ error }}</p>
    </div>
    <div v-else-if="!streamInfo" class="status-message">
      <h4>目前沒有直播</h4>
      <p>請稍後再來看看，或關注我們的最新消息！</p>
    </div>

    <div v-else class="stream-layout">

      <div class="stream-content-left">
        
        <div class="video-container">
          <h3 class="stream-title">{{ streamInfo.title }}</h3>
          <div class="player-wrapper">
            <video id="video-player" playsinline muted controls autoplay></video>
          </div>
        </div>

        <div class="featured-product-container">
          <transition name="fade" mode="out-in">
            <div v-if="featuredProduct" :key="featuredProduct.id" class="featured-product-card promo-style">
              <div class="promo-badge">🔥 現正主打商品!!</div>
              <img :src="`https://localhost:7017/ProductImages/${featuredProduct.imageUrl}`" class="product-thumb" alt="商品圖片">
              <p class="product-name">{{ featuredProduct.name }}</p>
              <a :href="`/OneSpecialNoodle?id=${featuredProduct.id}`" target="_blank" rel="noopener noreferrer" class="btn-details">
                詳情
              </a>
            </div>
            <div v-else class="featured-product-placeholder">
              <i class="fas fa-shopping-bag placeholder-icon"></i>
              <p>主播稍後會推薦商品，敬請期待！</p>
            </div>
          </transition>
        </div>
      </div>

      <div class="chat-container">
        <div class="chat-header">
          <h5><i class="fas fa-comments me-2"></i>聊天室</h5>
        </div>
        <ChatRoom
          v-if="streamInfo.chatRoomArn"
          :room-arn="streamInfo.chatRoomArn"
          :user-name="getUserDisplayName()"
        />
        <div v-else class="d-flex justify-content-center align-items-center h-100 text-muted">
          聊天室無法載入
        </div>
      </div>

    </div>
  </div>
</template>


<style scoped>
/* 引入 Font Awesome 圖示庫 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

/* --- ★ 整體頁面容器 (日式可愛風格) ★ --- */
.stream-page-container {
  padding: 2rem;
  background-color: #FFFBEB; /* 溫暖的奶油黃底色 */
  color: #5D4037; /* 深棕色文字，比純黑柔和 */
  min-height: calc(100vh - 80px);
  font-family: 'Microsoft JhengHei', 'Baloo 2', sans-serif; /* 建議使用更圓潤的字體 */
}

.status-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
  color: #795548;
}
.status-message h4 {
  color: #5D4037;
}
.spinner-border {
  color: #E53935 !important; /* 紅色 */
}

/* --- ★ 主佈局 ★ --- */
.stream-layout {
  display: flex;
  gap: 2rem; /* 加大間距 */
  max-width: 1280px;
  margin: 0 auto;
  align-items: flex-start;
}

/* --- ★ 左側內容 (影片) ★ --- */
.stream-content-left {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.video-container {
  background-color: #FFFFFF; /* 卡片使用純白以突出 */
  border: 3px solid #424242; /* 厚實的深灰色邊框 */
  padding: 1.5rem;
  border-radius: 16px;
  /* 可愛風格的塊狀陰影 */
  box-shadow: 8px 8px 0px #D6B6E2; /* 淡紫色塊狀陰影 */
  transition: all 0.2s ease-in-out;
}
.video-container:hover {
  transform: translate(-4px, -4px);
  box-shadow: 12px 12px 0px #D6B6E2;
}


.stream-title {
  display: inline-block; /* 讓背景色貼合文字寬度 */
  margin-bottom: 1.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  background-color: #9B59B6; /* 紫色標題背景 */
  border-radius: 12px 12px 12px 0; /* 不對稱圓角 */
  border: 3px solid #424242;
}

.player-wrapper {
  position: relative;
  padding-top: 56.25%; /* 16:9 */
  background-color: black;
  border-radius: 8px;
  overflow: hidden;
  border: 4px solid #FBC02D; /* 陽光明亮的黃色邊框 */
}

#video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* --- ★ 右側聊天室 ★ --- */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff; /* 純白卡片背景 */
  border-radius: 16px;
  box-shadow: 8px 8px 0px #D6B6E2; /* 同樣的塊狀陰影 */
  overflow: hidden;
  min-width: 340px;
  align-self: stretch;
  border: 3px solid #424242;
  transition: all 0.2s ease-in-out;
}
.chat-container:hover {
    transform: translate(-2px, -2px);
    box-shadow: 10px 10px 0px #D6B6E2;
}

.chat-header {
  padding: 1rem;
  border-bottom: 3px solid #424242;
  /* 活潑的紅黃漸層 */
  background: linear-gradient(135deg, #F06292, #FFD54F); /* 粉紅到黃色的漸層 */
  color: #5D4037;
  flex-shrink: 0;
  text-align: center;
}

.chat-header h5 {
  margin: 0;
  font-weight: 900; /* 超粗字體更有趣 */
  letter-spacing: 1px;
  text-shadow: 2px 2px 0px rgba(255,255,255,0.7); /* 文字立體效果 */
}


/* --- 主打商品區塊樣式 (維持不變) --- */
.featured-product-container { height: 122px; }
.featured-product-placeholder { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; background-color: #FFF8E1; border-radius: 8px; color: #795548; border: 2px dashed #FFCC80; }
.placeholder-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.featured-product-card { display: flex; justify-content: center; align-items: center; gap: 1.5rem; padding: 1rem; height: 100%; border-radius: 8px; position: relative; overflow: hidden; }
.promo-style { color: white; background: linear-gradient(135deg, #ff7e5f, #feb47b); border: 2px solid #ff7e5f; box-shadow: 0 5px 20px rgba(254, 180, 123, 0.5); animation: pulse-bg 2s infinite; }
@keyframes pulse-bg { 0% { box-shadow: 0 5px 20px rgba(254, 180, 123, 0.4); } 50% { box-shadow: 0 5px 30px rgba(255, 126, 95, 0.7); } 100% { box-shadow: 0 5px 20px rgba(254, 180, 123, 0.4); } }
.promo-badge { position: absolute; top: 0; left: 0; background-color: #ff4d4d; color: white; padding: 4px 10px; font-size: 0.8rem; font-weight: bold; border-radius: 8px 0 8px 0; z-index: 2; }
.product-thumb { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; flex-shrink: 0; border: 2px solid white; }
.product-name { font-weight: bold; font-size: 1.5rem; margin: 0; color: white; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); }
.btn-details { background-color: white; color: #ff7e5f; text-decoration: none; padding: 0.5rem 1.5rem; border-radius: 20px; font-weight: bold; transition: all 0.2s; display: inline-block; border: 1px solid white; flex-shrink: 0; }
.btn-details:hover { background-color: #fff5f2; transform: scale(1.05); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }


/* --- RWD 響應式設計 (維持不變) --- */
@media (max-width: 992px) {
  .stream-layout { flex-direction: column; }
  .stream-content-left { width: 100%; }
  .stream-page-container { padding: 1rem; }
  .video-container { padding: 1rem; }
  .chat-container { width: 100%; height: 70vh; max-height: 550px; min-width: unset; }
  .stream-title { font-size: 1.5rem; }
}
@media (max-width: 576px) {
  .featured-product-card { flex-direction: column; text-align: center; gap: 0.8rem; padding: 1.5rem 1rem; }
  .featured-product-container { height: auto; min-height: 122px; }
  .product-name { font-size: 1.2rem; }
  .btn-details { width: 80%; }
}
</style>