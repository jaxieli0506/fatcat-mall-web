<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useAdminAuthStore } from './stores/adminauth'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import HeaderComponent from './components/HeaderComponent.vue'
import FooterComponent from './components/FooterComponent.vue'
import CustomerService from './components/CustomerService.vue'
import StreamLogo from './components/StreamLogo.vue'
import { useStreamStore } from './stores/streamStore' 

       
// 應用載入狀態
const appLoading = ref(true)
        
//獲取目前路由
const route = useRoute()
//計算是否需要隱藏 Header 和 Footer
const shouldhideHeaderFooter = computed(()=>{
  return route.meta.hideHeaderFooter || false
})

//記住user登入資訊
// 獲取auth store
const authStore = useAuthStore()
//記住管理員登入資訊
// 獲取admin auth store
const adminAuthStore = useAdminAuthStore() 
const streamStore = useStreamStore(); // 建立 stream store 實例

// 在組件掛載時初始化auth狀態
onMounted(async () => {
  authStore.initializeAuth()
  adminAuthStore.initializeAuth()
  streamStore.initialize(); // 【在這裡初始化 stream store】
  // 模擬初始載入時間，讓用戶看到LoadingComponent
  await new Promise(resolve => setTimeout(resolve, 2000))
  appLoading.value = false
})

// 定義 isLoading 狀態（只使用 app loading，避免 API 請求時重新渲染）
const isLoading = computed(() => appLoading.value)

// 【meta標籤】判斷當前頁面是否為管理頁面 
const isAdminPage = computed(() => {
  return route.meta.isAdminPage || false
})


</script>

<template>
  <div>
    <!--Loading 畫面 -->
    <div v-if="isLoading" class="loading-overlay">
      <img src="/loading.gif" alt="Loading" class="loading-img" />
    </div>

    <!--內容畫面 -->
    <div v-else>
      <!-- header -->
      <HeaderComponent v-if="!shouldhideHeaderFooter" />
      <main :class="['main-content', { 'with-header': !shouldhideHeaderFooter}]">
        <!-- 各種 component -->
        <RouterView />
        <!-- 右下角貓貓客服 -->
        <CustomerService v-if="!isAdminPage" />
        <!-- 直播logo -->
        <StreamLogo v-if="!isAdminPage" />
      </main>
      <!-- Footer -->
      <FooterComponent v-if="!shouldhideHeaderFooter" />
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #FF7F61; /* 或改成 #f6f0fa 淡紫色 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-img {
  width: 700px; /* 調整gif大小 */
}

/* 預設沒有間距 */
.main-content{
  padding-top: 0;
}
/* 為主要內容區域添加頂部間距,避免被固定的header擋住 */
.main-content.with-header{
  padding-top: 66px;
}

/* 響應式調整 */
/* 中等螢幕 */
@media(max-width:768px){
  .main-content.with-header{
    padding-top: 65px;
  }
}
/* 超小螢幕 */
@media(max-width:576px){
  .main-content.with-header{
    padding-top: 65px;
  }
}
</style>
