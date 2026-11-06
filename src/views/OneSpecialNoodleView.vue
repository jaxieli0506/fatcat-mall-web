<script setup>
import { ref, onMounted, onBeforeUnmount,watch } from 'vue' // 加入watch by JJ
import { useRoute } from 'vue-router'
import ProductReview from '@/components/ProductReview.vue'
import CartOffcanvas from '@/components/CartOffcanvas.vue'
import api from '@/services/jjapi.js'; // 【rr：引入 api 實例】
import { useAuthStore } from '@/stores/auth'; // 【rr：引入 Pinia Auth Store】
import { useCartStore } from '@/stores/cart'; // 【引入購物車 Store】
import Swal from 'sweetalert2'; // 【rr：引入 SweetAlert2】
import 'sweetalert2/dist/sweetalert2.min.css'; // 【rr：引入 SweetAlert2 的樣式】
import * as bootstrap from 'bootstrap';

const route = useRoute()
const productId = route.query.id
const authStore = useAuthStore(); // by rr
const cartStore = useCartStore(); // 購物車 Store

// ====== 通知流程 ======
// ====== 通知流程：卡牌版 ======
const currentStep = ref(0)

const nextStep = () => {
  if (currentStep.value === 0) {
    const card = document.querySelector('.card-image')
    if (card) {
      card.classList.add('drop')
    }
    setTimeout(() => {
      currentStep.value = 1
    }, 600)
  } else if (currentStep.value === 1) {
    currentStep.value = 2
  }
}

// ====== 警語輪播文字 ======
const warningMessages = [
  '親愛的貓貓們請注意',
  '由於特殊款泡麵無法更換配料',
  '請留意過敏食材',
  '如有疑問請洽肥貓客服',
  '肥貓麵舖感謝您 🐾'
]
const currentWarning = ref(0)
let warningInterval

// 【rr：加入收藏的函式】
const addToFavorites = async () => {
  // 在函式內部進行型別轉換
  const numericProductId = Number(productId);

  // 使用轉換後的數字進行判斷
  if (!numericProductId || numericProductId === 0) {
    Swal.fire({
      icon: 'error',
      title: '操作失敗',
      text: '無效的商品 ID，無法加入收藏。',
    });
    return;
  }
  
  if (!authStore.isAuthenticated) {
    Swal.fire({
      icon: 'warning',
      title: '請先登入',
      text: '登入會員後才能將商品加入收藏喔！',
    });
    return;
  }

  try {
    const response = await api.post('/favorites', { 
      // 傳送給後端的也是轉換後的數字
      productId: numericProductId 
    });

    if (response.data.message.includes('已在您的收藏清單中')) {
        Swal.fire({
            icon: 'info',
            title: response.data.message,
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: '已加入收藏！',
            timer: 1500,
            showConfirmButton: false
        });
    }
    
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.response?.data || '加入收藏失敗，請稍後再試。';
    Swal.fire({
        icon: 'error',
        title: '加入失敗',
        text: errorMessage,
    });
    console.error(`將商品 #${numericProductId} 加入收藏失敗:`, err);
  }
};
// 【rr：加入收藏 結束】

