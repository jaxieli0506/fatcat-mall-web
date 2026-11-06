<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { watch } from 'vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const router = useRouter()

// 前往產品詳情
const goToProductDetail = (id) => {
  router.push({ name: 'product', query: { id } })
}

// 食材與分類資料
const products = ref([])       // 所有商品
const bowl = ref([])           // 使用者拖進碗裡的商品
const categories = ref([])     // 商品種類
const sorts = ref([])          // 商品小分類

// 使用者選擇的篩選條件
const selectedCategory = ref('')
const selectedSort = ref('')
const minPrice = ref('')
const maxPrice = ref('')

// 取得分類、小分類
const fetchFilterOptions = async () => {
  try {
    const catRes = await fetch('https://localhost:7017/api/ProductCategories')
    const allCategories = await catRes.json()
    categories.value = allCategories.filter(cat => cat.productCategoriesId !== 9)

    const sortRes = await fetch('https://localhost:7017/api/Sorts')
    const allSorts = await sortRes.json()
    sorts.value = allSorts.filter(s => s.categoryId !== 9)
  } catch (error) {
    console.error('無法取得篩選資料:', error)
  }
}

const filteredSorts = computed(() => {
  if (!selectedCategory.value) {
    return sorts.value // 沒選分類，顯示全部小分類
  }
  return sorts.value.filter(s => s.categoryId === parseInt(selectedCategory.value))
})

watch(selectedCategory, () => {
  selectedSort.value = ''  // 主分類變動時，清空小分類選項
})

// 預設載入全部商品（透過 filter API）
const fetchProducts = async () => {
  try {
    const res = await fetch('https://localhost:7017/api/Products/filter')
    const data = await res.json()
    // 這裡加上圖片路徑補全
    products.value = data.filter(p => p.categoryId !== 9).map(p => ({
      ...p,
      imageUrl: `/ProductImages/${p.imageUrl}`,
      categoryId: p.categoryId
    }))
  } catch (error) {
    console.error('無法取得商品資料:', error)
  }
}

const slider = ref(null)

const scrollLeft = () => {
  slider.value.scrollLeft -= 200
}

const scrollRight = () => {
  slider.value.scrollLeft += 200
}

// 套用使用者篩選條件
const applyFilters = async () => {
  try {
    const query = new URLSearchParams()
    if (selectedCategory.value) query.append('categoryId', selectedCategory.value)
    if (selectedSort.value) query.append('sortId', selectedSort.value)
    if (minPrice.value !== '') query.append('minPrice', minPrice.value)
    if (maxPrice.value !== '') query.append('maxPrice', maxPrice.value)

    const res = await fetch(`https://localhost:7017/api/Products/filter?${query.toString()}`)
    const data = await res.json()
    // 一樣補上圖片路徑
    products.value = data.filter(p => p.categoryId !== 9).map(p => ({
      ...p,
      imageUrl: `/ProductImages/${p.imageUrl}`,
      categoryId: p.categoryId
    }))
  } catch (error) {
    console.error('篩選商品失敗:', error)
  }
}

// 頁面載入時執行
onMounted(() => {
  fetchFilterOptions()
  fetchProducts()
})

// 拖曳邏輯：開始拖曳
const onDragStart = (product, from = 'list') => {
  event.dataTransfer.setData('product-id', product.productsId)
  event.dataTransfer.setData('from', from)
}

const showBubbles = ref(false)

const onDrop = (event) => {
  const id = parseInt(event.dataTransfer.getData('product-id'))
  const product = products.value.find(p => p.productsId === id)
  if (product && !bowl.value.some(i => i.productsId === id)) {
    bowl.value.push(product)

    // 觸發泡泡動畫
    showBubbles.value = true
    setTimeout(() => {
      showBubbles.value = false
    }, 800) // 泡泡動畫持續 0.8 秒
  }
}

