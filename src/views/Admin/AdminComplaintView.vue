<script setup>
// ========================================================================
// 區塊 1：Setup & 引入
// ========================================================================
import { ref, onMounted, computed, reactive, watch } from 'vue';
// 【修正】確保我們引入的是設定好 token 攔截器的 axios 實例
import api from '@/services/jjapi.js';

// ========================================================================
// 區塊 2：響應式狀態 (Reactive State)
// ========================================================================
const allComplaints = ref([]);
const complaints = ref([]);
const selectedComplaint = ref(null);
const isLoading = ref(true);
const error = ref(null);
const BACKEND_URL = 'https://localhost:7017'; 

// --- 篩選與搜尋 ---
const activeStatus = ref(0);
const searchTerm = ref('');       // 用於搜尋「申訴人姓名」
const searchOrderId = ref('');    // 【新增】用於搜尋「訂單號碼」

// --- 分頁 ---
const currentPage = ref(1);
const itemsPerPage = 10;

// --- 管理者回覆 ---
const newResponse = ref('');
const isProcessing = ref(false);

// --- 靜態資料 ---
const statusButtons = [
  { id: null, name: '全部', color: 'btn-all' },
  { id: 0, name: '待處理', color: 'btn-pending' },
  { id: 1, name: '已回覆', color: 'btn-replied' },
  { id: 2, name: '已結案', color: 'btn-closed' },
];

// --- Toast 通知相關狀態 ---
const toast = reactive({
  show: false,
  message: '',
  type: 'success',
});

const showImageModal = ref(false);
const selectedImage = ref(null);

// ========================================================================
// 區塊 3：計算屬性 (Computed Properties)
// ========================================================================
const totalPages = computed(() => Math.ceil(complaints.value.length / itemsPerPage));
const paginatedComplaints = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  return complaints.value.slice(startIndex, startIndex + itemsPerPage);
});

// ========================================================================
// 區塊 4：主要方法 (Methods)
// ========================================================================
const fetchComplaints = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await api.get('/complaints/admin-view');
    allComplaints.value = response.data;
  } catch (err) {
    error.value = "無法載入申訴資料。";
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const applyFilters = () => {
    let result = [...allComplaints.value];
    
    // 1. 根據狀態 ID 篩選
    if (activeStatus.value !== null) {
        result = result.filter(c => c.complaintStatusId === activeStatus.value);
    }
    
    // 2. 根據申訴人姓名搜尋 (不分大小寫)
    if (searchTerm.value.trim() !== '') {
        const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
        result = result.filter(c => c.userName && c.userName.toLowerCase().includes(lowerCaseSearchTerm));
    }

    // 3. 【新增】根據訂單號碼搜尋
    if (searchOrderId.value.trim() !== '') {
        // 將 orderId 轉為字串來進行部分匹配
        result = result.filter(c => c.orderId.toString().includes(searchOrderId.value.trim()));
    }

    complaints.value = result;
    currentPage.value = 1;
};

const selectStatus = (statusId) => {
    activeStatus.value = statusId;
    // 【修改】點擊按鈕時，也清空搜尋框
    searchTerm.value = '';
    searchOrderId.value = '';
    applyFilters();
};

const selectComplaint = (complaint) => {
    selectedComplaint.value = complaint;
    newResponse.value = '';
};

const closeDetailView = () => {
    selectedComplaint.value = null;
};

const getAdminId = () => {
    const storedAdmin = localStorage.getItem('adminUser');
    const adminInfo = storedAdmin ? JSON.parse(storedAdmin) : null;
    if (!adminInfo || !adminInfo.adminId) {
        showToast('錯誤：找不到管理員登入資訊，請重新登入。', 'error');
        return null;
    }
    return adminInfo.adminId;
};

const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => {
    toast.show = false;
  }, 3000);
};

const submitReply = async () => {
    if (!newResponse.value.trim()) {
        alert('回覆內容不可為空。');
        return;
    }
    const adminId = getAdminId();
    if (!adminId) return;

    isProcessing.value = true;
    try {
        const payload = { responseText: newResponse.value, adminId };
        await api.post(`/complaints/${selectedComplaint.value.complaintId}/reply`, payload);
        showToast('回覆成功！', 'success');
        newResponse.value = '';
        await refreshData();
    } catch (err) {
        showToast('回覆失敗！', 'error');
        console.error(err);
    } finally {
        isProcessing.value = false;
    }
};

const markAsClosed = async () => {
    if (!confirm('確定要將此案件結案嗎？')) return;
    const adminId = getAdminId();
    if (!adminId) return;

    isProcessing.value = true;
    try {
        const payload = { newStatusId: 2, adminId };
        await api.put(`/complaints/${selectedComplaint.value.complaintId}/status`, payload);
        showToast('案件已結案！');
        await refreshData();
    } catch (err) {
        showToast('操作失敗！', 'error');
        console.error(err);
    } finally {
        isProcessing.value = false;
    }
};

