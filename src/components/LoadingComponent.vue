<script setup>
import { ref, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart' // ✅ 引入購物車 store

const cartStore = useCartStore()
// 塔羅功能
const cards = ref([])
const selectedIndex = ref(null)
const mode = ref('loading')

// 貓頭預言師功能
const prophecyText = ref('')
const showProphecy = ref(false)
const isTriggeredByClick = ref(false)
const prophecies = [
  '今天穿橘色 🌶️',
  '今天不宜偷懶 🐾',
  '信pingu得永生 🍜',
  '相信泡麵，相信命運 ✨',
  '今天是拉麵星逆行的一天 🌘'
]
const clickProphecies = [
  '戳什麼戳 😾',
  '本喵不喜歡被摸 🙀',
  '走開人類 🐾',
  '有事嗎？沒事別吵我 😼',
  '嘶...再戳我就報警 ☎️'
]
const showProphecyNow = (text) => {
  prophecyText.value = text
  showProphecy.value = true
  setTimeout(() => {
    showProphecy.value = false
    isTriggeredByClick.value = false
  }, 4000)
}

const randomAutoProphecy = () => {
  if (isTriggeredByClick.value) return
  const random = prophecies[Math.floor(Math.random() * prophecies.length)]
  showProphecyNow(random)
}

const triggerClickProphecy = () => {
  isTriggeredByClick.value = true
  const random = clickProphecies[Math.floor(Math.random() * clickProphecies.length)]
  showProphecyNow(random)
}

// 撈取特殊泡麵
const fetchSpecialNoodles = async () => {
  try {
    const res = await fetch('https://localhost:7017/api/Products/special')
    const data = await res.json()
    cards.value = data.slice(0, 12).map(p => ({
      id: p.productsId,          // 加入 id
      name: p.name,
      price: p.price,            // 加入 price
      image: `/ProductImages/${p.imageUrl}`,
      description: p.description || '一碗神秘的泡麵...'
    }))
  } catch (err) {
    console.error('泡麵資料取得失敗', err)
  }
}

const handleCardClick = (index) => {
  if (mode.value !== 'loading') return // 避免重複抽
  selectedIndex.value = index
  mode.value = 'result'
}

const startDraw = () => {
  mode.value = 'spinning'
  setTimeout(() => {
    selectedIndex.value = Math.floor(Math.random() * cards.value.length)
    mode.value = 'result'
  }, 1200)
}

const reset = () => {
  mode.value = 'loading'
  selectedIndex.value = null
}

// ✅ 加入購物車功能
const addToCart = (noodle) => {
  const itemToAdd = {
    id: noodle.id,
    name: noodle.name,
    price: noodle.price || 0,
    image: noodle.image
  }
  cartStore.addItem(itemToAdd)
  alert(`✅ 已將 ${noodle.name} 加入購物車！`)
}

// 初始化：抓泡麵 & 開啟貓咪預言循環
onMounted(() => {
  fetchSpecialNoodles()
  setInterval(randomAutoProphecy, 5000)
})
</script>

<template>
  <div class="tarot-container">
  <h1 class="title">今日的命運泡麵是...</h1>
  <!-- 包住卡牌的容器 -->
  <div class="cards-wrapper">
    <div
      v-for="(card, index) in cards"
      :key="index"
      class="card"
      @click="handleCardClick(index)"
    >
      <div
        class="card-inner"
        :class="{ flipped: selectedIndex === index && mode === 'result' }"
      >
        <!-- 背面 -->
        <div class="card-back">
          <img src="/card-back.png" alt="卡牌背面" />
        </div>
        <!-- 正面 -->
        <div class="card-front">
          <img :src="card.image" alt="泡麵圖" />
          <h3>{{ card.name }}</h3>
        </div>
      </div>
    </div>
  </div>

  <!-- START 按鈕 -->
  <button v-if="mode === 'loading'" class="start-btn" @click="startDraw">START</button>

  <!-- 結果 -->
  <div v-if="mode === 'result'" class="result-info">
    <p>{{ cards[selectedIndex].description }}</p>
    <div class="result-actions">
      <button @click="reset">再抽一次</button>
      <button @click="addToCart(cards[selectedIndex])">加入購物車</button>
    </div>
  </div>
  <!-- 貓頭預言師 -->
  <div class="cat-prophet">
    <img
      src="/cat-head.png"
      alt="預言貓"
      class="cat-head"
      @click="triggerClickProphecy"
    />
    <div class="prophecy" v-if="showProphecy">{{ prophecyText }}</div>
  </div>
</div>
</template>

<style scoped>
.tarot-container {
  background-image: url('/starry-sky.png'); /* 你放的星空圖路徑 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: white;
  min-height: 100vh;
  padding: 2rem 1rem;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  color: transparent;
  background: linear-gradient(45deg, #ffcdf2, #d08fff, #a066ff);
  background-clip: text;
  -webkit-background-clip: text;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.cards-wrapper {
  display: grid;
  grid-template-columns: repeat(6, 1fr); /* 一排6張 */
  gap: 1.5rem;
  justify-content: center;
  margin: 2rem auto;
  max-width: 1000px;
}

.card {
  width: 180px;
  height: 260px;
  perspective: 1000px;
  position: relative;
  overflow: visible;
  transition: transform 0.3s ease;
}

.card-front img,
.card-back img {
  padding: 0;
  border: none;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.8s ease;
  transform-style: preserve-3d;
}

.card-inner.flipped {
  transform: rotateY(180deg);
  box-shadow: 0 0 30px 10px rgba(255, 255, 255, 0.8), 0 0 40px 20px rgba(138, 43, 226, 0.5); /* 白光 + 紫光 */
  border-radius: 10px;
}

.card-front,
.card-back {
  width: 100%;
  height: 100%;
  position: absolute;
  backface-visibility: hidden;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #999;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
}

.card-back {
  min-width: 100%;
  min-height: 100%;
  background: transparent;
  transform: rotateY(0deg);
  display: flex; /* 圖片置中並撐滿容器 */
  align-items: center;
  justify-content: center;
}

.card-back img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 避免圖片拉爆、被切角 */
  padding: 0px;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1); /* 小小發光而非白邊 */
}

