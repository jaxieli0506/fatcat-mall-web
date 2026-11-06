<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const product = ref({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  status: 1,
  categoryId: '',
  sortId: '',
  sortOrder: 1,
  stockAlert: false,
  lowerthanAlert: null,
  tags: [],
  images: []
})

// 資料
const categories = ref([])
const sorts = ref([])
const tags = ref([])
const imagePreviews = ref([])

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchSorts(),
    fetchTags()
  ])
})

const fetchCategories = async () => {
  const res = await fetch('https://localhost:7017/api/ProductCategories')
  categories.value = await res.json()
}

const fetchSorts = async () => {
  const res = await fetch('https://localhost:7017/api/Sorts')
  sorts.value = await res.json()
}

const fetchTags = async () => {
  const res = await fetch('https://localhost:7017/api/Tags')
  tags.value = await res.json()
}

const handleImageUpload = (e) => {
  const files = Array.from(e.target.files)
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (evt) => {
      imagePreviews.value.push({
        file: file,
        previewUrl: evt.target.result,
        isMain: false
      })
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

const setAsMain = (index) => {
  imagePreviews.value.forEach((img, i) => {
    img.isMain = (i === index)
  })
}

const removeImage = (index) => {
  imagePreviews.value.splice(index, 1)
}

const uploadAllImages = async (productId) => {
  const uploadedImages = []

  for (const img of imagePreviews.value) {
    const formData = new FormData()
    formData.append('file', img.file)

    const res = await fetch(`https://localhost:7017/api/AdminProducts/${productId}/images`, {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    uploadedImages.push({
      imageId: data.productImagesId, // ✅ 正確名稱
      imageUrl: data.imageUrl,
      isMain: img.isMain
    })
  }

  return uploadedImages
}

const submitProduct = async () => {
  try {
    const res = await fetch('https://localhost:7017/api/AdminProducts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product.value)
    })

    if (!res.ok) throw new Error('商品新增失敗')

    const data = await res.json()
    const productId = data.productId

    const uploadedImages = await uploadAllImages(productId)

    const mainImage = uploadedImages.find(img => img.isMain)
    if (mainImage && mainImage.imageId) {
      await fetch(`https://localhost:7017/api/AdminProducts/images/${mainImage.imageId}/set-main`, {
        method: 'POST'
      })
    }

    alert('✅ 商品建立成功！')
    router.push({ name: 'AdminProducts' })
  } catch (err) {
    alert(`❌ 發生錯誤：${err.message}`)
    console.error(err)
  }
}

const cancelCreate = () => {
  router.push({ name: 'AdminProducts' })
}
</script>

<template>
  <div class="create-wrapper">
    <h2>🆕 新增商品</h2>

    <form class="form-grid" @submit.prevent="submitProduct">
      <!-- 商品基本資訊 -->
      <div class="form-group">
        <label>商品名稱</label>
        <input v-model="product.name" type="text" />
      </div>

      <div class="form-group">
        <label>商品描述</label>
        <textarea v-model="product.description" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>價格</label>
          <input v-model.number="product.price" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>庫存</label>
          <input v-model.number="product.stock" type="number" min="0" />
        </div>
      </div>

      <!-- 上架狀態與分類 -->
      <div class="form-row">
        <div class="form-group">
          <label>商品狀態</label>
          <select v-model="product.status">
            <option :value="1">上架</option>
            <option :value="0">下架</option>
          </select>
        </div>
        <div class="form-group">
          <label>商品種類</label>
          <select v-model="product.categoryId">
            <option value="">請選擇</option>
            <option v-for="cat in categories" :key="cat.productCategoriesId" :value="cat.productCategoriesId">
                {{ cat.name }}
            </option>
           </select>
        </div>
        <div class="form-group">
          <label>商品小分類</label>
          <select v-model="product.sortId">
            <option value="">請選擇</option>
            <option v-for="sort in sorts" :key="sort.sortId" :value="sort.sortId">
                {{ sort.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 庫存提醒 -->
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="product.stockAlert" />
          啟用庫存提醒
        </label>
        <div v-if="product.stockAlert" class="form-group">
          <label>庫存下限</label>
          <input v-model.number="product.lowerthanAlert" type="number" min="0" />
        </div>
      </div>

      <!-- 排序 -->
      <div class="form-group">
        <label>商品排序</label>
        <input v-model.number="product.sortOrder" type="number" min="1" />
      </div>

      <!-- 圖片上傳區（等一下來做） -->
      <div class="form-group">
        <label>商品圖片</label>
        <input type="file" multiple accept="image/*" @change="handleImageUpload" />
        <div class="preview-images">
            <div v-for="(img, index) in imagePreviews" :key="index" class="image-box" :class="{ main: img.isMain }">
            <img :src="img.previewUrl" alt="圖片預覽" />
            <button type="button" @click="setAsMain(index)">⭐ 設為主圖</button>
            <button type="button" @click="removeImage(index)">❌ 移除</button>
            </div>
        </div>
      </div>

      <!-- 商品標籤（等一下來加） -->
      <div class="form-group">
        <label>商品標籤</label>
        <div class="tag-checkboxes">
            <label v-for="tag in tags" :key="tag.tagsId" class="tag-option">
            <input type="checkbox" :value="tag.tagsId" v-model="product.tags"/>
            {{ tag.name }}
            </label>
        </div>
      </div>

      <!-- 提交按鈕 -->
      <div class="form-actions">
        <button type="submit">✔ 儲存商品</button>
        <button type="button" class="cancel-btn" @click="cancelCreate">✖ 取消新增</button>
      </div>
    </form>
  </div>
</template>

<style lang="css" scoped>
.create-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f9f9ff;
  border-radius: 16px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #7c4dff;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.preview-images {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.image-box {
  border: 2px solid transparent;
  padding: 6px;
  border-radius: 8px;
  position: relative;
  background: #fff;
}

.image-box.main {
  border-color: gold;
}

.image-box img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
}

.tag-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f3f0ff;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #c2bdf7;
}

.form-actions {
  width: 100%;
  margin-top: 2rem;
  text-align: center;
}

.form-actions button {
  padding: 10px 24px;
  font-size: 1.1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  margin: 0 10px;
}

.form-actions button[type="submit"] {
  background-color: #7c4dff;
  color: white;
}

.form-actions button[type="submit"]:hover {
  background-color: #9575cd;
}

.cancel-btn {
  background-color: #cccccc;
  color: #333;
}

.cancel-btn:hover {
  background-color: #aaaaaa;
}
</style>