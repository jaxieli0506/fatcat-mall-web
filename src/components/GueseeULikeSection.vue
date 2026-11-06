<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 猜你喜歡商品列表
const products = ref([])

onMounted(async () => {
  try {
    // 並行抓取產品與圖片
    const [productRes, imageRes] = await Promise.all([
      axios.get('https://localhost:7017/api/Products'),
      axios.get('https://localhost:7017/api/ProductImages')
    ])

    const productList = productRes.data
    const imageList = imageRes.data

    // 1️⃣ 隨機打亂商品順序
    const shuffled = productList.sort(() => 0.5 - Math.random())

    // 2️⃣ 選擇前三筆
    const selected = shuffled.slice(0, 3)

    // 3️⃣ 合併圖片與商品資料
    const result = selected.map(p => {
      const mainImage = imageList.find(img => img.productId === p.productsId && img.isMain === 1)
      return {
        id: p.productsId,
        name: p.name,
        imageUrl: mainImage
          ? `https://localhost:7017/ProductImages/${mainImage.imageUrl}` // ✅ 改這裡
          : '/ProductImages/default.jpg',
        tag: '推薦'
      }
    })

    products.value = result
  } catch (error) {
    console.error('猜你喜歡資料抓取失敗:', error)
  }
})
</script>

<template>
  <ul class="list-group mb-3">
    <li class="list-group-item">
      <h3>猜你喜歡</h3>
    </li>
    <li class="list-group-item d-flex gap-2">
      <div class="product-grid">
        <RouterLink
          v-for="product in products"
          :key="product.id"
          :to="{ name: 'onespecialnoodle', query: { id: product.id } }"
          class="product-card"
        >
          <img :src="product.imageUrl" :alt="product.name" class="product-image" />
          <div class="product-info">
            <span class="product-tag">{{ product.tag }}</span>
            <h3 class="product-name">{{ product.name }}</h3>
          </div>
        </RouterLink>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.product-grid {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  flex-wrap: nowrap;
}
.product-card {
  flex: 1 1 30%;
  max-width: 30%;
  display: block;
  text-decoration: none;
  background-color: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  cursor: pointer;
}
.product-card:hover {
  transform: translateY(-5px);
}
.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  margin-top: 10px;
}
.product-info {
  padding: 1rem;
  text-align: center;
}
.product-tag {
  display: inline-block;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  background-color: #ff8c00;
  color: white;
  border-radius: 999px;
  margin-bottom: 0.5rem;
}
.product-name {
  font-size: 1.1rem;
  color: #4a2e6e;
  font-weight: bold;
}
</style>
