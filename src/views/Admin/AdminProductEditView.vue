<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const productId = route.params.id

// ===== 狀態 =====
const product = ref(null)
const categories = ref([])
const sorts = ref([])
const allTags = ref([])            // 所有標籤
const selectedTagIds = ref([])     // 被選中的 tagId 陣列
const isLoading = ref(true)
const formErrors = ref([])

// ===== API：取得資料 =====
const fetchProduct = async () => {
  try {
    const res = await fetch(`https://localhost:7017/api/AdminProducts/${productId}`)
    if (!res.ok) throw new Error('找不到該商品')
    const data = await res.json()

    // ✅ 補上圖片前綴並清理重複 /ProductImages/
    data.images.forEach(img => {
      if (!img.imageUrl.startsWith('http')) {
        const cleaned = img.imageUrl.replace(/^\/+ProductImages\/+/, '/ProductImages/')
        img.imageUrl = `https://localhost:7017${cleaned}`
      }
    })

    product.value = data
  } catch (err) {
    alert('取得商品失敗，請稍後再試')
    console.error(err)
    router.push({ name: 'AdminProducts' })
  }
}

const fetchCategories = async () => {
  const res = await fetch('https://localhost:7017/api/ProductCategories')
  categories.value = await res.json()
}

const fetchSorts = async () => {
  const res = await fetch('https://localhost:7017/api/Sorts')
  sorts.value = await res.json()
}

// ===== 小分類篩選（根據種類）=====
const filteredSorts = computed(() => {
  if (!product.value || !product.value.categoryId) return []
  return sorts.value.filter(sort => sort.categoryId === product.value.categoryId)
})

// ===== 初始化 =====
onMounted(async () => {
  await Promise.all([
    fetchProduct(),
    fetchCategories(),
    fetchSorts(),
    fetchTags(),           // 取得所有標籤
    fetchProductTags()     // 取得該商品目前的標籤
  ])

  // 等資料抓好後再監聽分類變更
  // 監聽分類變更後，自動清空小分類（避免舊的 sortId 殘留）
  // 注意：這個 watch 被寫在 onMounted 裡是安全的，因為 setup 只執行一次
  // 不會有重複註冊的問題（除非將來抽成方法或 composable 才需要改）
  watch(() => product.value.categoryId, () => {
    product.value.sortId = ''
  })

  isLoading.value = false
})

// ===== 表單驗證 =====
const validateForm = () => {
  formErrors.value = []

  if (product.value.price < 0) formErrors.value.push('價格不能為負數')
  if (product.value.stock < 0) formErrors.value.push('庫存不能為負數')
  if (product.value.stockAlert && product.value.lowerthanAlert < 0)
    formErrors.value.push('提醒下限不能為負數')

  return formErrors.value.length === 0
}

// ===== 更新商品 =====
const updateProduct = async () => {
  if (!validateForm()) return

  try {
    const res = await fetch(`https://localhost:7017/api/AdminProducts/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product.value)
    })

    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || '更新失敗，請檢查欄位是否正確')
    }

    // 🏷️ 同步更新標籤
    await saveProductTags()

    // 成功流程
    alert('✅ 更新成功！')
    router.push({ name: 'AdminProducts' })

  } catch (err) {
    alert(`❌ 更新失敗：${err.message}`)
    console.error(err)
  }
}

// ===== 圖片處理 =====
const uploadImage = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch(`https://localhost:7017/api/AdminProducts/${productId}/images`, {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      const newImage = await res.json()

      // ✅ 加這段：補上 /ProductImages/
      if (!newImage.imageUrl.startsWith('http')) {
        newImage.imageUrl = `https://localhost:7017/ProductImages/${newImage.imageUrl}`
      }

      product.value.images.push(newImage)
    } else {
      alert('❌ 上傳圖片失敗')
    }
  } catch (err) {
    alert('⚠️ 圖片上傳錯誤')
    console.error(err)
  }
}

const deleteImage = async (imageId) => {
  try {
    await fetch(`https://localhost:7017/api/AdminProducts/images/${imageId}`, {
      method: 'DELETE'
    })
    product.value.images = product.value.images.filter(img => img.productImagesId !== imageId)
  } catch (err) {
    alert('⚠️ 刪除圖片失敗')
    console.error(err)
  }
}

const setMainImage = async (imageId) => {
  try {
    await fetch(`https://localhost:7017/api/AdminProducts/images/${imageId}/set-main`, {
      method: 'POST'
    })
    product.value.images.forEach(img => {
      img.isMain = img.productImagesId === imageId ? 1 : 0
    })
  } catch (err) {
    alert('⚠️ 設為主圖失敗')
    console.error(err)
  }
}

// 取得所有標籤
const fetchTags = async () => {
  const res = await fetch('https://localhost:7017/api/Tags')
  const data = await res.json()
  allTags.value = data
}

// 取得該商品已有標籤
const fetchProductTags = async () => {
  const res = await fetch(`https://localhost:7017/api/AdminProducts/${productId}/tags`)
  const data = await res.json()
  selectedTagIds.value = data.map(t => t.tagsId)
}

