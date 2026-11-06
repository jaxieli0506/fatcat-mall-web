<script setup>
import { ref, reactive, computed } from 'vue'
import { Modal } from 'bootstrap'

// 響應式數據
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

//錯誤狀態
const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

//驗證狀態追蹤
const validationStatus = reactive({
  currentPassword: null, // null: 未驗證, true: 通過, false: 失敗
  newPassword: null,
  confirmPassword: null
})


const isLoading = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isModalVisible = ref(false)

// 定義事件
const emit = defineEmits(['password-changed'])

// Modal 實例
let modalInstance = null

// 驗證--目前密碼
const validateCurrentPassword = () => {
    if (!formData.currentPassword) {
        errors.currentPassword = '請輸入目前密碼'
        validationStatus.currentPassword = false
        return false
    }
    
    // 只清除錯誤訊息，不設定為驗證通過
    errors.currentPassword = ''
    validationStatus.currentPassword = null  // 設為null，表示格式正確但未驗證
    
    // 如果新密碼已輸入，重新驗證新密碼（檢查重複）
    if (formData.newPassword) {
        validateNewPassword()
    }
    
    return true
}

// 驗證--新密碼
const validateNewPassword = () => {
    // 檢查是否為空
    if (!formData.newPassword) {
        if (formData.newPassword === '') {
            // 剛開始輸入，不顯示錯誤
            errors.newPassword = ''
            validationStatus.newPassword = null
        } else {
            errors.newPassword = '請輸入新密碼'
            validationStatus.newPassword = false
        }
        return false
    }
    
    // 檢查長度
    if (formData.newPassword.length < 6) {
        errors.newPassword = '新密碼至少需要6個字元'
        validationStatus.newPassword = false
        return false
    }
    
    // 檢查與目前密碼是否重複
    if (formData.currentPassword && formData.newPassword === formData.currentPassword) {
        errors.newPassword = '新密碼不能與目前密碼相同'
        validationStatus.newPassword = false
        return false
    }

    // 通過所有驗證
    errors.newPassword = ''
    validationStatus.newPassword = true
    
    // 如果確認密碼已輸入，重新驗證確認密碼
    if (formData.confirmPassword) {
        validateConfirmPassword()
    }
    
    return true
}

// 驗證--確認密碼
const validateConfirmPassword = () => {
    if (!formData.confirmPassword) {
        if (formData.confirmPassword === '') {
            // 剛開始輸入，不顯示錯誤
            errors.confirmPassword = ''
            validationStatus.confirmPassword = null
        } else {
            errors.confirmPassword = '請確認新密碼'
            validationStatus.confirmPassword = false
        }
        return false
    }
    
    if (formData.confirmPassword !== formData.newPassword) {
        errors.confirmPassword = '確認密碼與新密碼不符'
        validationStatus.confirmPassword = false
        return false
    }
    
    // 通過驗證
    errors.confirmPassword = ''
    validationStatus.confirmPassword = true
    return true
}

// 計算屬性 - 檢查是否所有欄位都已驗證通過
const isFormValid = computed(() => {
    return formData.currentPassword.length > 0 && //只檢查是否有輸入
           validationStatus.newPassword === true &&
           validationStatus.confirmPassword === true
})

// 計算屬性 - 檢查是否有任何驗證錯誤
const hasValidationErrors = computed(() => {
    return errors.currentPassword !== '' ||
           validationStatus.newPassword === false ||
           validationStatus.confirmPassword === false
})

// keyup 事件處理器（只調用對應的驗證函數）
const onCurrentPasswordKeyup = () => {
    validateCurrentPassword()
}

const onNewPasswordKeyup = () => {
    validateNewPassword()
}

const onConfirmPasswordKeyup = () => {
    validateConfirmPassword()
}

// 提交前的最終檢查（不重複驗證，只檢查狀態）
const finalValidationCheck = () => {
    // 只做格式檢查，不做密碼正確性檢查
    validateCurrentPassword()
    validateNewPassword()
    validateConfirmPassword()
    
    // 返回是否所有驗證都通過
    return isFormValid.value
}

// 處理表單提交
const handleSubmit = async () => {
    // 只做最終檢查，不重複驗證
    if (!finalValidationCheck()) {
        console.log('表單驗證失敗，無法提交')
        return
    }

    try {
        isLoading.value = true
        
        console.log('表單驗證通過，準備變更密碼:', formData)
        
        // 發出事件，等待父組件處理
        emit('password-changed', formData)
        
    } catch (error) {
        console.error('密碼變更失敗:', error)
    } finally {
        isLoading.value = false
    }
}



// 重置表單
const resetForm = () => {
    formData.currentPassword = ''
    formData.newPassword = ''
    formData.confirmPassword = ''
    
    errors.currentPassword = ''
    errors.newPassword = ''
    errors.confirmPassword = ''
    
    validationStatus.currentPassword = null
    validationStatus.newPassword = null
    validationStatus.confirmPassword = null
    
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
}

// 處理 Modal 顯示
const showModal = () => {
    isModalVisible.value = true
    const modalElement = document.getElementById('passwordChangeModal')
    if (modalElement) {
        if (!modalInstance) {
            modalInstance = new Modal(modalElement)
        }
        modalInstance.show()
    }
}

