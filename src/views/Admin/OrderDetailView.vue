<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderById, getOrderStatuses, getShippingStatuses } from '@/services/orderService'
import axios from 'axios'
import { computed } from 'vue'


// 拿到 orderId
const route = useRoute()
const orderId = route.params.id

const shippings = ref([])
const shippingFee = ref(null)


// 訂單詳細資料
const order = ref(null)
// 訂單明細列表 (API: OrderDetails，需要另外寫service)
const orderDetails = ref([])
const couponDescription = ref('無使用優惠券')
const fetchCouponDescription = async (couponId) => {
  if (!couponId || couponId === 0) {
    couponDescription.value = '無使用優惠券'
    return
  }
 
  try {
    const res = await axios.get('https://localhost:7017/api/Coupons')
    const coupons = res.data
    const matched = coupons.find(c => c.couponId === couponId)
    couponDescription.value = matched ? matched.description : '查無優惠券'
  } catch (error) {
    console.error('無法取得優惠券資料', error)
    couponDescription.value = '載入優惠券失敗'
  }
}
const orderTotal = computed(() => {
  return orderDetails.value.reduce((sum, item) => {
    const qty = item.quantity ?? 0
    const price = item.unitprice ?? 0
    return sum + qty * price
  }, 0)
})

// 狀態相關
const orderStatuses = ref([])
const shippingStatuses = ref([])

const selectedOrderStatus = ref(null)
const selectedShippingStatus = ref(null)

// 讀取資料
const fetchData = async () => {
  try {
    // 訂單資料
    const orderRes = await getOrderById(orderId)
    order.value = orderRes.data

    // 取得優惠券描述
    await fetchCouponDescription(order.value.couponId)

    // 取得運費列表
    const shippingsRes = await axios.get('https://localhost:7017/api/Shippings')
    shippings.value = shippingsRes.data

    // 找出訂單的運費（用 order.shippingId）
    const shippingInfo = shippings.value.find(s => s.shippingId === order.value.shippingId)
    shippingFee.value = shippingInfo ? shippingInfo.shippingFee : null

    // 狀態資料
    const [orderStatusRes, shippingStatusRes] = await Promise.all([
      getOrderStatuses(),
      getShippingStatuses()
    ])

    orderStatuses.value = orderStatusRes.data
    shippingStatuses.value = shippingStatusRes.data

    // 設定目前訂單狀態跟物流狀態預設值
    selectedOrderStatus.value = order.value.orderStatusId
    selectedShippingStatus.value = order.value.shippingStatusId

    // 取得訂單明細
    const detailsRes = await axios.get(`https://localhost:7017/api/OrderDetails?orderId=${orderId}`)
    orderDetails.value = detailsRes.data

  } catch (error) {
    console.error('資料載入失敗', error)
  }
}

// 送出更新訂單狀態、物流狀態
const updateStatus = async () => {
  try {
    await axios.put(`https://localhost:7017/api/Orders/${orderId}`, {
      ...order.value,
      orderStatusId: selectedOrderStatus.value,
      shippingStatusId: selectedShippingStatus.value
    })
    alert('更新成功')
  } catch (error) {
    console.error('更新失敗', error)
    alert('更新失敗')
  }
}




onMounted(fetchData)

const formatCurrency = (num) => {
  if (typeof num !== 'number') return '-'
  return num.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD' , minimumFractionDigits: 0, maximumFractionDigits: 0})
}

const discountAmount = computed(() => {
  if (orderTotal.value == null || shippingFee.value == null || order.value == null) return 0
  return orderTotal.value + shippingFee.value - order.value.payableAmount
})

</script>

<template>
  <div class="container">
    <h2>訂單明細 - 訂單編號：{{ orderId }}</h2>

    <div v-if="order">
      <h4>訂單基本資料</h4>
      <p>會員ID: {{ order.userId }}</p>
      <p>訂單日期: {{ new Date(order.orderdate).toLocaleString() }}</p>
      <p>訂單金額: ${{ order.payableAmount }}</p>

      <div class="mb-3">
        <label>訂單狀態</label>
        <select v-model="selectedOrderStatus" class="form-select">
          <option v-for="status in orderStatuses" :key="status.orderStatusId" :value="status.orderStatusId">
            {{ status.description }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label>物流狀態</label>
        <select v-model="selectedShippingStatus" class="form-select">
          <option v-for="status in shippingStatuses" :key="status.shippingStatusId" :value="status.shippingStatusId">
            {{ status.description }}
          </option>
        </select>
      </div>

      <button @click="updateStatus" class="btn btn-success mb-3">更新狀態</button>

      <h4>訂單商品明細</h4>
<table class="table table-bordered">
  <thead>
    <tr>
      <th>商品名稱</th>
      <th>數量</th>
      <th>價格</th>
      <th>小計</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="detail in orderDetails" :key="detail.orderdetailId">
      <td>{{ detail.productName }}</td>
      <td>{{ detail.quantity ?? '無資料' }}</td>
      <td>{{ detail.unitprice ?? '無資料' }}</td>
      <td>
        {{
          detail.quantity != null && detail.unitprice != null
            ? detail.quantity * detail.unitprice
            : '無資料'
        }}
      </td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="3" class="text-end fw-bold">明細加總：</td>
      <td class="fw-bold">{{ orderTotal }}</td>
    </tr>
  </tfoot>
</table>

<!-- 顯示實際訂單記錄的總金額 -->
<p>運費：{{ shippingFee !== null ? formatCurrency(shippingFee) : '無資料' }}</p>
<p>使用優惠券：{{ couponDescription }}</p>
<p>折扣金額：{{ formatCurrency(discountAmount) }}</p>
<p>實付金額：${{ order.payableAmount }}</p>

    </div>

    <div v-else>載入中...</div>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
}
</style>
