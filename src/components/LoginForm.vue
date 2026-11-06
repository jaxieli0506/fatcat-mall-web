<script setup>
    import { ref, computed } from 'vue'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../stores/auth'
    import { facebookAuthService } from '../services/facebookAuthService'
    import { googleAuthService } from '../services/googleAuthService'
    import { lineAuthService } from '../services/lineAuthService'

    // 路由和狀態管理
    const router = useRouter()
    const authStore = useAuthStore()

    // 定義 props 來支援不同使用場景
    const props = defineProps({
      isModal: {
        type: Boolean,
        default: false
      },
      redirectPath: {
        type: String,
        default: '/'
      }
    })

    // 定義 emits 
    const emit = defineEmits(['login-success'])

    // 表單數據
    const loginForm = ref({
    email: '',
    password: '',
    rememberMe: false
    })

    //控制密碼可見性
    const showPassword = ref(false)
    const togglePassword = () => {
    showPassword.value = !showPassword.value
    }

    //錯誤訊息狀態：分別處理不同類型錯誤
    const errorMessage = ref('')
    const emailError = ref('')
    const passwordError = ref('')

    // 計算屬性 載入狀態：從 Auth Store 取得
    const isLoading = computed(() => authStore.isLoading)

    //表單驗證
    const validateForm = () => {
      clearErrors()
      let hasError = false

      // 驗證 Email
      const emailPattern = /^[^\s@]+@[^\s@]/
      if (!loginForm.value.email) {
          emailError.value = '請輸入電子郵件'
          console.log('Email錯誤:', emailError.value) // 測試用
          hasError = true
      } else if (!emailPattern.test(loginForm.value.email)) {
          emailError.value = '請輸入有效的電子郵件格式'
          console.log('Email格式錯誤:', emailError.value) // 測試用
          hasError = true
      }

      // 驗證密碼
      if (!loginForm.value.password) {
          passwordError.value = '請輸入密碼'
          console.log('密碼錯誤:', passwordError.value) // 測試用
          hasError = true
      } else if (loginForm.value.password.length < 3) {
          passwordError.value = '密碼至少需要3個字元'
          console.log('密碼長度錯誤:', passwordError.value) // 測試用
          hasError = true
      }
      return !hasError
    }

    const handleLogin = async (event) => {
      console.log('handleLogin 被觸發，event:', event)
      
      // 確保阻止表單的默認提交行為
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }
      
      // 清除之前的錯誤
      errorMessage.value = ''
      
      // 如果表單驗證失敗，直接返回，不進行 API 呼叫
      if (!validateForm()) {
          console.log('表單驗證失敗')
          return
      }
      
      console.log('開始呼叫登入 API')
      
      try {
          // 呼叫登入
          const result = await authStore.login({
          email: loginForm.value.email,
          password: loginForm.value.password,
          rememberMe: loginForm.value.rememberMe
          })

          console.log('登入結果:', result)

          if (result.success) {
          // 登入成功，根據使用場景決定行為
          console.log('登入成功')
          
          if (props.isModal) {
            // 在模態框中使用，發送事件給父組件
            emit('login-success')
          } else {
            // 在獨立頁面中使用，直接跳轉
            router.push(props.redirectPath)
          }
          } else {
          // 登入失敗，顯示錯誤訊息
          console.log('登入失敗，顯示錯誤訊息:', result.message)
          errorMessage.value = result.message || '登入失敗'
          }
      } catch (error) {
          console.error('登入錯誤:', error)
          errorMessage.value = error.message || '網路錯誤，請稍後再試'
      }
    }
  // 處理表單提交事件
  const handleFormSubmit = (event) => {
    console.log('表單提交事件被觸發')
    event.preventDefault()
    event.stopPropagation()
    handleLogin(event)
  }

  // 清除錯誤訊息
  const clearErrors = () => {
    emailError.value = ''
    passwordError.value = ''
    errorMessage.value = ''
  }

  // Facebook 登入處理
  const isLoadingFB = ref(false)
  
  const handleFacebookLogin = async () => {
    try {
      isLoadingFB.value = true
      clearErrors()
      
      console.log('開始 Facebook 登入流程...')
      
      // 使用 Facebook 認證服務
      const result = await facebookAuthService.facebookLogin()
      
      if (result.success) {
        // 登入成功 - 設置認證狀態並跳轉
        console.log('Facebook 登入成功:', result)
        
        // 使用專門的第三方登入狀態設置方法
        const authResult = authStore.setExternalLoginAuth(result.loginData)
        
        if (!authResult.success) {
          console.error('設置認證狀態失敗:', authResult.message)
          errorMessage.value = '登入狀態設置失敗，請重新登入'
          return
        }
        
        // 顯示歡迎訊息
        const welcomeMessage = result.isNewUser ? 
          `歡迎加入 Fat Cat，${result.loginData.name}！` : 
          `歡迎回來，${result.loginData.name}！`
        
        alert(welcomeMessage)
        
        // 根據使用場景決定行為
        if (props.isModal) {
          emit('login-success')
        } else {
          router.push(props.redirectPath)
        }
      } else if (result.needsManualBinding) {
        // Email 已被其他帳號使用，需要手動綁定
        const confirmed = confirm(
          `${result.message}\n\n` +
          `您可以選擇：\n` +
          `1. 用現有帳號（${result.email}）登入後，在個人設定中綁定 Facebook\n` +
          `2. 取消並使用其他登入方式\n\n` +
          `是否繼續使用傳統登入方式？`
        )
        
        if (!confirmed) {
          // 儲存 Facebook 資料以便後續綁定
          facebookAuthService.storeFacebookDataForRegistration(result.facebookData)
        }
      } else {
        // 其他錯誤情況
        errorMessage.value = result.message || 'Facebook 登入失敗'
      }
      
    } catch (error) {
      console.error('Facebook 登入失敗:', error)
      errorMessage.value = error.message || 'Facebook 登入失敗，請稍後再試'
    } finally {
      isLoadingFB.value = false
    }
  }

  // Google 登入處理
  const isLoadingGoogle = ref(false)
  
  const handleGoogleLogin = async () => {
    try {
      isLoadingGoogle.value = true
      clearErrors()
      
      console.log('開始 Google 登入流程...')
      
      // 檢查 Google SDK 是否已載入
      if (!window.google) {
        errorMessage.value = 'Google SDK 尚未載入，請稍後再試'
        return
      }

      // 使用 Google OAuth 2.0 獲取 access token
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: window.googleClientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response) => {
          if (response.error) {
            console.error('Google 授權失敗:', response.error)
            errorMessage.value = `Google 登入失敗: ${response.error}`
            isLoadingGoogle.value = false
            return
          }

          try {
            console.log('Google 授權成功，獲取用戶資訊...')
            
            // 使用 access_token 取得用戶資訊
            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
            
            if (!userInfoResponse.ok) {
              throw new Error('無法取得 Google 用戶資料')
            }

            const userInfo = await userInfoResponse.json()
            console.log('Google 用戶資訊:', userInfo)
            
            // 準備登入資料
            const googleLoginData = {
              accessToken: response.access_token,
              providerId: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture
            }
            
            // 使用 Google 認證服務
            const result = await googleAuthService.googleLogin(googleLoginData)
            
            if (result.success) {
              // 登入成功
              console.log('Google 登入成功:', result)
              
              // 設置認證狀態
              const authResult = authStore.setExternalLoginAuth(result.loginData)
              
              if (!authResult.success) {
                console.error('設置認證狀態失敗:', authResult.message)
                errorMessage.value = '登入狀態設置失敗，請重新登入'
                return
              }
              
              // 顯示歡迎訊息
              const welcomeMessage = result.isNewUser ? 
                `歡迎加入 Fat Cat，${result.loginData.name}！` : 
                `歡迎回來，${result.loginData.name}！`
              
              alert(welcomeMessage)
              
              // 根據使用場景決定行為
              if (props.isModal) {
                emit('login-success')
              } else {
                router.push(props.redirectPath)
              }
            } else if (result.needsManualBinding) {
              // Email 已被其他帳號使用，需要手動綁定
              const confirmed = confirm(
                `${result.message}\n\n` +
                `您可以選擇：\n` +
                `1. 用現有帳號（${result.email}）登入後，在個人設定中綁定 Google\n` +
                `2. 取消並使用其他登入方式\n\n` +
                `是否繼續使用傳統登入方式？`
              )
              
              if (!confirmed) {
                // 儲存 Google 資料以便後續綁定
                googleAuthService.storeGoogleDataForRegistration(googleLoginData)
              }
            } else {
              // 其他錯誤情況
              errorMessage.value = result.message || 'Google 登入失敗'
            }
            
          } catch (error) {
            console.error('處理 Google 用戶資料時發生錯誤:', error)
            errorMessage.value = '處理 Google 用戶資料時發生錯誤: ' + error.message
          } finally {
            isLoadingGoogle.value = false
          }
        }
      })
      
      // 請求授權
      client.requestAccessToken()
      
    } catch (error) {
      console.error('Google 登入失敗:', error)
      errorMessage.value = error.message || 'Google 登入失敗，請稍後再試'
      isLoadingGoogle.value = false
    }
  }

  // LINE 登入處理
  const isLoadingLine = ref(false)

  const handleLineLogin = async () => {
    try {
      isLoadingLine.value = true
      clearErrors()

      console.log('開始 LINE 登入流程...')

      // 檢查 LINE Channel ID 是否已設定
      if (!window.lineChannelId) {
        errorMessage.value = 'LINE Channel ID 尚未設定，請稍後再試'
        return
      }

      // 使用 LINE 認證服務初始化登入
      const authResult = await lineAuthService.initLineLogin()
      
      if (!authResult.success) {
        throw new Error('LINE 授權失敗')
      }

      console.log('LINE 授權成功，處理登入...')

      // 使用 LINE 認證服務
      const result = await lineAuthService.lineLogin(authResult.lineData)

      if (result.success) {
        console.log('LINE 登入成功:', result)

        // 使用專門的第三方登入狀態設置方法
        const authResult = authStore.setExternalLoginAuth(result.loginData)
        
        if (!authResult.success) {
          console.error('設置認證狀態失敗:', authResult.message)
          errorMessage.value = '登入狀態設置失敗，請重新登入'
          return
        }
        
        if (result.isNewUser) {
          // 新用戶註冊成功
          console.log('LINE 新用戶註冊並登入成功')
          
          // 顯示歡迎訊息並導向首頁
          alert('🎉 歡迎加入 Fat Cat 購物商城！\nLINE 帳號註冊並登入成功')
        } else {
          // 現有用戶登入成功
          console.log('LINE 現有用戶登入成功')
        }
        
        // 根據使用場景決定行為
        if (props.isModal) {
          emit('login-success')
        } else {
          router.push(props.redirectPath)
        }
      } else if (result.needsManualBinding) {
        // 需要手動綁定的情況
        console.log('需要手動綁定 LINE 帳號')
        
        const shouldRegisterNew = confirm(
          `${result.message}\n\n` +
          `選擇操作：\n` +
          `1. 用現有帳號（${result.email}）登入後，在個人設定中綁定 LINE\n` +
          `2. 或點擊「取消」創建新帳號\n\n` +
          `點擊「確定」前往登入，點擊「取消」創建新帳號`
        )

        if (!shouldRegisterNew) {
          // 儲存 LINE 資料以便後續綁定
          lineAuthService.storeLineDataForRegistration(result.lineData)
          router.push('/register')
        }
      } else {
        errorMessage.value = result.message || 'LINE 登入失敗'
      }
    } catch (error) {
      console.error('LINE 登入失敗:', error)
      errorMessage.value = error.message || 'LINE 登入失敗，請稍後再試'
    } finally {
      isLoadingLine.value = false
    }
  }
