<!-- src/views/CouponDetailView.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCouponById, updateCoupon, deleteCoupon } from '@/services/couponService'
import { getCouponTypes } from '@/services/couponService' // 確保你有這個方法

const route = useRoute()
const router = useRouter()
const couponId = route.params.id

const coupon = ref({
  couponId: '',
  coupontypeId: '',
  name: '',
  description: '',
  discountAmount: 0,
  expiryDate: ''
})

const fetchCoupon = async () => {
  const res = await getCouponById(couponId)
  const data = res.data

  // 保險處理日期格式
  if (data.expiryDate) {
    const date = new Date(data.expiryDate)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    data.expiryDate = `${yyyy}-${mm}-${dd}`
  }

  coupon.value = data
}

const couponTypes = ref([])



const updateCurrentCoupon = async () => {
  await updateCoupon(couponId, coupon.value)
  alert('已成功修改')
  router.push('/Admin/coupons') // 修改這行
}

const deleteCurrentCoupon = async () => {
  if (confirm('確定要刪除這張優惠券嗎？')) {
    await deleteCoupon(couponId)
    alert('已刪除')
    router.push('/Admin/coupons') // 修改這行
  }
}

// 取得優惠券種類
const fetchCouponTypes = async () => {
  const res = await getCouponTypes()
  couponTypes.value = res.data
}

onMounted(fetchCoupon)
onMounted(fetchCouponTypes)
</script>

<template>
  <div class="container">
    <h2>優惠券詳細資訊</h2>


    <div class="mb-3">
      <label class="form-label">描述</label>
      <input v-model="coupon.description" class="form-control" />
    </div>

    <div class="mb-3">
      <label class="form-label">折扣金額</label>
      <input type="number" v-model.number="coupon.discountAmount" class="form-control" />
    </div>

    <div class="mb-3">
      <label class="form-label">到期日</label>
      <input type="date" v-model="coupon.expiryDate" class="form-control" />
    </div>

     <!-- ✅ 修改：用 select 顯示優惠券種類 -->
    <div class="mb-3">
      <label class="form-label">優惠券種類</label>
      <select v-model.number="coupon.coupontypeId" class="form-select">
        <option v-for="type in couponTypes" :key="type.coupontypeId" :value="type.coupontypeId">
        {{ type.name }}
        </option>
      </select>
    </div>
    
    <!-- 加入低消欄位 minimumPurchase -->
    <div class="mb-3">
    <label class="form-label">最低消費金額（低消）</label>
    <input type="number" v-model.number="coupon.minimumPurchase" class="form-control" />
    </div>
    <button class="btn btn-success me-2" @click="updateCurrentCoupon">💾 儲存修改</button>
    <button class="btn btn-danger" @click="deleteCurrentCoupon">🗑️ 刪除優惠券</button>
  </div>
</template>
