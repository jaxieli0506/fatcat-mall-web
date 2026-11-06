<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginForm from '../components/LoginForm.vue'

// 路由和認證狀態
const router = useRouter()
const authStore = useAuthStore()

// 控制顯示狀態
const showLoginForm = ref(true)
const redirectMessage = ref('')

// 檢查登入狀態
onMounted(() => {
  if (authStore.isAuthenticated) {
    showLoginForm.value = false
    redirectMessage.value = `您已登入，${authStore.user?.name || '會員'}！`
    
    // 3秒後自動導回首頁
    setTimeout(() => {
      router.push('/')
    }, 3000)
  }
})

</script>

<template>
    <!-- .login-page：整個頁面容器 -->
<div class="login-page">  
    <div class="container-fluid">
      <div class="row min-vh-100">

        <!-- 左側 - 登入表單 -->
<div class="col-md-6 col-lg-5 d-flex align-items-center justify-content-center">
  <div class="login-form-container w-100" style="max-width: 420px;">
    
    <!-- 如果已登入，顯示重導向訊息 -->
    <div v-if="!showLoginForm" class="text-center">
      <img src="/cat-logo.png" alt="Fat Cat Logo" class="mb-3" style="height: 60px;">
      <div class="alert alert-success" role="alert">
        <i class="bi bi-check-circle-fill me-2"></i>
        {{ redirectMessage }}
      </div>
      <p class="text-muted">3秒後自動導向首頁...</p>
      <button @click="router.push('/')" class="btn btn-primary">
        <i class="bi bi-house-door-fill me-2"></i>
        立即前往首頁
      </button>
    </div>

    <!-- 如果未登入，顯示登入表單 -->
    <div v-else>
      <!-- Logo 和標題 -->
      <div class="text-center mb-4">
        <img src="/cat-logo.png" alt="Fat Cat Logo" class="mb-3" style="height: 60px;">
        <h2 class="h3 mb-3 fw-bold login-title">歡迎回來</h2>
        <p class="login-subtitle">請登入您的帳戶</p>
      </div>

      <!-- 登入表單組件 -->
      <LoginForm :is-modal="false" redirect-path="/"></LoginForm>

      <!-- 註冊連結 ----->
      <div class="text-center mt-4">
        <p class="register-text">
          還沒有帳戶？ 
          <router-link to="/register" class="register-link">
            立即註冊
          </router-link>   
        </p>
      </div>
    </div>
  </div>
</div>

         <!-- 右側 - 背景圖片 d-none d-md-block 在小螢幕隱藏 -->
        <div class="col-md-6 col-lg-7 d-none d-md-block">
          <div class="login-bg min-vh-100 d-flex align-items-center justify-content-center">
            <div class="text-center text-white">
              <h1 class="display-4 fw-bold mb-4">Fat Cat 購物商城</h1>
              <p class="lead">發現最好的商品，享受最棒的購物體驗</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
/* 色系定義 - 使用組件內變數 */
.login-page {
  --deep-purple: #92559c;
  --light-purple: #d3a2da;
  --light-yellow: #ffd689;
  --orange-yellow: #ffa600;
  --deep-gray: #686868;
  --light-gray: #f6f6f6;
  
  min-height: 100vh;
  background: linear-gradient(135deg, var(--light-purple) 0%, var(--light-gray) 100%);
}

.login-form-container {
  padding: 2rem;
  background: var(--light-gray);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--deep-gray);
}

.login-title {
  color: var(--deep-purple);
}

.login-subtitle {
  color: var(--deep-gray);
}

.register-text {
  color: var(--deep-gray);
}

.register-link {
  color: var(--deep-purple);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: var(--orange-yellow);
}

/* 漸層背景 */
.login-bg {
  background: linear-gradient(135deg, var(--deep-purple) 0%, var(--light-purple) 50%, var(--light-yellow) 100%);
  position: relative;
}

.login-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
}

.login-bg > div {
  position: relative;
  z-index: 1;
}

/* 響應式設計 */
@media (max-width: 767.98px) {
  .login-form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}

/* 成功提示樣式 */
.alert-success {
  background-color: #d1e7dd;
  border: 1px solid #badbcc;
  color: #0f5132;
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
</style>