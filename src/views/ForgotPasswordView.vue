<script setup>
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { authService } from '../services/authService'

    const router = useRouter()

    // 表單狀態
    const email = ref('')
    const isLoading = ref(false)
    const isSubmitted = ref(false)
    const errorMessage = ref('')
    
    // 驗證email格式
    const validateEmail = (email) => {
        const emailPattern = /^[^\s@]+@[^\s@]+$/
        return emailPattern.test(email)
    }

    // 處理表單提交
    const handleSubmit = async () => {
        errorMessage.value = ''
        
        // 驗證email
        if (!email.value) {
            errorMessage.value = '請輸入電子郵件'
            return
        }
        
        if (!validateEmail(email.value)) {
            errorMessage.value = '請輸入有效的電子郵件格式'
            return
        }
        
        try {
            isLoading.value = true
            
            console.log('發送重設密碼請求:', email.value)
            
            // 呼叫忘記密碼 API
            const result = await authService.forgotPassword(email.value)
            
            if (result.success) {
            // 顯示成功狀態
            isSubmitted.value = true
                console.log('忘記密碼郵件發送成功')
            } else {
                errorMessage.value = result.message || '發送失敗，請稍後再試'
            }
                
        } catch (error) {
            console.error('發送失敗:', error)
            errorMessage.value = error.message || '發送失敗，請稍後再試'
        } finally {
            isLoading.value = false
        }
    }

// 返回登入頁面
const goBackToLogin = () => {
    router.push('/login')
}

</script>

<template>
 <div class="forgot-password-container">
        <div class="forgot-password-card">
            <!-- 如果還沒提交 -->
            <div v-if="!isSubmitted" class="form-section">
                <div class="header-section text-center mb-4">
                    <i class="bi bi-key-fill header-icon"></i>
                    <h2>忘記密碼</h2>
                    <p class="text-muted">請輸入您的電子郵件，我們將發送重設密碼的連結給您</p>
                </div>

                <!-- 錯誤訊息 -->
                <div v-if="errorMessage" class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    {{ errorMessage }}
                </div>
 <!-- 表單 -->
                <form @submit.prevent="handleSubmit">
                    <div class="mb-4">
                        <label for="email" class="form-label">電子郵件</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="bi bi-envelope-fill"></i>
                            </span>
                            <input 
                                id="email"
                                v-model="email" 
                                type="email" 
                                class="form-control"
                                placeholder="請輸入您的電子郵件"
                                :disabled="isLoading"
                                required
                            >
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
                            <i v-else class="bi bi-send-fill me-2"></i>
                            {{ isLoading ? '發送中...' : '發送重設連結' }}
                        </button>

                        <button 
                            type="button" 
                            class="btn btn-outline-secondary w-100"
                            @click="goBackToLogin"
                            :disabled="isLoading"
                        >
                            <i class="bi bi-arrow-left me-2"></i>
                            返回登入
                        </button>
                    </div>
                </form>
            </div>
 <!-- 提交成功狀態 -->
            <div v-else class="success-section text-center">
                <div class="success-icon mb-4">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <h3>郵件已發送</h3>
                <p class="text-muted mb-4">
                    我們已將重設密碼的連結發送到<br>
                    <strong>{{ email }}</strong>
                </p>
                <p class="text-muted small mb-4">
                    請檢查您的信箱（包含垃圾信件匣）<br>
                    並點擊連結來重設密碼
                </p>

                <div class="button-group">
                    <button 
                        class="btn btn-primary w-100 mb-3"
                        @click="goBackToLogin"
                    >
                        <i class="bi bi-box-arrow-in-right me-2"></i>
                        前往登入
                    </button>
                   <button 
                        class="btn btn-outline-secondary w-100"
                        @click="isSubmitted = false"
                    >
                        <i class="bi bi-arrow-counterclockwise me-2"></i>
                        重新發送
                    </button>
                </div>
            </div>
        </div>
    </div>  



</template>

<style lang="css" scoped>
/* 主容器 */
.forgot-password-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #92559c 0%, #d3a2da 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
}

/* 主卡片 */
.forgot-password-card {
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

.btn-outline-secondary:hover {
    background-color: #92559c;
    border-color: #92559c;
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

/* 響應式設計 */
@media (max-width: 576px) {
    .forgot-password-card {
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