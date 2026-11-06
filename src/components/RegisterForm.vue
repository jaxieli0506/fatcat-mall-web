<script setup>
    import { ref, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../stores/auth'
    import { facebookAuthService } from '../services/facebookAuthService'
    import { useexLoginStore } from '../stores/exLogin'
    import Swal from 'sweetalert2'  //引用sweetAlert2

    // 路由和狀態管理
    const router = useRouter()
    const authStore = useAuthStore()
    const exLoginStore = useexLoginStore()

    // 表單數據
    const registerForm = ref({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: null,
        birthdate: null
    })

    // Facebook 資料相關
    const facebookData = ref(null)
    const hasFacebookData = ref(false)

    // 檢查並載入 Facebook 資料
    onMounted(() => {
        const pendingFacebookData = facebookAuthService.getPendingFacebookData()
        if (pendingFacebookData) {
            facebookData.value = pendingFacebookData
            hasFacebookData.value = true
            
            // 自動填入表單資料
            if (pendingFacebookData.name) {
                registerForm.value.name = pendingFacebookData.name
            }
            if (pendingFacebookData.email) {
                registerForm.value.email = pendingFacebookData.email
            }
            
            console.log('已載入 Facebook 資料:', pendingFacebookData)
        }
    })

    //控制密碼可見性
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const togglePassword = () => {
        showPassword.value = !showPassword.value
    }
    const toggleConfirmPassword = () => {
        showConfirmPassword.value = !showConfirmPassword.value
    }
    //錯誤訊息狀態：分別處理不同類型錯誤
    const errorMessage = ref('')
    const nameError = ref('')
    const emailError = ref('')
    const passwordError = ref('')
    const confirmPasswordError = ref('')
    const phoneError = ref('')

    // 計算屬性 載入狀態：從 Auth Store 取得
    const isLoading = computed(() => authStore.isLoading)

    //表單驗證
    const validateForm = () => {
        clearErrors()
        let hasError = false

        // 驗證姓名
        if (!registerForm.value.name) {
            nameError.value = '請輸入姓名'
            hasError = true
        } else if (registerForm.value.name.length < 2) {
            nameError.value = '姓名至少需要2個字元'
            hasError = true
        }
         // 驗證 Email
        const emailPattern = /^[^\s@]+@[^\s@]+$/
        if (!registerForm.value.email) {
            emailError.value = '請輸入電子郵件'
            hasError = true
        } else if (!emailPattern.test(registerForm.value.email)) {
            emailError.value = '請輸入有效的電子郵件格式'
            hasError = true
        }

        // 驗證密碼
        if (!registerForm.value.password) {
            passwordError.value = '請輸入密碼'
            hasError = true
        } else if (registerForm.value.password.length < 6) {
            passwordError.value = '密碼至少需要6個字元'
            hasError = true
        }

        // 驗證確認密碼
        if (!registerForm.value.confirmPassword) {
            confirmPasswordError.value = '請確認密碼'
            hasError = true
        } else if (registerForm.value.password !== registerForm.value.confirmPassword) {
            confirmPasswordError.value = '密碼不一致'
            hasError = true
        }
     // 驗證電話 (可選，但如果有輸入則需要驗證格式)
        if (registerForm.value.phone) {
            const phonePattern = /^[0-9-+\s()]+$/
            if (!phonePattern.test(registerForm.value.phone)) {
                phoneError.value = '請輸入有效的電話號碼'
                hasError = true
            }
        }

        return !hasError
    }

    const handleRegister = async () => {
         // 測試：檢查原始的 birthdate 值
            // console.log('原始 birthdate 值:', registerForm.value.birthdate)
            // console.log('birthdate 是否為空字串:', registerForm.value.birthdate === '')
            // console.log('birthdate 是否為 null:', registerForm.value.birthdate === null)
        // 清除之前的錯誤
        errorMessage.value = ''
        
        // 如果表單驗證成功 => 註冊
        if (!validateForm()) {
            return
        }

         try {
                // 準備註冊資料 (不包含確認密碼)
                 const registerData = {
                 name: registerForm.value.name?.trim() || "",
                 email: registerForm.value.email?.trim() || "",
                 password: registerForm.value.password || "",
                phone: registerForm.value.phone?.trim() || null,
                gender: registerForm.value.gender || null,
                // 修正日期格式處理
                birthdate: registerForm.value.birthdate ? new Date(registerForm.value.birthdate).toISOString() : null
        }
                // 額外驗證確保必填欄位不為空
                if (!registerData.name || !registerData.email || !registerData.password) {
                    await Swal.fire({
                        icon: 'error',
                        title: '資料驗證失敗',
                        text: '請確認所有必填欄位都已填寫',
                        confirmButtonText: '確定',
                        confirmButtonColor: '#dc3545'
                    })
                    return
                }

                // console.log('發送註冊資料:', registerData) // 測試用
            // 呼叫註冊
            const result = await authStore.register(registerData)

            if (result.success) {
                // 如果有 Facebook 資料，先嘗試綁定
                if (hasFacebookData.value && facebookData.value) {
                    try {
                        // 先登入以獲取認證
                        const loginResult = await authStore.login({
                            email: registerData.email,
                            password: registerData.password,
                            rememberMe: false
                        })
                        
                        if (loginResult.success) {
                            // 登入成功後綁定 Facebook 帳號
                            const bindResult = await exLoginStore.bindAccount(
                                'Facebook',
                                facebookData.value.accessToken,
                                facebookData.value.facebookUserId,
                                facebookData.value.email,
                                facebookData.value.name
                            )
                            
                            // 清除待處理的 Facebook 資料
                            facebookAuthService.clearPendingFacebookData()
                            
                            if (bindResult.success) {
                                // 註冊成功且 Facebook 綁定成功
                                await Swal.fire({
                                    icon: 'success',
                                    title: '註冊成功！',
                                    text: 'Facebook 帳號已自動綁定，歡迎加入 Fat Cat！',
                                    confirmButtonText: '前往首頁',
                                    confirmButtonColor: '#92559c',
                                    allowOutsideClick: false,
                                    allowEscapeKey: false,
                                    timer: 5000,
                                    timerProgressBar: true
                                })
                                
                                // 跳轉到首頁
                                router.push('/')
                                return
                            } else {
                                console.warn('Facebook 綁定失敗:', bindResult.message)
                            }
                        }
                    } catch (error) {
                        console.warn('自動綁定 Facebook 過程中發生錯誤:', error)
                    }
                }
                
                // 標準註冊成功流程（沒有 Facebook 資料或綁定失敗）
                await Swal.fire({
                    icon: 'success',
                    title: '註冊成功！',
                    text: hasFacebookData.value ? '請重新登入，您可以在個人設定中手動綁定 Facebook 帳號' : '請重新登入',
                    confirmButtonText: '前往登入',
                    confirmButtonColor: '#92559c',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    timer: 5000,
                    timerProgressBar: true,
                    showClass: {
                        popup: 'animate__animated animate__fadeInDown'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOutUp'
                    }
                })
                
                // 清除 Facebook 資料
                if (hasFacebookData.value) {
                    facebookAuthService.clearPendingFacebookData()
                }
                
                // 跳轉到登入頁面
                router.push('/login')
            } else {
                // 註冊失敗 - 顯示錯誤 SweetAlert
            await Swal.fire({
                icon: 'error',
                title: '註冊失敗',
                text: result.message || '註冊失敗，請稍後再試',
                confirmButtonText: '確定',
                confirmButtonColor: '#dc3545'
            })
            }
        } catch (error) {
                console.error('註冊錯誤詳細信息:', error) // 調試用
            
            // 檢查是否是 400 錯誤
            if (error.response?.status === 400) {
                await Swal.fire({
                    icon: 'error',
                    title: '註冊資料有誤',
                    text: error.response?.data?.message || '請檢查所有必填欄位是否正確填寫',
                    confirmButtonText: '確定',
                    confirmButtonColor: '#dc3545'
                })
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: '網路錯誤',
                    text: '無法連接伺服器，請檢查網路連線',
                    confirmButtonText: '確定',
                    confirmButtonColor: '#dc3545'
                })
            }
        }
    }
    // 清除錯誤訊息
    const clearErrors = () => {
        nameError.value = ''
        emailError.value = ''
        passwordError.value = ''
        confirmPasswordError.value = ''
        phoneError.value = ''
        errorMessage.value = ''
    }
