<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getOrders, 
  getOrderStatuses, 
  getShippings, 
  getShippingStatuses 
} from '@/services/orderService'

const orders = ref([])
const orderStatuses = ref([])
const shippings = ref([])
const shippingStatuses = ref([])
const router = useRouter()

const selectedStatusId = ref(null)

const currentPage = ref(1)
const pageSize = 10

const goToOrderDetail = (orderId) => {
  router.push(`/admin/orderdetail/${orderId}`)
}

const fetchAllData = async () => {
  try {
    const [ordersRes, statusRes, shippingRes, shippingStatusRes] = await Promise.all([
      getOrders(),
      getOrderStatuses(),
      getShippings(),
      getShippingStatuses()
    ])

    orders.value = ordersRes.data
    orderStatuses.value = statusRes.data
    shippings.value = shippingRes.data
    shippingStatuses.value = shippingStatusRes.data

    // 預設第一個訂單狀態
    if (statusRes.data.length > 0) {
      selectedStatusId.value = statusRes.data[0].orderStatusId
    }
  } catch (err) {
    console.error('資料載入錯誤:', err)
  }
}

// 篩選出當前分頁的訂單
const filteredOrders = computed(() => {
  if (selectedStatusId.value === null) return orders.value
  return orders.value.filter(o => o.orderStatusId === selectedStatusId.value)
})

// 分頁後的訂單
const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

// 總頁數
const totalPages = computed(() =>
  Math.ceil(filteredOrders.value.length / pageSize)
)

// 換頁
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 切換狀態時，重設分頁
watch(selectedStatusId, () => {
  currentPage.value = 1
})

const getOrderStatusDesc = (id) =>
  orderStatuses.value.find(item => item.orderStatusId === id)?.description || '未知'

const getShippingName = (id) =>
  shippings.value.find(item => item.shippingId === id)?.name || '未知'

const getShippingStatusDesc = (id) =>
  shippingStatuses.value.find(item => item.shippingStatusId === id)?.description || '未知'

onMounted(fetchAllData)

</script>

<template>
  <div class="container">
    <h2>訂單管理</h2>

    <!-- 分類頁籤 -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item" v-for="status in orderStatuses" :key="status.orderStatusId">
        <a 
          href="#" 
          class="nav-link"
          :class="{ active: selectedStatusId === status.orderStatusId }"
          @click.prevent="selectedStatusId = status.orderStatusId"
        >
          {{ status.description }}
        </a>
      </li>
    </ul>

    <!-- 表格 -->
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>訂單編號</th>
          <th>會員ID</th>
          <th>訂單日期</th>
          <th>總金額</th>
          <th>訂單狀態</th>
          <th>運送方式</th>
          <th>運送狀態</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in pagedOrders" :key="order.orderId">
          <td>{{ order.orderId }}</td>
          <td>{{ order.userId }}</td>
          <td>{{ new Date(order.orderdate).toLocaleString() }}</td>
          <td>{{ order.payableAmount }}</td>
          <td>{{ getOrderStatusDesc(order.orderStatusId) }}</td>
          <td>{{ getShippingName(order.shippingId) }}</td>
          <td>{{ getShippingStatusDesc(order.shippingStatusId) }}</td>
          <td>
            <button @click="goToOrderDetail(order.orderId)" class="btn btn-sm btn-primary">明細</button>
          </td>
        </tr>
        <tr v-if="filteredOrders.length === 0">
          <td colspan="8" class="text-center">此狀態無訂單資料</td>
        </tr>
      </tbody>
    </table>

    <!-- 分頁區塊 -->
    <nav v-if="totalPages > 1" class="mt-3">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="goToPage(currentPage - 1)">上一頁</a>
        </li>

        <li 
          class="page-item" 
          v-for="page in totalPages" 
          :key="page" 
          :class="{ active: currentPage === page }"
        >
          <a class="page-link" href="#" @click.prevent="goToPage(page)">{{ page }}</a>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <a class="page-link" href="#" @click.prevent="goToPage(currentPage + 1)">下一頁</a>
        </li>
      </ul>
    </nav>
  </div>
</template>
