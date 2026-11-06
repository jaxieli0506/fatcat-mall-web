<script setup>
import { reactive } from 'vue';
import api from '@/services/jjapi.js'; 

const props = defineProps({
  productId: { type: Number, required: true },
  orderId: { type: Number, required: true }
});

const emit = defineEmits(['review-submitted']);

const newReview = reactive({
  rating: 5,
  comment: '',
  files: []
});

const handleFileChange = (event) => {
  newReview.files = Array.from(event.target.files);
};

const submitReview = async () => {
  const formData = new FormData();
  
  // 【確保有將 OrderId 加進去】~
  formData.append('OrderId', props.orderId);
  formData.append('Rating', newReview.rating);
  formData.append('Comment', newReview.comment);
  if (newReview.files.length > 0) {
    for (const file of newReview.files) {
      formData.append('Files', file);
    }
  }

  try {
    // 【改用 api 實例來發送請求】
    await api.post(`/products/${props.productId}/reviews`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    emit('review-submitted');
  } catch (err) {
    // 提供更友善的錯誤提示
    const errorMessage = err.response?.data?.message || err.response?.data || '提交評論失敗，請稍後再試。';
    alert(errorMessage);
    console.error('提交評論失敗:', err);
  }
};
</script>


<template>
  <div class="add-review-form card mt-5">
    <h5 class="card-header">針對訂單 #{{ orderId }} 發表你的評論</h5>
    <div class="card-body">
      <form @submit.prevent="submitReview">
        <div class="mb-3">
          <label class="form-label">你的評分</label>
          <div class="rating-input">
            <span 
              v-for="star in 5" 
              :key="star" 
              class="star interactive"
              :class="{ 'filled': star <= newReview.rating }"
              @click="newReview.rating = star"
              >★</span>
          </div>
        </div>
        <div class="mb-3">
          <label for="comment" class="form-label">評論內容</label>
          <textarea id="comment" v-model="newReview.comment" class="form-control" rows="4" placeholder="分享你對這個單品的心得..." required></textarea>
        </div>
        <div class="mb-3">
            <label for="reviewFiles" class="form-label">上傳照片 (可選)</label>
            <input class="form-control" type="file" id="reviewFiles" @change="handleFileChange" multiple accept="image/*">
        </div>
        <button type="submit" class="btn btn-warning w-100">提交評論</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.star { color: #e0e0e0; font-size: 1.5rem; } 
.star.filled { color: #ffa600; }
.rating-input .star { font-size: 2rem; cursor: pointer; transition: color 0.2s ease-in-out; }
.rating-input .star:hover { color: #ffd966; }
</style>

