<script setup>
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'

const props = defineProps({
  items: Array
})

const cartStore = useCartStore()
const showItems = computed(() => props.items || cartStore.items)
const showTotal = computed(() =>
  showItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

// debounce 防抖函式
function debounce(fn, delay = 300) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

// 改變數量（防抖＋檢查）
const onQtyInput = debounce((event, item) => {
  let value = parseInt(event.target.value)
  if (isNaN(value) || value < 1) {
    event.target.value = item.quantity
    return
  }
  cartStore.setQty(item, value)
}, 300)

const increase = (item) => cartStore.increaseQty(item)
const decrease = (item) => cartStore.decreaseQty(item)
const remove = (item) => cartStore.removeItem(item.id)
</script>


<template>
  <div v-if="showItems.length">
    <div class="list-group mb-3">
      <div
        class="list-group-item d-flex align-items-center gap-3"
        v-for="item in showItems"
        :key="item.id"
      >
        <img :src="item.image" alt="商品圖" style="width: 60px; height: 60px; object-fit: cover;" />
        
        <div class="flex-grow-1">
          <h6 class="mb-1">{{ item.name }}</h6>
          <div>單價：${{ item.price }}</div>

          <div class="d-flex align-items-center mt-1">
            <button class="btn btn-outline-secondary btn-sm" @click="decrease(item)">-</button>
            <input
              type="number"
              class="form-control form-control-sm mx-2"
              style="width: 60px;"
              :value="item.quantity"
              @input="onQtyInput($event, item)"
              min="1"
            />
            <button class="btn btn-outline-secondary btn-sm" @click="increase(item)">+</button>
          </div>

          <div class="text-muted">小計：${{ item.price * item.quantity }}</div>
        </div>

        <button class="btn btn-sm btn-danger" @click="remove(item)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>

    <div class="text-end fw-bold fs-5">
      總金額：<span class="text-danger">${{ showTotal }}</span>
    </div>
  </div>
  <div v-else class="text-center text-muted">沒有商品資料</div>
</template>