// 拖回食材清單
const onDropToList = (event) => {
  const id = parseInt(event.dataTransfer.getData('product-id'))
  const from = event.dataTransfer.getData('from')

  if (from === 'bowl') {
    const index = bowl.value.findIndex(p => p.productsId === id)
    if (index !== -1) {
      bowl.value.splice(index, 1)
    }
  }
}

const removeFromBowl = (id) => {
  const index = bowl.value.findIndex(p => p.productsId === id)
  if (index !== -1) {
    bowl.value.splice(index, 1)
  }
}

const addSmartRandomIngredients = () => {
  const grouped = {}

  // 依種類分類所有商品
  for (const product of products.value) {
    const catId = product.categoryId
    if (!grouped[catId]) {
      grouped[catId] = []
    }
    grouped[catId].push(product)
  }

  let added = false

  for (const catId in grouped) {
    const items = grouped[catId]
    if (items.length === 0) continue

    const randomIndex = Math.floor(Math.random() * items.length)
    const selected = items[randomIndex]

    const existingIndex = bowl.value.findIndex(b => b.categoryId === parseInt(catId))

    if (existingIndex !== -1) {
      // 替換該分類現有的食材
      bowl.value.splice(existingIndex, 1, selected)
    } else {
      // 該分類還沒有，加進去
      bowl.value.push(selected)
    }

    added = true
  }

  if (added) {
    showBubbles.value = true
    setTimeout(() => {
      showBubbles.value = false
    }, 800)
  } else {
    alert('每個分類都已經有一個食材囉～無法再抽了 😺')
  }
}

const addToCart = () => {
  if (bowl.value.length === 0) {
    alert('請先選擇至少一樣食材再加入購物車～')
    return
  }

  bowl.value.forEach(product => {
    cartStore.addItem({
      id: product.productsId, // 注意這裡使用 id 屬性
      name: product.name,
      price: product.price ?? 0,
      image: product.imageUrl || '' // 預設圖已處理好
    })
  })

  alert('已成功加入購物車 🛒')
  bowl.value = [] // ✅ 加完清空
}
</script>

<template>
  <div class="page-wrapper">
  <div class="blur-overlay"></div> <!-- 全頁毛玻璃層 -->
  <div class="container">
    <!-- 篩選區 -->
<div class="filter-box">
  <div class="filter-group">
    <label>商品種類</label>
    <select v-model="selectedCategory">
      <option value="">全部</option>
      <option v-for="cat in categories" :key="cat.productCategoriesId" :value="cat.productCategoriesId">
        {{ cat.name }}
      </option>
    </select>
  </div>

  <div class="filter-group">
    <label>商品小分類</label>
    <select v-model="selectedSort">
      <option value="">全部</option>
      <option v-for="sort in filteredSorts" :key="sort.sortId" :value="sort.sortId">
        {{ sort.name }}
      </option>
    </select>
  </div>

  <div class="filter-group">
    <label>價格區間</label>
    <div class="price-range">
      <input type="number" v-model.number="minPrice" placeholder="最低價格" />
      <span>～</span>
      <input type="number" v-model.number="maxPrice" placeholder="最高價格" />
    </div>
  </div>

  <button class="filter-button" @click="applyFilters">套用篩選</button>
</div>
    <!-- 篩選區下方加標題 -->
<h3 class="section-title">🧂 可拖曳食材區</h3>

<!-- 食材清單，可滑動容器 + 左右按鈕 -->
<div class="product-slider-container">
  <button class="scroll-btn left" @click="scrollLeft">‹</button>

  <div class="product-slider" ref="slider" @dragover.prevent @drop="onDropToList">
    <div
      v-for="product in products"
      :key="product.productsId"
      class="ironbox"
      draggable="true"
      @dragstart="onDragStart(product, 'list')"
      @dblclick="goToProductDetail(product.productsId)"
    >
      <img class="ironbox-bg" src="/ironbox.png" alt="鐵盒背景" />
      <img class="ironbox-item" :src="product.imageUrl" :alt="product.name" />
      <div class="ironbox-name">{{ product.name }}</div>
    </div>
  </div>

  <button class="scroll-btn right" @click="scrollRight">›</button>
