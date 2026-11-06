<script setup>
    import { onMounted, ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../stores/auth'
    import RegisterForm from '../components/RegisterForm.vue'

    // 路由和認證狀態
    const router = useRouter()
    const authStore = useAuthStore()

    // 控制顯示狀態
    const showRegisterForm = ref(true)
    const redirectMessage = ref('')

    // 檢查登入狀態
    onMounted(() => {
    if (authStore.isAuthenticated) {
        showRegisterForm.value = false
        redirectMessage.value = `您已登入，${authStore.user?.name || '會員'}！`
        
        // 3秒後自動導回首頁
        setTimeout(() => {
        router.push('/')
        }, 3000)
    }
    })
</script>

<template>
    <!-- .register-page：整個頁面容器 -->
<div class="register-page">  
    <div class="container-fluid vh-100">
      <div class="row h-100">

        <!-- 左側 - 註冊表單 -->
<div class="col-md-8 col-lg-7 d-flex align-items-center justify-content-center">
  <div class="register-form-container w-100" style="max-width: 600px;">
    
    <!-- 如果已登入，顯示重導向訊息 -->
    <div v-if="!showRegisterForm" class="text-center">
      <img src="/cat-logo.png" alt="Fat Cat Logo" class="mb-3" style="height: 60px;">
      <div class="alert alert-info" role="alert">
        <i class="bi bi-info-circle-fill me-2"></i>
        {{ redirectMessage }}
      </div>
      <p class="text-muted">3秒後自動導向首頁...</p>
      <button @click="router.push('/')" class="btn btn-primary">
        <i class="bi bi-house-door-fill me-2"></i>
        立即前往首頁
      </button>
    </div>

    <!-- 如果未登入，顯示註冊表單 -->
    <div v-else>
      <!-- Logo 和標題 -->
      <div class="text-center mb-4">
        <img src="/cat-logo.png" alt="Fat Cat Logo" class="mb-3" style="height: 60px;">
        <h2 class="h3 mb-3 fw-bold register-title">加入 Fat Cat</h2>
        <p class="register-subtitle">創建您的帳戶</p>
      </div>
      <!-- 註冊表單組件 -->
      <RegisterForm></RegisterForm>

      <!-- 登入連結 -->
      <div class="text-center mt-4">
        <p class="login-text">
          已經有帳戶？ 
          <router-link to="/login" class="login-link">
            立即登入
          </router-link>
        </p>
      </div>
    </div>
  </div>
</div>
<!-- 右側 - 背景圖片 d-none d-md-block 在小螢幕隱藏 -->
<div class="col-md-4 col-lg-5 d-none d-md-block">
          <div class="register-bg h-100 d-flex align-items-center justify-content-center">
            <div class="text-center text-white">
              <h1 class="display-4 fw-bold mb-4">歡迎加入 Fat Cat</h1>
              <p class="lead">成為會員，享受專屬優惠和服務</p>
              <div class="mt-4">
                <div class="row text-center">
                  <div class="col-4">
                    <i class="bi bi-gift-fill display-6 mb-2"></i>
                    <p class="small">專屬優惠</p>
                  </div>
                  <div class="col-4">
                    <i class="bi bi-heart-fill display-6 mb-2"></i>
                    <p class="small">收藏最愛</p>
                  </div>
                  <div class="col-4">
                    <i class="bi bi-truck display-6 mb-2"></i>
                    <p class="small">快速配送</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
/* 色系定義 - 使用組件內變數 */
.register-page {
  --deep-purple: #92559c;
  --light-purple: #d3a2da;
  --light-yellow: #ffd689;
  --orange-yellow: #ffa600;
  --deep-gray: #686868;
  --light-gray: #f6f6f6;
  
  background: linear-gradient(135deg, var(--light-purple) 0%, var(--light-gray) 100%);
}

.register-form-container {
  padding: 2rem;
  background: var(--light-gray);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--deep-gray);
}

.register-title {
  color: var(--deep-purple);
}

.register-subtitle {
  color: var(--deep-gray);
}

.login-text {
  color: var(--deep-gray);
}
.login-link {
  color: var(--deep-purple);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.login-link:hover {
  color: var(--orange-yellow);
}

/* 漸層背景 */
.register-bg {
  background: linear-gradient(135deg, var(--deep-purple) 0%, var(--light-purple) 50%, var(--light-yellow) 100%);
  position: relative;
}

.register-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
}

.register-bg > div {
  position: relative;
  z-index: 1;
}
/* 響應式設計 */
@media (max-width: 767.98px) {
  .register-form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}

/* 提示樣式 */
.alert-info {
  background-color: #cff4fc;
  border: 1px solid #b8daff;
  color: #055160;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.btn-primary {
  background-color: var(--deep-purple);
  border-color: var(--deep-purple);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--light-purple);
  border-color: var(--light-purple);
  transform: translateY(-1px);
}
.text-muted {
  color: var(--deep-gray) !important;
  font-size: 0.9rem;
}

/* 圖示樣式 */
.bi {
  color: inherit;
}

/* 優惠介紹區域 */
.register-bg .col-4 {
  opacity: 0.9;
}

.register-bg .col-4:hover {
  opacity: 1;
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

</style>