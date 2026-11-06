<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/jjapi.js'
import { useCartStore } from '@/stores/cart'
import PostReviewForm from './PostReviewForm.vue'

const props = defineProps({
  items: Array,
  isCompleted: Boolean,
  orderId: Number
})

const cartStore = useCartStore()
const showItems = ref([])
const loading = ref(false)
const error = ref(null)
const showReviewForm = ref(false)
const selectedItem = ref(null)
const isOrderCompleted = ref(false)  // ✅頂層定義，template 才能使用

// 後端 URL 常數
const BACKEND_URL = 'https://localhost:7017'
const fetchOrderData = async () => {
  console.log('✅ 訂單是否完成:', isOrderCompleted.value)
  try {
    loading.value = true

    // 取得訂單狀態
    const orderRes = await api.get(`/Orders/${props.orderId}`)
    const statusName = orderRes.data.orderStatus?.description
    isOrderCompleted.value = orderRes.data.orderStatusId === 3 || statusName === '已完成（收貨成功）'

    // 同時取得相關資料
    const [orderDetailsRes, cartRes, productRes, imageRes] = await Promise.all([
      api.get('/OrderDetails', { params: { orderId: props.orderId } }),
      api.get('/ShoppingCartItems'),
      api.get('/Products'),
      api.get('/ProductImages')
    ])

    const orderDetails = orderDetailsRes.data
    const cartItems = cartRes.data
    const products = productRes.data
    const productImages = imageRes.data

    // 組合資料
    showItems.value = orderDetails.map(od => {
      const cartItem = cartItems.find(ci => ci.itemId === od.itemId)
      const product = products.find(p => p.productsId === cartItem?.productsId)
      const mainImage = productImages.find(img =>
        img.productId === product?.productsId && img.isMain === 1
      )

      return {
        productId: product?.productsId || 0,
        name: product?.name || od.productName,
        image: mainImage?.imageUrl
          ? `${BACKEND_URL}/ProductImages/${mainImage.imageUrl}`
          : `${BACKEND_URL}/ProductImages/pingu.png`,
        price: od.unitprice,
        quantity: od.quantity,
        subtotal: od.unitprice * od.quantity,
        hasBeenReviewed: false
      }
    })
  } catch (err) {
    console.error('❌ 載入失敗:', err)
    error.value = '載入失敗，請稍後再試。'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!props.orderId) {
    console.warn('⚠️ 缺少 orderId，無法載入訂單資料')
    return
  }

  if (props.items?.length > 0) {
    showItems.value = props.items.map(item => ({
      ...item,
      subtotal: item.price * item.quantity
    }))
  } else {
    await fetchOrderData()
  }
})

const handleReviewClick = (item) => {
  selectedItem.value = item
  showReviewForm.value = true
}

const closeReviewForm = () => {
  showReviewForm.value = false
  selectedItem.value = null
}

const handleReviewSubmitted = () => {
  if (selectedItem.value) {
    selectedItem.value.hasBeenReviewed = true
  }
  closeReviewForm()
}

const total = computed(() =>
  showItems.value.reduce((sum, item) =>
    sum + (item.subtotal || item.price * item.quantity), 0)
)
</script>

<template>
  <div v-if="loading">載入中...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <div class="list-group mb-3">
      <div
        v-for="(item, index) in showItems"
        :key="index"
        class="list-group-item d-flex align-items-center gap-3"
      >
        <img
          :src="item.image"
          alt="商品圖"
          style="width: 60px; height: 60px; object-fit: cover"
        />
        <div class="flex-grow-1">
          <h6 class="mb-1">{{ item.name }}</h6>
          <div>單價：${{ item.price }}</div>
          <div>數量：{{ item.quantity }}</div>
          <div class="text-muted">小計：${{ item.subtotal }}</div>
        </div>

        <template v-if="isOrderCompleted">
          <button v-if="item.hasBeenReviewed" class="btn btn-secondary btn-sm" disabled>
            已評價
          </button>
          <button
            v-else
            class="btn btn-outline-primary btn-sm"
            @click="handleReviewClick(item)"
          >
            評價
          </button>
        </template>
      </div>
    </div>

    <div class="text-end fw-bold fs-5">
      總金額：<span class="text-danger">${{ total }}</span>
    </div>

    <!-- 評價表單 Modal -->
    <div
      v-if="showReviewForm && selectedItem"
      class="modal fade show"
      style="display: block; background-color: rgba(0,0,0,0.5);"
      @click.self="closeReviewForm"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">對「{{ selectedItem.name }}」發表評論</h5>
            <button type="button" class="btn-close" @click="closeReviewForm"></button>
          </div>
          <div class="modal-body">
            <PostReviewForm
              :product-id="selectedItem.productId"
              :order-id="orderId"
              @review-submitted="handleReviewSubmitted"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-group-item {
  border-radius: 12px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
}
.modal {
  z-index: 1050;
}
</style>
