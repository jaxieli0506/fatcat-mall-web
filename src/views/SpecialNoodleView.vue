<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router' // add by JJ

const route = useRoute() // add by JJ

const selectedCategory = ref('')     // 先給空，等資料來了再設
const categories = ref([])           // 動態分類
const allProducts = ref([])          // 從 API 抓到的全部特殊款泡麵
const products = ref([])             // 篩選後顯示的資料
const isLoading = ref(true)
const loadError = ref(null)

const fetchSpecialProducts = async () => {
  isLoading.value = true
  loadError.value = null
  try {
    const res = await fetch('https://localhost:7017/api/Products/special')
    const data = await res.json()

    // 格式化
    const formatted = data.map(p => ({
      id: p.productsId,
      name: p.name,
      imageUrl: `/ProductImages/${p.imageUrl}`,
      tag: p.sortName || '未分類'
    }))

    allProducts.value = formatted

    // 建分類
    const uniqueCategories = [...new Set(formatted.map(p => p.tag))]
    categories.value = uniqueCategories

    // 設預設分類（有資料才設）
    if (uniqueCategories.length > 0) {
      selectedCategory.value = uniqueCategories[0]
    } else {
      selectedCategory.value = ''
    }

    filterProducts()
  } catch (err) {
    console.error('載入特殊泡麵失敗:', err)
    loadError.value = '載入失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

const filterProducts = () => {
  if (!selectedCategory.value) {
    products.value = allProducts.value
  } else {
    products.value = allProducts.value.filter(p => p.tag === selectedCategory.value)
  }
}

watch(selectedCategory, filterProducts)

// onMounted(fetchSpecialProducts)
// 修改 by JJ
onMounted(()=>{
  fetchSpecialProducts().then(()=>{
    // 如果網址有帶category參數，則自動選擇該分類
    if (route.query.category) {
      selectedCategory.value = route.query.category
    }
  })
}) 
// 監聽網址 query 變化，自動切換分類 by JJ
watch(
  () => route.query.category,
  (newCategory) => {
    if (newCategory && categories.value.includes(newCategory)) {
      selectedCategory.value = newCategory
    }
  }
)
</script>

<template>
  <div class="special-page">
    <!-- 左側分類 -->
    <aside class="category-menu">
      <h3 class="menu-title">🍜 商品分類</h3>
      <ul>
        <li
        v-for="category in categories"
        :key="category"
        :class="{ active: selectedCategory === category }"
        @click="selectedCategory = category"
        >
          <i class="bi bi-caret-right-fill"></i>
          {{ category }}
        </li>
      </ul>
    </aside>

    <!-- 商品展示 -->
    <section class="product-section">
  <h2 class="title title-arrow">🔥 {{ selectedCategory || '全部特殊款泡麵' }}</h2>

  <div v-if="isLoading" class="loading-box">載入中…</div>
  <div v-else-if="loadError" class="error-box">{{ loadError }}</div>
  <div v-else-if="products.length === 0" class="empty-box">這個分類目前沒有商品🐾</div>
  <div v-else class="product-grid">
    <RouterLink
      v-for="product in products"
      :key="product.id"
      :to="{ name: 'onespecialnoodle', query: { id: product.id } }"
      class="product-card"
    >
      <img
        :src="product.imageUrl"
        :alt="product.name"
        class="product-image"
        @error="e => e.target.src = '/fakenoodle.jpg'"
      />
      <div class="product-info">
        <span class="product-tag">{{ product.tag }}</span>
        <h3 class="product-name">{{ product.name }}</h3>
      </div>
    </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.special-page {
  display: flex;
  padding: 2rem;
  background-image: url('/CatsWalking.gif'); /* GIF路徑 */
  background-repeat: repeat;
  background-size: 300px;
  animation: scroll 40s linear infinite;
}

/* 分類選單 */
.category-menu {
  width: 220px;
  margin-right: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5e1ff, #e0d4f7);
  border-radius: 1rem;
  box-shadow: 0 0 10px rgba(150, 130, 200, 0.3);
}

.menu-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #663399;
  margin-bottom: 1.2rem;
  text-align: center;
}

.category-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-menu li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  margin-bottom: 0.5rem;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  color: #4a2e6e;
  transition: all 0.3s ease;
  font-weight: 500;
  border-left: 5px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.category-menu li:hover i {
  animation: bounce 0.4s ease;
  color: #d63384;
}

.category-menu li:hover {
  background: linear-gradient(135deg, #e2ccff, #ffe0f7);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(175, 100, 255, 0.4);
  color: #6a1ea1;
}

.category-menu li.active {
  background-color: #ff4d4f;
  color: white;
  font-weight: bold;
  border-left: 5px solid #cc0000;
}

.product-section {
  flex: 1;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #663399;
  margin-bottom: 1.5rem;
}

.title-arrow {
  display: inline-block;
  position: relative;
  color: white;
  background-color: #b48ce3; /* 淡紫色底 */
  padding: 0.7rem 2rem 0.7rem 1.5rem;
  font-size: 1.6rem;
  font-weight: bold;
  clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%);
  margin-bottom: 2rem;
  box-shadow: 0 3px 8px rgba(100, 50, 150, 0.3);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.product-card {
  display: block; /* RouterLink 是 inline by default，要顯示區塊 */
  text-decoration: none; /* 移除底線 */
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

/* 動畫背景可加這個做平滑滑動 (optional) */
@keyframes bounce {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(4px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>