// 【加入購物車的函式】
const addToCart = async () => {
  // 檢查商品資料是否存在
  if (!productDetail.value) {
    Swal.fire({
      icon: 'error',
      title: '操作失敗',
      text: '商品資料載入中，請稍後再試。',
    });
    return;
  }

  // 檢查數量是否有效
  if (!quantity.value || quantity.value < 1) {
    Swal.fire({
      icon: 'warning',
      title: '請選擇數量',
      text: '請選擇要加入購物車的商品數量。',
    });
    return;
  }

  // 檢查庫存
  if (quantity.value > productDetail.value.stock) {
    Swal.fire({
      icon: 'warning',
      title: '庫存不足',
      text: `目前庫存只有 ${productDetail.value.stock} 個，無法加入 ${quantity.value} 個商品。`,
    });
    return;
  }

  try {
    // 顯示載入中
    Swal.fire({
      title: '加入購物車中...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // 準備商品資料
    const productToAdd = {
      id: productDetail.value.productsId,
      productsId: productDetail.value.productsId,
      name: productDetail.value.name,
      price: productDetail.value.price,
      image: productDetail.value.imageUrl || images.value[0] || '/ProductImages/default.jpg'
    };

    console.log('準備加入購物車的商品資料:', productToAdd);

    // 根據選擇的數量加入購物車
    for (let i = 0; i < quantity.value; i++) {
      await cartStore.addItem(productToAdd);
    }

    Swal.fire({
      icon: 'success',
      title: '加入成功！',
      text: `已將 ${quantity.value} 個「${productDetail.value.name}」加入購物車`,
      timer: 1500,
      showConfirmButton: false
    });

    // 重置數量為 1
    quantity.value = 1;

    // 自動打開購物車側邊欄
    setTimeout(() => {
      const cartOffcanvas = document.getElementById('offcanvasExample');
      if (cartOffcanvas) {
        const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(cartOffcanvas);
        offcanvasInstance.show();
      }
    }, 1600); // 等待成功提示消失後打開購物車

  } catch (err) {
    console.error('加入購物車失敗:', err);
    Swal.fire({
      icon: 'error',
      title: '加入失敗',
      text: '加入購物車時發生錯誤，請稍後再試。',
    });
  }
};
// 【加入購物車 結束】


onMounted(() => {
  warningInterval = setInterval(() => {
    currentWarning.value = (currentWarning.value + 1) % warningMessages.length
  }, 2000)
})
onBeforeUnmount(() => {
  clearInterval(warningInterval)
})

// ====== 商品資料 ======
const productDetail = ref(null)
const images = ref([])
const quantity = ref(1)

const fetchProductDetail = async () => {
  const productId = route.query.id // 取得路由中的商品ID by JJ
  try {
    const res = await fetch(`https://localhost:7017/api/Products/Details/${productId}`)
    const data = await res.json()
    productDetail.value = data
    images.value = [data.imageUrl] // 只有一張主圖

    // 商品規格先用寫死的
    productSpecs.value = [
      { label: '口味', value: '貓貓專用香氣' },
      { label: '內容量', value: '150g ± 5%' },
      { label: '保存期限', value: '6 個月' },
      { label: '產地', value: '台灣' },
      { label: '過敏原', value: '含愛心與貓毛' }
    ]

    await fetchRecommendedProducts()
  } catch (err) {
    console.error('取得商品資料失敗', err)
  }
}

// 隨機推薦商品（排除目前商品）
const fetchRecommendedProducts = async () => {
  try {
    const res = await fetch(`https://localhost:7017/api/Products/recommend?excludeId=${productId}&count=3`)
    const data = await res.json()

    // 補上圖片路徑（如果 imageUrl 不是完整路徑）
    recommendedProducts.value = data.map(p => ({
      ...p,
      image: p.imageUrl.startsWith('/ProductImages/')
        ? p.imageUrl
        : '/ProductImages/' + p.imageUrl
    }))
  } catch (err) {
    console.error('推薦商品取得失敗', err)
  }
}

// 輪播控制
const currentImageIndex = ref(0)
const direction = ref('next')

const showPrev = () => {
  if (currentImageIndex.value > 0) {
    direction.value = 'prev'
    currentImageIndex.value--
  }
}

const showNext = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    direction.value = 'next'
    currentImageIndex.value++
  }
}

// 商品規格與推薦商品（先寫死）
const productSpecs = ref([])
const recommendedProducts = ref([])

onMounted(fetchProductDetail) 
watch(() => route.query.id, async () => {
  await fetchProductDetail()
  await fetchRecommendedProducts()
}) // 當路由變更時，重新載入商品資料 by JJ

</script>

<template>
<!-- 通知畫面 -->
<div v-if="currentStep < 2" class="notification-wrapper">
  <div class="card-stage">
    <!-- 第一張卡牌 -->
    <div v-if="currentStep === 0" class="first-card-wrapper">
      <img
        src="/message-card.png"
        alt="提示卡片"
        class="card-image glow"
      />
      <div class="card-message">
        <p>親愛的貓貓們，特殊款泡麵無法更換配料 🍜</p>
      </div>
    </div>

    <!-- 第二張卡牌 -->
    <transition name="fade-rise">
      <div v-if="currentStep === 1" class="second-card-wrapper">
        <img
          src="/message-card1.png"
          alt="提示卡片2"
          class="card-image glow"
        />
        <div class="card-message">
          <p>自定義泡麵請前往商品列表 👉</p>
        </div>
      </div>
    </transition>

    <!-- 按鈕 -->
    <button class="next-btn" @click="nextStep">
      {{ currentStep === 0 ? '繼續 ➜' : '進入 ➜' }}
    </button>
  </div>
