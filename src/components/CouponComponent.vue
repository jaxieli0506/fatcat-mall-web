<script setup>
import { ref, onMounted, computed } from 'vue';

const coupons = ref([]);
const shippings = ref([]);
const message = ref('');
const claimedCouponIds = ref([]);
const LOCAL_STORAGE_KEY = 'claimedCoupons'

const saveClaimedCoupons = () => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(claimedCouponIds.value))
}
// 計算最小與最大運費
const minShippingFee = computed(() => {
  if (shippings.value.length === 0) return 0;
  return Math.min(...shippings.value.map(s => s.shippingFee));
});
const maxShippingFee = computed(() => {
  if (shippings.value.length === 0) return 0;
  return Math.max(...shippings.value.map(s => s.shippingFee));
});
 
onMounted(async () => {
  // 先讀取 localStorage 裡的優惠券領取資料
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (stored) {
    try {
      claimedCouponIds.value = JSON.parse(stored)
    } catch (e) {
      console.warn('解析 localStorage 領取優惠券失敗:', e)
    }
  }

  // 你原本的 fetch 優惠券 & 運費資料程式碼...
  try { 
    const res = await fetch('https://localhost:7017/api/Coupons'); 
    if (!res.ok) throw new Error('載入優惠券失敗'); 
    const data = await res.json(); 
 
    const now = new Date(); 
    coupons.value = data.filter(coupon => new Date(coupon.expirydate) > now); 
  } catch (error) { 
    console.error(error); 
    message.value = '無法載入優惠券資料'; 
  } 
 
  try { 
    const res2 = await fetch('https://localhost:7017/api/Shippings'); 
    if (!res2.ok) throw new Error('載入運費失敗'); 
    shippings.value = await res2.json(); 
  } catch (error) { 
    console.error(error); 
    message.value += '\n無法載入運費資料'; 
  } 
});

const handleClaim = (coupon) => { 
  if (claimedCouponIds.value.includes(coupon.couponId)) return; 
 
  claimedCouponIds.value.push(coupon.couponId); 
  saveClaimedCoupons() // 儲存到 localStorage
  alert(`成功領取優惠券：${coupon.description}`); 
};


</script>

<template>
  <div id="coupon-section" class="campaign-container container-fluid py-5">
    <h2 class="text-center mb-5 display-5 fw-bold text-black">優惠領取</h2>
    <p v-if="message" class="text-danger text-center">{{ message }}</p>

    <div class="row row-cols-1 row-cols-md-2 g-4">
      <div class="col" v-for="coupon in coupons" :key="coupon.couponId">
       <div
            class="card h-100"
            :class="[
              claimedCouponIds.includes(coupon.couponId)
                ? 'border-secondary text-muted bg-light'
                : 'border-success bg-white'
            ]"
          >
          <div class="card-body">
            <h5 class="card-title">{{ coupon.name }}</h5>
            <p class="card-text">
              {{ coupon.description }}<br>

               <span v-if="coupon.minimumPurchase > 0">
                  低消：NT$ {{ coupon.minimumPurchase }}<br>
              </span>
              <span v-if="coupon.coupontypeId === 3 && shippings.length > 0">
                運費：免費
              </span>
              <span v-else-if="coupon.coupontypeId === 4 && shippings.length > 0">
                打折：{{ coupon.discountAmount }}%
              </span>
              <span v-else>
                折扣金額：NT$ {{ coupon.discountAmount }}
              </span><br>
              到期日：{{ coupon.expirydate.split('T')[0] }}
            </p>
            <button
              class="btn"
              :class="claimedCouponIds.includes(coupon.couponId) ? 'btn-secondary' : 'btn-success'"
              :disabled="claimedCouponIds.includes(coupon.couponId)"
              @click="handleClaim(coupon)"
            ><i class="fa-solid fa-ticket"></i>
              {{ claimedCouponIds.includes(coupon.couponId) ? '已領取' : '領取' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: 0.3s ease;
}
.card:hover {
  transform: translateY(-3px);
}
.claimed-bg {
  background-color: #f0f0f0;
}
.unclaimed-bg {
  background-color: #ffffff;
}
.campaign-container {
  background-color: #b287e6;  /* 換背景顏色 */
}
</style>
