<script setup>
    import { useAuthStore } from '../stores/auth'
    import { useRouter } from 'vue-router'
    import { computed } from 'vue'
    import { useCartStore } from '@/stores/cart'
    import { useNotificationStore } from '@/stores/notification'
    import CartOffcanvas from '@/components/CartOffcanvas.vue'
    import * as bootstrap from 'bootstrap'
    import Swal from 'sweetalert2'
    import {ref,onMounted, onUnmounted, watch} from 'vue'
    import api from '@/services/jjapi'
    import { searchAll } from '@/services/searchService.js';

    // 搜尋功能區 -----------------------------------------------------------------
    const searchKeyword = ref('');
    const searchResult = ref(null);
    const searchLoading = ref(false);
    const searchError = ref('');
    const showSearchDropdown = ref(false);

    const doSearch = async () => {
      if (!searchKeyword.value.trim()) {
        searchError.value = '請輸入關鍵字';
        searchResult.value = null;
        showSearchDropdown.value = false;
        return;
      }
      searchError.value = '';
      searchLoading.value = true;
      try {
        const res = await searchAll(searchKeyword.value);
        searchResult.value = res.data;
        showSearchDropdown.value = true;
      } catch (e) {
        searchError.value = '搜尋失敗';
        searchResult.value = null;
        showSearchDropdown.value = false;
      }
      searchLoading.value = false;
    };

    // 點擊外部時關閉下拉
    const closeDropdown = () => {
      showSearchDropdown.value = false;
    };

    // 取得活動路由
    const getCampaignRoute = (campaignTitle) => {
      switch (campaignTitle) {
        case '夏季清爽泡麵祭！全館88折':
          return { name: 'campaigns', hash: '#campaign-1' };
        case '情人節雙人套餐':
          return { name: 'campaigns', hash: '#campaign-2' };
        case '新品上市：地獄廚神聯名款麻辣泡麵':
          return { name: 'campaigns', hash: '#campaign-4' };
        case '我們的堅持：只用最好的食材':
          return { name: 'campaigns', hash: '#campaign-5' };
        default:
          return { name: 'campaigns' }; // 預設導向活動頁面
      }
    };
    // 搜尋功能區end ----------------------------------------------------------
        
    //登入登出功能區------------------------------------------
    // 使用auth store和router
    const authStore = useAuthStore()
    const router = useRouter()

    // 使用Cart store
    const cartStore = useCartStore()

    // 使用notification store
    const notificationStore = useNotificationStore()

    // 計算屬性：是否已登入
    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const user = computed(() => authStore.user)

    // 新增：控制開啟購物車 Offcanvas
    function openOffcanvas() {
      const el = document.getElementById('offcanvasExample')
      if (el) {
        const instance = bootstrap.Offcanvas.getOrCreateInstance(el)
        instance.show()
      }
    }
    // 登出處理
    const handleLogout = async () => {
      // 1. 確認對話框
      const result = await Swal.fire({
        title: '確定要登出嗎？',
        text: '登出後需要重新登入才能存取會員功能',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '確定登出',
        cancelButtonText: '取消',
        confirmButtonColor: '#92559c',
        cancelButtonColor: '#6c757d'
      })

      if (!result.isConfirmed) {
        return // 用戶取消登出
      }

      try {
        // 2. 顯示載入中
        Swal.fire({
          title: '登出中...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        // 3. 執行登出
        await authStore.logout()
        
        // 4. 顯示成功提示
        await Swal.fire({
          title: '登出成功！',
          text: '感謝您的使用，期待下次再見！',
          icon: 'success',
          confirmButtonText: '確定',
          confirmButtonColor: '#92559c',
          timer: 3000,
          timerProgressBar: true
        })
        
        // 5. 智能跳轉邏輯
        const currentRoute = router.currentRoute.value
        const authRequiredPages = ['user', 'myorders', 'checkout', 'favorite']
        
        if (authRequiredPages.includes(currentRoute.name)) {
          router.push('/')
        } else {
          window.location.reload()
        }
        
      } catch (error) {
        console.error('登出失敗:', error)
        
        Swal.fire({
          title: '登出失敗',
          text: '請檢查網路連線後再試',
          icon: 'error',
          confirmButtonText: '確定',
          confirmButtonColor: '#dc3545'
        })
      }
    }

    // 處理頭像顯示
    const getUserAvatar = computed(() => {
      if (user.value?.picPath) {
        // 如果 picPath 是相對路徑，加上後端服務器 URL
        if (user.value.picPath.startsWith('/')) {
          return `https://localhost:7017${user.value.picPath}`
        }
        // 如果已經是完整 URL，直接返回
        return user.value.picPath
      }
      // 如果沒有頭像，返回預設圖片
      return '/pingu.png'
    })
    //登入登出功能區 end-------------------------------------
    
    // 通知功能區------------------------------------------
    // 使用 store 的未讀通知數量
    const unreadCount = computed(() => notificationStore.userUnreadCount)

    async function fetchUnreadCount() {
      const user = localStorage.getItem('user')
      const userId = user ? JSON.parse(user).userId : null
      if (!userId) {
        console.log('無法從localstorage 取得 userId，未讀通知數量設為 0')
        return
      }
      if (!isAuthenticated.value){
        console.log('未登入，未讀通知數量設為 0')
        return
      }
      await notificationStore.fetchUserNotifications(userId)
      console.log('取得未讀通知數量:', unreadCount.value)
    }

    // 定義清理變量
    let notificationInterval = null
    const handleFocus = () => {
      if (isAuthenticated.value) {
        fetchUnreadCount()
      }
    }

    // 頁面載入時取得未讀通知數量
    onMounted(() => {
      fetchUnreadCount()
      
      // 當頁面重新獲得焦點時，重新檢查通知
      window.addEventListener('focus', handleFocus)
      
      // 定期檢查通知（每2分鐘）
      notificationInterval = setInterval(() => {
        if (isAuthenticated.value) {
          fetchUnreadCount()
        }
      }, 120000) // 2分鐘
    })

    // 清理事件監聽器
    onUnmounted(() => {
      window.removeEventListener('focus', handleFocus)
      if (notificationInterval) {
        clearInterval(notificationInterval)
      }
    })
    
    // 如果有登入狀態變化，重新取得未讀數量
    watch(isAuthenticated, (newVal) => {
      if (newVal) {
        fetchUnreadCount()
      } else {
        notificationStore.clearUserNotifications()
      }
    })

    // 點擊通知按鈕跳轉到通知頁面
    function goToNotification() {
      router.push({ name: 'notification' })
    }

    //計算購物車內品項數
    const cartItemCount = computed(() =>
      cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
    )
    const cartItemKindCount = computed(() => cartStore.items.length)
    // 通知功能區 end------------------------------------------
</script>

<template>
<header class="custom-header px-3 py-2">
    <div class="container-fluid d-flex justify-content-between align-items-center">
      <!-- 左側 Logo + 店名 -->
      <RouterLink :to="{name:'home'}" class="d-flex align-items-center gap-2 flex-shrink-0 text-decoration-none">
        <img src="/cat-logo.png" alt="logo" class="logo-img" />
        <img src="/cat-font.png" alt="" style="height: 50px;" class="d-none d-lg-inline">
      </RouterLink>

      <!-- 搜尋區塊 -->
      <div class="search-bar position-relative me-3 me-md-2 me-sm-1" ref="searchBarRef">
        <div class="group">
           <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
              v-model="searchKeyword"
              @keyup.enter="doSearch"
              @mouseenter="searchResult && (showSearchDropdown = true)"
              class="input"
              type="search"
              placeholder="搜尋商品/分類/活動/優惠券"
              name="searchbar"
              autocomplete="off"
            />
        </div>
        <!-- 下拉搜尋結果 -->
        <div
          v-if="showSearchDropdown"
          class="search-dropdown"
          @mouseleave="closeDropdown"
        >
          <div v-if="searchLoading" class="p-2 text-center">載入中...</div>
          <div v-else-if="searchError" class="p-2 text-danger">{{ searchError }}</div>
          <template v-else-if="searchResult">
            <div v-if="searchResult.categories.length">
              <div class="search-title">商品大分類</div>
              <ul>
                <li v-for="c in searchResult.categories" :key="c.productCategoriesId">
                  <RouterLink
                    :to="c.name === '特殊款泡麵' ? { name: 'specialnoodle' } : { name: 'productlist' }"
                    @click="closeDropdown"
                  >
                    {{ c.name }}
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div v-if="searchResult.sorts.length">
              <div class="search-title">商品小分類</div>
              <ul>
                <li v-for="s in searchResult.sorts" :key="s.sortId">
                  <RouterLink
                    :to="{ name: 'specialnoodle', query: { category: s.name } }"
                    @click="closeDropdown"
                >
                  {{ s.name }}
                </RouterLink>
                </li>
              </ul>
            </div>
            <div v-if="searchResult.products.length">
              <div class="search-title">商品</div>
              <ul>
                <li v-for="p in searchResult.products" :key="p.productsId">
                <RouterLink :to="{ name: 'onespecialnoodle', query: { id: p.productsId } }" @click="closeDropdown">
                  {{ p.name }} 
                </RouterLink>
                </li>
              </ul>
            </div>
            <div v-if="searchResult.coupons.length">
              <div class="search-title">優惠券</div>
              <ul>
                <li v-for="c in searchResult.coupons" :key="c.couponId">
                  <RouterLink
                    :to="{ name: 'home', hash: '#coupon-section' }"
                    @click="closeDropdown"
                  >
                    {{ c.couponCode }} - {{ c.description }}
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div v-if="searchResult.campaigns.length">
              <div class="search-title">活動</div>
              <ul>
                <li v-for="c in searchResult.campaigns" :key="c.campaignId">
                  <RouterLink
                    :to="getCampaignRoute(c.title)"
                    @click="closeDropdown"
                  >
                    {{ c.title }}
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div v-if="!searchResult.categories.length && !searchResult.sorts.length && !searchResult.products.length && !searchResult.coupons.length && !searchResult.campaigns.length">
              <span class="p-2">查無結果</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 右側按鈕群組 -->
      <div class="d-flex align-items-center gap-1 gap-sm-2 gap-md-3 gap-lg-4 flex-shrink-0">      
        <RouterLink :to="{name:'home'}" class="icon-btn" title="首頁"><i class="bi bi-house-door"></i></RouterLink>
        <RouterLink :to="{name:'drink'}" class="icon-btn" title="飲料"><i class="fa-solid fa-martini-glass"></i></RouterLink>
        <RouterLink :to="{name:'productlist'}" class="icon-btn" title="商品"><i class="fa-solid fa-bowl-food"></i></RouterLink>
        <button class="icon-btn position-relative" @click="openOffcanvas" title="購物車">
          <i class="fa fa-shopping-cart"></i>
          <span
            v-if="cartItemKindCount > 0"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style="font-size: 0.75rem;"
          >
            {{ cartItemKindCount > 99 ? '99+' : cartItemKindCount }}
            <span class="visually-hidden">購物車內商品種類數量</span>
          </span>
        </button>
        <RouterLink :to="{name:'favorite'}" class="icon-btn" title="我的最愛"><i class="bi bi-heart-fill"></i></RouterLink>

        <!-- 會員中心下拉選單 -->
        <div class="dropdown">
          <button class="icon-btn dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="會員中心">
            <!-- 根據登入狀態顯示不同的圖示和文字 -->
            <template v-if="isAuthenticated">
              <!-- 如果有頭像則顯示頭像，否則顯示預設圖示 -->
              <img v-if="getUserAvatar" :src="getUserAvatar" alt="會員頭像" class="user-avatar" />
              <i v-else class="bi bi-person-circle"></i>
              <span class="user-greeting d-none d-lg-inline">{{ user.name }}您好</span>
            </template>
            <template v-else>
              <i class="bi bi-person-circle"></i>
              <span class="d-none d-lg-inline"></span>
            </template>
          </button>
          <!-- 下拉選單 -->
          <ul class="dropdown-menu dropdown-menu-end">
            <!-- 根據登入狀態顯示不同的選單項目 -->
            <template v-if="isAuthenticated">
              <li><RouterLink :to="{name:'user'}" class="dropdown-item"><i class="bi bi-person-gear me-2"></i>會員中心</RouterLink></li>
              <li><RouterLink :to="{name:'feedback'}" class="dropdown-item"><i class="bi bi-envelope-arrow-up me-2"></i>進度追蹤</RouterLink></li>
              <li><RouterLink :to="{name:'myorders'}" class="dropdown-item"><i class="bi bi-receipt me-2"></i>我的訂單</RouterLink></li>
              <li><hr class="dropdown-divider"></li>
              
              <li><button @click="handleLogout" class="dropdown-item" :disabled="authStore.isLoading"><i class="bi bi-box-arrow-right me-2"></i>{{ authStore.isLoading ? '登出中...' : '登出' }}</button></li>
            </template>
            <template v-else>
              <li><RouterLink :to="{name:'login'}" class="dropdown-item"><i class="bi bi-box-arrow-in-right me-2"></i>會員登入</RouterLink></li>
              
            </template>
          </ul>
        </div>
        <!-- 通知按鈕 -->
        <button type="button" class="position-relative icon-btn"
                @click="goToNotification" title="通知">
          <i class="fa fa-bell"></i>
          <span v-if="unreadCount > 0"
                class="position-absolute top-0 start-100 badge rounded-pill bg-danger" 
                style="font-size: 0.75rem; transform: translate(-75%,-20%);">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
            <span class="visually-hidden">unread messages</span>
          </span>
        </button>
      </div>
    </div>
  </header>
<CartOffcanvas />
</template>

<style lang="css" scoped>
.p-2{
  color: gray;
}
.custom-header {
  background-color: #c286cf; /* 紫色背景 */
  color: white;
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* Logo 大小 */
.logo-img {
  height: 48px;
}

/* 店名字型樣式 */
.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  font-family: 'Comic Sans MS', 'Noto Sans TC', sans-serif;
  white-space: nowrap; /* 防止文字換行 */
}

.icon-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.4rem;
  transition: color 0.3s ease;
}

.icon-btn:hover {
  color: #ffe0f0;
}

.btn-space {
  margin-right: 10px; /* 可以依需求微調距離 */
}

/* 
搜尋功能樣式 */
.search-bar {
  min-width: 500px;
  flex: 1;
  max-width: 600px;
}

.search-dropdown {
  position: absolute;
  top: 110%;
  left: 0;
  width: 350px;
  background: #fff;
  border: 1px solid #c286cf;
  border-radius: 0.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 9999;
  padding: 0.5rem 1rem;
  max-height: 350px;
  overflow-y: auto;
}

.search-title {
  font-weight: bold;
  color: #92559c;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}
.search-dropdown ul {
  padding-left: 1rem;
  margin-bottom: 0.5rem;
  color: #212529;
}
.search-dropdown li {
  list-style: disc;
  font-size: 0.98rem;
  margin-bottom: 0.15rem;
}
/* 下拉選單樣式 */
.dropdown-menu {
  background-color: #f8f0fa;
  border: 1px solid #c286cf;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(146, 85, 0156 0.15);
}

.dropdown-item {
  color: #6f42c1;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  transition: background-color 0.15s ease-in-out;
}

.dropdown-item:hover {
  background-color: #e9d6f7;
  color: #92559c;
  text-decoration: none;
}

.dropdown-item i {
  width: 1rem;
}
.group {
  display: flex;
  line-height: 28px;
  align-items: center;
  position: relative;
  max-width: 350px; /* 桌機時較寬 */
  width: 100%;
}

.input {
  font-family: "Montserrat", "Noto Sans TC", sans-serif;
  width: 100%;
  min-width: 0;
  height: 45px;
  padding-left: 2.5rem;
  border: 0;
  border-radius: 12px;
  background-color: #f8f0fa;
  outline: none;
  color: #6f42c1;
  transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1);
  cursor: text;
  z-index: 0;
}


.input::placeholder {
  color: #b48ce3;
}

.input:hover {
  box-shadow: 0 0 0 2.5px #c286cf, 0px 0px 25px -15px #b48ce3;
}

.input:active {
  transform: scale(0.95);
}
.input:focus {
  background-color: #f3e6fa;
}

.search-icon {
  position: absolute;
  left: 1rem;
  fill: #b48ce3;
  width: 1rem;
  height: 1rem;
  pointer-events: none;
  z-index: 1;
}
/* 響應式設計 */
@media (max-width: 992px) {
  .search-bar {
    min-width: 300px;
  }
  .group {
    max-width: 250px;
  }
}
@media (max-width: 768px) {
  .search-bar {
    min-width: 200px;
  }
  .group {
    max-width: 180px;
  }
  .input {
    height: 38px;
    font-size: 0.95rem;
  }
}
@media (max-width: 576px) {
  .search-bar {
    min-width: 120px;
  }
  .group {
    max-width: 100px;
  }
  .input {
    height: 32px;
    font-size: 0.9rem;
    padding-left: 2rem;
  }
}

/* 響應式調整 */
@media (max-width: 992px) {
  .logo-text {
    font-size: 1.3rem; /* 在中等螢幕時稍微縮小字體 */
  }
}

@media (max-width: 768px) {
  .logo-text {
    font-size: 1.2rem; /* 在小螢幕時再縮小字體 */
  }
  
  .icon-btn {
    font-size: 1.2rem; /* 手機時縮小圖標 */
  }
  
  .logo-img {
    height: 40px; /* 手機時縮小 logo */
  }
}

@media (max-width: 576px) {
  .logo-text {
    font-size: 1.1rem; /* 超小螢幕時進一步縮小 */
  }
  
  .icon-btn {
    font-size: 1.1rem;
    min-width: 32px; /* 確保按鈕有最小寬度 */
    padding: 0.25rem;
  }
}

/* 超小螢幕額外優化 */
@media (max-width: 480px) {
  .search-bar {
    min-width: 100px;
    margin-right: 0.5rem !important; /* 進一步縮小與按鈕間距 */
  }
  
  .icon-btn {
    font-size: 1rem;
    min-width: 28px;
    padding: 0.2rem;
  }
  
  .user-avatar {
    width: 20px;
    height: 20px;
  }
}

/* 極小螢幕優化 */
@media (max-width: 380px) {
  .search-bar {
    min-width: 70px;
    margin-right: 0.3rem !important; /* 極小螢幕間距 */
  }
  
  .group {
    max-width: 70px;
  }
  
  .icon-btn {
    font-size: 0.9rem;
    min-width: 24px;
    padding: 0.15rem;
  }
  
  .user-avatar {
    width: 18px;
    height: 18px;
  }
  
  /* 移除gap override，使用HTML類別控制 */
}

/* 320px 極限優化 */
@media (max-width: 320px) {
  .search-bar {
    min-width: 60px;
    margin-right: 0.25rem !important; /* 最小間距 */
  }
  
  .group {
    max-width: 60px;
  }
  
  .input {
    height: 28px;
    font-size: 0.8rem;
    padding-left: 1.5rem;
  }
  
  .search-icon {
    left: 0.5rem;
    width: 0.8rem;
    height: 0.8rem;
  }
  
  .icon-btn {
    font-size: 0.8rem;
    min-width: 20px;
    padding: 0.1rem;
  }
  
  .user-avatar {
    width: 16px;
    height: 16px;
  }
  
  /* 使用HTML gap類別，不需要CSS override */
}

/* 280px 超極限優化 - 確保所有按鈕顯示 */
@media (max-width: 280px) {
  .search-bar {
    min-width: 50px;
    margin-right: 0.2rem !important;
  }
  
  .group {
    max-width: 50px;
  }
  
  .input {
    height: 24px;
    font-size: 0.7rem;
    padding-left: 1.2rem;
  }
  
  .search-icon {
    left: 0.3rem;
    width: 0.7rem;
    height: 0.7rem;
  }
  
  .icon-btn {
    font-size: 0.7rem;
    min-width: 18px;
    padding: 0.05rem;
  }
  
  .user-avatar {
    width: 14px;
    height: 14px;
  }
}

/* 登入登出css設定 */
/* 使用者頭像樣式 */
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

/* 使用者歡迎文字 */
.user-greeting {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

/* 修改 dropdown-item 樣式以支援 button */
.dropdown-item {
  color: #212529;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  transition: background-color 0.15s ease-in-out;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.dropdown-item:disabled {
  opacity: 0.6;
  pointer-events: none;
}

.dropdown-divider {
  height: 0;
  margin: 0.5rem 0;
  overflow: hidden;
  border-top: 1px solid #dee2e6;
}




/* 響應式調整 */
@media (max-width: 992px) {
  .user-greeting {
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .user-avatar {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 576px) {
  .user-avatar {
    width: 24px;
    height: 24px;
  }
}


</style>   