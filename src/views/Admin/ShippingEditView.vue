<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const shippingId = route.params.id

const shipping = ref({
  name: '',
  shippingFee: 0,
  supportCod: false,
  description: '',
  shippingTypeId: 1  // ✅ 預設值設定
})

const fetchShipping = async () => {
  const res = await axios.get(`/api/Shippings/${shippingId}`)
  shipping.value = res.data
}

const updateShipping = async () => {
  try {
    await axios.put(`/api/Shippings/${shippingId}`, shipping.value)
    alert('修改成功！')
    router.push({ name: 'AdminShipping' }) // ✅ 使用路由名稱更安全
  } catch (err) {
    console.error('修改失敗', err)
    alert('修改失敗')
  }
}

onMounted(fetchShipping)
</script>

<template>
  <div class="container mt-4">
    <h2>修改物流</h2>

    <div class="mb-3">
      <label class="form-label">名稱</label>
      <input v-model="shipping.name" class="form-control" required />
    </div>

    <!-- ✅ 新增運送類型選擇 -->
    <div class="mb-3"> 
      <label class="form-label">運送類型</label>
      <select v-model="shipping.shippingTypeId" class="form-select" required>
        <option :value="1">宅配</option>
        <option :value="2">超商取貨</option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">運費</label>
      <input v-model.number="shipping.shippingFee" type="number" class="form-control" required />
    </div>

    <div class="form-check mb-3">
      <input v-model="shipping.supportCod" type="checkbox" class="form-check-input" />
      <label class="form-check-label">支援貨到付款</label>
    </div>

    <div class="mb-3">
      <label class="form-label">描述</label>
      <textarea v-model="shipping.description" class="form-control" required />
    </div>

    <button class="btn btn-primary" @click="updateShipping">儲存修改</button>
  </div>
</template>
