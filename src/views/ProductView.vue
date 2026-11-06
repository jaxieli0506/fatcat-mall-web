<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProductReview from '@/components/ProductReview.vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const route = useRoute()
const productId = route.query.id
const product = ref(null)

const fetchProductDetail = async () => {
  try {
    const res = await fetch(`https://localhost:7017/api/Products/Details/${productId}`)
    const data = await res.json()
    product.value = data
  } catch (error) {
    console.error('無法取得商品資料:', error)
  }
}

const addToCart = () => {
  if (!product.value) {
    alert('尚未載入商品，無法加入購物車')
    return
  }

  cartStore.addItem({
    id: product.value.productsId,
    name: product.value.name,
    price: product.value.price ?? 0,
    image: product.value.imageUrl || ''
  })

  alert('✨ 已加入購物車！')
}

onMounted(() => {
  fetchProductDetail()
})
</script>

<template>
  <div class="page-background">
    <div class="product-card" v-if="product">
      <div class="product-grid">
        <!-- 左圖 -->
        <div class="left-panel">
          <img :src="product.imageUrl" :alt="product.name" class="main-image" />
        </div>

        <!-- 右文 -->
        <div class="right-panel">
          <h1 class="product-name">{{ product.name }}</h1>
          <p class="price">💰 ${{ product.price }}</p>
          <p class="meta">
            分類：{{ product.categoryName }} / {{ product.sortName }}<br />
            庫存：{{ product.stock }} 個<br />
            狀態：
            <span :class="product.status === 1 ? 'on-sale' : 'off-sale'">
              {{ product.statusText }}
            </span>
          </p>

          <p class="description">{{ product.description }}</p>

          <div class="action-buttons">
            <button class="action-button cart-btn" @click="addToCart">加入購物車 ✨</button>
            <button class="action-button favorite-btn">💖 收藏</button>
          </div>

          <div class="button-row">
            <RouterLink :to="{ name: 'productlist' }">
              <button class="back-btn">← 返回商品列表</button>
            </RouterLink>
            <RouterLink :to="{ name: 'specialnoodle' }">
              <button class="back-btn">查看特殊款泡麵 ➜</button>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="product" class="comment-box">
      <h2 class="comment-title">🔮 魔法評論區</h2>
       <!-- RRRRRRRRRR 評論區 -->
        <ProductReview :product-id="route.query.id" />
    </div>

    <div v-else class="loading">載入中...</div>
  </div>
</template>

<style scoped>
.page-background {
  background-image: url('/starry-sky.png');
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.page-background::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(18px);
  background: rgba(255, 255, 255, 0.03);
  z-index: 0;
}

.product-card {
  background-image: url('/tarot-card.png');
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 24px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 40px rgba(255, 200, 255, 0.4);
  max-width: 1200px;
  width: 100%;
  color: #eeeafc;
  position: relative;
  z-index: 1;
  padding: 32px;
  background-position: center;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 32px;
}

.left-panel {
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-image {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(255, 220, 255, 0.4);
  transition: all 0.4s ease;
}

.main-image:hover {
  transform: scale(1.05);
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-weight: bold;
}

.product-name {
  font-size: 2.2rem;
  font-weight: bold;
  color: #ffccff;
  text-shadow: 0 0 8px #bb88ff;
}

.price {
  font-size: 1.5rem;
  color: #ffe066;
  text-shadow: 0 0 5px #ffcc00;
}

.meta, .description {
  font-size: 1rem;
  color: #ddd;
  line-height: 1.6;
}

.description {
  margin-top: 8px;
}

.on-sale {
  color: #adff2f;
  font-weight: bold;
  text-shadow: 0 0 5px #aaff99;
}
.off-sale {
  color: #aaa;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-button {
  padding: 10px 18px;
  font-size: 1rem;
  border-radius: 999px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cart-btn {
  background: linear-gradient(135deg, #ffb6ff, #bca3ff);
  color: #4a2e6e;
  box-shadow: 0 0 10px rgba(200, 100, 255, 0.4);
}

.favorite-btn {
  background: linear-gradient(135deg, #ffd6e8, #f3baff);
  color: #6e2e4a;
  box-shadow: 0 0 10px rgba(255, 150, 200, 0.3);
}

.action-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 16px rgba(255, 200, 255, 0.6);
}

.button-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.back-btn {
  background-color: #d9c7eb;
  color: #4a2e6e;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.3s;
}

.back-btn:hover {
  background-color: #c5b0e0;
  color: white;
}

.comment-box {
  margin-top: 32px;
  width: 100%;
  max-width: 1200px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(4px);
  box-shadow: inset 0 0 12px rgba(190, 160, 255, 0.3);
  position: relative;
  z-index: 1;
}

.comment-title {
  font-size: 1.4rem;
  margin-bottom: 12px;
  color: #ffccff;
  text-shadow: 0 0 8px #bb88ff;
}

.loading {
  color: #ccc;
  font-size: 1.5rem;
  text-align: center;
  margin-top: 40px;
}

/* 🔁 RWD */
@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr;
  }

  .right-panel {
    padding-left: 0;
  }

  .main-image {
    max-width: 300px;
  }
}
</style>
