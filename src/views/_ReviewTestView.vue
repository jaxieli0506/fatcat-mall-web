<script setup>
import CreateComplaintForm from '@/components/CreateComplaintForm.vue';
import PostReviewForm from '@/components/PostReviewForm.vue';
import ProductReview from '@/components/ProductReview.vue';

// ========================================================================
//        【在這裡定義好所有要測試用的 ID 】
// ========================================================================
// 為了讓後端驗證通過，這些 ID 必須是一組真實的、有關聯的資料
// 根據你的資料庫，當你以 UserId=1 的身分登入時：
// 1. 你有一張訂單 OrderId = 2
// 2. 這張訂單裡有一個商品，其對應的 ProductId 是 1
const testOrderId = 14;
const testProductId = 2;

// 處理子元件發出的事件，方便除錯
const handleComplaintSubmitted = () => {
    alert(`測試頁面收到通知：訂單 #${testOrderId} 的申訴已提交！`);
}
const handleReviewSubmitted = () => {
    alert(`測試頁面收到通知：商品 #${testProductId} 的評論已提交！`);
}
</script>

<template>
  <div class="container mt-4">
    <h1>rr 各個元件的測試區塊</h1>
    <hr>

     <!-- <h3 class="mt-4">發表新評論 (PostReviewForm)</h3>
    <PostReviewForm 
        :product-id="testProductId" 
        :order-id="testOrderId"
        @review-submitted="handleReviewSubmitted" 
    />
    <hr> -->

    <!-- 
        ============================================================
        區塊 C：提出申訴的表單元件
        我們將 testOrderId 傳遞給它
        ============================================================
     -->
    <h3 class="mt-4">提出申訴 (CreateComplaintForm)</h3>
    <CreateComplaintForm 
        :order-id="testOrderId" 
        @complaint-submitted="handleComplaintSubmitted"
    />
    <hr>
     
  </div>
</template>
