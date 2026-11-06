<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/jjapi.js'; // 👈 確保只匯入 api
import Swal from 'sweetalert2'; 
import 'sweetalert2/dist/sweetalert2.min.css'; 

// --- Props & Emits ---
const props = defineProps({
  reviewId: {
    type: Number,
    required: true
  }
});
const emit = defineEmits(['close']);

// --- 狀態定義 ---
const reportReasons = ref([]);
const isFetchingReasons = ref(false);
const currentReport = reactive({
  reasonTypeId: '',
  reasonComment: ''
});

// --- API 呼叫 ---
const fetchReportReasons = async () => {
  if (reportReasons.value.length > 0) return;
  isFetchingReasons.value = true;
  try {
    const response = await api.get(`/reviews/report-reasons`);
    reportReasons.value = response.data;
  } catch (err) {
    console.error('取得檢舉原因失敗:', err);
    alert('無法載入檢舉原因，請稍後再試。');
  } finally {
    isFetchingReasons.value = false;
  }
};

const submitReport = async () => {
  if (!currentReport.reasonTypeId) {
    emit('close');
    Swal.fire({
      icon: 'warning',
      title: '請選擇一個檢舉原因',
    });
    return;
  }
  try {
    const payload = {
      reasonTypeId: parseInt(currentReport.reasonTypeId),
      reasonComment: currentReport.reasonComment
    };
    
    await api.post(`/reviews/${props.reviewId}/report`, payload);
    
    // 【修改處】將 emit('close') 移到 Swal.fire() 的前面
    // 這樣就會先關閉視窗，再顯示提示
    emit('close'); 
    
    Swal.fire({
      icon: 'success',
      title: '檢舉已送出',
      text: '感謝您的回報，我們將會盡快處理。',
    });
    
  } catch (err) {
    console.error('提交檢舉失敗:', err);
    
    // 【修改處】錯誤時也一樣，先關閉視窗再提示
    emit('close');
    
    Swal.fire({
      icon: 'error',
      title: '提交失敗',
      text: '發生未知錯誤，請稍後再試。',
    });
  }
};

// --- 生命週期鉤子 ---
onMounted(() => {
  fetchReportReasons();
});
</script>

<template>
  <Teleport to="body">
    <div class="modal-wrapper">
      <div class="modal-backdrop show"></div>
      
      <div class="modal show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered"> <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">檢舉評論</h5>
              <button type="button" class="btn-close" @click="emit('close')"></button>
            </div>
            <div class="modal-body">
              <div v-if="isFetchingReasons" class="text-center">
                <div class="spinner-border spinner-border-sm"></div>
              </div>
              <form v-else @submit.prevent="submitReport">
                <div class="mb-3">
                  <label for="reportReason" class="form-label">請選擇檢舉原因：</label>
                  <select class="form-select" id="reportReason" v-model="currentReport.reasonTypeId" required>
                    <option disabled value="">請選擇...</option>
                    <option v-for="reason in reportReasons" :key="reason.reasonTypeId" :value="reason.reasonTypeId">
                      {{ reason.reasonName }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="reportComment" class="form-label">補充說明 (可選填)：</label>
                  <textarea class="form-control" id="reportComment" rows="3" v-model="currentReport.reasonComment"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="emit('close')">取消</button>
              <button type="button" class="btn btn-danger" @click="submitReport">送出檢舉</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 【新增】一個固定的外層容器，確保 z-index 在最上層 */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000; /* 使用一個較高的 z-index */
}

/* 因為我們用了 Teleport，modal-backdrop 和 modal 都被傳送到 body，
  所以原本的 .modal 樣式可能會失效。
  我們直接在這裡重新定義背景顏色，確保效果。
*/
.modal-backdrop {
  background-color: rgba(0,0,0,0.5);
}

/* 確保 modal 本身背景是透明的，才看得到 backdrop */
.modal {
  background-color: transparent;
}
</style>