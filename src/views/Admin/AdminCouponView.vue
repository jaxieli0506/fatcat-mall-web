<script setup>
import { ref, onMounted } from 'vue'
import { getCoupons } from '@/services/couponService'
import { useRouter } from 'vue-router'

const coupons = ref([])
const router = useRouter()

const fetchCoupons = async () => {
  const res = await getCoupons()
  coupons.value = res.data
}

const goToAddPage = () => {
  router.push('/coupon-add')
}

const goToDetailPage = (id) => {
  router.push(`/coupon-detail/${id}`)
}

onMounted(fetchCoupons)
</script>

<template>
  <div class="container">
    <h2>優惠券列表</h2>

    <!-- 前往新增頁面按鈕 -->
    <button @click="goToAddPage" class="btn btn-primary mb-3">➕ 新增優惠券</button>

    <ul class="list-group">
      <li
        v-for="coupon in coupons"
        :key="coupon.couponId"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        <div>
          <strong>{{ coupon.name }}</strong> - {{ coupon.description }}
          <span class="text-muted">
            <template v-if="coupon.coupontypeId === 3">
              （免運費，低消: {{ coupon.minimumPurchase }}）
            </template>
            <template v-else-if="coupon.coupontypeId === 4">
              （{{ coupon.discountAmount }}%打折，低消: {{ coupon.minimumPurchase }}）
            </template>
            <template v-else>
              （折扣: {{ coupon.discountAmount }}，低消: {{ coupon.minimumPurchase }}）
            </template>
          </span>
        </div>
        <button
          @click="goToDetailPage(coupon.couponId)"
          class="btn btn-outline-secondary btn-sm"
        >
          管理
        </button>
      </li>
    </ul>
  </div>
</template>