</script>

<template>
<!-- Facebook 資料提示 -->
    <div v-if="hasFacebookData" class="alert alert-info mb-3">
        <i class="bi bi-facebook me-2"></i>
        <strong>Facebook 登入偵測</strong><br>
        已自動填入您的 Facebook 姓名和電子郵件。註冊成功後，Facebook 帳號將自動綁定到您的新會員帳戶。
    </div>

<!-- 顯示整體錯誤訊息 -->
    <div v-if="errorMessage" class="alert alert-danger mb-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ errorMessage }}
    </div>

    <form @submit.prevent="handleRegister" class="register-form" novalidate>
<!-- 姓名 + 電話 並排 -->
<div class="row">
    <!-- 姓名輸入 -->
    <div class="col-md-6 mb-3">
        <label for="name" class="form-label custom-label">
            姓名 <span class="required-mark">*</span>
        </label>
        <div class="input-group">
            <span class="input-group-text custom-input-group-text">
                <i class="bi bi-person"></i>
            </span>
            <input 
                id="name" 
                v-model="registerForm.name" 
                type="text" 
                class="form-control custom-form-control" 
                :class="{ 'is-invalid': nameError }" 
                placeholder="請輸入您的姓名" 
                :disabled="isLoading"
                @input="nameError = ''; errorMessage = ''"
            >
        </div>
        <div v-if="nameError" class="error-message">
            {{ nameError }}
        </div>
    </div>

    <!-- 電話輸入 -->
    <div class="col-md-6 mb-3">
        <label for="phone" class="form-label custom-label">電話號碼</label>
        <div class="input-group">
            <span class="input-group-text custom-input-group-text">
                <i class="bi bi-telephone"></i>
            </span>
            <input 
                id="phone" 
                v-model="registerForm.phone" 
                type="tel" 
                class="form-control custom-form-control" 
                :class="{ 'is-invalid': phoneError }" 
                placeholder="請輸入您的電話號碼 (可選)" 
                :disabled="isLoading"
                @input="phoneError = ''; errorMessage = ''"
            >
        </div>
        <div v-if="phoneError" class="error-message">
            {{ phoneError }}
        </div>
    </div>