</div>

<!-- 碗區標題與提示 -->
<h3 class="section-title">🍜 你的泡麵碗</h3> <!-- 置中 -->

<!-- 桌子背景容器以及碗 -->
<div class="table-wrapper">
  <img src="/mytable.png" class="table-bg" alt="桌子背景" />
  <div class="bowl" @dragover.prevent @drop="onDrop">
    <!-- 湯底 -->
    <img v-if="bowl.length > 0" src="/soup.png" class="soup-base" alt="湯底" />

    <!-- 食材泡泡，漂浮顯示在湯碗旁邊 -->
    <div class="floating-bubbles">
      <div
        v-for="(item, index) in bowl"
        :key="item.productsId"
        class="bubble"
        :class="`bubble bubble-${index}`"
      >
        <img :src="item.imageUrl" :alt="item.name" class="bubble-img" />
        <span class="bubble-text">{{ item.name }}</span>
        <button class="remove-btn" @click="removeFromBowl(item.productsId)">❌</button>
      </div>
    </div>

    <!-- 泡泡動畫 -->
    <div v-if="showBubbles" class="bubble-effect"></div>
  </div>
</div>

<!-- 改為左右按鈕 -->
<div class="action-panel">
  <div class="button-group">
    <button @click="bowl = []" class="action-button">清空碗</button>
    <button @click="addSmartRandomIngredients" class="action-button">隨機抽選食材 🎯</button>
    <button class="action-button" @click="addToCart">加入購物車</button>

    <RouterLink :to="{ name: 'specialnoodle' }">
      <button class="action-button">查看特殊款泡麵 ➜</button>
    </RouterLink>
  </div>
</div>
  </div>
  </div>
</template>


<style scoped>
.page-wrapper {
  position: relative;
  min-height: 100vh;
  background-image: url('/catnightcar.png');
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  -webkit-backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.1); /* 微透明白，讓毛玻璃更柔和 */
  z-index: 0;
}

.container {
  position: relative;
  z-index: 1; /* 確保在毛玻璃上層 */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  padding-bottom: 60px;
}

.product-slider-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-bottom: 30px;
}

.product-slider {
  display: flex;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.ironbox {
  position: relative;
  width: 250px;
  height: 250px;
  flex-shrink: 0;
  cursor: grab;
}

.ironbox-bg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.ironbox-item {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 155px;
  height: 150px;
  object-fit: cover;
  z-index: 1;
  pointer-events: none;
}

.ironbox-name {
  position: absolute;
  bottom: 5px;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none; /* 避免 hover 停在名字上就卡住 */
}

.ironbox:hover .ironbox-name {
  opacity: 1;
}

/* 左右捲動按鈕 */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  font-size: 24px;
  font-weight: bold;
  padding: 6px 12px;
  cursor: pointer;
  z-index: 10;
  border-radius: 8px;
}

.scroll-btn.left {
  left: 0;
}

.scroll-btn.right {
  right: 0;
}

.scroll-btn:hover {
  background-color: #ffe0e0;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  background-color: rgba(0, 0, 0, 0.6); /* 半透明深底 */
  padding: 10px 20px;
  border: 2px solid #ffcc70;
  border-radius: 6px;
  display: inline-block;
  text-shadow:
    2px 2px 0px #663399,
   -2px -2px 0px #663399; /* 紫色描邊感 */
  margin-bottom: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); /* 底部陰影 */
}

.table-wrapper {
  position: relative;
  width: 1050px;
  overflow: visible;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-top: 40px;
  margin-bottom: 60px;
}

/* 桌子背景圖片 */
.table-bg {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: auto;
  z-index: 0;
  pointer-events: none;
}