</script>

<template>
  <form @submit.prevent="handleFormSubmit" class="login-form" novalidate>
    <!-- 整體錯誤訊息 -->
    <div v-if="errorMessage" class="alert alert-danger error-alert mb-3" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ errorMessage }}
    </div>

    <!-- Email 輸入 -->
    <div class="mb-3">
      <label for="email" class="form-label custom-label">電子郵件</label>
      <div class="input-group">
        <span class="input-group-text custom-input-group-text">
          <i class="bi bi-envelope"></i>
        </span>
        <input 
          id="email" 
          v-model="loginForm.email" 
          type="text" 
          class="form-control custom-form-control" 
          :class="{ 'is-invalid': emailError }" 
          placeholder="請輸入您的電子郵件" 
          :disabled="isLoading" 
          @input="emailError = ''; errorMessage = ''"
        >
      </div>
      <div v-if="emailError" class="email-error-message">
        {{ emailError }}
      </div>
    </div>

    <!-- 密碼輸入 -->
    <div class="mb-3">
      <label for="password" class="form-label custom-label">密碼</label>
      <div class="input-group">
        <span class="input-group-text custom-input-group-text">
          <i class="bi bi-lock"></i>
        </span>
        <input 
          id="password" 
          v-model="loginForm.password" 
          :type="showPassword ? 'text' : 'password'" 
          class="form-control custom-form-control" 
          :class="{ 'is-invalid': passwordError }" 
          placeholder="請輸入您的密碼" 
          :disabled="isLoading" 
          @input="passwordError = ''; errorMessage = ''" 
          @keyup.enter="handleLogin"
        >
        <!-- 密碼顯示切換 -->
        <button type="button" class="btn custom-password-toggle" @click="togglePassword" :disabled="isLoading">
          <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </button>
      </div>
      <div v-if="passwordError" class="password-error-message">
        {{ passwordError }}
      </div>
    </div>

     <!-- 記住我 -->
    <div class="mb-3 form-check custom-form-check">
      <input
        id="rememberMe"
        v-model="loginForm.rememberMe"
        type="checkbox"
        class="form-check-input custom-checkbox"
        :disabled="isLoading"
      >
      <label for="rememberMe" class="form-check-label custom-check-label">
        記住我
      </label>
    </div>

    <!-- 登入按鈕 -->
    <button
      type="button"
      class="btn custom-login-btn w-100 mb-3"
      :disabled="isLoading"
      @click="handleLogin"
    >
      <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">載入中...</span>
      </span>
      <i v-else class="bi bi-box-arrow-in-right me-2"></i>
      {{ isLoading ? '登入中...' : '登入' }}
    </button>

    <!-- 分隔線 -->
    <div class="divider-container mb-3">
      <div class="divider-line"></div>
      <span class="divider-text">或者</span>
      <div class="divider-line"></div>
    </div>

    <!-- 第三方登入圖標按鈕 -->
    <div class="social-login-buttons d-flex justify-content-center gap-3 mb-3">
      <!-- Facebook 登入 -->
      <button
        type="button"
        class="btn social-btn facebook-btn"
        :disabled="isLoadingFB || isLoading"
        @click="handleFacebookLogin"
        title="使用 Facebook 登入"
      >
        <span v-if="isLoadingFB" class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">載入中...</span>
        </span>
        <i v-else class="fa-brands fa-square-facebook"></i>
      </button>

      <!-- Google 登入 -->
      <button
        type="button"
        class="btn social-btn google-btn"
        :disabled="isLoadingGoogle || isLoading"
        @click="handleGoogleLogin"
        title="使用 Google 登入"
      >
        <span v-if="isLoadingGoogle" class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">載入中...</span>
        </span>
        <i v-else class="fa-brands fa-google"></i>
      </button>

      <!-- LINE 登入 -->
      <button
        type="button"
        class="btn social-btn line-btn"
        :disabled="isLoadingLine || isLoading"
        @click="handleLineLogin"
        title="使用 LINE 登入"
      >
        <span v-if="isLoadingLine" class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">載入中...</span>
        </span>
        <i v-else class="fa-brands fa-line"></i>
      </button>
    </div>

    <!-- 忘記密碼 -->
    <div class="text-center">
      <RouterLink :to="{name:'forgot-password'}" class="custom-forgot-password-link">
        忘記密碼？
      </RouterLink>
    </div>
  </form>

