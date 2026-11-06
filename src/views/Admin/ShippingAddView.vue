<script setup> 
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const shipping = ref({
  name: '',
  shippingTypeId: '',
  shippingFee: 0,
  supportCod: false,
  description: ''
})

const errors = ref({
  name: '',
  shippingTypeId: '',
  shippingFee: '',
  description: ''
})

// 驗證欄位
const validate = () => {
  let isValid = true
  errors.value = {
    name: '',
    shippingTypeId: '',
    shippingFee: '',
    description: ''
  }

  if (!shipping.value.name.trim()) {
    errors.value.name = '名稱為必填'
    isValid = false
  }
  if (!shipping.value.shippingTypeId) {
    errors.value.shippingTypeId = '請選擇運送類型'
    isValid = false
  }
  if (shipping.value.shippingFee === null || shipping.value.shippingFee === '' || shipping.value.shippingFee < 0) {
    errors.value.shippingFee = '請輸入有效的運費'
    isValid = false
  }
  if (!shipping.value.description.trim()) {
    errors.value.description = '描述為必填'
    isValid = false
  }

  return isValid
}

const createShipping = async () => {
  if (!validate()) return

  try {
    await axios.post('/api/Shippings', shipping.value)
    alert('新增成功！')
   router.push('/admin/shipping')
  } catch (error) {
    console.error('新增失敗', error)
    alert('新增失敗')
  }
}
</script>

<template>
  <div class="container mt-4">
    <h2>新增物流</h2>

    <div class="mb-3">
      <label class="form-label">名稱</label>
      <input v-model="shipping.name" class="form-control" />
      <div class="text-danger">{{ errors.name }}</div>
    </div>

    <div class="mb-3"> 
      <label class="form-label">運送類型</label>
      <select v-model="shipping.shippingTypeId" class="form-select">
        <option disabled value="">請選擇</option>
        <option :value="1">宅配</option>
        <option :value="2">超商取貨</option>
      </select>
      <div class="text-danger">{{ errors.shippingTypeId }}</div>
    </div>

    <div class="mb-3">
      <label class="form-label">運費</label>
      <input v-model.number="shipping.shippingFee" type="number" class="form-control" />
      <div class="text-danger">{{ errors.shippingFee }}</div>
    </div>

    <div class="form-check mb-3">
      <input v-model="shipping.supportCod" type="checkbox" class="form-check-input" />
      <label class="form-check-label">支援貨到付款</label>
    </div>

    <div class="mb-3">
      <label class="form-label">描述</label>
      <textarea v-model="shipping.description" class="form-control" rows="3" />
      <div class="text-danger">{{ errors.description }}</div>
    </div>

    <button class="btn btn-success" @click="createShipping">新增</button>
  </div>
</template>