.bowl-hint {
  text-align: center;
  font-size: 18px;
  color: whitesmoke;
  font-weight: bold;
  margin-bottom: 10px;
}

/* 碗：大小、位置 */
.bowl {
  position: relative;
  width: 600px;
  height: 600px;
  background-image: url('/pot.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  margin-bottom: 20px;
}

/* 湯底圖片 */
.soup-base {
  position: absolute;
  width: 60%;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%) scaleY(0.95);
  z-index: 0;
  pointer-events: none;
  opacity: 0.9;
}

.action-panel {
  background-color: rgba(0, 0, 0, 0.3);
  border: 3px solid #ffcc70;
  border-radius: 10px;
  padding: 20px 30px;
  margin-top: 30px;
  margin-bottom: 60px;
  width: fit-content;
  max-width: 95%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.button-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.floating-bubbles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none; /* 不擋拖曳 */
}

.bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: float 3s ease-in-out infinite alternate;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  pointer-events: auto;
  z-index: 3;
}

/* 泡泡分佈在碗的周圍位置 */
.bubble-0 { top: -30px; left: 50%; transform: translateX(-50%); }
.bubble-1 { top: 10%; left: 10%; }
.bubble-2 { top: 50%; left: -30px; transform: translateY(-50%); }
.bubble-3 { bottom: 10%; left: 10%; }
.bubble-4 { bottom: -30px; left: 50%; transform: translateX(-50%); }
.bubble-5 { bottom: 10%; right: 10%; }
.bubble-6 { top: 50%; right: -30px; transform: translateY(-50%); }
.bubble-7 { top: 10%; right: 10%; }

.bubble-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.bubble-text {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #c00;
  margin-left: 5px;
}

/*  動畫（上下漂浮） */
@keyframes float {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-10px); }
}

.action-button {
  background: linear-gradient(to right, #ffa94d, #ff6f61);
  border: none;
  color: white;
  padding: 14px 28px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 14px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.action-button:hover {
  background: linear-gradient(to right, #ffb96b, #ff8677);
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
}

.action-button:active {
  transform: scale(0.98);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.filter-box {
  background-color: rgba(255, 165, 0, 0.2); /* 半透明橘色 */
  border: 2px solid #ffa94d;               /* 同色系邊框 */
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  box-shadow: inset 0 0 8px rgba(255, 140, 0, 0.2); /* 內陰影 */
  backdrop-filter: blur(4px);                      /* 毛玻璃效果 */
  -webkit-backdrop-filter: blur(4px);
}

.filter-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.filter-group label {
  font-weight: bold;
  color: #fff;
  font-size: 14px;
  text-shadow:
    1px 1px 0 #663399,
   -1px -1px 0 #663399;  /* 紫色描邊 */
}

.filter-group select,
.price-range input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ffd280;
  min-width: 140px;
  background-color: #fff;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-button {
  background-color: rgba(255, 165, 0, 0.85);  /* 橘色半透明 */
  color: white;
  border: 2px solid #ffd280;                 /* 黃橘邊框 */
  border-radius: 4px;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-shadow: 1px 1px #aa4c00;              /* 描邊*/
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);  /* 陰影 */
}

.filter-button:hover {
  background-color: rgba(255, 190, 100, 0.95); /* Hover 淺一點橘 */
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(255, 180, 100, 0.4);
}

.filter-button:active {
  transform: scale(0.97);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.bubble-effect {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  background-image: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.4) 0%, transparent 30%),
                    radial-gradient(circle at 60% 60%, rgba(255,255,255,0.3) 0%, transparent 25%),
                    radial-gradient(circle at 50% 80%, rgba(255,255,255,0.5) 0%, transparent 35%);
  background-repeat: no-repeat;
  animation: bubble-float 0.8s ease-out forwards;
  border-radius: 50%;
}

@keyframes bubble-float {
  0% {
    opacity: 1;
    transform: translateY(0) scale(0.8);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(1.5);
  }
}
</style>
