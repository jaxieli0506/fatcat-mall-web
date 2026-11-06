<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../services/authService'

const router = useRouter()
const route = useRoute()

// 表單狀態
const formData = ref({
  token: '',
  email: '',
  newPassword: '',
  confirmPassword: ''
})
const isLoading = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')
const errors = ref({
  newPassword: '',
  confirmPassword: ''
})

// 密碼顯示控制
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 從URL參數獲取token和email
onMounted(() => {
  const token = route.query.token
  const email = route.query.email
  
  if (!token || !email) {
    errorMessage.value = '無效的重設連結'
    return
  }
  
  formData.value.token = token
  formData.value.email = email
})

// 驗證密碼
const validatePasswords = () => {
  errors.value = { newPassword: '', confirmPassword: '' }
  let hasError = false
  
  // 驗證新密碼
  if (!formData.value.newPassword) {
    errors.value.newPassword = '請輸入新密碼'
    hasError = true
  } else if (formData.value.newPassword.length < 6) {
    errors.value.newPassword = '密碼至少需要6個字元'
    hasError = true
  }
  
  // 驗證確認密碼
  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = '請確認新密碼'
    hasError = true
  } else if (formData.value.confirmPassword !== formData.value.newPassword) {
    errors.value.confirmPassword = '確認密碼與新密碼不符'
    hasError = true
  }
  
  return !hasError
}

// 處理表單提交
const handleSubmit = async () => {
  errorMessage.value = ''
  
  // 驗證表單
  if (!validatePasswords()) {
    return
  }
  
  try {
    isLoading.value = true
    
    console.log('重設密碼請求:', {
      email: formData.value.email,
      token: formData.value.token
    })
    
    // 呼叫重設密碼 API
    const result = await authService.resetPassword({
      token: formData.value.token,
      email: formData.value.email,
      newPassword: formData.value.newPassword,
      confirmPassword: formData.value.confirmPassword
    })
    
    if (result.success) {
      isSuccess.value = true
      console.log('密碼重設成功')
      
      // 3秒後跳轉到登入頁面
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      errorMessage.value = result.message || '重設密碼失敗'
    }
    
  } catch (error) {
    console.error('重設密碼失敗:', error)
    errorMessage.value = error.message || '重設密碼失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 返回登入頁面
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <!-- 成功狀態 -->
      <div v-if="isSuccess" class="success-section text-center">
        <div class="success-icon mb-4">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h3>密碼重設成功</h3>
        <p class="text-muted mb-4">
          您的密碼已成功重設<br>
          請使用新密碼登入
        </p>
        <p class="text-muted small mb-4">
          3秒後自動跳轉到登入頁面...
        </p>

        <button 
          class="btn btn-primary w-100"
          @click="goToLogin"
        >
          <i class="bi bi-box-arrow-in-right me-2"></i>
          立即前往登入
        </button>
      </div>

      <!-- 重設密碼表單 -->
      <div v-else class="form-section">
        <div class="header-section text-center mb-4">
          <i class="bi bi-shield-lock-fill header-icon"></i>
          <h2>重設密碼</h2>
          <p class="text-muted">請輸入您的新密碼</p>
          <p class="text-muted small">重設帳號：{{ formData.email }}</p>
        </div>

        <!-- 整體錯誤訊息 -->
        <div v-if="errorMessage" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ errorMessage }}
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleSubmit">
          <!-- 新密碼 -->
          <div class="mb-3">
            <label for="newPassword" class="form-label">新密碼</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-lock-fill"></i>
              </span>
              <input 
                id="newPassword"
                v-model="formData.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="form-control"
                :class="{ 'is-invalid': errors.newPassword }"
                placeholder="請輸入新密碼 (至少6個字元)"
                :disabled="isLoading"
                @input="errors.newPassword = ''"
              >
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                @click="showNewPassword = !showNewPassword"
                :disabled="isLoading"
              >
                <i class="bi" :class="showNewPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
            <div v-if="errors.newPassword" class="invalid-feedback d-block">
              {{ errors.newPassword }}
            </div>
          </div>

          <!-- 確認密碼 -->
          <div class="mb-4">
            <label for="confirmPassword" class="form-label">確認新密碼</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-lock-check-fill"></i>
              </span>
              <input 
                id="confirmPassword"
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-control"
                :class="{ 'is-invalid': errors.confirmPassword }"
                placeholder="請再次輸入新密碼"
                :disabled="isLoading"
                @input="errors.confirmPassword = ''"
              >
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                @click="showConfirmPassword = !showConfirmPassword"
                :disabled="isLoading"
              >
                <i class="bi" :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
            <div v-if="errors.confirmPassword" class="invalid-feedback d-block">
              {{ errors.confirmPassword }}
            </div>
          </div>

          <!-- 按鈕群組 -->
          <div class="button-group">
            <button 
              type="submit" 
              class="btn btn-primary w-100 mb-3"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-shield-check me-2"></i>
              {{ isLoading ? '重設中...' : '確認重設密碼' }}
            </button>

            <button 
              type="button" 
              class="btn btn-outline-secondary w-100"
              @click="goToLogin"
              :disabled="isLoading"
            >
              <i class="bi bi-arrow-left me-2"></i>
              返回登入
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
/* 主容器 */
.reset-password-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #92559c 0%, #d3a2da 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

/* 主卡片 */
.reset-password-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  padding: 3rem;
  width: 100%;
  max-width: 450px;
}

/* 標題區域 */
.header-section {
  margin-bottom: 2rem;
}

.header-icon {
  font-size: 3rem;
  color: #92559c;
  margin-bottom: 1rem;
}

.header-section h2 {
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* 表單樣式 */
.form-label {
  color: #555;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #92559c;
}

.form-control {
  border-color: #dee2e6;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  border-color: #92559c;
  box-shadow: 0 0 0 0.2rem rgba(146, 85, 156, 0.25);
}

/* 按鈕樣式 */
.btn-primary {
  background: linear-gradient(135deg, #92559c 0%, #d3a2da 100%);
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #d3a2da 0%, #ffa600 100%);
  transform: translateY(-1px);
}

.btn-outline-secondary {
  border-color: #92559c;
  color: #92559c;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: #92559c;
  border-color: #92559c;
  color: white;
}

/* 成功狀態樣式 */
.success-section {
  padding: 1rem 0;
}

.success-icon {
  font-size: 4rem;
  color: #28a745;
}

.success-section h3 {
  color: #333;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* 錯誤訊息樣式 */
.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* 響應式設計 */
@media (max-width: 576px) {
  .reset-password-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  
  .header-icon {
    font-size: 2.5rem;
  }
  
  .success-icon {
    font-size: 3rem;
  }
}
</style> 