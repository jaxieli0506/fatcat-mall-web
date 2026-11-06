<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const API_URL = 'https://localhost:7017/api/Shippings'
const shippings = ref([])
const router = useRouter()

// 載入所有物流方式
const fetchShippings = async () => {
  try {
    const res = await axios.get(API_URL)
    shippings.value = res.data
  } catch (error) {
    alert('載入物流資料失敗')
    console.error(error)
  }
}

// 跳轉到新增頁面
const goToAdd = () => {
  router.push('/admin/shippings/add')
}

// 跳轉到編輯頁面
const goToEdit = (id) => {
  router.push(`/admin/shippings/edit/${id}`)
}

// 刪除物流方式
const deleteShipping = async (id) => {
  if (!confirm('確定要刪除嗎？')) return
  try {
    await axios.delete(`${API_URL}/${id}`)
    alert('刪除成功')
    fetchShippings()
  } catch (error) {
    alert('刪除失敗')
    console.error(error)
  }
}

onMounted(fetchShippings)
</script>

<template>
  <div class="container">
    <h2>物流管理</h2>

    <div class="mb-3 text-start">
      <button class="btn btn-success" @click="goToAdd">新增物流方式</button>
    </div>

    <!-- 物流列表 -->
    <table class="table table-bordered mb-4">
      <thead>
        <tr>
          <th>物流名稱</th>
          <th>說明</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in shippings" :key="item.shippingId">
          <td>{{ item.name }}</td>
          <td>{{ item.description }}</td>
          <td>
            <button class="btn btn-sm btn-primary me-2" @click="goToEdit(item.shippingId)">編輯</button>
            <button class="btn btn-sm btn-danger" @click="deleteShipping(item.shippingId)">刪除</button>
          </td>
        </tr>
        <tr v-if="shippings.length === 0">
          <td colspan="3" class="text-center">目前沒有物流方式</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
}
.me-2 {
  margin-right: 0.5rem;
}
</style>
