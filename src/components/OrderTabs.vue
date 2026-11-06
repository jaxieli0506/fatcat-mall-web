<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import CreateComplaintForm from './CreateComplaintForm.vue' //by rr
import Swal from 'sweetalert2' //by rr


const authStore = useAuthStore()
const orders = ref([])
const statuses = ref([])
const showComplaintModal = ref(false)// rr新增：管理申訴表單 Modal 的狀態
const selectedOrderIdForComplaint = ref(null)// rr獲取orderid：管理申訴表單 Modal 的狀態

// 目前的 tab 狀態 ID（預設是 1：訂單成立）
const selectedStatus = ref(1)

// 當前登入會員的 userId
const userId = computed(() => authStore.user?.userId)

// 載入所有訂單與訂單狀態
const fetchData = async () => {
  try {
    const [ordersRes, statusesRes] = await Promise.all([
      axios.get('https://localhost:7017/api/Orders'),
      axios.get('https://localhost:7017/api/OrderStatus')
    ])
    orders.value = ordersRes.data
    statuses.value = statusesRes.data
  } catch (error) {
    console.error('載入訂單資料失敗', error)
  }
}

// 過濾目前使用者的訂單
const userOrders = computed(() =>
  orders.value.filter(order => order.userId === userId.value)
)

// 再過濾目前狀態的訂單
const filteredOrders = computed(() =>
  userOrders.value.filter(order => order.orderStatusId === selectedStatus.value)
)

const currentPage = ref(1)
const pageSize = 10

// 分頁後的訂單資料
const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

// 計算總頁數
const totalPages = computed(() =>
  Math.ceil(filteredOrders.value.length / pageSize)
)

// 換頁
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 將狀態 ID 轉換成描述
const getStatusText = (statusId) => {
  const status = statuses.value.find(s => s.orderStatusId === statusId)
  return status?.description || '未知狀態'
}

// 找出「已完成（收貨成功）」狀態的 ID
const completedStatusId = computed(() => {
  const status = statuses.value.find(s => s.description === '已完成（收貨成功）')
  return status?.orderStatusId || null
})

// ----RR  申訴處理函式----
// 點擊「申訴」按鈕時觸發
const openComplaintModal = (order) => {
  selectedOrderIdForComplaint.value = order.orderId
  showComplaintModal.value = true
}

// 僅用於關閉 Modal (例如點擊取消)
const closeComplaintModal = () => {
  showComplaintModal.value = false
  selectedOrderIdForComplaint.value = null
}

// 【新增】當申訴成功提交後觸發
const handleComplaintSuccess = (submittedOrderId) => {
  // 1. 在訂單列表陣列中找到剛剛申訴的那個訂單
  const order = orders.value.find(o => o.orderId === submittedOrderId);
  if (order) {
    // 2. 在該訂單物件上新增一個標記，告訴模板它已經申訴過了
    order.hasBeenAppealed = true; 
  }

  // 3. 關閉 Modal
  closeComplaintModal();

  // 4. 顯示 SweetAlert 成功提示
  Swal.fire({
    icon: 'success',
    title: '申訴已提交！',
    text: '我們將盡快為您處理。',
    confirmButtonText: '好的'
  });
}
//--------RR 申訴結束-------

onMounted(fetchData)
</script>

<template>
  <div class="container mt-4">
    <!-- 若尚未登入 -->
    <div v-if="!authStore.isAuthenticated">
      <p class="text-danger">請先登入以查看您的訂單。</p>
    </div>

    <!-- Tabs -->
    <div v-else>
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item" v-for="status in statuses" :key="status.orderStatusId">
          <a
            href="#"
            class="nav-link"
            :class="{ active: selectedStatus === status.orderStatusId }"
            @click.prevent="selectedStatus = status.orderStatusId"
          >
            {{ status.description }}
          </a>
        </li>
      </ul>

      <!-- 訂單列表 -->
      <div v-if="filteredOrders.length">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>日期</th>
              <th>總金額</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in pagedOrders" :key="order.orderId">
              <td>{{ order.orderId }}</td>
              <td>{{ new Date(order.orderdate).toLocaleDateString() }}</td>
              <td>NT${{ order.payableAmount }}</td>
              <td>{{ getStatusText(order.orderStatusId) }}</td>
              <td>
                <router-link
                  :to="`/orderdetail/${order.orderId}`"
                  class="btn btn-outline-primary btn-sm me-2"
                >
                  查看明細
                </router-link>

                <!-- 顯示申訴按鈕 RRRRRRRRRR-->
                <template v-if="order.orderStatusId === completedStatusId">
                <button v-if="order.hasBeenAppealed" class="btn btn-secondary btn-sm" disabled>
                  已申訴
                </button>

                <button v-else class="btn btn-outline-danger btn-sm" @click="openComplaintModal(order)">
                  申訴
                </button>
              </template>
              </td>
            </tr>
          </tbody>
        </table>
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

      <div v-else>
        <p>目前無此狀態的訂單。</p>
      </div>
    </div>
     <Teleport to="body">
      <div v-if="showComplaintModal" class="modal-overlay">
        <CreateComplaintForm 
          :order-id="selectedOrderIdForComplaint"
          @close="closeComplaintModal"
          @complaint-submitted="handleComplaintSuccess(selectedOrderIdForComplaint)"
        />
      </div>
    </Teleport>

  </div> </template>


<style scoped>
.nav-link.active {
  font-weight: bold;
}
/* 申訴 Modal 的背景遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; /* z-index 確保在最上層 */
  padding: 20px;
}
</style>