</div>

  <!-- 正常內容 -->
  <div v-else class="special-noodle-container">
    <div class="content-box">
      <!-- 圖片 -->
      <div class="image-slider">
        <button class="nav-btn left" @click="showPrev" :disabled="currentImageIndex === 0">‹</button>
        <transition :name="direction" mode="out-in">
          <img
            :key="images[currentImageIndex]"
            :src="images[currentImageIndex]"
            class="product-image"
            alt="泡麵圖片"
          />
        </transition>
        <button class="nav-btn right" @click="showNext" :disabled="currentImageIndex === images.length - 1">›</button>
      </div>
      <!-- 給r謙放使用者評論的地方 -->
      <div>
        <!-- r謙放這裡面 -->
      </div>
      <!-- 資訊 -->
      <div class="info-box">
        <h1 class="product-name">{{ productDetail?.name }}</h1>
        <p class="product-price">NT$ {{ productDetail?.price }}</p>
        <p class="product-description">{{ productDetail?.description }}</p>
        <p class="product-stock">剩餘庫存：{{ productDetail?.stock }} 碗</p>
        <p class="product-category">分類：{{ productDetail?.categoryName }} > {{ productDetail?.sortName }}</p>
        <p class="product-status">狀態：{{ productDetail?.statusText }}</p>
        <!-- 商品規格 -->
        <div class="product-specs-form">
          <h3 class="spec-title">商品規格</h3>
          <div class="spec-grid">
            <div
            class="spec-row"
            v-for="(item, index) in productSpecs"
            :key="index"
            >
              <label class="spec-label">{{ item.label }}</label>
              <div class="spec-value">{{ item.value }}</div>
            </div>
          </div>
        </div>
        <!-- 數量選擇器 -->
        <div class="quantity-box">
          <label for="qty">數量：</label>
          <input id="qty" type="number" v-model="quantity" min="1" />
        </div>
        <div class="button-group">
          <button class="cart-btn" @click="addToCart">加入購物車</button>
          <button 
            v-if="authStore.isAuthenticated" 
            class="favorite-btn" 
            @click="addToFavorites">
            加入最愛
          </button>
        </div>
      </div>
    </div>

    <!-- 警語 -->
    <div class="warning-text">
    <transition name="slide-up" mode="out-in">
    <p :key="currentWarning">{{ warningMessages[currentWarning] }}</p>
    </transition>
    </div>
    <!-- 商品評論區（rr已做好 🐱）--> 
    <div class="review-section">
      <h3>⭐ 貓貓們的評論區</h3>
      <div class="review-box"> 
        <!-- RRRRRRRRRR 評論區 -->
        <ProductReview :product-id="route.query.id" />
      </div>
    </div>
    <!-- 推薦商品 -->
    <div class="recommend-area">
      <h3>你可能會喜歡</h3>
      <div class="recommend-list">
        <router-link
          v-for="item in recommendedProducts"
          :key="item.productsId"
          :to="{ name: 'product', query: { id: item.productsId } }"
          class="recommend-item"
        >
          <img :src="item.image" :alt="item.name" />
          <p>{{ item.name }}</p>
          <p>NT$ {{ item.price }}</p>
        </router-link>
      </div>
    </div>
  </div>

  <!-- 購物車側邊欄 -->
  <CartOffcanvas />
</template>

<style lang="css" scoped>
/* ===== 通知樣式（魔法卡牌版） ===== */
.notification-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #fff0fa, #ffe4ec);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: hidden;
}

.card-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 卡牌圖片樣式 */
.card-image {
  width: 360px;
  height: auto;
  transition: transform 0.5s ease, opacity 0.5s ease;
  z-index: 1;
  border-radius: 20px;
}

/* 掉落動畫 */
.card-image.drop {
  transform: translateY(100vh);
  opacity: 0;
}

/* 第二張卡牌浮現動畫 */
.fade-rise-enter-active {
  transition: all 0.6s ease;
}
.fade-rise-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

/* 光暈特效 */
.glow {
  animation: glowPulse 2s infinite alternate;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

@keyframes glowPulse {
  from {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
  }
  to {
    box-shadow: 0 0 35px rgba(255, 255, 255, 0.8);
  }
}

/* 第二張卡牌包裝 */
.second-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 留言文字區塊 */
.card-message {
  margin-top: 20px;
  text-align: center;
  animation: fadeIn 1s ease-in-out;
  color: #b03b97;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 0 0 6px rgba(255, 180, 255, 0.6);
}

.card-message p {
  margin: 8px 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 下一步按鈕 */
.next-btn {
  margin-top: 20px;
  background-color: #ffb8e2;
  border: none;
  color: white;
  font-weight: bold;
  font-size: 16px;
  padding: 10px 25px;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 120, 200, 0.3);
  transition: all 0.3s ease;
}
.next-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 120, 200, 0.5);
}

/* 整個頁面容器 */
.special-noodle-container {
  padding: 40px 5vw;
  background-color: #fff5fc;
  min-height: 100vh;
}

/* 左右結構容器 */
.content-box {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
  align-items: flex-start;
}

/* 圖片區域（單張顯示 + 按鈕） */
.image-slider {
  flex: 1;
  min-width: 800px;
  max-width: 1000px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 圖片本體 */
.product-image {
  height: 500px;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0,0,0,0.15);
  user-select: none;
}

