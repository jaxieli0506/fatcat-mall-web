<script setup>
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import CartItemList from '@/components/CartItemList.vue'
import CouponSection from '@/components/CouponSection.vue'
import LoginForm from '@/components/LoginForm.vue'
import { ref } from 'vue'
import GueseeULikeSection from '@/components/GueseeULikeSection.vue'
import { useRouter } from 'vue-router'
import api from '@/services/jjapi.js'

const cartStore = useCartStore()

// 添加登入路由守衛 by jj
const authStore = useAuthStore()

// 登入模態框狀態
const showLoginModal = ref(false)

const products = ref([
  {
    id: 101,
    name: '社畜最愛宵夜麵',
    imageUrl: '/fakenoodle.jpg',
    tag: '強檔'
  },
  {
    id: 102,
    name: '小女友泡麵套餐',
    imageUrl: '/fakenoodle.jpg',
    tag: '推薦'
  },
  {
    id: 103,
    name: '16塊腹肌指定口味',
    imageUrl: '/fakenoodle.jpg',
    tag: '人氣'
  }
])

// 處理結帳按鈕點擊
function handleCheckoutClick() {
  // 檢查用戶是否已登入
  if (!authStore.isAuthenticated) {
    // 未登入，顯示登入模態框
    showLoginModal.value = true
    return
  }
  
  // 已登入，導向結帳頁面
  window.location.href = '/checkout'
}

// 處理登入成功
function handleLoginSuccess() {
  // 登入成功後，關閉登入模態框並重新執行結帳流程
  showLoginModal.value = false
  proceedToCheckout()
}

// 關閉登入模態框
function closeLoginModal() {
  showLoginModal.value = false
}
const router = useRouter()

// 點擊「前往結帳」：先檢查登入狀態，再將購物車資料批次送至後端，並取得 itemId 列表存入 Pinia，最後跳轉結帳頁
async function proceedToCheckout() {
  // 檢查用戶是否已登入
  if (!authStore.isAuthenticated) {
    // 未登入，顯示登入模態框
    showLoginModal.value = true
    return
  }

  try {
    const cartPayload = cartStore.items.map(i => ({
      itemId: 0,
      productsId: i.id,
      quantity: i.quantity,
      unitprice: i.price
    }))
    
    const res = await api.post('/ShoppingCartItems/batch', cartPayload)

    if (Array.isArray(res.data)) {
      cartStore.setCartItemIds(res.data)
      console.log('後端回傳購物車項目ID列表:', res.data)
      router.push('/checkout')
    } else {
      alert('取得購物車項目ID失敗')
    }
  } catch (err) {
    console.error('❌ 建立購物車資料失敗:', err)
    alert('無法建立購物車資料，請稍後再試')
  }
}

</script>

<template>
  <div class="page-content-wrapper pt-5 pb-5">
    <div class="container mb-2">
      <h2>購物車確認</h2>

      <!-- 購物車區塊 -->
      <div class="accordion col-lg-10 container mb-5" id="accordionPanelsStayOpenExample">
        <div class="accordion-item">
          <h2 class="accordion-header" id="panelsStayOpen-headingOne">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#panelsStayOpen-collapseOne"
              aria-expanded="true"
              aria-controls="panelsStayOpen-collapseOne"
            >
              <h3>購物車</h3>
            </button>
          </h2>
          <div
            id="panelsStayOpen-collapseOne"
            class="accordion-collapse collapse show"
            aria-labelledby="panelsStayOpen-headingOne"
          >
            <div class="accordion-body">
              <CartItemList />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 猜你喜歡 + 優惠券區塊 -->
    <div class="container">
      <div class="row">
        <div class="col-12 col-md-6">
          <li class="list-group-item d-flex gap-2">
            <GueseeULikeSection />
          </li>
        </div>

        <div class="col-12 col-md-6 d-flex flex-column">
          <CouponSection />
          <div class="mt-3 d-flex justify-content-end gap-2">
            <router-link to="/">
              <button type="button" class="btn custom-purple-outline-btn">繼續購物</button>
            </router-link>
            <button type="button" class="btn custom-purple-btn" @click="proceedToCheckout">前往結帳</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 登入模態框 -->
  <div v-if="showLoginModal" class="login-modal-overlay" @click="closeLoginModal">
    <div class="login-modal-content" @click.stop>
      <!-- 關閉按鈕 -->
      <button type="button" class="btn-close modal-close-btn" @click="closeLoginModal" aria-label="Close">
        <i class="bi bi-x-lg"></i>
      </button>

      <!-- 模態框標題 -->
      <div class="modal-header">
        <h4 class="modal-title">請先登入</h4>
        <p class="modal-subtitle">登入後即可繼續結帳流程</p>
      </div>

      <!-- 直接使用現有的 LoginForm 組件 -->
      <LoginForm 
        :is-modal="true" 
        :redirect-path="'/checkout'"
        @login-success="handleLoginSuccess" 
      />
    </div>
  </div>
</template>
<style scoped lang="css">
.custom-purple-btn {
  background-color: #92559c;
  border-color: #92559c;
  color: white;
  transition: background-color 0.3s ease;
}
.custom-purple-btn:hover {
  background-color: #7b4583;
  border-color: #7b4583;
}

.custom-purple-outline-btn {
  background-color: transparent;
  border: 2px solid #92559c;
  color: #92559c;
  transition: all 0.3s ease;
}
.custom-purple-outline-btn:hover {
  background-color: #92559c;
  color: white;
  border-color: #92559c;
}

.btn-space {
  margin-right: 10px;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  margin-top: 10px;
}

.product-info {
  padding: 1rem;
  text-align: center;
}

.product-tag {
  display: inline-block;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  background-color: #ff8c00;
  color: white;
  border-radius: 999px;
  margin-bottom: 0.5rem;
}

.product-name {
  font-size: 1.1rem;
  color: #4a2e6e;
  font-weight: bold;
}

.product-grid {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.product-card {
  flex: 1 1 30%;
  max-width: 30%;
}

.product-section {
  margin-bottom: 2rem;
}

/* 模態框樣式 */
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.login-modal-content {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  max-width: 450px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
}

.modal-close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.modal-title {
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.modal-subtitle {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

/* 響應式調整 */
@media (max-width: 576px) {
  .login-modal-content {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .modal-title {
    font-size: 1.25rem;
  }
}
</style>
