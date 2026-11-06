<template>
  <div class="row">
    <!-- 個人資料 -->
    <div class="col-12 col-md-4 mb-3">
      <ul class="list-group">
        <li class="list-group-item"><h3>個人資料</h3></li>
        <li class="list-group-item">姓名：<div>{{ checkout.name }}</div></li>
        <li class="list-group-item">電話：<div>{{ checkout.phone }}</div></li>
        <li class="list-group-item">Email：<div>{{ checkout.email }}</div></li>
      </ul>
    </div>

    <!-- 送貨資料 -->
    <div class="col-12 col-md-4 mb-3">
      <ul class="list-group">
        <li class="list-group-item"><h3>送貨資料</h3></li>
        <li class="list-group-item">送貨方式：
          <div>{{ addressType === 1 ? '超商取貨' : '宅配' }}</div>
        </li>
        
        <!-- 顯示收件人資訊 -->
        <li class="list-group-item">收件人姓名：
          <div>{{ checkout.recipientName || '未填寫' }}</div>
        </li>
        <li class="list-group-item">收件人電話：
          <div>{{ checkout.recipientPhone || '未填寫' }}</div>
        </li>
        
        <!-- 根據地址類型顯示不同資訊 => addressType === 1 是超商取貨, 其他則是宅配,參考shippingForm,vue 第81行 by jj) -->
        <!-- 如果是超商取貨 -->
        <li class="list-group-item" v-if="checkout.addressType === 1 && checkout.recipientAddress">
          取貨門市：
          <div>{{ checkout.storeName }}({{ checkout.recipientAddress }})</div>
        </li>
        <!-- 如果是宅配 -->
        <li class="list-group-item" v-else-if="checkout.recipientAddress">
          收件地址：
          <div>{{ checkout.recipientAddress }}</div>
        </li>
      </ul>
    </div>

    <!-- 付款資料 -->
    <div class="col-12 col-md-4 mb-3">
      <ul class="list-group">
        <li class="list-group-item"><h3>付款資料</h3></li>
        <li class="list-group-item">使用優惠券：
          <div>{{ selectedCoupon?.description || '未使用' }}</div>
        </li>
        <li class="list-group-item">
            訂單總金額：{{ productTotal }} 元
          <div>
            運費：{{ checkout.shippingFee }} 元<br />
            折扣金額：-{{ checkout.discount }} 元
            <hr />
            實付金額：<strong>{{ checkout.total }} 元</strong>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useCheckoutStore } from '@/stores/checkout'
import { useOrderStore } from '@/stores/order'

const checkout = useCheckoutStore()

const couponOptions = ref([])
const shippingOptions = ref([])
const orderStore = useOrderStore()

const productTotal = computed(() =>
  orderStore.latestOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

// 載入對應資料名稱
onMounted(async () => {
  try {
    const [couponRes, shippingRes] = await Promise.all([
      axios.get('https://localhost:7017/api/Coupons'),
      axios.get('https://localhost:7017/api/Shippings')
    ])
    couponOptions.value = couponRes.data
    shippingOptions.value = shippingRes.data

    checkout.productTotal = productTotal.value

    recalculateTotal()
  } catch (error) {
    console.error('❌ 載入優惠券或送貨方式失敗:', error)
  }
})

// 比對對應名稱
const selectedCoupon = computed(() =>
  couponOptions.value.find(c => c.couponId === checkout.couponId)
)
const selectedShipping = computed(() =>
  shippingOptions.value.find(s => s.shippingId === checkout.shippingId)
)

// 重新計算總金額
const recalculateTotal = () => {
  checkout.total = productTotal.value + checkout.shippingFee - checkout.discount
}
</script>