</div>
        <!-- Email 輸入 -->
        <div class="mb-3">
            <label for="email" class="form-label custom-label">
                電子郵件 <span class="required-mark">*</span>
            </label>
            <div class="input-group">
                <span class="input-group-text custom-input-group-text">
                    <i class="bi bi-envelope"></i>
                </span>
                <input 
                    id="email" 
                    v-model="registerForm.email" 
                    type="email" 
                    class="form-control custom-form-control" 
                    :class="{ 'is-invalid': emailError }" 
                    placeholder="請輸入您的電子郵件" 
                    :disabled="isLoading"
                    @input="emailError = ''; errorMessage = ''"
                >
            </div>
            <div v-if="emailError" class="error-message">
                {{ emailError }}
            </div>
        </div>

<!-- 密碼 + 確認密碼 並排 -->
<div class="row">
    <!-- 密碼輸入 -->
    <div class="col-md-6 mb-3">
        <label for="password" class="form-label custom-label">
            密碼 <span class="required-mark">*</span>
        </label>
        <div class="input-group">
            <span class="input-group-text custom-input-group-text">
                <i class="bi bi-lock"></i>
            </span>
            <input 
                id="password" 
                v-model="registerForm.password" 
                :type="showPassword ? 'text' : 'password'" 
                class="form-control custom-form-control" 
                :class="{ 'is-invalid': passwordError }" 
                placeholder="請輸入您的密碼" 
                :disabled="isLoading"
                @input="passwordError = ''; errorMessage = ''"
            >
            <!-- 密碼顯示切換 -->
            <button type="button" class="btn custom-password-toggle" @click="togglePassword" :disabled="isLoading">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
        </div>
        <div v-if="passwordError" class="error-message">
            {{ passwordError }}
        </div>
    </div>

    <!-- 確認密碼輸入 -->
    <div class="col-md-6 mb-3">
        <label for="confirmPassword" class="form-label custom-label">
            確認密碼 <span class="required-mark">*</span>
        </label>
        <div class="input-group">
            <span class="input-group-text custom-input-group-text">
                <i class="bi bi-lock-fill"></i>
            </span>
            <input 
                id="confirmPassword" 
                v-model="registerForm.confirmPassword" 
                :type="showConfirmPassword ? 'text' : 'password'" 
                class="form-control custom-form-control" 
                :class="{ 'is-invalid': confirmPasswordError }" 
                placeholder="請再次輸入您的密碼" 
                :disabled="isLoading"
                @input="confirmPasswordError = ''; errorMessage = ''"
            >
            <!-- 確認密碼顯示切換 -->
            <button type="button" class="btn custom-password-toggle" @click="toggleConfirmPassword" :disabled="isLoading">
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
        </div>
        <div v-if="confirmPasswordError" class="error-message">
            {{ confirmPasswordError }}
        </div>
    </div>
</div>

