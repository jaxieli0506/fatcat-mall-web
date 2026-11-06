<script setup>
// ========================================================================
// 區塊 1：Setup & 引入
// ========================================================================
import { ref, onMounted, computed } from 'vue';
import api from '@/services/jjapi.js'; 

// ========================================================================
// 區塊 3：響應式狀態定義
// ========================================================================
const BACKEND_URL = 'https://localhost:7017';
const reviews = ref([]);
const isLoading = ref(true);
const error = ref(null);
const showReportModal = ref(false); 
const reportingReviewId = ref(null);
const showImageModal = ref(false);
const selectedImage = ref(null);
const currentPage = ref(1); // 當前頁碼，預設為第 1 頁
const itemsPerPage = 5;   // 每頁顯示 5 筆資料

// ========================================================================
// 區塊 4：計算屬性
// ========================================================================
const averageRating = computed(() => {
  if (!reviews.value || reviews.value.length === 0) return 0;
  const total = reviews.value.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.value.length).toFixed(1);
});

// 分頁相關的計算屬性
const totalPages = computed(() => {
  return Math.ceil(reviews.value.length / itemsPerPage);
});

const paginatedReviews = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return reviews.value.slice(startIndex, endIndex);
});

// ========================================================================
// 區塊 5：API 呼叫函式
// ========================================================================
const fetchMyReviews = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // vvvvvvvvvv 【核心修正】 vvvvvvvvvvvv
    // 我們現在呼叫的是專門用來獲取「我的評論」的後端 API。
    // 這個 API 不需要任何參數，它會自動從你請求附帶的 Token 中解析出 UserId。
    const response = await api.get(`/reviews`);
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    reviews.value = response.data;
  } catch (err) {
    // 增加對 401 未授權錯誤的處理，提供更友善的提示
    if (err.response && err.response.status === 401) {
        error.value = '您需要登入才能查看評論紀錄。';
    } else {
        error.value = '無法載入您的評論紀錄。';
    }
    console.error(`取得我的評論失敗:`, err);
  } finally {
    isLoading.value = false;
  }
};

// ========================================================================
// 區塊 6：檢舉 Modal 相關方法 (可以保留)
// ========================================================================
const openReportModal = (reviewId) => {
  reportingReviewId.value = reviewId;
  showReportModal.value = true;
};
const closeReportModal = () => {
  showReportModal.value = false;
  reportingReviewId.value = null;
};

// ========================================================================
// 區塊 7：圖片預覽相關方法
// ========================================================================
const openImageModal = (imagePath) => {
  selectedImage.value = `${BACKEND_URL}${imagePath}`;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  selectedImage.value = null;
};

// 建構完整的圖片 URL
const getImageUrl = (filePath) => {
  return `${BACKEND_URL}${filePath}`;
};

// ========================================================================
// 區塊 8：生命週期鉤子
// ========================================================================
onMounted(() => {
  fetchMyReviews(); // 呼叫修正後的函式
});
</script>