.card-front {
  background: #fff;
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.card-front h3 {
  font-size: 14px;
  margin-top: 0.5rem;
  color: #333;
}

.card-front img {
  width: 100%;
  height: 120px;
  object-fit: contain;
  padding: 10px;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card:hover {
  transform: scale(1.1);
  box-shadow: 0 0 25px rgba(153, 102, 255, 0.6); /* 紫色光暈 */
  z-index: 2;
}

.start-btn {
  margin-top: 2rem;
  font-size: 24px;
  padding: 12px 32px;
  background: linear-gradient(45deg, #ff94d4, #cc7eff);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: white;
  font-weight: bold;
  transition: transform 0.2s;
}

.start-btn:hover {
  transform: scale(1.05);
}

.result-info {
  margin-top: 2rem;
}

.result-info p {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffeaff;
  animation: sparkleText 2.5s infinite;
  text-shadow: 0 0 6px #d47cff, 0 0 12px #9d4eff;
}

@keyframes sparkleText {
  0%, 100% {
    opacity: 1;
    text-shadow: 0 0 6px #d47cff, 0 0 12px #9d4eff;
  }
  50% {
    opacity: 0.7;
    text-shadow: 0 0 2px #ffffff;
  }
}

.result-actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.result-actions button {
  padding: 12px 24px;
  border-radius: 20px;
  background: linear-gradient(to right, #e9aaff, #ba68ff);
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  box-shadow: 0 0 10px rgba(170, 85, 255, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.result-actions button:hover {
  transform: scale(1.08);
  box-shadow: 0 0 16px rgba(200, 100, 255, 0.8);
}

.cat-prophet {
  position: fixed;
  bottom: 40px;
  left: 20px;
  animation: floaty 5s ease-in-out infinite;
  z-index: 10;
}

.cat-head {
  width: 60px;
  filter: drop-shadow(0 0 6px #fff);
}

.prophecy {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffffcc;
  color: #4c007d;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  animation: fadeInOut 4s ease-in-out;
  white-space: nowrap;
}

@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}

.cat-head:active {
  animation: shake 0.3s;
}
@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
</style>