// 儲存標籤（在儲存商品時一起送出）
const saveProductTags = async () => {
  await fetch(`https://localhost:7017/api/AdminProducts/${productId}/tags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(selectedTagIds.value)
  })
}

const cancelEdit = () => {
  const confirmed = confirm('確定要取消修改嗎？未儲存的變更將會遺失喔！')
  if (confirmed) {
    router.push({ name: 'AdminProducts' }) // 換成你的商品列表路由名稱
  }
}
</script>

<template>
  <div v-if="!isLoading" class="edit-wrapper">
    <h2>📝 編輯商品</h2>

    <form @submit.prevent="updateProduct" class="edit-form">
      <!-- 左欄：商品基本資訊 -->
      <div class="form-left">
        <label>名稱
          <input v-model="product.name" />
        </label>

        <label>描述
          <textarea v-model="product.description" />
        </label>

        <label>價格
          <input type="number" v-model.number="product.price" min="0" />
        </label>

        <label>庫存
          <input type="number" v-model.number="product.stock" min="0" />
        </label>

        <label>提醒下限
          <input type="number" v-model.number="product.lowerthanAlert" min="0" />
        </label>
        <div class="tag-area">
          <h4>🏷️ 商品標籤</h4>
          <div class="tag-list">
            <label
              v-for="tag in allTags"
              :key="tag.tagsId"
              class="tag-item"
            >
              <input
                type="checkbox"
                :value="tag.tagsId"
                v-model="selectedTagIds"
              />
              {{ tag.name }}
            </label>
          </div>
        </div>
      </div>

      <!-- 右欄：狀態、分類、圖片 -->
      <div class="form-right">
        <label>狀態
          <select v-model="product.status">
            <option :value="1">上架</option>
            <option :value="0">下架</option>
          </select>
        </label>

        <label>種類
          <select v-model="product.categoryId">
            <option v-for="cat in categories" :key="cat.productCategoriesId" :value="cat.productCategoriesId">
              {{ cat.name }}
            </option>
          </select>
        </label>

        <label>小分類
            <select v-model="product.sortId">
                <option v-for="sort in filteredSorts" :key="sort.sortId" :value="sort.sortId">
                    {{ sort.name }}
                </option>
            </select>
        </label>

        <div class="toggle-wrapper">
          <span class="toggle-label">啟用庫存提醒</span>
          <label class="switch">
            <input type="checkbox" v-model="product.stockAlert" />
            <span class="slider"></span>
          </label>
        </div>             

        <!-- 🖼️ 圖片區 -->
        <div class="image-area">
          <h4>商品圖片</h4>
          <input type="file" @change="uploadImage" />

          <div class="img-list">
            <div v-for="img in product.images" :key="img.productImagesId" class="img-card">
              <img :src="img.imageUrl" />
              <button @click.prevent="deleteImage(img.productImagesId)" class="image-button">刪除</button>
              <button
                v-if="img.isMain !== 1"
                @click.prevent="setMainImage(img.productImagesId)"
                class="image-button"
              >
                設主圖
              </button>
              <span v-else class="main-label">主圖</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="action-button">✔ 儲存變更</button>
        <button type="button" class="action-button" @click="cancelEdit">❌ 取消修改</button>
      </div>
    </form>
  </div>
</template>

<style lang="css" scoped>
.edit-wrapper {
  padding: 2rem;
  max-width: 1200px;
  margin: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.06);
}

.edit-form {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.form-left,
.form-right {
  flex: 1;
  min-width: 300px;
}

form label {
  display: block;
  margin-bottom: 1.2rem;
  font-weight: bold;
  color: #333;
}

form input,
form textarea,
form select {
  width: 100%;
  padding: 10px;
  margin-top: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  box-sizing: border-box;
}

form textarea {
  resize: vertical;
  min-height: 80px;
}

.tag-area {
  margin-top: 1.5rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.5rem;
}

.tag-item {
  background: #f6f0ff;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #c9aaff;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.3s ease;
}

.tag-item:hover {
  background: #e9d8ff;
}

.image-area {
  margin-top: 2rem;
}

.img-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.img-card {
  width: 120px;
  text-align: center;
}

.img-card img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.image-button {
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 0.85rem;
  background-color: #ede7f6;
  color: #7c4dff;
  border: 1px solid #d1b3ff;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.image-button:hover {
  background-color: #d1b3ff;
  color: white;
}

.main-label {
  display: block;
  color: #2e7d32;
  font-weight: bold;
  margin-top: 6px;
}

.toggle-wrapper {
  display: flex;
  flex-direction: column; /* 讓它變成上下排列 */
  align-items: flex-start; /* 或 center */
  gap: 6px;
  margin-top: 1rem;
}

.toggle-label {
  font-size: 1rem;
  user-select: none;
  line-height: 1.3;
}

/* 開關外框 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

/* 隱藏原生 checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* 滑動按鈕 */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc; /* 預設灰色 */
  transition: 0.4s;
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

/* 開啟狀態顏色 */
.switch input:checked + .slider {
  background-color: #4caf50; /* 綠色 */
}

.switch input:checked + .slider:before {
  transform: translateX(22px);
}

.form-actions {
  width: 100%;
  margin-top: 2rem;
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 3rem; /* 按鈕之間的距離 */
}

.action-button {
  padding: 10px 24px;
  background-color: #7c4dff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: 0.3s;
}

.action-button:hover {
  background-color: #9575cd;
}
</style>