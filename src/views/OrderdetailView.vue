<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderItemList from '@/components/OrderItemList.vue'
import OrderDetail from '@/components/OrderDetail.vue'
import { useOrderStore } from '@/stores/order'
import api from '@/services/jjapi.js'
import CustomerService from '@/components/CustomerService.vue';


const orderStore = useOrderStore()
// 建議加載資料前先檢查是否為空，必要時使用 await fetch
const route = useRoute()
const router = useRouter()
const orderId = route.params.id
const order = ref(null)
const orderStatusId = computed(() => order.value?.orderStatusId || 0)
const orderItems = ref([])
const isOrderCanceled = computed(() => order.value?.orderStatusId === 6)
const customerServiceRef = ref(null);

const cancelOrder = async () => {
  const confirmCancel = window.confirm('確定要取消訂單嗎？此操作無法復原。')
  if (!confirmCancel) return

  try {
    await api.put(`/Orders/${orderId}`, {
      ...order.value,
      orderStatusId: 6 // 代表已取消
    })

    // 更新前端狀態
    order.value.orderStatusId = 6
    alert('訂單已成功取消。')

  } catch (err) {
    console.error('取消訂單失敗:', err)
    alert('取消訂單失敗，請稍後再試。')
  }
}

const returnOrder = async () => {
  const confirmReturn = window.confirm('確定要退貨嗎？')
  if (!confirmReturn) return

  try {
    const res = await fetch(`https://localhost:7017/api/Orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...order.value,
        orderStatusId: 4 // 代表已退貨
      })
    })

    if (!res.ok) throw new Error('退貨失敗')

    order.value.orderStatusId = 4
    alert('訂單已申請退貨。')

  } catch (err) {
    console.error('退貨失敗:', err)
    alert('退貨失敗，請稍後再試。')
  }
}

const fetchOrderDetail = async () => {
  try {
    const [orderRes, itemsRes] = await Promise.all([
      api.get(`/Orders/${orderId}`),
      api.get('/OrderDetails', { params: { orderId: orderId } })
    ])
    order.value = orderRes.data
    orderItems.value = itemsRes.data
  } catch (err) {
    console.error('無法載入訂單詳情', err)
  }
}

const props = defineProps({
  order: Object
})


const handleOrderAction = async () => {
  const isReturn = orderStatusId.value === 3
  const actionText = isReturn ? '退貨' : '取消訂單'
  const confirmAction = window.confirm(`確定要${actionText}嗎？`)

  if (!confirmAction) return

  try {
    const newStatusId = isReturn ? 4 : 6
    const res = await fetch(`https://localhost:7017/api/Orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...order.value,
        orderStatusId: newStatusId
      })
    })

    if (!res.ok) throw new Error(`${actionText}失敗`)

    order.value.orderStatusId = newStatusId
    alert(`訂單已成功${isReturn ? '申請退貨' : '取消'}`)

  } catch (err) {
    console.error(`${actionText}失敗:`, err)
    alert(`${actionText}失敗，請稍後再試。`)
  }
}

const openCustomerService = () => {
  if (customerServiceRef.value) {
    customerServiceRef.value.toggleChat();
  }
};



onMounted(fetchOrderDetail)
</script>

<template>
  <div class="page-content-wrapper pt-5 pb-5">
    <div class="container mb-2">
      <h2>訂單明細</h2>
      <p class="text-muted">訂單編號：{{ orderId }}</p>
      <div class="accordion col-lg-10 container mb-5" id="accordionPanelsStayOpenExample">
        <div class="accordion-item">
          <h2 class="accordion-header" id="panelsStayOpen-headingOne">
            <button class="accordion-button" type="button" data-bs-toggle="collapse"
              data-bs-target="#panelsStayOpen-collapseOne" aria-expanded="true"
              aria-controls="panelsStayOpen-collapseOne">
              <h3>商品列表</h3>
            </button>
          </h2>
          <div id="panelsStayOpen-collapseOne" class="accordion-collapse collapse show"
            aria-labelledby="panelsStayOpen-headingOne">
            <div class="accordion-body">
              <!-- 訂單商品列表 -->
              <OrderItemList
                :order-id="Number(orderId)"
                :order-status-id="Number(orderStatusId)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <OrderDetail :order-id="Number(orderId)" />

      
      <div class="mt-4">
  
        <button
          v-if="!isOrderCanceled"
          type="button"
          class="btn custom-purple-btn float-end btn-space"
          @click="openCustomerService" 
        >
          聯絡我們
        </button>
        <CustomerService ref="customerServiceRef" />
      
      <button
        v-if="!isOrderCanceled && orderStatusId !== 4 && (orderStatusId === 3 || orderStatusId !== 6)"
        type="button"
        class="btn btn-danger float-end btn-space"
        @click="handleOrderAction"
      >
        {{ orderStatusId === 3 ? '我要退貨' : '取消訂單' }}
      </button>


            <router-link to="/myorders">
        <button type="button" class="btn custom-purple-outline-btn float-end btn-space">
          返回我的訂單
        </button>
      </router-link>

  

  
</div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.custom-purple-btn {
  background-color: #92559c;
  border-color: #92559c;
  color: white;
}

.custom-purple-btn:hover {
  background-color: #7b4583;
  border-color: #7b4583;
}

.custom-purple-outline-btn {
  background-color: transparent;
  border: 2px solid #92559c;
  color: #92559c;
  transition: all 0.3s ease;
}

.custom-purple-outline-btn:hover {
  background-color: #92559c;
  color: white;
  border-color: #92559c;
}

.btn-space {
  margin-right: 10px;
}
</style>