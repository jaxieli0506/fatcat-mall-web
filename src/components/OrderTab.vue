<!-- components/OrderTab.vue
<template>
  <div class="tab-pane fade" :class="{ show: active, active: active }" :id="id" role="tabpanel" :aria-labelledby="labelledby">
    <ul class="list-group">
      <li class="list-group-item" v-for="order in orders" :key="order.id">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            訂單編號: {{ order.orderNumber }}<br>
            訂單狀態: {{ order.status }}<br>
            訂單金額: {{ checkout.total }}元
          </div>
          <div>
            <router-link to="/orderdetail">
              <button type="button" class="btn custom-purple-btn float-end">訂單明細</button>
            </router-link>
            <button
              v-if="showReview"
              type="button"
              class="btn custom-purple-btn float-end btn-space"
            >
              前往評價
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  id: String,
  labelledby: String,
  active: Boolean,
  orders: {
    type: Array,
    required: true
  },
  showReview: {
    type: Boolean,
    default: false
  }
})
import { useCheckoutStore } from '@/stores/checkout'

const checkout = useCheckoutStore()
</script>


<style scoped>
.custom-purple-btn {
  background-color: #92559c;
  border-color: #92559c;
  color: white;
}
.custom-purple-btn:hover {
  background-color: #7b4583;
  border-color: #7b4583;
}
.btn-space {
  margin-right: 10px;
}
.nav-pills .nav-link {
  color: #92559c;
  border: 1px solid #92559c;
  background-color: transparent;
  margin-right: 8px;
  transition: all 0.3s ease;
}
.nav-pills .nav-link:hover {
  background-color: #f3e8f7;
  color: #92559c;
}
.nav-pills .nav-link.active {
  background-color: #92559c;
  color: white;
  border-color: #92559c;
}
</style> -->