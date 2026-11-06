<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// --- 響應式狀態定義 ---
const API_URL = 'https://localhost:7017/api/Campaigns'; 
const BACKEND_URL = 'https://localhost:7017';

const campaigns = ref([]);
const isLoading = ref(true);
const error = ref(null);

// --- API 呼叫函式 ---
const fetchCampaigns = async () => {
  try {
    const response = await axios.get(API_URL);
    campaigns.value = response.data;
  } catch (err) {
    console.error('取得公開活動失敗:', err);
    error.value = '無法載入活動資訊，請稍後再試。';
  } finally {
    isLoading.value = false;
  }
};

// --- 生命週期鉤子 ---
onMounted(() => {
  fetchCampaigns();
});
</script>

<template>
  <div class="campaign-container container-fluid py-5">
    <div class="container">
      <h2 class="text-center mb-5 display-5 fw-bold section-title">熱門活動</h2>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
      </div>

      <div v-if="!isLoading && campaigns.length > 0" id="campaignCarousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="3000">
        <div class="carousel-inner">
          <div 
            v-for="(campaign, index) in campaigns" 
            :key="campaign.campaignId"
            class="carousel-item" 
            :class="{ active: index === 0 }">
            
            <div class="campaign-slide-card card">
              <div class="campaign-header-bar"></div>
              
              <div class="row g-0">
                <div class="col-md-5 d-flex align-items-center justify-content-center p-4">
                  <img 
                    :src="`${BACKEND_URL}${campaign.coverImageUrl}`" 
                    class="campaign-image" 
                    :alt="campaign.title"
                    onerror="this.onerror=null;this.src='https://placehold.co/600x800/333/FFFFFF?text=圖片載入失敗'">
                </div>

                <div class="col-md-7">
                  <div class="card-body p-lg-5 p-4 d-flex flex-column h-100">
                    <h3 class="card-title mb-3">{{ campaign.title }}</h3>
                    <p class="card-text text-muted mb-4">
                      活動期間：{{ new Date(campaign.startDate).toLocaleDateString() }} - {{ new Date(campaign.endDate).toLocaleDateString() }}
                    </p>
                    <p class="card-text fs-5 mb-5">{{ campaign.content }}</p>
                    
                    <div class="mt-auto">
                      <router-link :to="{ path: '/campaigns', hash: `#campaign-${campaign.campaignId}` }" class="btn-details">
                        查看詳情
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="carousel-control-prev" type="button" :data-bs-target="'#campaignCarousel'" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">上一張</span>
        </button>
        <button class="carousel-control-next" type="button" :data-bs-target="'#campaignCarousel'" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">下一張</span>
        </button>
      </div>

      <div v-if="!isLoading && campaigns.length === 0 && !error" class="text-center text-muted py-5">
        <p class="fs-4">目前沒有任何進行中的活動。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 1. 全局背景：淺紫色與淡鵝黃色斜向粗條紋 */
.campaign-container {
  background-color: #FFF9E6; /* 淡鵝黃色底 */
  background-image: repeating-linear-gradient(
    180deg,
    #E8DAEF,
    #E8DAEF 35px,
    #FFF9E6 35px,
    #FFF9E6 70px
  );
}

/* 區塊標題 */
.section-title {
  font-family: 'Noto Serif TC', serif; /* 一個好看的襯線字體 */
  color: #3D2B1F; /* 深咖啡色 */
  text-shadow: 2px 2px 0 #FFF9E6; /* 加上一點背景色的陰影，更有立體感 */
}

/* 2. 卡片設計：模擬日式祭典的布簾 (Noren) 感 */
.campaign-slide-card {
  background-color: #fefcf5; /* 帶一點米白的紙質感 */
  border: 2px solid #3D2B1F; /* 深咖啡色邊框 */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 500px;
}

/* 磚紅色的頂部裝飾條 */
.campaign-header-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  background-color: #B85C5C; /* 磚紅色 */
  border-bottom: 2px solid #3D2B1F;
}

/* 左側海報圖片 */
.campaign-image {
  display: block;
  width: 100%;
  max-width: 300px; /* 限制最大寬度，避免不成比例 */
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* 右側文字區 */
.card-body {
  padding: 2.5rem;
}
.card-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: #B85C5C; /* 標題使用磚紅色 */
  border-bottom: 3px solid #E8DAEF; /* 加上淺紫色底線 */
  padding-bottom: 0.5rem;
  display: inline-block; /* 讓底線長度符合文字 */
}

/* 3. 按鈕設計：像一個小木牌或掛牌 */
.btn-details {
  display: inline-block;
  background-color: #B85C5C; /* 磚紅色 */
  color: white;
  text-decoration: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  border: 2px solid #8c4747;
}

.btn-details:hover {
  background-color: #a04f4f;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.3);
}


/* 輪播控制按鈕 (沿用之前的精緻化設計) */
.carousel-control-prev,
.carousel-control-next {
  width: 5%; 
}
.carousel-control-prev-icon,
.carousel-control-next-icon {
  background-color: rgba(61, 43, 31, 0.6); /* 改為深咖啡色半透明 */
  border-radius: 50%;
  padding: 1.5rem;
  background-size: 50% 50%;
}
.carousel-control-prev:hover .carousel-control-prev-icon,
.carousel-control-next:hover .carousel-control-next-icon {
  background-color: rgba(61, 43, 31, 0.9);
}
</style>