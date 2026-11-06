<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const isLive = ref(false);
const streamInfo = ref(null);
let pollingTimer = null;

// 檢查直播狀態的函式
const checkLiveStatus = async () => {
  try {
    const response = await axios.get('/api/streaming/current');
    if (response.data) {
      isLive.value = true;
      streamInfo.value = response.data;
    } else {
      isLive.value = false;
      streamInfo.value = null;
    }
  } catch (error) {
    console.error('檢查直播狀態失敗:', error);
    isLive.value = false;
    streamInfo.value = null;
  }
};

// 元件掛載時，立刻檢查一次，並設定每 30 秒檢查一次
onMounted(() => {
  checkLiveStatus();
  pollingTimer = setInterval(checkLiveStatus, 30000); // 30秒輪詢一次
});

// 元件卸載時，清除計時器，避免記憶體洩漏
onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }
});
</script>

<template>
  <div v-if="isLive" class="live-indicator">
    <a href="/stream" class="live-link" target="_blank" rel="noopener noreferrer">
      <div class="live-icon-outer-ring"></div>
      <div class="live-icon">
        <i class="fas fa-video"></i>
      </div>
      <span class="live-text">LIVE</span>
    </a>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.live-indicator {
  position: fixed;
  right: 25px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
}

.live-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  background-color: #ff4d4d; /* 醒目的紅色 */
  border-radius: 50%;
  color: white;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(255, 77, 77, 0.6);
  transition: transform 0.2s ease-in-out;
}

.live-link:hover {
  transform: translateY(-50%) scale(1.1); /* 懸停時放大一點 */
}

.live-icon {
  font-size: 20px;
}

.live-text {
  font-size: 12px;
  font-weight: bold;
  margin-top: 2px;
  letter-spacing: 1px;
}

/* 製作一個會呼吸的閃爍光環效果 */
.live-icon-outer-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(255, 77, 77, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7);
  }
  70% {
    transform: scale(1.2);
    box-shadow: 0 0 0 10px rgba(255, 77, 77, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 77, 77, 0);
  }
}
</style>