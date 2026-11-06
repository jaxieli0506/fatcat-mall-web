<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import api from '@/services/jjapi.js'; //要抓會員id token用的
import { useCartStore } from '@/stores/cart'; // ✅ 引入購物車 Store

// --- 響應式狀態定義 ---
const API_URL = 'https://localhost:7017/api/favorites'; 
const BACKEND_URL = 'https://localhost:7017';

const favorites = ref([]);
const isLoading = ref(true);
const error = ref(null);
const cartStore = useCartStore(); // ✅ 建立購物車 store 實例
// --- API 呼叫函式 ---
const fetchFavorites = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await api.get('/favorites');
    favorites.value = response.data;
  } catch (err) {
    console.error('取得收藏列表失敗:', err);
    error.value = '無法載入您的收藏清單，請稍後再試。';
  } finally {
    isLoading.value = false;
  }
};

const removeFromFavorites = async (productId) => {
  if (!confirm('確定要將此商品移出收藏清單嗎？')) {
    return;
  }
  try {
    await api.delete(`/favorites/${productId}`); // 改用 api，並使用相對路徑
    favorites.value = favorites.value.filter(item => item.productId !== productId);
  } catch (err) {
    console.error('移除收藏失敗:', err);
    alert('移除失敗，請稍後再試。');
  }
};

// --- 加入購物車 ---
const addToCart = (product) => {
  const cartItem = {
    id: product.productId,
    name: product.productName,
    price: product.productPrice,
    image: `/ProductImages/${product.productImageUrl}`
  };
  cartStore.addItem(cartItem);
  alert(`已將「${product.productName}」加入購物車！`);
};



// --- 生命週期鉤子 ---
onMounted(() => {
  fetchFavorites();
});
</script>

<template>
  <div class="favorites-view-container">
    <main class="container py-5">
      <!-- 頁面標題 -->
      <div class="text-center mb-5">
        <h1 class="display-4 fw-bold page-title">我的收藏</h1>
        <p class="lead page-subtitle">追蹤您喜愛的客製化泡麵單品！</p>
      </div>

      <!-- 錯誤或載入中訊息 -->
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border theme-spinner" role="status"></div>
      </div>

      <!-- 收藏列表 -->
      <div v-if="!isLoading && favorites.length > 0" class="row g-4">
        <div v-for="item in favorites" :key="item.productId" class="col-lg-3 col-md-4 col-sm-6">
          <div class="favorite-card card h-100 shadow-sm">
            <img :src="`${BACKEND_URL}/ProductImages/${item.productImageUrl}`" class="card-img-top" :alt="item.productName" onerror="this.onerror=null;this.src='https://placehold.co/400x300/6c757d/FFFFFF?text=Image'">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ item.productName }}</h5>
              <p class="card-text text-danger fs-5 fw-bold mt-auto">${{ item.productPrice }}</p>
            </div>
            <!-- 加入購物車按鈕 -->
            <div class="card-footer bg-transparent border-0 p-3">
              <div class="btn-group w-100" role="group">
                <button @click="addToCart(item)" type="button" class="btn btn-warning">
                  <i class="fas fa-cart-plus me-1"></i> 加入購物車
                </button>
                <button @click="removeFromFavorites(item.productId)" type="button" class="btn btn-outline-secondary">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 沒有收藏時的訊息 -->
      <div v-if="!isLoading && favorites.length === 0" class="text-center text-muted py-5">
        <p class="fs-4">您的收藏清單是空的。</p>
        <p>快去逛逛，把喜歡的商品加進來吧！</p>
        <router-link to="/" class="btn btn-primary mt-3">前往首頁</router-link>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.favorites-view-container { background-color: #f8f9fa; min-height: 100vh; }
.page-title { color: #92559c; }
.page-subtitle { color: #686868; }
.theme-spinner { color: #92559c; }

.favorite-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.favorite-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
.favorite-card .card-img-top {
  height: 200px;
  object-fit: cover;
}
.favorite-card .card-title {
  font-size: 1rem;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.5rem;
}

/* 👇👇👇【新增的樣式】👇👇👇 */
.btn-group .btn {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
