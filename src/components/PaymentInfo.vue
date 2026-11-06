<template> 
  <ul class="list-group">
    <li class="list-group-item">
      <h3>付款資料</h3>
    </li>

    <!-- 優惠券選擇 -->
    <li class="list-group-item">
      使用優惠券:
      <select
        class="form-select form-select-sm"
        v-model="checkout.couponId"
        :disabled="usableCoupons.length === 0"
      >
        <!-- 使用者有可用優惠券 -->
        <template v-if="usableCoupons.length > 0">
          <option value="">請選擇優惠券</option>
          <option 
            v-for="coupon in usableCoupons" 
            :key="coupon.couponId"
            :value="coupon.couponId"
            :disabled="coupon.minimumPurchase > 0 && productTotal < coupon.minimumPurchase"
          >
            {{ coupon.description }}
            <template v-if="coupon.minimumPurchase > 0">
              （低消 {{ coupon.minimumPurchase }} 元
              {{ productTotal < coupon.minimumPurchase ? '，未達門檻' : '' }}）
            </template>
          </option>
        </template>

        <!-- 使用者無可用優惠券 -->
        <template v-else>
          <option value="" selected>無可使用的優惠券</option>
        </template>
      </select>

      <!-- 提示訊息 -->
      <div v-if="couponMessage" class="text-danger mt-1">
        {{ couponMessage }}
      </div>
    </li>

    <!-- 金額明細 -->
    <li class="list-group-item">
      <div>
        商品總金額: {{ cartStore.total }} 元<br />
        運費: {{ checkout.shippingFee }} 元<br />
        折扣金額: -{{ checkout.discount }} 元
        <hr />
        實付金額: <strong>{{ checkout.total }} 元</strong>
      </div>
    </li>
  </ul>
</template>


<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import axios from 'axios'
import { useCheckoutStore } from '@/stores/checkout'
import { useCartStore } from '@/stores/cart'

const checkout = useCheckoutStore()
const cartStore = useCartStore()

const productTotal = computed(() => cartStore.total)
const couponOptions = ref([])        // 從 API 取得的所有優惠券
const couponMessage = ref('')        // 優惠券錯誤提示
const claimedCouponIds = ref([])     // 從 localStorage 讀取的已領取優惠券ID列表

const usableCoupons = computed(() =>
  couponOptions.value.filter(coupon => claimedCouponIds.value.includes(coupon.couponId))
)


// ✅ 過濾出 minimumPurchase > 0 的優惠券
const validCouponOptions = computed(() =>
  couponOptions.value.filter(c => c.minimumPurchase > 0)
)

const LOCAL_STORAGE_KEY = 'claimedCoupons'

function loadClaimedCoupons() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (stored) {
    try {
      claimedCouponIds.value = JSON.parse(stored)
    } catch (e) {
      console.warn('解析 localStorage 領取優惠券失敗:', e)
      claimedCouponIds.value = []
    }
  }
}

onMounted(async () => {
  loadClaimedCoupons()

  try {
    const res = await axios.get('https://localhost:7017/api/Coupons')
    const now = new Date()
    couponOptions.value = res.data.filter(c => new Date(c.expirydate) >= now)

    console.log('✅ Coupon API 成功（未過期的）:', couponOptions.value)
    recalculateTotal()
  } catch (error) {
    console.error('❌ 載入優惠券失敗:', error)
  }
})

// ✅ 監看優惠券、運費、商品金額
watch(() => checkout.couponId, recalculateTotal)
watch(() => checkout.shippingFee, recalculateTotal)

// ✅ 若商品金額變動導致不符門檻 → 自動清除優惠券 + 顯示提示
watch(productTotal, () => {
  const selected = couponOptions.value.find(c => c.couponId === Number(checkout.couponId))
  if (selected && selected.minimumPurchase > productTotal.value) {
    couponMessage.value = `已自動取消優惠券「${selected.description}」，因金額未達 NT$${selected.minimumPurchase} 門檻`
       // ✅ 加入 alert 提示
    alert(`您使用的優惠券「${selected.description}」已被取消，因為商品金額未達 NT$${selected.minimumPurchase} 元的門檻`)
    checkout.couponId = ''
  } else {
    couponMessage.value = ''
  }
  recalculateTotal()
})

// ✅ 計算折扣與總金額
function recalculateTotal() {
  const selectedCoupon = couponOptions.value.find(c => c.couponId === Number(checkout.couponId))
  couponMessage.value = '' // 清空錯誤提示
  checkout.discount = 0

  if (!selectedCoupon) {
    checkout.total = productTotal.value + checkout.shippingFee
    return
  }

  if (selectedCoupon.minimumPurchase && productTotal.value < selectedCoupon.minimumPurchase) {
    checkout.total = productTotal.value + checkout.shippingFee
    return
  }

  if (selectedCoupon.coupontypeId === 3) {
    checkout.discount = checkout.shippingFee
  } else if (selectedCoupon.coupontypeId === 4) {
    const discountRate = selectedCoupon.discountAmount / 100
    checkout.discount = Math.round(productTotal.value * (1 - discountRate))
  } else {
    checkout.discount = selectedCoupon.discountAmount ?? 0
  }

  checkout.total = productTotal.value + checkout.shippingFee - checkout.discount
}

</script>
