<script setup>
import { ref, onMounted } from 'vue'

const products = ref([])

const fetchSpecialNoodles = async () => {
  try {
    const res = await fetch('https://localhost:7017/api/Products/special')
    const data = await res.json()

    // 顯示前 4 筆資料並格式化圖片路徑
    products.value = data.slice(0, 4).map(p => ({
      id: p.productsId,
      name: p.name,
      imageUrl: `/ProductImages/${p.imageUrl}`,
      tag: '強檔'
    }))
  } catch (error) {
    console.error('無法取得特殊款泡麵資料:', error)
  }
}

onMounted(() => {
  fetchSpecialNoodles()
})
</script>

<template>
  <section class="hot-products">
    <div class="bg-overlay"></div>
    <h2 class="section-title">🔥 特殊款泡麵推薦</h2>
    <p class="subtitle">給有選擇障礙的你</p>

    <div class="product-list">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-tag"> {{ product.tag }} </div>
        <img :src="product.imageUrl" :alt="product.name" class="product-image" />
        <div class="product-name">{{ product.name }}</div>
      </div>
    </div>

    <RouterLink :to="{name:'specialnoodle'}"><button class="more-btn">查看更多 ➜</button></RouterLink>
  </section>
</template>

<style scoped>
.hot-products {
  position: relative;
  padding: 40px 20px;
  text-align: center;
  background-image: url('/CatsWalking.gif');
  background-repeat: repeat;
  background-size: 300px;
  background-attachment: fixed;
  overflow: hidden;
  border-top: 6px double #ffcc80;
  border-bottom: 6px double #ffcc80;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 240, 200, 0.5), rgba(255, 240, 200, 0.4));
  z-index: 0;
  pointer-events: none;
}

.hot-products > *:not(.bg-overlay) {
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 36px;
  font-weight: bold;
  color: #d47b00;
  text-shadow: 1px 1px 3px #fff6d5;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 20px;
  color: #8b5e00;
  margin-bottom: 30px;
  font-weight: 600;
  font-style: italic;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  margin-bottom: 30px;
}

.product-card {
  background: linear-gradient(to bottom, #fffaf0, #ffe6ba);
  border: 2px solid #f5c673;
  border-radius: 16px;
  width: 300px;
  box-shadow: 0 4px 10px rgba(216, 145, 0, 0.2);
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 0 12px 6px rgba(255, 250, 220, 0.6),
    0 0 20px 10px rgba(255, 240, 200, 0.4),
    0 6px 14px rgba(255, 230, 180, 0.3);
  z-index: 2;
  animation: glowWhiteGold 1.5s ease-in-out infinite alternate;
}

.product-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(45deg, #ff9800, #ffd700);
  color: white;
  font-weight: bold;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.product-name {
  padding: 14px;
  font-size: 18px;
  font-weight: bold;
  color: #5c3c00;
  text-shadow: 0 1px 1px #fff6e5;
}

.more-btn {
  background: linear-gradient(to right, #ff9800, #ffc766);
  color: white;
  font-weight: bold;
  font-size: 16px;
  padding: 10px 26px;
  border: none;
  border-radius: 30px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.more-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(255, 170, 0, 0.3);
}
</style>