</template>

<style lang="css" scoped>
/* 色系定義 - 使用組件內變數 */
.login-form {
  --deep-purple: #92559c;
  --light-purple: #d3a2da;
  --light-yellow: #ffd689;
  --orange-yellow: #ffa600;
  --deep-gray: #686868;
  --light-gray: #f6f6f6;
  
  width: 100%;
}

/* 錯誤訊息樣式 */
.error-alert {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

/* 標籤樣式 */
.custom-label {
  color: var(--deep-gray);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* 輸入框組樣式 */
.custom-input-group-text {
  background-color: var(--light-gray);
  border: 1px solid var(--deep-gray);
  border-right: none;
  color: var(--deep-purple);
}

.custom-form-control {
  border: 1px solid var(--deep-gray);
  border-left: none;
  background-color: white;
  color: var(--deep-gray);
}

.custom-form-control:focus {
  border-color: var(--deep-purple);
  box-shadow: 0 0 0 0.25rem rgba(146, 85, 156, 0.25);
  background-color: white;
}

.custom-form-control::placeholder {
  color: #999;
}

/* 密碼切換按鈕 */
.custom-password-toggle {
  background-color: var(--light-gray);
  border: 1px solid var(--deep-gray);
  border-left: none;
  color: var(--deep-purple);
  transition: all 0.3s ease;
}

.custom-password-toggle:hover {
  background-color: var(--light-purple);
  color: var(--deep-purple);
}

/* 複選框樣式 */
.custom-form-check {
  margin-bottom: 1.5rem;
}

.custom-checkbox {
  accent-color: var(--deep-purple);
}

.custom-check-label {
  color: var(--deep-gray);
  font-size: 0.9rem;
}

/* 登入按鈕樣式 */
.custom-login-btn {
  background: linear-gradient(135deg, var(--deep-purple) 0%, var(--light-purple) 100%);
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.custom-login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--light-purple) 0%, var(--orange-yellow) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(146, 85, 156, 0.3);
}

.custom-login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 分隔線樣式 */
.divider-container {
  display: flex;
  align-items: center;
  margin: 1rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: var(--deep-gray);
  opacity: 0.3;
}

.divider-text {
  margin: 0 1rem;
  color: var(--deep-gray);
  font-size: 0.875rem;
  background-color: var(--light-gray);
  padding: 0 0.5rem;
}

/* 第三方登入圖標按鈕樣式 */
.social-login-buttons {
  margin: 1rem 0;
}

.social-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.social-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.social-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Facebook 按鈕 */
.facebook-btn {
  background: #1877F2;
  color: white;
}

.facebook-btn:hover:not(:disabled) {
  background: #166fe5;
  color: white;
  box-shadow: 0 4px 15px rgba(24, 119, 242, 0.4);
}

/* Google 按鈕 */
.google-btn {
  background: #dd4b39;
  color: white;
}

.google-btn:hover:not(:disabled) {
  background: #c23321;
  color: white;
  box-shadow: 0 4px 15px rgba(221, 75, 57, 0.4);
}

/* LINE 按鈕 */
.line-btn {
  background: #00B900;
  color: white;
}

.line-btn:hover:not(:disabled) {
  background: #00A000;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 185, 0, 0.4);
}

/* 忘記密碼連結 */
.custom-forgot-password-link {
  color: var(--deep-gray);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;
}

.custom-forgot-password-link:hover {
  color: var(--deep-purple);
}

/* 無效輸入樣式 */
.is-invalid {
  border-color: #dc3545 !important;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* 自定義錯誤訊息樣式 */
.email-error-message,
.password-error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

/* 載入動畫 */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* 響應式調整 */
@media (max-width: 576px) {
  .login-form {
    padding: 0;
  }
  
  .custom-login-btn {
    padding: 0.875rem 1rem;
  }
}
</style>