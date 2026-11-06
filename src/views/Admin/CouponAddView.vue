<script setup>
import { ref, onMounted } from 'vue'
import { createCoupon, getCouponTypes } from '@/services/couponService'
import { useRouter } from 'vue-router'

// 路由與初始值
const router = useRouter()
const newCoupon = ref({
  couponCode: generateRandomCode(),
  coupontypeId: '',
  description: '',
  discountAmount: null,
  minimumPurchase: null,
  expiryDate: ''
})

const couponTypes = ref([])

// 隨機產生優惠碼
function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// 新增優惠券
const addCoupon = async () => {
  // 折扣金額 > 0 驗證
  if (!newCoupon.value.discountAmount || newCoupon.value.discountAmount <= 0) {
    alert('折扣金額必須大於 0！')
    return
  }
  await createCoupon(newCoupon.value)
  alert('新增成功')
  router.push('/Admin/coupons')
}

// 取得優惠券種類
const fetchCouponTypes = async () => {
  const res = await getCouponTypes()
  couponTypes.value = res.data
}

onMounted(fetchCouponTypes)
</script>

<template>
  <form @submit.prevent="addCoupon" class="container">
    <h2 class="my-4">新增優惠券</h2>

    <div class="mb-3">
      <label class="form-label">優惠碼</label>
      <input v-model="newCoupon.couponCode" class="form-control" readonly />
    </div>

    <div class="mb-3">
      <label class="form-label">描述</label>
      <input
        v-model="newCoupon.description"
        class="form-control"
        placeholder="請輸入優惠券描述"
        required
      />
    </div>

    <div class="mb-3">
      <label class="form-label">折扣金額</label>
      <input
        type="number"
        v-model.number="newCoupon.discountAmount"
        class="form-control"
        placeholder="如：50"
        min="1"
        required
      />
    </div>

    <div class="mb-3">
      <label class="form-label">最低消費金額（低消）</label>
      <input
        type="number"
        v-model.number="newCoupon.minimumPurchase"
        class="form-control"
        placeholder="如：500"
        min="0"
        required
      />
    </div>

    <div class="mb-3">
      <label class="form-label">到期日</label>
      <input v-model="newCoupon.expiryDate" type="date" class="form-control" required />
    </div>

    <div class="mb-3">
      <label class="form-label">優惠券種類</label>
      <select v-model.number="newCoupon.coupontypeId" class="form-select" required>
        <option disabled value="">請選擇優惠券種類</option>
        <option v-for="type in couponTypes" :key="type.id" :value="type.id">
          {{ type.name }}
        </option>
      </select>
    </div>

    <button type="submit" class="btn btn-primary">新增</button>
  </form>
</template>