const refreshData = async () => {
    const complaintIdToKeepOpen = selectedComplaint.value.complaintId;
    await fetchComplaints();
    applyFilters();
    const updatedComplaint = allComplaints.value.find(c => c.complaintId === complaintIdToKeepOpen);
    selectedComplaint.value = updatedComplaint || null;
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
// 區塊 5：監聽器 (Watchers)
// ========================================================================
watch([searchTerm, searchOrderId], () => {
    let timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
        applyFilters();
    }, 300);
});

// ========================================================================
// 區塊 6：生命週期鉤子 (Lifecycle Hooks)
// ========================================================================
onMounted(async () => {
  await fetchComplaints();
  applyFilters();
});
</script>

<template>
  <div class="complaint-management">
    <!-- Toast 通知元件 -->
    <transition name="toast">
        <div v-if="toast.show" class="toast-notification" :class="toast.type">
            <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <svg v-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ toast.message }}</span>
        </div>
    </transition>
    
    <!-- 頁首與篩選器 -->
    <header class="page-header">
      <h3>消費申訴處理</h3>
      <div class="filters-and-search">
        <!-- 【新增】訂單號碼搜尋框 -->
        <div class="search-bar">
            <input type="text" v-model.trim="searchOrderId" placeholder="搜尋訂單號碼...">
        </div>
        <div class="search-bar">
            <input type="text" v-model.trim="searchTerm" placeholder="搜尋申訴人姓名...">
        </div>
        <div class="status-buttons">
            <button
                v-for="status in statusButtons"
                :key="status.id"
                class="btn"
                :class="[status.color, { 'active': activeStatus === status.id }]"
                @click="selectStatus(status.id)">
                {{ status.name }}
            </button>
        </div>
      </div>
    </header>

    <!-- 載入與錯誤狀態 -->
    <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <!-- 主內容佈局 -->
    <div v-else class="content-layout">
      <!-- 左側列表 -->
      <div class="list-panel">
        <h4>{{ statusButtons.find(s => s.id === activeStatus)?.name || '所有' }} 案件 ({{ complaints.length }} 筆)</h4>
        <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>主旨</th>
                  <th>申訴人</th>
                  <th>訂單號碼</th>
                  <th>申訴時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedComplaints.length === 0">
                  <td colspan="5" class="text-center text-muted">沒有符合條件的案件</td>
                </tr>
                <tr v-for="complaint in paginatedComplaints" :key="complaint.complaintId" @click="selectComplaint(complaint)" :class="{ 'table-active': selectedComplaint && selectedComplaint.complaintId === complaint.complaintId }">
                  <td>{{ complaint.complaintId }}</td>
                  <td>{{ complaint.subject }}</td>
                  <td>{{ complaint.userName }}</td>
                  <td>#{{ complaint.orderId }}</td>
                  <td>{{ new Date(complaint.createdAt).toLocaleDateString() }}</td>
                </tr>
              </tbody>
            </table>
        </div>
        <!-- 分頁 -->
        <nav v-if="totalPages > 1" class="mt-auto pt-3">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }"><a class="page-link" href="#" @click.prevent="currentPage--">上一頁</a></li>
            <li class="page-item disabled"><span class="page-link">{{ currentPage }} / {{ totalPages }}</span></li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }"><a class="page-link" href="#" @click.prevent="currentPage++">下一頁</a></li>
          </ul>
        </nav>
      </div>

      <!-- 右側詳情 -->
      <div class="detail-panel">
        <div v-if="selectedComplaint" class="detail-content-wrapper">
          <h4>案件詳情 (ID: {{ selectedComplaint.complaintId }})</h4>
          <hr>
          <div class="detail-scroll-content">
            <!-- 案件資訊 -->
            <p><strong>申訴人:</strong> {{ selectedComplaint.userName }} (ID: {{ selectedComplaint.userId }})</p>
            <p><strong>訂單號碼:</strong> #{{ selectedComplaint.orderId }}</p>
            <p><strong>申訴類型:</strong> {{ selectedComplaint.complaintTypeName }}</p>
            <p><strong>申訴時間:</strong> {{ new Date(selectedComplaint.createdAt).toLocaleString() }}</p>
            <p><strong>目前狀態:</strong> <span class="fw-bold" :class="`status-${selectedComplaint.complaintStatusId}`">{{ selectedComplaint.complaintStatusName }}</span></p>
            <hr>
            <h5><strong>主旨:</strong> {{ selectedComplaint.subject }}</h5>
            <p class="description-box">{{ selectedComplaint.description }}</p>
            <div v-if="selectedComplaint.attachments && selectedComplaint.attachments.length > 0" class="attachments-section mt-3">
            <h6><strong>附件照片:</strong></h6>
            <div class="attachment-grid">
              <img
                v-for="att in selectedComplaint.attachments"
                :key="att.attachmentId"
                :src="getImageUrl(att.filePath)"
                alt="申訴附件"
                class="attachment-thumbnail"
                @click="openImageModal(att.filePath)"
              />
            </div>
          </div>
            
            <!-- 客服回覆區 -->
            <div v-if="selectedComplaint.responseText" class="response-box mt-3">
              <h6><strong>客服回覆 (由 {{ selectedComplaint.adminName }} 於 {{ new Date(selectedComplaint.resolvedAt).toLocaleString() }}):</strong></h6>
              <p>{{ selectedComplaint.responseText }}</p>
            </div>
          </div>

          <hr>
          <!-- 管理員操作區 -->
          <div class="admin-actions">
            <h5>管理員操作</h5>
            <div class="mb-3">
              <label for="responseText" class="form-label">回覆內容:</label>
              <textarea id="responseText" class="form-control" rows="4" v-model="newResponse" placeholder="在此輸入回覆..."></textarea>
            </div>
            <div class="d-flex justify-content-between">
                <button class="btn btn-submit-reply" @click="submitReply" :disabled="isProcessing">
                    {{ isProcessing ? '處理中...' : '送出回覆 (並標示為已回覆)' }}
                </button>
                <button v-if="selectedComplaint.complaintStatusId !== 2" class="btn btn-close-case" @click="markAsClosed" :disabled="isProcessing">
                    {{ isProcessing ? '處理中...' : '手動結案' }}
                </button>
            </div>
          </div>
        </div>
        <div v-else class="placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="bi bi-chat-left-text" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6m0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/></svg>
            <span>點擊左側列表以查看詳細資訊</span>
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
/* ======================================================================== */
/* 區塊 7：CSS 樣式 (美化版)                                              */
/* ======================================================================== */
.complaint-management {
  padding: 2rem;
  background-color: #fdfaff; /* 淡紫色背景 */
  font-family: 'Microsoft JhengHei', sans-serif;
  height: 100%;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0cde6;
}
.page-header h3 {
    margin: 0;
    color: #5e3a71;
    font-weight: 600;
}
.filters-and-search {
    display: flex;
    align-items: center;
    gap: 1rem;
}
.search-bar {
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid #d3a2da;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.search-bar:focus-within {
    box-shadow: 0 0 0 3px rgba(146, 85, 156, 0.25);
    border-color: #92559c;
}
.search-bar input {
  border: none;
  background: none;
  outline: none;
}
.status-buttons {
    display: flex;
    gap: 10px;
}
.status-buttons .btn {
    padding: 0.5rem 1.2rem;
    border-radius: 20px;
    font-weight: 500;
    border: 1px solid transparent;
    transition: all 0.2s ease;
}
.status-buttons .btn.active {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.btn-all { background-color: #ffc107; color: #212529; }
.btn-pending { background-color: #6c757d; color: white; }
.btn-replied { background-color: #28a745; color: white; }
.btn-closed { background-color: #ee2c39; color: white; }

.content-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  height: calc(100vh - 180px); /* 根據你的整體佈局微調 */
}
.list-panel, .detail-panel {
  background-color: #fff;
  border: 1px solid #e0cde6;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.list-panel h4, .detail-panel h4 {
    color: #5e3a71;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #eee;
    margin-bottom: 1rem;
}
.table-responsive {
    overflow-y: auto;
}
.table {
    margin-bottom: 0;
}
.table thead {
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 10;
}
.table th {
    color: #5e3a71;
    border-bottom: 2px solid #d3a2da;
}
.table-hover tbody tr {
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.table-hover tbody tr:hover {
  background-color: #fdfaff;
}
.table-active {
    background-color: #f2e7f5 !important;
    color: #5e3a71;
    font-weight: bold;
}
.pagination {
    margin-bottom: 0;
}
.detail-panel {
    background-color: #faf7fb;
}
.placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 100%;
    color: #a39daa;
}
.placeholder svg {
    margin-bottom: 1rem;
}
.detail-content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}
.detail-scroll-content {
    flex-grow: 1;
    overflow-y: auto;
    padding-right: 15px;
    margin-right: -15px;
}
.description-box, .response-box {
    background-color: #fff;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e0cde6;
    white-space: pre-wrap;
    word-break: break-word;
}
.response-box {
    border-left: 4px solid #92559c;
}
.admin-actions {
    flex-shrink: 0;
    padding-top: 1rem;
}
.admin-actions .btn {
    border-radius: 8px;
    padding: 0.5rem 1rem;
}
.btn-submit-reply {
    background-color: #92559c;
    color: white;
}
.btn-submit-reply:hover {
    background-color: #5e3a71;
}
.btn-close-case {
    background-color: #343a40;
    color: white;
}
.status-0 { color: #6c757d; }
.status-1 { color: #198754; }
.status-2 { color: #2d2c2c; }
.toast-notification {
  position: fixed;
  top: 85px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  z-index: 1000;
  font-weight: 500;
}
.toast-notification.success { background-color: #28a745; }
.toast-notification.error { background-color: #dc3545; }
.toast-enter-active, .toast-leave-active { transition: all 0.5s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(100%); }
.loading-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(255,255,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}
.spinner {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 9px solid #f2e7f5;
    border-top-color: #92559c;
    animation: spinner-anim 0.8s linear infinite;
}
@keyframes spinner-anim {
    to { transform: rotate(360deg); }
}
.attachments-section {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.attachment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 0.5rem;
}

.attachment-thumbnail {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  transition: opacity 0.2s;
}

.attachment-thumbnail:hover {
  opacity: 0.8;
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
