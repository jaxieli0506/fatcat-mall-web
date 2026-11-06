<script setup>
// ========================================================================
// 區塊 1：Setup & 引入
// ========================================================================
import { ref, onMounted } from 'vue';
// 【重要】確保你引入的是設定好的 axios 實例，它會自動附加 token
import api from '@/services/jjapi.js'; 

// ========================================================================
// 區塊 2：響應式狀態 (Reactive State)
// ========================================================================
const complaints = ref([]); // 用來存放從 API 獲取的申訴歷史列表
const isLoading = ref(true);  // 控制「載入中...」訊息的顯示
const error = ref(null);      // 存放錯誤訊息
const BACKEND_URL = 'https://localhost:7017';
const showImageModal = ref(false);// 【新增】圖片 Modal 相關狀態
const selectedImage = ref(null);

// ========================================================================
// 區塊 3：主要方法 (Methods)
// ========================================================================
/**
 * @description 從後端 API 獲取當前登入者的所有申訴紀錄
 */
const fetchMyComplaints = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // 呼叫後端 API，這個請求會因為 jjapi.js 的設定而自動帶上 token
    const response = await api.get('/complaints/my-complaints');
    complaints.value = response.data;
  } catch (err) {
    // 處理可能的錯誤，例如 token 過期導致的 401
    if (err.response && err.response.status === 401) {
        error.value = '您需要登入才能查看申訴紀錄。';
    } else {
        error.value = '無法載入您的申訴紀錄，請稍後再試。';
    }
    console.error("獲取申訴紀錄失敗:", err);
  } finally {
    isLoading.value = false;
  }
};

// 【新增】圖片 Modal 相關方法
const getImageUrl = (filePath) => {
  if (!filePath) return '';
  return filePath.startsWith('http') ? filePath : `${BACKEND_URL}${filePath}`;
};

const openImageModal = (imagePath) => {
  selectedImage.value = getImageUrl(imagePath);
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  selectedImage.value = null;
};


// ========================================================================
// 區塊 4：生命週期鉤子 (Lifecycle Hooks)
// ========================================================================
// onMounted 會在元件被掛載到畫面上後執行一次
onMounted(() => {
    fetchMyComplaints();
});
</script>

<template>
  <!-- ================================================================== -->
  <!-- 區塊 5：頁面 HTML 結構                                           -->
  <!-- ================================================================== -->
  <div class="container mt-4">
    <h5 class="mb-4">當前使用者申訴紀錄</h5>

    <!-- 載入與錯誤狀態顯示 -->
    <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="complaints.length === 0" class="alert alert-info">您目前沒有任何申訴紀錄。</div>

    <!-- 申訴歷史列表 -->
    <div v-else class="list-group">
      <div v-for="complaint in complaints" :key="complaint.complaintId" class="list-group-item list-group-item-action flex-column align-items-start mb-3 shadow-sm">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1 text-primary">{{ complaint.subject }}</h5>
          <small class="text-muted">{{ new Date(complaint.createdAt).toLocaleDateString() }}</small>
        </div>
        <p class="mb-1">
            <span class="fw-bold">訂單 #{{ complaint.orderId }}</span> | 
            <span class="text-muted">類型: {{ complaint.complaintTypeName }}</span>
        </p>
        <p class="mb-2 fst-italic text-secondary">"{{ complaint.description }}"</p>
        
        <span class="badge fs-6" :class="{
            'bg-warning text-dark': complaint.complaintStatusName === '待處理',
            'bg-success': complaint.complaintStatusName === '已回覆',
            'bg-secondary': complaint.complaintStatusName === '已結案'
        }">
            {{ complaint.complaintStatusName }}
        </span>

        <!-- 如果有客服回覆，就顯示出來 -->
         <div v-if="complaint.attachments && complaint.attachments.length > 0" class="mt-3">
          <p class="mb-1 fw-bold">您上傳的附件:</p>
          <div class="attachment-grid">
            <img
              v-for="att in complaint.attachments"
              :key="att.attachmentId"
              :src="getImageUrl(att.filePath)"
              alt="申訴附件"
              class="attachment-thumbnail"
              @click="openImageModal(att.filePath)"
            />
          </div>
        </div>

        <div v-if="complaint.responseText" class="mt-3 p-3 bg-light border rounded">
          </div>
        <div v-if="complaint.responseText" class="mt-3 p-3 bg-light border rounded">
            <p class="mb-1 fw-bold">客服回覆:</p>
            <p class="mb-0">{{ complaint.responseText }}</p>
            <small v-if="complaint.resolvedAt" class="text-muted d-block text-end mt-1">
                回覆於 {{ new Date(complaint.resolvedAt).toLocaleDateString() }}
            </small>
        </div>
      </div>
    </div>
  </div>
  
    <Teleport to="body">
          <div v-if="showImageModal" class="image-modal-overlay" @click="closeImageModal">
            <div class="image-modal-content" @click.stop>
              <i class="fas fa-times image-modal-close" @click="closeImageModal"></i>
              <img :src="selectedImage" alt="圖片預覽" class="modal-image" />
            </div>
          </div>
        </Teleport>

 </template>

<style scoped>
/* --- ComplaintHistory 的樣式 --- */
.attachment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  transition: transform 0.2s;
}

.attachment-thumbnail:hover {
  transform: scale(1.05);
  border-color: #999;
}

/* --- 圖片 Modal 彈窗樣式 (如果全域已有可省略) --- */
.image-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
}
.image-modal-content { position: relative; }
.modal-image {
  max-width: 90vw; max-height: 90vh; border-radius: 8px;
}
.image-modal-close {
  position: absolute; top: -15px; right: -15px; font-size: 2rem; color: white;
  cursor: pointer; text-shadow: 0 0 8px rgba(0,0,0,0.8);
  transition: transform 0.2s;
}
.image-modal-close:hover { transform: scale(1.2); }
</style>