/* 滑動動畫（下一張） */
.next-enter-active, .next-leave-active,
.prev-enter-active, .prev-leave-active {
  transition: all 0.5s ease;
  position: absolute;
}
.next-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.next-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 滑動動畫（上一張） */
.prev-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.prev-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 容器確保滑動不爆版 */
.image-slider {
  position: relative;
  overflow: hidden;
}
.product-image {
  position: relative;
  z-index: 1;
}

/* 左右切換按鈕 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 184, 226, 0.7);
  border: none;
  font-size: 36px;
  font-weight: bold;
  color: white;
  width: 40px;
  height: 60px;
  border-radius: 10px;
  cursor: pointer;
  z-index: 1;
}
.nav-btn.left {
  left: 0;
}
.nav-btn.right {
  right: 0;
}
.nav-btn:disabled {
  background-color: rgba(200, 200, 200, 0.5);
  cursor: not-allowed;
}

/* 右側商品資訊 */
.info-box {
  flex: 1;
  min-width: 300px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-name {
  font-size: 32px;
  font-weight: bold;
  color: #ab3fa2;
}

.product-price {
  font-size: 24px;
  color: #d94ca0;
}

.product-description {
  font-size: 18px;
  color: #333;
}

.product-stock {
  font-size: 16px;
  color: #777;
}

/* 兩顆按鈕 */
.button-group {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

/* 共用按鈕樣式 */
.cart-btn,
.favorite-btn {
  padding: 10px 20px;            /* 更小一點 */
  font-size: 15px;               /* 字體也縮一點 */
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 加入購物車：更亮更濃的漸層 */
.cart-btn {
  background: linear-gradient(135deg, #ff84b7, #ff2f85);
  color: white;
}
.cart-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 18px rgba(255, 47, 133, 0.4);
}

/* 加入最愛：紫粉交界，對比更明顯 */
.favorite-btn {
  background: linear-gradient(135deg, #ffc1ea, #d266c2);
  color: white;
}
.favorite-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 18px rgba(210, 102, 194, 0.4);
}

.warning-text {
  margin-top: 60px;
  padding: 30px;
  background-color: #fff0f5;
  border-left: 6px solid #d94ca0;
  border-radius: 10px;
  text-align: center;
  font-weight: bold;
  font-size: 24px;
  color: #9b376e;
  animation: fadeIn 0.5s ease;
}

/* 警語輪播動畫 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 商品規格 */
.product-specs {
  margin-top: 20px;
}
.product-specs ul {
  padding-left: 20px;
}
.product-specs li {
  margin-bottom: 5px;
  font-size: 16px;
}

/* 商品規格 - 表單樣式 */
.product-specs-form {
  margin-top: 30px;
  padding: 25px 30px;
  background-color: #fff0f9;
  border: 2px dashed #e2a8d7;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(220, 160, 210, 0.15);
}

.spec-title {
  font-size: 22px;
  font-weight: bold;
  color: #b046a6;
  margin-bottom: 20px;
  border-bottom: 2px solid #f5c5ea;
  padding-bottom: 8px;
}

.spec-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.spec-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 15px;
  background-color: #ffeaf6;
  border-radius: 12px;
  transition: background-color 0.3s ease;
}

.spec-row:hover {
  background-color: #fdd4ee;
}

.spec-label {
  font-weight: bold;
  color: #a343a2;
  width: 120px;
  flex-shrink: 0;
}

.spec-value {
  color: #444;
  flex-grow: 1;
  text-align: right;
}

/* 數量選擇器 */
.quantity-box {
  margin-top: 15px;
  font-size: 16px;
}
.quantity-box input {
  width: 60px;
  margin-left: 10px;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

/* rr評論區的簡單小樣式 */
.review-section {
  margin-top: 80px;
  text-align: center;
}

.review-section h3 {
  font-size: 24px;
  color: #a43f96;
  margin-bottom: 20px;
}

.review-box {
  margin: 0 auto;
  max-width: 700px;
  min-height: 120px;
  padding: 30px;
  background: rgba(255, 240, 250, 0.5);
  border-radius: 20px;
  border: 2px dashed #dba6d6;
  box-shadow: 0 4px 10px rgba(200, 100, 160, 0.1);
  backdrop-filter: blur(5px);
}

/* 推薦商品區塊 */
.recommend-area {
  margin-top: 2rem;
}

.recommend-area h3 {
  font-size: 24px;
  color: #a43f96;
  margin-bottom: 20px;
  text-align: center;
}

.recommend-list {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.recommend-item {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #d8bbff;
  border-radius: 12px;
  padding: 10px;
  width: 150px;
  text-align: center;
  box-shadow: 0 0 8px #a27bff80;
  transition: transform 0.3s ease;
  color: inherit;
  text-decoration: none;
}

.recommend-item:hover {
  transform: scale(1.05);
}

.recommend-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}
</style>