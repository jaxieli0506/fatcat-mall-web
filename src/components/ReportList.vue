<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/jjapi.js'; 


const reports = ref([]);
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const response = await api.get('/feedback/reports'); 
    reports.value = response.data;
  } catch (err) {
    console.error("取得檢舉紀錄失敗:", err);
    error.value = "無法載入您的檢舉紀錄，請稍後再試。";
  } finally {
    isLoading.value = false;
  }
});

// 用來根據狀態 ID 回傳對應的 CSS class
const statusClass = (statusId) => {
  switch (statusId) {
    case 0: return 'bg-secondary'; // 待處理
    case 1: return 'bg-success';   // 成立
    case 2: return 'bg-danger';    // 不成立
    default: return 'bg-dark';
  }
};
</script>

<template>
  <div>
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="reports.length === 0" class="text-center text-muted p-5">
      <p class="fs-4">您尚未提交任何檢舉紀錄。</p>
    </div>

    <div v-else class="list-group">
      <div v-for="report in reports" :key="report.reportId" class="list-group-item list-group-item-action flex-column align-items-start mb-3 shadow-sm report-card">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1 report-reason">檢舉原因：{{ report.reasonName || 'N/A' }}</h5>
          <small class="text-muted">{{ new Date(report.createdAt).toLocaleString() }}</small>
        </div>
        
        <div class="mb-2 p-3 bg-light rounded report-review-comment">
          <small class="text-muted">您檢舉的評論：</small>
          <p class="mb-0 fst-italic">"{{ report.reportedReviewComment?.substring(0, 100) || '評論已被移除或無法顯示' }}{{ (report.reportedReviewComment?.length || 0) > 100 ? '...' : '' }}"</p>
        </div>

        <p v-if="report.reasonComment" class="mb-2"><b>檢舉原因：</b>{{ report.reasonComment }}</p>
        
        <div class="d-flex align-items-center">
          <span class="badge rounded-pill me-2 fs-6" :class="statusClass(report.statusId)">
            {{ report.statusName || '未知狀態' }}
          </span>
          <small v-if="report.adminName" class="text-muted">由 {{ report.adminName }} 處理</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-card {
  border-left: 5px solid #6c757d;
  transition: all 0.2s ease-in-out;
}
.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
.report-reason {
  color: #343a40;
}
.report-review-comment {
  border: 1px solid #e9ecef;
}
.badge {
  padding: 0.5em 0.75em;
}
</style>