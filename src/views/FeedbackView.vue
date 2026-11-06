<script setup>
import { ref } from 'vue';
import ReportList from '../components/ReportList.vue'; // 引入我們等下要做的子元件
import ComplaintHistory from '@/components/ComplaintHistory.vue';
import ReviewComponent from '@/components/ReviewComponent.vue';

const activeTab = ref('reports'); // 'reports' 或 'appeals'

// ========================================================================
//        【在這裡定義好所有要測試用的 ID 】
// ========================================================================
// 為了讓後端驗證通過，這些 ID 必須是一組真實的、有關聯的資料
// 根據你的資料庫，當你以 UserId=1 的身分登入時：
// 1. 你有一張訂單 OrderId = 2
// 2. 這張訂單裡有一個商品，其對應的 ProductId 是 1
const testOrderId = 2;
const testProductId = 1;

// 處理子元件發出的事件，方便除錯
const handleComplaintSubmitted = () => {
    alert(`測試頁面收到通知：訂單 #${testOrderId} 的申訴已提交！`);
}
const handleReviewSubmitted = () => {
    alert(`測試頁面收到通知：商品 #${testProductId} 的評論已提交！`);
}


</script>

<template>
  <div class="container my-5 feedback-view">
    <h2 class="mb-4">進度追蹤</h2>

    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'reports' }" 
          href="#" 
          @click.prevent="activeTab = 'reports'"
        >
          檢舉紀錄
        </a>
      </li>
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'appeals' }" 
          href="#" 
          @click.prevent="activeTab = 'appeals'"
        >
          申訴紀錄
        </a>
      </li>
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'reviews' }" 
          href="#" 
          @click.prevent="activeTab = 'reviews'"
        >
          我的評論紀錄
        </a>
      </li>
    </ul>

    <div class="tab-content">
      <div v-if="activeTab === 'reports'">
        <ReportList />
      </div>

      <div v-if="activeTab === 'appeals'" class="text-muted p-5">
        <ComplaintHistory></ComplaintHistory>
        <hr>        
      </div>

      <div v-if="activeTab === 'reviews'" class="text-muted p-5">
        <ReviewComponent :product-id="testProductId" />
        <hr>        
      </div>

    
    </div>
  </div>
</template>

<style scoped>
.feedback-view {
  max-width: 960px;
}
.nav-tabs .nav-link {
  color: #6c757d;
}
.nav-tabs .nav-link.active {
  color: #495057;
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
  font-weight: 500;
}
</style>