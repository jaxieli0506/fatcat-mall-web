<script setup>
// ========================================================================
// 區塊 1：Setup & 引入
// ========================================================================
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/jjapi.js';

// ========================================================================
// 區塊 2：Props & Emits
// 定義此元件如何與父元件溝通
// ========================================================================
const props = defineProps({
  // 這個元件必須由父層傳入一個 orderId，它才知道要為哪個訂單申訴
  orderId: {
    type: Number,
    required: true
  }
});
// 定義此元件會向父層發送的事件
const emit = defineEmits(['complaint-submitted', 'close']);

// ========================================================================
// 區塊 3：響應式狀態 (Reactive State)
// ========================================================================
const complaintTypes = ref([]); // 存放申訴類型下拉選單的選項
const isSubmitting = ref(false);  // 控制提交按鈕是否處於禁用狀態
const newComplaint = reactive({
  subject: '',
  complaintTypeId: null,
  description: '',
  attachments: [],
});

// ========================================================================
// 區塊 4：主要方法 (Methods)
// ========================================================================
/**
 * @description 從 API 獲取所有可用的申訴類型，用於填充下拉選單
 */
const fetchComplaintTypes = async () => {
  try {
    const response = await api.get('/complaints/types');
    complaintTypes.value = response.data;
  } catch (err) {
    console.error('無法載入申訴類型', err);
    // 這裡可以考慮顯示一個錯誤訊息給使用者
  }
};

/**
 * @description 當使用者選擇檔案時，更新狀態
 */
const handleFileChange = (event) => {
    newComplaint.attachments = Array.from(event.target.files);
};

/**
 * @description 提交申訴表單的核心邏輯
 */
const submitComplaint = async () => {
    // 基本的前端驗證
    if (!newComplaint.complaintTypeId || !newComplaint.subject) {
        alert('申訴主旨和類型為必填項。');
        return;
    }
    isSubmitting.value = true;

    // 建立 FormData 物件來打包要傳送的資料 (因為包含檔案)
    const formData = new FormData();
    formData.append('OrderId', props.orderId); // 使用從 props 傳入的 orderId
    formData.append('Subject', newComplaint.subject);
    formData.append('ComplaintTypeId', newComplaint.complaintTypeId);
    formData.append('Description', newComplaint.description);
    newComplaint.attachments.forEach(file => {
        formData.append('Attachments', file);
    });

    try {
        // 呼叫後端 API
        await api.post('/complaints', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        emit('complaint-submitted'); // 通知父層「提交成功了」，父層可以做些事，例如刷新訂單列表
        emit('close'); // 通知父層「可以關閉我了」
    } catch (err) {
        console.error("提交申訴失敗:", err);
    } finally {
        isSubmitting.value = false;
    }
};

// ========================================================================
// 區塊 5：生命週期鉤子 (Lifecycle Hooks)
// ========================================================================
onMounted(() => {
    fetchComplaintTypes();
});
</script>

<template>
  <!-- ================================================================== -->
  <!-- 區塊 6：頁面 HTML 結構 (只有表單，沒有觸發按鈕)                    -->
  <!-- ================================================================== -->
  <div class="card card-body mt-3 border-danger">
    <h4 class="card-title text-danger">針對訂單 #{{ orderId }} 提出申訴</h4>
    <form @submit.prevent="submitComplaint">
      <div class="row">
          <div class="col-md-6 mb-3">
              <label for="complaintType" class="form-label">申訴類型</label>
              <select id="complaintType" class="form-select" v-model.number="newComplaint.complaintTypeId" required>
                  <option disabled :value="null">請選擇...</option>
                  <option v-for="type in complaintTypes" :key="type.complaintTypeId" :value="type.complaintTypeId">
                      {{ type.typeName }}
                  </option>
              </select>
          </div>
          <div class="col-md-6 mb-3">
              <label for="subject" class="form-label">申訴主旨</label>
              <input type="text" id="subject" class="form-control" v-model="newComplaint.subject" required>
          </div>
      </div>
      <div class="mb-3">
          <label for="description" class="form-label">詳細說明</label>
          <textarea id="description" class="form-control" rows="4" v-model="newComplaint.description" placeholder="請詳細描述您遇到的問題..."></textarea>
      </div>
      <div class="mb-3">
          <label for="attachments" class="form-label">上傳附件 (可選)</label>
          <input type="file" id="attachments" class="form-control" @change="handleFileChange" multiple>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" @click="emit('close')">取消</button>
        <button type="submit" class="btn btn-danger" :disabled="isSubmitting">
            {{ isSubmitting ? '提交中...' : '送出申訴' }}
        </button>
      </div>
    </form>
  </div>
</template>
