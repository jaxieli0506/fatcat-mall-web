<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useStreamStore } from '@/stores/streamStore';
import axios from 'axios';
import ChatRoom from '@/components/ChatRoom.vue';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Swal from 'sweetalert2';

// --- 功能區塊：元件狀態 ---
const activeTab = ref('control');
const streamTitleInput = ref('');
const pastStreams = ref([]);
const error = ref(null);
const loading = ref(false);
const streamStore = useStreamStore();
const connection = ref(null);
const productNameToFeature = ref(''); 
const currentFeaturedProduct = ref(null);

// --- 功能區塊：API 呼叫 ---
const fetchHistory = async () => {
  try {
    const response = await axios.get('/api/streaming/history');
    pastStreams.value = response.data;
  } catch (err) {
    console.error("獲取直播歷史失敗:", err);
  }
};

// --- 功能區塊：事件處理 ---
const handleStartStream = async () => {
  if (!streamTitleInput.value.trim()) {
    error.value = '請輸入直播標題！';
    return;
  }
  sessionStorage.removeItem('fatcat_chat_history');
  loading.value = true;
  error.value = null;
  try {
    await streamStore.startStream(streamTitleInput.value);
  } catch (err) {
    error.value = err.response?.data || '開始直播失敗';
  } finally {
    loading.value = false;
  }
};
const handleEndStream = async () => {
  loading.value = true;
  error.value = null;
  try {
    await streamStore.endStream();
    streamTitleInput.value = '';
    await fetchHistory();
  } catch (err) {
    error.value = err.response?.data || '結束直播失敗';
  } finally {
    loading.value = false;
  }
};
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => Swal.fire('已成功複製！', '', 'success'));
};

