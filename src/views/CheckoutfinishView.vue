<script setup>
import { onMounted, ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { useCheckoutStore } from '@/stores/checkout'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/jjapi.js'

import OrderSummary from '@/components/OrderSummary.vue'
import OrderItemList from '@/components/OrderItemList.vue'

const cartStore = useCartStore()
const orderStore = useOrderStore()
const checkoutStore = useCheckoutStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const orderId = computed(() => Number(route.query.orderId))

// 訂單相關資料
const order = ref(null)
const orderDetails = ref([])
const couponInfo = ref(null)
const shippingInfo = ref(null)
const isLoading = ref(true)

// 計算折扣金額
const discountAmount = computed(() => {
  if (!order.value || !shippingInfo.value) return 0
  const totalAmount = order.value.totalAmount || 0
  const shippingFee = shippingInfo.value.shippingFee || 0
  const payableAmount = order.value.payableAmount || 0
  return Math.max(0, totalAmount + shippingFee - payableAmount)
})

// 商品總金額
const productTotal = computed(() => order.value?.totalAmount || 0)

// 運費
const shippingFee = computed(() => shippingInfo.value?.shippingFee || 0)

// 實付金額
const finalAmount = computed(() => order.value?.payableAmount || 0)

onMounted(async () => {
  if (!orderId.value) {
    console.error('未提供訂單ID')
    return
  }

  try {
    isLoading.value = true
    
    // 確保認證狀態已初始化（從 ECPay 回來後可能需要重新載入）
    authStore.initializeAuth()
    
    // 並行請求所有必要資料
    const [orderRes, orderDetailsRes, couponsRes, shippingsRes] = await Promise.all([
      api.get(`/Orders/${orderId.value}`),
      api.get('/OrderDetails', { params: { orderId: orderId.value } }),
      api.get('/Coupons'),
      api.get('/Shippings')
    ])

    // 設定訂單資料
    order.value = orderRes.data
    orderDetails.value = orderDetailsRes.data

    // 設定運送資料
    if (order.value.shippingId) {
      shippingInfo.value = shippingsRes.data.find(s => s.shippingId === order.value.shippingId)
    }

    // 設定優惠券資料
    if (order.value.couponId) {
      couponInfo.value = couponsRes.data.find(c => c.couponId === order.value.couponId)
    }

    // 恢復結帳資料到 checkout store（如果需要在其他組件中使用）
    if (order.value) {
      checkoutStore.productTotal = productTotal.value
      checkoutStore.shippingFee = shippingFee.value
      checkoutStore.discount = discountAmount.value
      checkoutStore.total = finalAmount.value
      checkoutStore.couponId = order.value.couponId
    }

    // 設定訂單項目到 order store
    orderStore.latestOrderItems.value = orderDetails.value

    console.log('✅ 訂單資料載入完成:', {
      order: order.value,
      orderDetails: orderDetails.value,
      couponInfo: couponInfo.value,
      shippingInfo: shippingInfo.value,
      discountAmount: discountAmount.value
    })

  } catch (error) {
    console.error('❌ 載入訂單資料失敗:', error)
    alert('載入訂單資料失敗，請稍後再試')
  } finally {
    isLoading.value = false
  }
})

const goToMyOrders = () => {
  cartStore.clearCart()
  router.push('/myorders')
}
</script>

<template>
  <div class="page-content-wrapper pt-5 pb-5">
    <div class="container mb-2">
      <h2>結帳完成</h2>

      <!-- 載入狀態 -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <p class="mt-2">正在載入訂單資料...</p>
      </div>

      <!-- 訂單內容 -->
      <div v-else>
        <!-- 訂單資訊卡片 -->
        <div class="card mb-4">
          <div class="card-header">
            <h4 class="mb-0">
              <i class="bi bi-check-circle-fill text-success me-2"></i>
              訂單編號：{{ orderId }}
            </h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h6><i class="bi bi-calendar3 me-2"></i>訂單日期</h6>
                <p>{{ order ? new Date(order.orderdate).toLocaleString('zh-TW') : '' }}</p>
              </div>
              <div class="col-md-6">
                <h6><i class="bi bi-geo-alt me-2"></i>收件地址</h6>
                <p>{{ order?.location || '未提供' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 商品列表 -->
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
                <h3>商品列表</h3>
              </button>
            </h2>
            <div
              id="panelsStayOpen-collapseOne"
              class="accordion-collapse collapse show"
              aria-labelledby="panelsStayOpen-headingOne"
            >
              <div class="accordion-body">
                <OrderItemList :order-id="Number(orderId)" />
              </div>
            </div>
          </div>
        </div>

        <!-- 付款明細 -->
        <div class="card mb-4">
          <div class="card-header">
            <h4 class="mb-0">
              <i class="bi bi-receipt me-2"></i>
              付款明細
            </h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <table class="table table-borderless">
                  <tbody>
                    <tr>
                      <td>商品總金額：</td>
                      <td class="text-end">NT$ {{ productTotal.toLocaleString() }}</td>
                    </tr>
                    <tr>
                      <td>
                        運費：
                        <small v-if="shippingInfo" class="text-muted">({{ shippingInfo.name }})</small>
                      </td>
                      <td class="text-end">NT$ {{ shippingFee.toLocaleString() }}</td>
                    </tr>
                    <tr v-if="discountAmount > 0">
                      <td>
                        折扣：
                        <small v-if="couponInfo" class="text-muted">({{ couponInfo.description }})</small>
                      </td>
                      <td class="text-end text-success">-NT$ {{ discountAmount.toLocaleString() }}</td>
                    </tr>
                    <tr class="border-top">
                      <td><strong>實付金額：</strong></td>
                      <td class="text-end"><strong class="text-primary fs-5">NT$ {{ finalAmount.toLocaleString() }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="col-md-6">
                <div class="alert alert-success">
                  <i class="bi bi-check-circle me-2"></i>
                  <strong>付款成功！</strong><br>
                  您的訂單已成功建立，我們將盡快為您處理。
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 舊的 OrderSummary 組件，如果還需要的話 -->
        <!-- <OrderSummary /> -->

        <button type="button" class="btn custom-purple-btn float-end" @click="goToMyOrders">
          我的訂單
        </button>
      </div>
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
</style>
