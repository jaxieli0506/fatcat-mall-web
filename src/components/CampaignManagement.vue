<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

// --- 響應式狀態定義 ---

// ⚠️ 已更新：API 網址現在對應到你的 AdminCampaignController
const API_URL = 'https://localhost:7017/api/admin/AdminCampaign'; // ⚠️

// 用於儲存從後端取回的活動列表
const campaigns = ref([]);

// 用於控制彈出視窗 (Modal) 的顯示與隱藏
const campaignModal = ref(null); 
// 用於儲存當前正在編輯或新增的活動資料
const currentCampaign = reactive({
  campaignId: 0,
  title: '',
  content: '',
  coverImageUrl: '',
  startDate: '',
  endDate: '',
  isPublished: true,
  callToActionUrl: ''
});
// 判斷當前是「新增」還是「編輯」模式
const isEditMode = ref(false);


// --- API 呼叫函式 ---

// 1. 取得所有活動
const fetchCampaigns = async () => {
  try {
    const response = await axios.get(API_URL);
    campaigns.value = response.data;
  } catch (error) {
    console.error('取得活動列表失敗:', error);
    alert('無法載入活動列表，請檢查後端服務是否已啟動，或 CORS 設定是否正確。');
  }
};

// 2. 儲存活動 (新增或更新)
const saveCampaign = async () => {
  // 將日期格式轉換為後端可接受的格式
  const campaignData = {
    ...currentCampaign,
    startDate: new Date(currentCampaign.startDate).toISOString(),
    endDate: new Date(currentCampaign.endDate).toISOString(),
  };

  try {
    if (isEditMode.value) {
      // 編輯模式：使用 PUT
      await axios.put(`${API_URL}/${campaignData.campaignId}`, campaignData);
    } else {
      // 新增模式：使用 POST
      await axios.post(API_URL, campaignData);
    }
    // 成功後，重新整理列表並關閉視窗
    await fetchCampaigns();
    closeModal();
  } catch (error) {
    console.error('儲存活動失敗:', error);
    alert('儲存失敗，請檢查輸入的資料是否正確。');
  }
};

// 3. 刪除活動
const deleteCampaign = async (id) => {
  if (confirm(`確定要刪除 ID 為 ${id} 的活動嗎？`)) {
    try {
      await axios.delete(`${API_URL}/${id}`);
      // 成功後，重新整理列表
      await fetchCampaigns();
    } catch (error) {
      console.error('刪除活動失敗:', error);
      alert('刪除失敗！');
    }
  }
};


// --- Modal 控制函式 ---

// 打開「新增」視窗
const openCreateModal = () => {
  isEditMode.value = false;
  // 重設表單資料
  Object.assign(currentCampaign, {
    campaignId: 0,
    title: '',
    content: '',
    coverImageUrl: '',
    startDate: '',
    endDate: '',
    isPublished: true,
    callToActionUrl: ''
  });
  // 顯示視窗
  const modal = new bootstrap.Modal(campaignModal.value);
  modal.show();
};

// 打開「編輯」視窗
const openEditModal = (campaign) => {
  isEditMode.value = true;
  // 載入該筆活動的資料到表單中
  // 日期需要特別處理，因為 HTML input[type=datetime-local] 需要 'YYYY-MM-DDTHH:mm' 格式
  Object.assign(currentCampaign, {
    ...campaign,
    startDate: campaign.startDate.substring(0, 16),
    endDate: campaign.endDate.substring(0, 16)
  });
  const modal = new bootstrap.Modal(campaignModal.value);
  modal.show();
};

// 關閉視窗
const closeModal = () => {
    const modal = bootstrap.Modal.getInstance(campaignModal.value);
    if(modal) {
        modal.hide();
    }
};

// --- 生命週期鉤子 ---

// 當元件掛載到畫面上時，自動執行一次 fetchCampaigns
onMounted(() => {
  fetchCampaigns();
});

</script>

<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>活動管理</h2>
      <button class="btn btn-primary" @click="openCreateModal">新增活動</button>
    </div>

    <!-- 活動列表表格 -->
    <table class="table table-hover table-bordered align-middle">
      <thead class="table-dark">
        <tr>
          <th>ID</th>
          <th>標題</th>
          <th>狀態</th>
          <th>開始日期</th>
          <th>結束日期</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="campaign in campaigns" :key="campaign.campaignId">
          <td>{{ campaign.campaignId }}</td>
          <td>{{ campaign.title }}</td>
          <td>
            <span :class="campaign.isPublished ? 'badge bg-success' : 'badge bg-secondary'">
              {{ campaign.isPublished ? '已發佈' : '草稿' }}
            </span>
          </td>
          <td>{{ new Date(campaign.startDate).toLocaleString() }}</td>
          <td>{{ new Date(campaign.endDate).toLocaleString() }}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(campaign)">編輯</button>
            <button class="btn btn-sm btn-outline-danger" @click="deleteCampaign(campaign.campaignId)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 新增/編輯 Modal -->
    <div class="modal fade" id="campaignModal" tabindex="-1" ref="campaignModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? '編輯活動' : '新增活動' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCampaign">
              <div class="mb-3">
                <label for="title" class="form-label">標題</label>
                <input type="text" class="form-control" id="title" v-model="currentCampaign.title" required>
              </div>
              <div class="mb-3">
                <label for="content" class="form-label">內容</label>
                <textarea class="form-control" id="content" rows="3" v-model="currentCampaign.content"></textarea>
              </div>
              <div class="mb-3">
                <label for="coverImageUrl" class="form-label">封面圖片 URL</label>
                <input type="url" class="form-control" id="coverImageUrl" v-model="currentCampaign.coverImageUrl" required>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="startDate" class="form-label">開始日期</label>
                  <input type="datetime-local" class="form-control" id="startDate" v-model="currentCampaign.startDate" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="endDate" class="form-label">結束日期</label>
                  <input type="datetime-local" class="form-control" id="endDate" v-model="currentCampaign.endDate" required>
                </div>
              </div>
              <div class="mb-3">
                <label for="callToActionUrl" class="form-label">點擊後連結 URL</label>
                <input type="url" class="form-control" id="callToActionUrl" v-model="currentCampaign.callToActionUrl">
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="isPublished" v-model="currentCampaign.isPublished">
                <label class="form-check-label" for="isPublished">
                  是否發佈
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">關閉</button>
            <button type="button" class="btn btn-primary" @click="saveCampaign">儲存</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 讓表格的按鈕垂直置中對齊更好看 */
.table td {
  vertical-align: middle;
}
.badge {
  font-size: 0.9em;
}
</style>