// --- 【「主打商品」功能的函式】 ---
const setupSignalRConnection = () => {
  const hubUrl = "https://localhost:7017/chatHub";
  connection.value = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => localStorage.getItem('adminToken')
    })
    .withAutomaticReconnect()
    .build();

  // 監聽廣播，更新本地狀態
  connection.value.on("ReceiveFeaturedProduct", (product) => {
    currentFeaturedProduct.value = product; // 這行會更新 UI
    Swal.fire({
        icon: 'success',
        title: '商品上架成功！',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
  });
  connection.value.on("ReceiveClearProduct", () => {
  currentFeaturedProduct.value = null;
  productNameToFeature.value = ''; 
});
  connection.value.on("FeatureProductFailed", (errorMessage) => {
    Swal.fire('操作失敗', errorMessage, 'error');
  });

  // 開始連線
  connection.value.start()
    .then(() => {
      console.log('✅ SignalR 已連接 (管理者)');
      connection.value.invoke('JoinAsAdmin');
    })
    .catch(err => {
        console.error('SignalR 連線失敗: ', err);
        Swal.fire('連線失敗', `無法連接到即時互動伺服器: ${err.message}`, 'error');
    });
};

const featureProduct = () => {
  if (!productNameToFeature.value.trim()) { 
    Swal.fire('請輸入商品名稱', '', 'warning'); 
    return;
  }
  if (connection.value?.state === 'Connected') {
    connection.value.invoke("FeatureProduct", productNameToFeature.value.trim()); 
  } else {
    Swal.fire('連線中斷', '與伺服器的連線已中斷，請刷新頁面重試。', 'error');
  }
};

const clearProduct = () => {
  if (connection.value?.state === 'Connected') {
    connection.value.invoke("ClearFeaturedProduct");
  } else {
     Swal.fire('連線中斷', '與伺服器的連線已中斷，請刷新頁面重試。', 'error');
  }
};

// --- 功能區塊：生命週期鉤子 ---
onMounted(() => {
  streamStore.checkCurrentStream();
  fetchHistory();
  setupSignalRConnection();
});
onUnmounted(() => {
  if (connection.value) {
    connection.value.stop();
  }
});
</script>

<template>
  <div class="container mt-4">
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'control' }" @click.prevent="activeTab = 'control'" href="#">
          <i class="fas fa-video me-1"></i> 直播控制台
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'history' }" @click.prevent="activeTab = 'history'" href="#">
          <i class="fas fa-history me-1"></i> 過往直播紀錄
        </a>
      </li>
    </ul>

    <div class="tab-content">
      <div v-if="activeTab === 'control'" class="tab-pane fade show active">
        <div class="row">
          
          <div class="col-lg-7">
            <div class="card">
              <div class="card-body">
                <div v-if="error" class="alert alert-danger">{{ error }}</div>
                <div v-if="streamStore.isLive">
                  <h5 class="card-title">🔴 直播進行中：{{ streamStore.currentStreamTitle }}</h5>
                  <p class="text-muted">以下為串流資訊：</p>
                  <div v-if="streamStore.streamInfo" class="credentials-box">
                    <div class="mb-3">
                      <label class="form-label">擷取伺服器</label>
                      <div class="input-group">
                        <input type="text" class="form-control" :value="streamStore.streamInfo.ingestEndpoint" readonly>
                        <button class="btn btn-outline-secondary" @click="copyToClipboard(streamStore.streamInfo.ingestEndpoint)">複製</button>
                      </div>
                    </div>
                    <div>
                      <label class="form-label">串流金鑰</label>
                      <div class="input-group">
                        <input type="password" class="form-control" :value="streamStore.streamInfo.streamKey" readonly>
                        <button class="btn btn-outline-secondary" @click="copyToClipboard(streamStore.streamInfo.streamKey)">複製</button>
                      </div>
                    </div>
                  </div>
                  <button class="btn btn-danger w-100 mt-3" @click="handleEndStream" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm"></span> 結束直播
                  </button>
                </div>
                <div v-else>
                  <h5 class="card-title">準備開始一場新的直播</h5>
                  <div class="mb-3">
                    <label for="streamTitle" class="form-label">直播標題</label>
                    <input type="text" id="streamTitle" class="form-control" v-model="streamTitleInput" placeholder="例如：夏季新品大特賣！">
                  </div>
                  <button class="btn btn-primary w-100" @click="handleStartStream" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm"></span> 開始直播並取得金鑰
                  </button>
                </div>
              </div>
            </div>

            <div class="card mt-4">
              <div class="card-header fs-5 fw-bold"><i class="fas fa-bullhorn me-2"></i>主打商品控制</div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="productIdInput" class="form-label">輸入商品名稱</label>
                  <div class="input-group">
                    <input type="text" id="productNameInput" class="form-control" v-model="productNameToFeature" placeholder="例如：烏龍麵">
                    <button class="btn btn-success" @click="featureProduct">上架商品</button>
                  </div>
                </div>
                <hr>
                <div v-if="currentFeaturedProduct">
                  <p class="mb-2"><strong>目前主打商品：</strong></p>
                  <div class="d-flex align-items-center p-2 rounded" style="background-color: #f8f9fa;">
                    <img :src="`https://localhost:7017/ProductImages/${currentFeaturedProduct.imageUrl}`" style="width: 50px; height: 50px; object-fit: cover;" class="me-3 rounded">
                    <div class="flex-grow-1">
                      <div class="fw-bold">{{ currentFeaturedProduct.name }}</div>
                      <small class="text-muted">ID: {{ currentFeaturedProduct.id }} | 價格: ${{ currentFeaturedProduct.price }}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" @click="clearProduct">
                      <i class="fas fa-times"></i> 下架
                    </button>
                  </div>
                </div>
                <div v-else class="text-muted text-center">
                  目前沒有主打商品
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-lg-5">
            <div class="card">
              <div class="card-header fs-5 fw-bold"><i class="fas fa-comments me-2"></i>聊天室</div>
              <div class="card-body p-0" style="height: 400px;">
                <ChatRoom 
                  v-if="streamStore.isLive && streamStore.streamInfo?.chatRoomArn" 
                  :room-arn="streamStore.streamInfo.chatRoomArn"
                  user-name="肥貓小編"
                />
                <div v-else class="d-flex justify-content-center align-items-center h-100 text-muted">
                  直播開始後，聊天室將會啟用
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div v-if="activeTab === 'history'" class="tab-pane fade show active">
        <div class="card">
          <div class="card-body" style="max-height: 600px; overflow-y: auto;">
            <ul v-if="pastStreams.length > 0" class="list-group list-group-flush">
              <li v-for="stream in pastStreams" :key="stream.livestreamId" class="list-group-item">
                <div class="fw-bold">{{ stream.title }}</div>
                <small class="text-muted me-3">
                  開始時間: {{ new Date(stream.startedAt).toLocaleString() }}
                </small>
                <small class="text-muted" v-if="stream.endedAt">
                  結束時間: {{ new Date(stream.endedAt).toLocaleString() }}
                </small>
              </li>
            </ul>
            <p v-else class="text-muted text-center">尚無直播紀錄</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.credentials-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.5rem; padding: 1.5rem; margin-top: 1rem; }
.card-header { background-color: #f1f3f5; }
.nav-link { cursor: pointer; }
</style>