// 處理 Modal 隱藏
const hideModal = () => {
    isModalVisible.value = false
    if (modalInstance) {
        modalInstance.hide()
    }
}

// 處理密碼變更結果
const handlePasswordChangeResult = (success, message) => {
    if (success) {
        // 成功時重置表單並關閉 Modal
        resetForm()
        hideModal()
    } else {
        // 失敗時顯示錯誤訊息
        if (message && message.includes('目前密碼')) {
            errors.currentPassword = '目前密碼不正確'
            validationStatus.currentPassword = false
        } else {
            // 其他錯誤顯示在目前密碼欄位
            errors.currentPassword = message || '密碼變更失敗'
            validationStatus.currentPassword = false
        }
    }
}

// 暴露方法給父組件
defineExpose({
    showModal,
    hideModal,
    handlePasswordChangeResult
})
</script>

<template>
  <div 
    class="modal fade" 
    id="passwordChangeModal" 
    tabindex="-1"
    :aria-hidden="!isModalVisible"
    :aria-modal="isModalVisible"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">更改密碼</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="hideModal"
            aria-label="關閉"
          ></button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="handleSubmit" novalidate>
            <!-- 目前密碼 -->
            <div class="mb-3">
              <label for="currentPassword" class="form-label">目前密碼</label>
              <div class="input-group">
                <input 
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="form-control"
                  id="currentPassword"
                  v-model="formData.currentPassword"
                  :class="{ 
                    'is-invalid': validationStatus.currentPassword === false,
                    'is-valid': validationStatus.currentPassword === true
                  }"
                  placeholder="請輸入目前密碼"
                  @keyup="onCurrentPasswordKeyup"
                >
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <i class="bi" :class="showCurrentPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <div v-if="errors.currentPassword" class="invalid-feedback d-block">
                {{ errors.currentPassword }}
              </div>
            </div>

            <!-- 新密碼 -->
            <div class="mb-3">
              <label for="newPassword" class="form-label">新密碼</label>
              <div class="input-group">
                <input 
                  :type="showNewPassword ? 'text' : 'password'"
                  class="form-control"
                  id="newPassword"
                  v-model="formData.newPassword"
                  :class="{ 
                    'is-invalid': validationStatus.newPassword === false,
                    'is-valid': validationStatus.newPassword === true
                  }"
                  placeholder="請輸入新密碼 (至少6個字元)"
                  @keyup="onNewPasswordKeyup"
                >
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="showNewPassword = !showNewPassword"
                >
                  <i class="bi" :class="showNewPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <div v-if="errors.newPassword" class="invalid-feedback d-block">
                {{ errors.newPassword }}
              </div>
               <!-- 密碼強度提示 -->
                <div v-else-if="validationStatus.newPassword === true" class="valid-feedback d-block">
                ✓ 密碼長度符合要求
              </div>
              <div v-else-if="formData.newPassword && formData.newPassword.length < 6" class="text-muted small">
                還需要 {{ 6 - formData.newPassword.length }} 個字元
              </div>
            </div>

            <!-- 確認密碼 -->
            <div class="mb-3">
              <label for="confirmPassword" class="form-label">確認新密碼</label>
              <div class="input-group">
                <input 
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-control"
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  :class="{ 
                    'is-invalid': validationStatus.confirmPassword === false,
                    'is-valid': validationStatus.confirmPassword === true
                  }"
                  placeholder="請再次輸入新密碼"
                  @keyup="onConfirmPasswordKeyup"
                >
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <i class="bi" :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <div v-if="errors.confirmPassword" class="invalid-feedback d-block">
                {{ errors.confirmPassword }}
              </div>
              <!-- 確認密碼成功提示 -->
               <div v-else-if="validationStatus.confirmPassword === true" class="valid-feedback d-block">
                ✓ 密碼確認一致
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="hideModal">取消</button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="handleSubmit"
            :disabled="isLoading || hasValidationErrors"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            {{ isLoading ? '變更中...' : '確認變更' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
/* 使用與項目一致的色系 */
.modal-content {
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.modal-header {
  background: linear-gradient(135deg, #92559c 0%, #d3a2da 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header .btn-close {
  filter: invert(1);
}

.form-control:focus {
  border-color: #92559c;
  box-shadow: 0 0 0 0.2rem rgba(146, 85, 156, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #92559c 0%, #d3a2da 100%);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #d3a2da 0%, #ffa600 100%);
}

.btn-outline-secondary {
  border-color: #92559c;
  color: #92559c;
}

.btn-outline-secondary:hover {
  background-color: #92559c;
  border-color: #92559c;
}
/* 成功狀態的樣式 */
.form-control.is-valid {
  border-color: #28a745;
}

.form-control.is-valid:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

.valid-feedback {
  color: #28a745;
  font-size: 0.875em;
  margin-top: 0.25rem;
}

/* 提示文字樣式 */
.text-muted.small {
  font-size: 0.875em;
  margin-top: 0.25rem;
  display: block;
}

</style>