<script setup>
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { onMounted, onUnmounted, ref,watch, computed } from 'vue'
import * as bootstrap from 'bootstrap'
import LoginForm from './LoginForm.vue'
// 添加登入路由守衛 by jj

const cartStore = useCartStore()
const authStore = useAuthStore()

// 計算屬性：確保響應式更新
const cartItems = computed(() => cartStore.items)
const cartTotal = computed(() => cartStore.total)

let offcanvasInstance = null

// 登入模態框狀態
const showLoginModal = ref(false)

// 監聽購物車變化，當有新商品加入時立即載入圖片
watch(
  () => cartStore.items.length,
  async (newLength, oldLength) => {
    // 當商品數量增加時，為新加入的商品載入圖片
    if (newLength > oldLength) {
      console.log('檢測到新商品加入購物車，開始載入圖片...')
      await cartStore.loadImagesForCartItems()
    }
  },
  { immediate: false }
)

// 監聽個別商品變化，確保圖片正確載入
watch(
  () => cartStore.items.map(item => ({ id: item.id, image: item.image })),
  async (newItems, oldItems) => {
    // 檢查是否有商品圖片需要更新
    const needsImageUpdate = newItems.some((newItem, index) => {
      const oldItem = oldItems?.[index]
      return newItem && (!newItem.image || newItem.image === '/ProductImages/default.jpg')
    })
    
    if (needsImageUpdate) {
      console.log('檢測到商品圖片需要更新...')
      await cartStore.loadImagesForCartItems()
    }
  },
  { deep: true }
)

// 這段可選，確保 offcanvas 正確初始化（只初始化一次）
onMounted(() => {
  const el = document.getElementById('offcanvasExample')
  if (el) {
    offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(el)
  }

  // ✅ 載入購物車商品圖片

  // ✅ 初始載入購物車商品圖片
  cartStore.loadImagesForCartItems()
})

onUnmounted(() => {
  // 清除殘留 backdrop（進一步安全保險）
  document.querySelectorAll('.offcanvas-backdrop').forEach(el => el.remove())
  document.body.classList.remove('offcanvas-backdrop')
  document.body.style.overflow = '' // 有時 bootstrap 加 overflow:hidden 也沒清掉
})

// 正確關閉 Offcanvas 並清理 backdrop
function closeOffcanvas() {
  const el = document.getElementById('offcanvasExample')
  const instance = bootstrap.Offcanvas.getInstance(el)
  if (instance) instance.hide()

  // 安全移除殘留
  document.querySelectorAll('.offcanvas-backdrop').forEach(el => el.remove())
  document.body.classList.remove('offcanvas-backdrop')
  document.body.style.overflow = ''
}

// 處理結帳按鈕點擊
function handleCheckoutClick() {
  // 檢查用戶是否已登入
  if (!authStore.isAuthenticated) {
    // 未登入，顯示登入模態框
    showLoginModal.value = true
    return
  }
  
  // 已登入，關閉 offcanvas 並導向購物車頁面
  closeOffcanvas()
  window.location.href = '/cart'
}

// 處理登入成功
function handleLoginSuccess() {
  // 登入成功後，關閉登入模態框並導向購物車頁面
  showLoginModal.value = false
  closeOffcanvas()
  window.location.href = '/cart'
}

// 關閉登入模態框
function closeLoginModal() {
  showLoginModal.value = false
}

const onQtyInput = debounce((event, item) => {
  let value = parseInt(event.target.value)

  // 非數字或小於1就自動還原
  if (isNaN(value) || value < 1) {
    event.target.value = item.quantity
    return
  }

  cartStore.setQty(item, value)
}, 300)

function debounce(fn, delay = 300) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}
</script>

<template>
  <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="offcanvasExampleLabel">購物車</h5>
      <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>

    <div class="offcanvas-body">
      <template v-if="cartItems.length">
        <div class="list-group mb-3">
          <div
            class="list-group-item d-flex align-items-center gap-3"
            v-for="item in cartItems"
            :key="item.id"
          >
            <img
              :src="item.image"
              alt="商品圖"
              class="rounded"
              style="width: 60px; height: 60px; object-fit: cover;"
            />
            <div class="flex-grow-1">
              <h6 class="mb-1">{{ item.name }}</h6>
              <div>單價：${{ item.price }}</div>
              <div class="d-flex align-items-center mt-1">
                <button class="btn btn-outline-secondary btn-sm" @click="cartStore.decreaseQty(item)">-</button>
                
                <input
                  type="number"
                  class="form-control form-control-sm mx-2"
                  style="width: 60px;"
                  :value="item.quantity"
                  @input="onQtyInput($event, item)"
                  min="1"
                />

                <button class="btn btn-outline-secondary btn-sm" @click="cartStore.increaseQty(item)">+</button>
              </div>
            </div>
            <button class="btn btn-sm btn-danger" @click="cartStore.removeItem(item.id)">
              <i class="fa-solid fa-trash-can"></i>移除
            </button>
          </div>
        </div>

        <div class="fw-bold text-end mb-3">
          總金額：<span class="text-danger">${{ cartTotal }}</span>
        </div>

        <!-- 修改結帳按鈕，添加路由守衛 -->
        <button class="btn custom-purple-btn w-100" @click="handleCheckoutClick">立刻結帳</button>
      </template>

      <template v-else>
        <div class="text-center">購物車內尚無商品</div>
        <router-link to="/" class="btn custom-purple-outline-btn mt-3 w-100" @click="closeOffcanvas">前往購物</router-link>
      </template>
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
        :redirect-path="'/cart'"
        @login-success="handleLoginSuccess" 
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.custom-purple-btn {
  background-color: #92559c;
  border-color: #92559c;
  color: white;
}

.custom-purple-btn:hover {
  background-color: #7b4583; /* 可選的 hover 色 */
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
  margin-right: 10px; /* 可以依需求微調距離 */
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