<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import { useNotificationStore } from '@/stores/notification' // 上架發送通知 by jj

// 引入 notification store  by jj
const notificationStore = useNotificationStore()

const products = ref([])
const categories = ref([])
const sorts = ref([])

const keyword = ref('')
const selectedCategoryId = ref('')
const selectedSortId = ref('')
const selectedStatus = ref('')

// 撈商品資料（已包含 categoryId、sortId）
const fetchProducts = async () => {
  const res = await fetch('https://localhost:7017/api/AdminProducts')
  const data = await res.json() // 🔹 這行不能少！

  products.value = data.map(p => {
    return {
      ...p,
      mainImage: p.mainImage?.startsWith('/ProductImages/')
        ? p.mainImage
        : `/ProductImages/${p.mainImage}`
    }
  })
}

// 撈分類資料
const fetchCategories = async () => {
  const res = await fetch('https://localhost:7017/api/ProductCategories')
  categories.value = await res.json()
}

// 撈小分類資料
const fetchSorts = async () => {
  const res = await fetch('https://localhost:7017/api/Sorts')
  sorts.value = await res.json()
}

// 篩選後的商品清單
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchKeyword =
      !keyword.value ||
      p.name.includes(keyword.value) ||
      p.categoryName.includes(keyword.value) ||
      p.sortName.includes(keyword.value)

    const matchCategory =
      !selectedCategoryId.value || p.categoryId === parseInt(selectedCategoryId.value)

    const matchSort =
      !selectedSortId.value || p.sortId === parseInt(selectedSortId.value)

    const matchStatus =
      !selectedStatus.value ||
      (selectedStatus.value === '上架' && p.isAvailable) ||
      (selectedStatus.value === '下架' && !p.isAvailable)

    return matchKeyword && matchCategory && matchSort && matchStatus
  })
})

onMounted(() => {
  fetchProducts()
  fetchCategories()
  fetchSorts()
})

const toggleStatus = async (product) => {
  try {
    const res = await fetch(`https://localhost:7017/api/AdminProducts/ToggleStatus/${product.productsId}`, {
      method: 'PATCH'
    })

    const result = await res.json()

    // 記錄原始狀態，用於檢查是否為上架操作 by jj
    const wasOffline = !product.isAvailable
    
    // 更新前端的狀態（即時畫面同步）
    product.statusText = result.statusText
    product.isAvailable = result.isAvailable

    // 如果是從下架變為上架，觸發用戶通知刷新 by jj
    if (wasOffline && product.isAvailable) {
      console.log(`商品「${product.name}」已上架，觸發用戶通知刷新`)
      // 延遲一點時間讓後端通知寫入完成
      setTimeout(async () => {
        await notificationStore.refreshUserNotifications()
      }, 1000)
    }
  } catch (err) {
    console.error('切換上下架失敗', err)
    alert('操作失敗，請稍後再試')
  }
}

