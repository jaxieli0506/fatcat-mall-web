<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const coupons = ref([])
const loading = ref(false)
const error = ref(null)

const cartTotal = computed(() => cartStore.total) // 購物車總金額
// 新增：已領取的優惠券ID清單（localStorage）
const claimedCouponIds = ref([])

const LOCAL_STORAGE_KEY = 'claimedCoupons'

function loadClaimedCoupons() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (stored) {
    try {
      claimedCouponIds.value = JSON.parse(stored)
    } catch (e) {
      console.warn('解析 localStorage 領取優惠券失敗:', e)
    }
  }
}

onMounted(() => {
  loadClaimedCoupons()
  fetchCoupons()
})

// 可用優惠：購物車金額 >= 優惠券門檻金額
const availableCoupons = computed(() =>
  coupons.value.filter(c => cartTotal.value >= c.minimumPurchase)
)

// 還差多少就能用的優惠券
const upcomingCoupons = computed(() =>
  coupons.value
    .filter(c => cartTotal.value < c.minimumPurchase)
    .map(c => ({
      ...c,
      remaining: c.minimumPurchase - cartTotal.value,
    }))
)

// 抓取優惠券資料
async function fetchCoupons() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/Coupons')
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const data = await res.json()

    const now = new Date()

    // ✅ 過濾未過期優惠券（expirydate >= 今天）
    coupons.value = data.filter(c => new Date(c.expirydate) >= now)
  } catch (err) {
    error.value = err.message || '取得優惠券資料失敗'
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  fetchCoupons()
})
</script>

<template> 
  <ul class="list-group mb-3">
    <li class="list-group-item">
      <h3>優惠&促銷</h3>
    </li>

    <!-- ✅ 可用優惠券 --> 
    <li class="list-group-item">
      <strong>可用優惠券</strong>
      <div v-if="loading">讀取中...</div>
      <div v-else-if="error" class="text-danger">錯誤：{{ error }}</div>
      <div v-else>
        <div v-if="availableCoupons.length === 0">目前無可使用的優惠券</div>
        <ul v-else>
          <li v-for="coupon in availableCoupons" :key="coupon.couponId">
            {{ coupon.description }}
            <span v-if="coupon.coupontypeId === 3">
              （運費：免費）
            </span>
            <span v-else-if="coupon.coupontypeId === 4">
              （ {{ coupon.discountAmount }} %折扣）
            </span>
            <span v-else>
              （折 {{ coupon.discountAmount }} 元）
            </span>
            <!-- 額外標示 -->
            <span v-if="!claimedCouponIds.includes(coupon.couponId)" class="text-danger ms-2">(未領取)</span>
          </li>
        </ul>
      </div>
    </li>

    <!-- 🔜 即將可使用的優惠券 -->
    <li class="list-group-item">
      <strong>優惠促銷</strong>
      <div v-if="!loading && upcomingCoupons.length > 0">
        <ul>
          <li v-for="coupon in upcomingCoupons" :key="coupon.couponId">
            再消費 <strong>NT$ {{ coupon.remaining }}</strong> 可享：
            {{ coupon.description }}
            <span v-if="coupon.coupontypeId === 3">
              （滿 {{ coupon.minimumPurchase }} 元 運費：免費）
            </span>
            <span v-else-if="coupon.coupontypeId === 4">
              （ {{ coupon.discountAmount }} %折扣）
            </span>
            <span v-else-if="coupon.minimumPurchase > 0">
              （滿 {{ coupon.minimumPurchase }} 元折 {{ coupon.discountAmount }} 元）
            </span>
            <span v-else>
              （折 {{ coupon.discountAmount }} 元）
            </span>

            <!-- 額外標示 -->
            <span v-if="!claimedCouponIds.includes(coupon.couponId)" class="text-danger ms-2">(未領取)</span>
          </li>
        </ul>
      </div>
      <div v-else-if="!loading && upcomingCoupons.length === 0">
        所有優惠條件已符合 🎉
      </div>
    </li>
  </ul>
</template>
