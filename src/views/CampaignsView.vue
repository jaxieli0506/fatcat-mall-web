<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

// --- 響應式狀態定義 ---
const API_URL = 'https://localhost:7017/api/Campaigns'; 
const BACKEND_URL = 'https://localhost:7017'; 

const campaigns = ref([]);
const isLoading = ref(true);
const error = ref(null);

const route = useRoute();

// --- API 呼叫函式 ---
const fetchAllCampaigns = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await axios.get(API_URL);
    campaigns.value = response.data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  } catch (err) {
    console.error('取得所有活動失敗:', err);
    error.value = '無法載入活動資訊，請稍後再試。';
  } finally {
    isLoading.value = false;
  }
};

// --- 滾動函式 ---
const scrollToCampaign = async () => {
  const hash = route.hash;
  if (!hash) return;

  await nextTick();

  const element = document.querySelector(hash);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// --- 生命週期鉤子 ---
onMounted(async () => {
  await fetchAllCampaigns();
  await scrollToCampaign();
});
</script>

<template>
  <div class="campaigns-view-container">
    <main class="container py-5">
      <div class="title-container text-center mb-5">
        <h1 class="display-4 fw-bold page-title">所有活動</h1>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border theme-spinner" role="status"></div>
      </div>

      <div v-if="!isLoading && campaigns.length > 0" class="d-grid gap-5">
        <div 
          v-for="campaign in campaigns" 
          :key="campaign.campaignId" 
          :id="`campaign-${campaign.campaignId}`" 
          class="campaign-card card"
        >
          <div class="row g-0">
            <div class="col-lg-5 image-container">
              <img 
                :src="`${BACKEND_URL}${campaign.coverImageUrl}`" 
                class="img-fluid" 
                :alt="campaign.title"
                onerror="this.onerror=null;this.src='https://placehold.co/600x800/eeeeee/FFFFFF?text=圖片載入失敗'">
            </div>

            <div class="col-lg-7 d-flex flex-column">
              <div class="card-body p-5">
                <h3 class="card-title fw-bold mb-3">{{ campaign.title }}</h3>
                <p class="card-text text-muted mb-4">
                  <small>活動期間：{{ new Date(campaign.startDate).toLocaleDateString() }} - {{ new Date(campaign.endDate).toLocaleDateString() }}</small>
                </p>
                <p class="card-text fs-5 lh-lg">{{ campaign.content }}</p>
              </div>
              <div class="card-footer p-5 pt-0">
                <router-link v-if="campaign.callToActionUrl" :to="campaign.callToActionUrl" class="btn btn-theme-action btn-lg">
                    前往購物
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isLoading && campaigns.length === 0 && !error" class="text-center text-muted py-5">
        <p class="fs-4">目前沒有任何活動。</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 主要容器背景，使用你喜歡的「淡紫色」和「白色」粗條紋 */
.campaigns-view-container {
  background-color: #d3a2da; /* 淡紫色 */
  background-image: repeating-linear-gradient(
    to bottom,
    #d3a2da,
    #d3a2da 60px,
    #ffffff 60px,
    #ffffff 120px
  );
  min-height: 100vh;
  padding: 3rem 0;
}

/* 頁面大標題樣式 */
.page-title {
  color: #92559c; /* 深紫色 */
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1rem 2.5rem;
  border-radius: 1rem;
  display: inline-block;
  border: 4px solid #92559c;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  backdrop-filter: blur(4px);
}

/* 載入中 spinner 的顏色 */
.theme-spinner {
  color: #92559c;
}

/* 👇👇👇【CSS 簡化】👇👇👇
  移除了 .campaign-wrapper 和 ::before (扇子) 的所有樣式
*/

/* 活動卡片樣式 */
.campaign-card {
  background-color: #f6f6f6; /* 淺灰白色 */
  border: 4px solid #000000; /* 你喜歡的 4px 黑邊框 */
  border-radius: 10px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 10px 10px 0px rgba(146, 85, 156, 0.7);
}

.campaign-card:hover {
  transform: translate(-5px, -5px);
  box-shadow: 15px 15px 0px #ffa600;
}

/* 圖片容器 */
.image-container {
  padding: 0;
  border-right: 4px solid #000;
}
.campaign-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px 0 0 5px;
}

/* 卡片標題，保留印章設計 */
.campaign-card .card-title {
  color: #92559c;
  position: relative;
  padding-left: 20px;
  font-size: 2.25rem;
}
.campaign-card .card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 80%;
  background-color: #ffd689; /* 淡黃色 */
  border-radius: 2px;
}

/* 按鈕樣式，保留你喜歡的設計 */
.btn-theme-action {
  background: linear-gradient(45deg, #ffa600, #ffd689);
  color: #686868;
  font-weight: bold;
  border: none;
  padding: 0.75rem 2.5rem;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 166, 0, 0.3);
}

.btn-theme-action:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 7px 25px rgba(255, 166, 0, 0.4);
}
</style>
