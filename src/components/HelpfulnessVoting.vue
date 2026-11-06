<script setup>
import { ref } from 'vue';
import axios from 'axios';
import api from '@/services/jjapi.js';

// --- Props & Emits ---
const props = defineProps({
  reviewId: { type: Number, required: true },
  initialCount: { type: Number, default: 0 },
  // --- 👇👇👇【 1：接收來自父層的「投票記憶」】👇👇👇 ---
  // 這個 prop 會告訴元件，使用者刷新前到底投了什麼票
  initialUserVote: { type: Boolean, default: null } 
});

const emit = defineEmits(['vote-updated']);

// --- 狀態定義 ---
const API_BASE_URL = 'https://localhost:7017/api';
const helpfulnessCount = ref(props.initialCount);
const isLoading = ref(false); // 加一個載入狀態，防止狂點

// --- 👇👇👇【 2：用接收到的「記憶」來初始化狀態】👇👇👇 ---
// 不要再寫死 ref(null)，而是使用父層傳進來的 props.initialUserVote
const currentUserVote = ref(props.initialUserVote); 

// --- 函式 ---
const vote = async (voteType) => {
  // 如果正在請求中，或點擊的按鈕就是當前狀態，則不反應
  if (isLoading.value || currentUserVote.value === voteType) {
    return;
  }
  
  isLoading.value = true;
  const previousVote = currentUserVote.value;

  // 樂觀更新計數
  if (voteType === true) {
    helpfulnessCount.value++;
  } else {
    if (previousVote === true) {
      helpfulnessCount.value--;
    }
  }
  currentUserVote.value = voteType; // 更新按鈕顏色
  
  try {
    // 發送 API 請求
    const response = await api.post(`/reviews/${props.reviewId}/helpfulness`, {
      isHelpful: voteType
    });
    
    // --- 【修改點 3：使用後端回傳的最新計數來校準】 ---
    // 這樣能保證畫面上顯示的數字永遠是最準確的
    if (response.data && typeof response.data.newCount === 'number') {
        helpfulnessCount.value = response.data.newCount;
    }
    
    // 通知父層更新（如果需要）
    emit('vote-updated', { 
        reviewId: props.reviewId, 
        newCount: helpfulnessCount.value,
        newUserVote: currentUserVote.value
    });

  } catch (err) {
    console.error('投票失敗:', err);
    alert('投票失敗，請稍後再試。');
    // 還原 UI 狀態
    currentUserVote.value = previousVote;
    // 這裡也需要還原計數
     if (voteType === true) {
        helpfulnessCount.value--;
    } else {
        if (previousVote === true) {
            helpfulnessCount.value++;
        }
    }
  } finally {
      isLoading.value = false;
  }
};
</script>

<template>
  <div class="helpfulness-voting ">
    <button @click="vote(true)" class="btn btn-sm" :class="currentUserVote === true ? 'btn-success' : 'btn-outline-secondary'">
      <i class="fas fa-thumbs-up"></i> 讚 ({{ helpfulnessCount }})
    </button>
    <button @click="vote(false)" class="btn btn-sm ms-2" :class="currentUserVote === false ? 'btn-danger' : 'btn-outline-secondary'">
      <i class="fas fa-thumbs-down"></i>
    </button>
  </div>
</template>

<style scoped>
.helpfulness-voting .btn {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
}
</style>