<template>
  <div class="review-section my-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">我的評論紀錄 ({{ reviews.length }})</h3>
      <div v-if="reviews.length > 0" class="average-rating">
        <strong>平均評分: {{ averageRating }}</strong> / 5
        <span class="star filled ms-1">★</span>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>
    <div v-if="isLoading" class="text-center py-4"><div class="spinner-border"></div></div>

    <div v-if="!isLoading && reviews.length > 0" class="review-list">      
      <div v-for="review in paginatedReviews" :key="review.reviewId" class="review-card card mb-3">          
        <div class="card-body">
            <div class="review-header d-flex align-items-start mb-2">
              <div class="flex-grow-1">
                <small class="text-muted">針對商品</small>
                <h6 class="card-title mb-0">{{ review.productName || '商品名稱' }}</h6>
              </div>
              <div class="ms-auto text-end">
                <div class="rating-stars mb-2">
                  <span v-for="n in 5" :key="n" class="star" :class="{ 'filled': n <= review.rating }">★</span>
                </div>
                <small class="text-muted">{{ new Date(review.createdAt).toLocaleDateString() }}</small>
              </div>
            </div>
            <p class="card-text mt-3">{{ review.comment }}</p>
            
            <div v-if="review.attachments && review.attachments.length > 0" class="attachments mt-3">
              <small class="text-muted d-block mb-2">附件照片：</small>
              <div class="attachment-grid">
                <img 
                  v-for="(attachment, index) in review.attachments" 
                  :key="index"
                  :src="getImageUrl(attachment.filePath)"
                  :alt="attachment.fileName"
                  :title="attachment.fileName"
                  class="attachment-thumbnail"
                  @click="openImageModal(attachment.filePath)"
                  @error="$event.target.src = '/images/products/default.jpg'"
                />
              </div>
            </div>
            <div v-if="review.response" class="official-response mt-3 p-3">
              <strong>店家回覆：</strong> {{ review.response }}
            </div>

            <div v-if="!review.status" class="hidden-review-warning mt-3">
              此評論已隱藏！被檢舉原因：{{ review.hiddenReason || '管理員未提供特定原因' }}，有問題請洽客服。
            </div>            
        </div>
      </div>
      <nav v-if="totalPages > 1" class="d-flex justify-content-center mt-4"> 
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="currentPage--">
              <span>&laquo;</span>
            </a>
          </li>
          <li 
            v-for="pageNumber in totalPages" 
            :key="pageNumber" 
            class="page-item" 
            :class="{ active: currentPage === pageNumber }"
          >
            <a class="page-link" href="#" @click.prevent="currentPage = pageNumber">
              {{ pageNumber }}
            </a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a class="page-link" href="#" @click.prevent="currentPage++">
              <span>&raquo;</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
    
    <div v-if="!isLoading && reviews.length === 0" class="text-center text-muted py-4">
      <p>您尚未發表任何評論。</p>
    </div>

    <Teleport to="body">
      <div 
        v-if="showImageModal" 
        class="image-modal-overlay" 
        @click="closeImageModal"
      >
        <div class="image-modal-content" @click.stop>
          <i class="fas fa-times image-modal-close" @click="closeImageModal"></i>
          <img 
            :src="selectedImage" 
            alt="預覽圖片" 
            class="modal-image"
          />
        </div>
      </div>
    </Teleport>
    <ReportModal v-if="showReportModal" :review-id="reportingReviewId" @close="closeReportModal" />
  </div>
</template>

<style scoped>
/* 你的樣式完全不需要修改，可以保持原樣 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.review-section { max-width: 800px; margin-left: auto; margin-right: auto; }
.review-card { border-left: 4px solid #92559c; } /* 改回紫色系，代表「我的」 */
.star { color: #e0e0e0; font-size: 1.5rem; } 
.star.filled { color: #ffa600; }
.attachments img { width: 80px; height: 80px; object-fit: cover; cursor: pointer; transition: transform 0.2s ease; }
.attachments img:hover { transform: scale(1.1); }
.official-response { background-color: #f6f6f6; border-radius: 5px; border: 1px solid #eee; }
.review-actions .btn-link { text-decoration: none; font-size: 0.8rem; }
.review-actions .btn-link:hover { text-decoration: underline; }
.hidden-review-warning {
    background-color: #f8d7da; /* 粉紅底 */
    color: #842029; /* 紅字 */
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
    border: 1px solid #f5c2c7;
    font-size: 0.9rem;
}
/* 縮圖樣式 */
.attachments .attachment-thumbnail {
  width: 80px; 
  height: 80px; 
  object-fit: cover; 
  cursor: pointer;
  transition: opacity 0.2s ease;
  border-radius: 4px; 
}

.attachments .attachment-thumbnail:hover {
  opacity: 0.8;}

/* 背景遮罩層 */
.image-modal-overlay {
  position: fixed; /* 固定位置，覆蓋整個視窗 */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* 半透明黑 */
  display: flex; /* 使用 flex 輕鬆實現垂直水平置中 */
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 確保在最上層 */
  padding: 15px; /* 給內容一點邊距，避免貼邊 */
}

/* 圖片和關閉按鈕的容器 */
.image-modal-content {
  position: relative; /* 為了讓關閉按鈕可以絕對定位 */
  display: flex;
}

/* 放大後的圖片 */
.modal-image {
  max-width: 90vw;   /* 最大寬度不超過視窗寬度的 90% */
  max-height: 90vh; /* 最大高度不超過視窗高度的 90% */
  object-fit: contain;
  border-radius: 8px; /* 加個圓角 */
  box-shadow: 0 10px 30px rgba(0,0,0,0.5); /* 加個陰影更有立體感 */
}

/* 關閉按鈕 (X) */
.image-modal-close {
  position: absolute;
  top: -15px;      /* 定位到圖片容器的右上角偏外側 */
  right: -15px;
  font-size: 2rem; /* 放大 icon */
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
  text-shadow: 0 0 8px rgba(0,0,0,0.8); /* 給文字加點陰影，在複雜背景下更清晰 */
}

.image-modal-close:hover {
  transform: scale(1.2); /* 滑鼠移過去稍微放大 */
}

.pagination .page-item.active .page-link {
  background-color: #92559c; /* 你的主題紫色 */
  border-color: #92559c;
  color: white; /* 讓頁碼數字變白色 */
}
</style>