<!-- 性別 + 生日 並排 -->
<div class="row">
    <!-- 性別選擇 -->
    <div class="col-md-6 mb-3">
        <label for="gender" class="form-label custom-label">性別</label>
        <div class="input-group">
            <span class="input-group-text custom-input-group-text">
                <i class="bi bi-gender-ambiguous"></i>
            </span>
            <select 
                id="gender" 
                v-model="registerForm.gender" 
                class="form-select custom-form-control" 
                :disabled="isLoading"
            >
                <option :value="null">請選擇性別 (可選)</option>
                <option :value="0">男性</option>
                <option :value="1">女性</option>
                <option :value="2">其他</option>
            </select>
        </div>
    </div>

    <!-- 生日輸入 -->
    <div class="col-md-6 mb-3">
        <label for="birthdate" class="form-label custom-label">生日</label>
        <div class="input-group">
            <span class="input-group-text custom-input-group-text">
                <i class="bi bi-calendar-date"></i>
            </span>
            <input 
                id="birthdate" 
                v-model="registerForm.birthdate" 
                type="date" 
                class="form-control custom-form-control" 
                :disabled="isLoading"
            >
        </div>
    </div>
</div>

 <!-- 註冊按鈕 -->
        <button
            type="submit"
            class="btn custom-register-btn w-100 mb-3"
            :disabled="isLoading"
        >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">註冊中...</span>
            </span>
            <i v-else class="bi bi-person-plus-fill me-2"></i>
            {{ isLoading ? '註冊中...' : '建立帳戶' }}
        </button>

        <!-- 必填提示 -->
        <p class="text-center text-muted small">
            <span class="required-mark">*</span> 為必填欄位
        </p>
    </form>

</template>

<style lang="css" scoped>
/* 色系定義 - 使用組件內變數 */
.register-form {
    --deep-purple: #92559c;
    --light-purple: #d3a2da;
    --light-yellow: #ffd689;
    --orange-yellow: #ffa600;
    --deep-gray: #686868;
    --light-gray: #f6f6f6;
    --danger-red: #dc3545;
    
    width: 100%;
}

/* 標籤樣式 */
.custom-label {
    color: var(--deep-gray);
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.required-mark {
    color: var(--danger-red);
    font-weight: bold;
}

/* 輸入框組樣式 */
.custom-input-group-text {
    background-color: var(--light-gray);
    border: 1px solid var(--deep-gray);
    color: var(--deep-purple);
    font-weight: 500;
}
.custom-form-control {
    border: 1px solid var(--deep-gray);
    color: var(--deep-gray);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.custom-form-control:focus {
    border-color: var(--deep-purple);
    box-shadow: 0 0 0 0.2rem rgba(146, 85, 156, 0.25);
}

.custom-form-control.is-invalid {
    border-color: var(--danger-red);
}

/* 密碼切換按鈕 */
.custom-password-toggle {
    background-color: var(--light-gray);
    border: 1px solid var(--deep-gray);
    color: var(--deep-purple);
    border-left: none;
    transition: background-color 0.3s ease;
}

.custom-password-toggle:hover {
    background-color: var(--light-purple);
    color: white;
}
/* 錯誤訊息樣式 */
.error-message {
    color: var(--danger-red);
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
}

.error-message::before {
    content: "⚠️";
    margin-right: 0.5rem;
}

.alert-danger {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

/* Facebook 提示樣式 */
.alert-info {
    background-color: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.alert-info .bi-facebook {
    color: #1877f2;
    font-size: 1rem;
}
/* 註冊按鈕樣式 */
.custom-register-btn {
    background: linear-gradient(135deg, var(--deep-purple) 0%, var(--light-purple) 100%);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    border-radius: 0.375rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-register-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--light-purple) 0%, var(--orange-yellow) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.custom-register-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 載入動畫 */
.spinner-border-sm {
    width: 1rem;
    height: 1rem;
}
/* 下拉選單樣式 */
.form-select.custom-form-control {
    background-color: white;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px 12px;
}

/* 日期輸入樣式 */
input[type="date"].custom-form-control {
    color: var(--deep-gray);
}

/* 響應式設計 */
@media (max-width: 576px) {
    .register-form {
        padding: 0.5rem;
    }
    
    .custom-register-btn {
        padding: 0.6rem 1rem;
    }
}
/* 提示文字 */
.text-muted {
    color: var(--deep-gray) !important;
}

/* 響應式設計 - 手機版不並排 */
@media (max-width: 768px) {
    .row .col-md-6 {
        margin-bottom: 1rem;
    }
}

/* 調整並排時的間距 */
.row {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
}

.row .col-md-6 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
}
</style>