const confirmDelete = async (id) => {
  const result = await Swal.fire({
    title: '確定要刪除嗎？',
    text: '您可以在廚餘桶復原此商品。',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '是的，刪除',
    cancelButtonText: '取消',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#aaa'
  })

  if (result.isConfirmed) {
    try {
      const res = await fetch(`https://localhost:7017/api/AdminProducts/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('刪除失敗')

      Swal.fire('刪除成功', '商品已被移至廚餘桶 🍜', 'success')

      // 如果你有重新載入商品列表：
      fetchProducts() // 重新載入方法

    } catch (err) {
      console.error(err)
      Swal.fire('刪除失敗', '請稍後再試', 'error')
    }
  }
}

const currentPage = ref(1)
const itemsPerPage = 15

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProducts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage)
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const showTrash = ref(false)
const deletedProducts = ref([])

const fetchDeletedProducts = async () => {
  const res = await fetch('https://localhost:7017/api/AdminProducts/deleted')
  deletedProducts.value = await res.json()
}

const restoreProduct = async (id) => {
  const result = await Swal.fire({
    title: '確定要復原這個商品？',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '復原',
    cancelButtonText: '取消'
  })

  if (!result.isConfirmed) return

  const res = await fetch(`https://localhost:7017/api/AdminProducts/${id}/restore`, {
    method: 'POST'
  })

  if (res.ok) {
    Swal.fire('復原成功', '商品已回到上架區 🧼', 'success')
    fetchDeletedProducts()
    //  建議加這行：重新撈目前上架商品（你的主列表）
    fetchProducts()
  } else {
    Swal.fire('復原失敗', '請稍後再試', 'error')
  }
}

watch(showTrash, (val) => {
  if (val) fetchDeletedProducts()
})
</script>

<template>
  <div class="product-admin-wrapper">
    <h2>📦 全站商品列表</h2>

    <!-- 🔍 篩選區 -->
    <div class="top-bar">
    <div class="filter-box">
      <input type="text" v-model="keyword" placeholder="搜尋商品 / 分類 / 小分類" />

      <select v-model="selectedCategoryId">
        <option value="">全部種類</option>
        <option v-for="cat in categories" :key="cat.productCategoriesId" :value="cat.productCategoriesId">
          {{ cat.name }}
        </option>
      </select>

      <select v-model="selectedSortId">
        <option value="">全部小分類</option>
        <option v-for="sort in sorts" :key="sort.sortId" :value="sort.sortId">
          {{ sort.name }}
        </option>
      </select>

      <select v-model="selectedStatus">
        <option value="">全部狀態</option>
        <option value="上架">上架</option>
        <option value="下架">下架</option>
      </select>
    </div>
      <RouterLink :to="{ name: 'AdminProductCreate' }" class="btn-create" >➕ 新增商品</RouterLink>
    </div>
    <!-- 📋 商品表格 -->
    <table class="product-table">
      <thead>
        <tr>
          <th>圖片</th>
          <th>名稱</th>
          <th>分類</th>
          <th>價格</th>
          <th>庫存</th>
          <th>狀態</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in paginatedProducts" :key="p.productsId">
          <td><img :src="p.mainImage" alt="商品圖" class="thumb" /></td>
          <td>{{ p.name }}</td>
          <td>{{ p.categoryName }} / {{ p.sortName }}</td>
          <td>{{ p.price }} 元</td>
          <td>{{ p.stock }}</td>
          <td>
            <span :class="p.isAvailable ? 'status-on' : 'status-off'">
              {{ p.statusText }}
            </span>
          </td>
          <td>
          <RouterLink :to="{ name: 'AdminProductEdit', params: { id: p.productsId } }" class="btn-edit">編輯</RouterLink>
            <button class="btn-delete" @click="confirmDelete(p.productsId)">刪除</button>
            <button class="btn-status" @click="toggleStatus(p)">
              {{ p.isAvailable ? '下架' : '上架' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
        <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一頁</button>
        <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            :class="{ active: page === currentPage }"
        >
            {{ page }}
        </button>
        <button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一頁</button>
        <p class="result-count">共 {{ filteredProducts.length }} 筆，頁數：{{ currentPage }} / {{ totalPages }}</p>
    </div>
    <!-- 🗑️ 廚餘桶按鈕 -->
<button class="btn-trash-float" @click="showTrash = true">🗑️ 廚餘桶</button>

<!-- 🧙‍♂️ 廚餘彈窗 -->
<div v-if="showTrash" class="modal-overlay">
  <div class="modal-content">
    <h3>🗑️ 廚餘桶（可復原商品）</h3>
    <table v-if="deletedProducts.length">
      <thead>
        <tr>
          <th>名稱</th>
          <th>分類</th>
          <th>價格</th>
          <th>庫存</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in deletedProducts" :key="p.productsId">
          <td>{{ p.name }}</td>
          <td>{{ p.categoryName }} / {{ p.sortName }}</td>
          <td>{{ p.price }}</td>
          <td>{{ p.stock }}</td>
          <td>
            <button class="btn-restore" @click="restoreProduct(p.productsId)">復原</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>目前沒有商品在廚餘桶內 🍜</p>
    <button class="btn-close" @click="showTrash = false">關閉</button>
  </div>
</div>
    </div>
</template>

<style lang="css" scoped>
.product-admin-wrapper {
  padding: 1rem;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1rem;
}

.filter-box {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-box input,
.filter-box select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.btn-create {
  background-color: #7c4dff;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  transition: 0.3s;
}

.btn-create:hover {
  background-color: #9575cd;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
}

.product-table th,
.product-table td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
}

.thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.status-on {
  background-color: #28a745;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
}

.status-off {
  background-color: #6c757d;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
}

button {
  margin: 0 4px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-edit {
  background-color: #409eff;
  color: white;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none; /* 移除底線 */
  display: inline-block;
}

.btn-delete {
  background-color: #ff5252;
  color: white;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none; /* 移除底線 */
  display: inline-block;
}
.btn-delete:hover {
  background-color: #ff867c;
}

.btn-status {
  background-color: #e6a23c;
  color: white;
}

.pagination {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pagination button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
}

.pagination button.active {
  background-color: #409eff;
  color: white;
  font-weight: bold;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 浮動按鈕：廚餘桶 */
.btn-trash-float {
  position: fixed;
  bottom: 60px;
  right: 30px;
  background-color: #ff7043;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0,0,0,0.3);
  z-index: 99;
}
.btn-trash-float:hover {
  background-color: #ff8a65;
}

/* 彈窗樣式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
}
.btn-restore {
  padding: 6px 14px;
  background-color: #7c4dff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-restore:hover {
  background-color: #9575cd;
}
.btn-close {
  margin-top: 1rem;
  background-color: #999;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
</style>