<script setup>
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { ref } from 'vue'
import api from '@/services/jjapi.js' 

import CartItemList from '@/components/CartItemList.vue'
// import MemberInfoForm from '@/components/MemberInfoForm.vue'  移除memberInform by jj
import ShippingForm from '@/components/ShippingForm.vue'
import PaymentInfo from '@/components/PaymentInfo.vue'
import LoginForm from '@/components/LoginForm.vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckoutStore } from '@/stores/checkout'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const checkoutStore = useCheckoutStore()
const orderStore = useOrderStore()

const shippingFormRef = ref()
const isSubmitting = ref(false)
const checkout = useCheckoutStore()
const authStore = useAuthStore()
const cartStore = useCartStore()

// 添加登入路由守衛 by jj
// 登入模態框狀態
const showLoginModal = ref(false)

// 初始化結帳資料
onMounted(()=>{
  // 設定預設運費 = 60
  checkout.shippingFee = 60
  // 設定商品總金額
  checkout.productTotal = cartStore.total
})

async function handleCheckout() {
  console.log('結帳時 cartItemIds:', cartStore.cartItemIds)
  if (!cartStore.cartItemIds.length || cartStore.cartItemIds.some(id => id === undefined)) {
    alert('訂單項目ID缺失，請重新整理購物車頁面後再試')
    router.push('/cart')
    return
  }

  const isValid = shippingFormRef.value?.validateShippingInfo?.()
  if (!isValid) return

  if (!authStore.isAuthenticated) {
    // 未登入，顯示登入模態框
    showLoginModal.value = true
    return
  }

  isSubmitting.value = true

  try {
    orderStore.setOrderItems(JSON.parse(JSON.stringify(cartStore.items)))

    // Step 1: 新增訂單
    const orderPayload = {
      userId: authStore.user.userId,
      orderdate: new Date().toISOString(),
      location: checkoutStore.recipientAddress || '未填寫地址',
      couponId: checkoutStore.couponId || null,
      totalAmount: cartStore.total,
      payableAmount: checkoutStore.total,
      orderStatusId: 1,
      shippingId: checkoutStore.shippingId || 1,
      shippingStatusId: checkoutStore.shippingStatusId || 1,
      supportpaymentMethodId: checkoutStore.paymentMethodId || null
    }

    const orderRes = await api.post('/Orders', orderPayload)
    const orderId = orderRes.data.orderId
    if (!orderId) throw new Error('未取得 orderId')

    // Step 2: 新增訂單詳情
    const orderDetails = cartStore.items.map((item, index) => ({
      OrderId: orderId,
      ItemId: cartStore.cartItemIds?.[index] ?? -1,
      ProductName: item.name ?? '',
      Quantity: item.quantity,
      Unitprice: item.price
    }))
    await api.post('/OrderDetails/batch', orderDetails)

    // Step 3: 呼叫後端產生綠界付款表單（使用測試環境）
    const paymentRes = await api.post('/ecpay', {
        orderId,
        payableAmount: checkoutStore.total
      })


    // Step 4: 寫入 HTML 並跳轉（_self 表示本頁跳轉）
    const newWindow = window.open('', '_self')
    newWindow.document.write(paymentRes.data)

    // Step 5: 清空購物車（可延後到付款完成頁再清空）
    cartStore.clearCart()
  } catch (err) {
    console.error('❌ 訂單送出失敗', err.response?.data || err)
    alert('訂單送出失敗，請查看 Console 錯誤')
    console.table(err.response?.data?.errors)
  } finally {
    isSubmitting.value = false
  }
}

// 處理登入成功
function handleLoginSuccess() {
  // 登入成功後，關閉登入模態框
  showLoginModal.value = false
  // 重新執行結帳流程
  handleCheckout()
}

// 關閉登入模態框
function closeLoginModal() {
  showLoginModal.value = false
}
</script>

<template>
  <div class="page-content-wrapper pt-5 pb-5">
    <div class="container mb-2">
      <h2>訂單結帳</h2>

      <div class="accordion col-lg-10 container mb-5" id="accordionPanelsStayOpenExample">
        <div class="accordion-item">
          <h2 class="accordion-header" id="panelsStayOpen-headingOne">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#panelsStayOpen-collapseOne"
            >
              <h3>購物車</h3>
            </button>
          </h2>
          <div id="panelsStayOpen-collapseOne" class="accordion-collapse collapse show">
            <div class="accordion-body">
              <CartItemList />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row">
        <!-- 改為直接將 shippingForm 置左, paymentInfo 置右 , MemberInfoForm 刪除by jj-->
        <!-- <div class="col-md-6"><MemberInfoForm /></div> 註解掉 by jj -->
        <div class="col-md-6"><ShippingForm ref="shippingFormRef" /></div>
        <div class="col-md-6"><PaymentInfo /></div>
        <div class="mt-3 text-end">
          <router-link to="/cart">
            <button class="btn custom-purple-outline-btn btn-space">購物車確認</button>
          </router-link>
          <button class="btn custom-purple-btn" @click="handleCheckout" :disabled="isSubmitting">
            {{ isSubmitting ? '處理中...' : '確定結帳' }}
          </button>
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

<style scoped>
.custom-purple-btn {
  background-color: #92559c;
  border-color: #92559c;
  color: white;
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
