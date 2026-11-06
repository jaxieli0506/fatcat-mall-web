<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/jjapi.js'  // 改用配置好的 api 實例
import { useRoute } from 'vue-router'


const route = useRoute()

const props = defineProps({
  orderId: {
    type: Number,
    required: true
  }
})

const currentOrderId = props.orderId

const order = ref(null)
const orderDetails = ref([])
const couponOptions = ref([])
const shippingOptions = ref([])
const cartItems = ref([])
const products = ref([])
const productImages = ref([])
const orderStatuses = ref([])
const shippingStatuses = ref([])



// 用戶個人資料（從訂單API獲取） 
const userInfo = computed(() => ({
  name: order.value?.userName || '',
  email: order.value?.userEmail || '',
  phone: order.value?.userPhone || ''
}))

// 收貨資料（從訂單API獲取）
const recipientInfo = computed(() => ({
  name: order.value?.recipientName || '',
  phone: order.value?.recipientPhone || '',
  address: order.value?.recipientAddress || '',
  storeName: order.value?.storeName || ''
}))

const matchedShipping = computed(() =>
  shippingOptions.value.find(s => s.shippingId === order.value?.shippingId)
)

const matchedCoupon = computed(() =>
  couponOptions.value.find(c => c.couponId === order.value?.couponId)
)

const matchedOrderStatus = computed(() =>
  orderStatuses.value.find(s => s.orderStatusId === order.value?.orderStatusId)
)

const matchedShippingStatus = computed(() =>
  shippingStatuses.value.find(s => s.shippingStatusId === order.value?.shippingStatusId)
)

// 計算折扣金額
const discountAmount = computed(() => {
  if (!order.value) return 0
  const totalAmount = order.value.totalAmount || 0
  const shippingFee = matchedShipping.value?.shippingFee || 0
  const payableAmount = order.value.payableAmount || 0
  return totalAmount + shippingFee - payableAmount
})

// 彙整顯示的商品資訊
const detailedItems = computed(() => {
  return cartItems.value.map(cart => {
    const product = products.value.find(p => p.productsId === cart.productsId) || {}
    const image = productImages.value.find(img => img.productId === cart.productsId && img.isMain === 1)

    return {
      itemId: cart.itemId,
      name: product.name || '未命名',
      price: cart.unitprice,
      quantity: cart.quantity,
      image: image?.imageUrl || 'default.jpg'
    }
  })
})

const productTotal = computed(() =>
  detailedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)



onMounted(async () => {
  try {
    const [couponRes, shippingRes, productRes, imageRes, orderRes, orderStatusRes, shippingStatusRes] = await Promise.all([
      api.get('/Coupons'),                              // 改用 api
      api.get('/Shippings'),                            // 改用 api
      api.get('/Products'),                             // 改用 api
      api.get('/ProductImages'),                        // 改用 api
      api.get(`/Orders/${currentOrderId}`),             // 改用 api
      api.get('/OrderStatus'),                          // 改用 api
      api.get('/ShippingStatus')                        // 改用 api
    ])

    couponOptions.value = couponRes.data
    shippingOptions.value = shippingRes.data
    products.value = productRes.data
    productImages.value = imageRes.data
    orderStatuses.value = orderStatusRes.data
    shippingStatuses.value = shippingStatusRes.data
    order.value = orderRes.data

    if (!order.value) {
      console.warn(`找不到 orderId=${currentOrderId} 的訂單`)
      return
    }

    // 用 orderId 取得購物車項目
    const cartRes = await api.get(`/ShoppingCartItems?orderId=${order.value.orderId}`)  // 改用 api
    cartItems.value = cartRes.data

    // 取得該訂單的訂單明細
    const orderDetailsRes = await api.get(`/OrderDetails?orderId=${order.value.orderId}`)  // 改用 api
    orderDetails.value = orderDetailsRes.data

  } catch (err) {
    console.error('❌ 載入訂單資料失敗:', err)
  }
})
</script>

<template>
  <div class="row">
    <!-- 個人資料 -->
    <div class="col-12 col-md-4 mb-3">
      <ul class="list-group">
        <li class="list-group-item"><h3>個人資料</h3></li>
        <li class="list-group-item">姓名：<div>{{ userInfo.name }}</div></li>
        <li class="list-group-item">電話：<div>{{ userInfo.phone }}</div></li>
        <li class="list-group-item">Email：<div>{{ userInfo.email }}</div></li>
      </ul>
    </div>

    <!-- 送貨資料 -->
    <div class="col-12 col-md-4 mb-3">
      <ul class="list-group">
        <li class="list-group-item"><h3>送貨資料</h3></li>
        <li class="list-group-item">
          訂單狀態：<div>{{ matchedOrderStatus?.description || '無資料' }}</div>
        </li>
        <li class="list-group-item">
          物流狀態：<div>{{ matchedShippingStatus?.description || '無資料' }}</div>
        </li>
        <li class="list-group-item">送貨方式：
          <div>{{ matchedShipping?.name || '未選擇' }}</div>
        </li>
        <li class="list-group-item" v-if="matchedShipping?.shippingTypeId === 1">
          收件地址：
          <div>{{ recipientInfo.address || '未填寫' }}</div>
        </li>
        <li class="list-group-item" v-else-if="matchedShipping?.shippingTypeId === 2">
          取貨門市：
          <div>{{ recipientInfo.storeName || '未選擇' }}</div>
        </li>
        <li class="list-group-item">收件人姓名：<div>{{ recipientInfo.name }}</div></li>
        <li class="list-group-item">收件人電話：<div>{{ recipientInfo.phone }}</div></li>
      </ul>
    </div>

    <!-- 付款資料 -->
    <div class="col-12 col-md-4 mb-3">
      <ul class="list-group">
        <li class="list-group-item"><h3>付款資料</h3></li>
        <li class="list-group-item">使用優惠券：
          <div>{{ matchedCoupon?.description || '未使用' }}</div>
        </li>
        <li class="list-group-item">
          訂單總金額：{{ order?.totalAmount ?? '—' }} 元
          <div>
            運費：{{ matchedShipping?.shippingFee ?? '—' }} 元<br />
            折扣金額：-{{ discountAmount }} 元
            <hr />
            實付金額：<strong>{{ order?.payableAmount ?? '—' }} 元</strong>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
